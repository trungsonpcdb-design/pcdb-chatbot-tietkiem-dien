"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { SuggestedQuestions } from "./suggested-questions";
import type { ChatMessage } from "./message-bubble";

export function ChatContainer() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const sessionIdRef = useRef<string | null>(null);

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

      const reader = res.body.getReader();
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
  }, []);

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-1 flex-col bg-white">
      {hasMessages ? (
        <MessageList messages={messages} />
      ) : (
        <SuggestedQuestions onPick={send} />
      )}
      <MessageInput onSend={send} disabled={busy} />
    </div>
  );
}
