"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { RatingModal } from "./rating-modal";
import { LeadCaptureModal } from "./lead-capture-modal";
import { attachSessionEndListeners } from "@/lib/session-lifecycle";
import type { ChatMessage } from "./message-bubble";
import type { FormDmtmnData } from "./form-dmtmn";
import {
  getScript,
  PICKER_SCRIPT_ID,
  type ScriptButton,
  type ScriptNode,
} from "@/lib/scripts";

function buildScriptMessage(node: ScriptNode): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content: node.message,
    quickReplies: node.buttons,
    scripted: true,
  };
}

export function ChatContainer({
  initialScriptId = PICKER_SCRIPT_ID,
}: {
  initialScriptId?: string;
}) {
  const [currentScriptId, setCurrentScriptId] = useState<string>(initialScriptId);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const script = getScript(initialScriptId);
    if (!script) return [];
    const rootNode = script.nodes[script.rootId];
    return rootNode ? [buildScriptMessage(rootNode)] : [];
  });
  const [busy, setBusy] = useState(false);
  const sessionIdRef = useRef<string | null>(null);
  const [ratingOpen, setRatingOpen] = useState(false);
  const ratingShownRef = useRef(false);
  const [leadOpen, setLeadOpen] = useState(false);
  const [leadTopic, setLeadTopic] = useState("KHAC");
  const leadShownRef = useRef(false);

  useEffect(() => {
    const detach = attachSessionEndListeners(() => {
      if (
        !ratingShownRef.current &&
        messages.filter((m) => m.role === "user").length >= 1 &&
        sessionIdRef.current
      ) {
        ratingShownRef.current = true;
        setRatingOpen(true);
      }
    });
    return detach;
  }, [messages]);

  const consumeSSE = useCallback(
    async (body: ReadableStream<Uint8Array>, assistantId: string) => {
      const reader = body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        const events = buf.split("\n\n");
        buf = events.pop() ?? "";

        for (const ev of events) {
          const evName = ev.match(/^event:\s*(\S+)/m)?.[1];
          const evData = ev.match(/^data:\s*(.+)$/m)?.[1];
          if (!evName || !evData) continue;

          if (evName === "session") {
            try {
              const parsed = JSON.parse(evData);
              if (parsed.sessionId) sessionIdRef.current = parsed.sessionId;
            } catch {}
          } else if (evName === "delta") {
            try {
              const parsed = JSON.parse(evData);
              if (parsed.text) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + parsed.text, pending: false }
                      : m
                  )
                );
              }
            } catch {}
          } else if (evName === "citations") {
            try {
              const parsed = JSON.parse(evData);
              if (Array.isArray(parsed)) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, citations: parsed } : m
                  )
                );
              }
            } catch {}
          } else if (evName === "suggest_lead") {
            try {
              const parsed = JSON.parse(evData);
              if (!leadShownRef.current) {
                leadShownRef.current = true;
                setLeadTopic(parsed.interestTopic ?? "KHAC");
                setTimeout(() => setLeadOpen(true), 1500);
              }
            } catch {}
          } else if (evName === "message_saved") {
            try {
              const parsed = JSON.parse(evData);
              if (parsed.id) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, serverMessageId: parsed.id } : m
                  )
                );
              }
            } catch {}
          } else if (evName === "error") {
            try {
              const parsed = JSON.parse(evData);
              throw new Error(parsed.message || "Lỗi từ server");
            } catch (e) {
              throw e instanceof Error ? e : new Error(String(e));
            }
          }
        }
      }
    },
    []
  );

  const send = useCallback(async (text: string) => {
    setBusy(true);
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    const assistantId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantId, role: "assistant", content: "", pending: true },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          message: text,
        }),
      });

      if (!res.ok) {
        let msg = "Đã xảy ra lỗi khi gửi câu hỏi.";
        try {
          const j = await res.json();
          if (j?.error) msg = j.error;
        } catch {}
        throw new Error(msg);
      }
      if (!res.body) throw new Error("Không nhận được phản hồi.");

      await consumeSSE(res.body, assistantId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: `⚠️ ${msg}`, pending: false }
            : m
        )
      );
    } finally {
      setBusy(false);
    }
  }, [consumeSSE]);

  const handleQuickReply = useCallback(
    (btn: ScriptButton) => {
      const currentScript = getScript(currentScriptId);
      if (!currentScript) return;

      let targetScriptId = currentScriptId;
      let targetNodeId: string | null = null;
      const action = btn.action;

      if (action.type === "goto") {
        targetNodeId = action.nodeId;
      } else if (action.type === "root") {
        targetNodeId = currentScript.rootId;
      } else if (action.type === "escalate") {
        targetNodeId = "escalate";
      } else if (action.type === "switch") {
        const nextScript = getScript(action.scriptId);
        if (nextScript) {
          targetScriptId = action.scriptId;
          targetNodeId = nextScript.rootId;
        } else {
          targetScriptId = PICKER_SCRIPT_ID;
          targetNodeId = "not-ready";
        }
      } else if (action.type === "picker") {
        targetScriptId = PICKER_SCRIPT_ID;
        const picker = getScript(PICKER_SCRIPT_ID);
        targetNodeId = picker?.rootId ?? null;
      }
      if (!targetNodeId) return;

      const targetScript = getScript(targetScriptId);
      const node = targetScript?.nodes[targetNodeId];
      if (!node) return;

      if (targetScriptId !== currentScriptId) setCurrentScriptId(targetScriptId);

      setMessages((prev) => {
        const withoutOldButtons = prev.map((m) =>
          m.scripted && m.quickReplies ? { ...m, quickReplies: undefined } : m
        );
        const userEcho: ChatMessage = {
          id: crypto.randomUUID(),
          role: "user",
          content: btn.label,
        };
        return [...withoutOldButtons, userEcho, buildScriptMessage(node)];
      });
    },
    [currentScriptId]
  );

  const sendForm = useCallback(
    async (data: FormDmtmnData) => {
      setBusy(true);
      const summary = `[Form ĐMTMN] Diện tích ${data.areaM2}m², hướng ${data.orientation}, ${data.roofType}, hóa đơn ${data.monthlyBillVnd.toLocaleString("vi-VN")}đ/tháng.`;
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: summary,
      };
      const assistantId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: assistantId, role: "assistant", content: "", pending: true },
      ]);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
            message: summary,
            formData: data,
          }),
        });
        if (!res.ok || !res.body) throw new Error("Gửi form thất bại");
        await consumeSSE(res.body, assistantId);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : String(err));
      } finally {
        setBusy(false);
      }
    },
    [consumeSSE]
  );

  return (
    <div className="flex flex-1 flex-col bg-white">
      <MessageList
        messages={messages}
        onFormSubmit={sendForm}
        onQuickReply={handleQuickReply}
        busy={busy}
      />
      <MessageInput onSend={send} disabled={busy} />
      <RatingModal
        open={ratingOpen}
        onOpenChange={setRatingOpen}
        sessionId={sessionIdRef.current}
      />
      <LeadCaptureModal
        open={leadOpen}
        onOpenChange={setLeadOpen}
        sessionId={sessionIdRef.current}
        interestTopic={leadTopic}
      />
    </div>
  );
}
