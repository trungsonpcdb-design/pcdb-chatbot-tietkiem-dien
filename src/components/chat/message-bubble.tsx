"use client";

import Image from "next/image";
import { Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSpeechSynthesis } from "@/lib/hooks/use-speech-synthesis";
import type { Citation } from "./citation-popover";
import { FeedbackButtons } from "./feedback-buttons";
import { FormDmtmn, type FormDmtmnData } from "./form-dmtmn";
import { QuickReplyButtons } from "./quick-reply-buttons";
import type { ScriptButton } from "@/lib/scripts";

export interface ChatMessage {
  id: string;
  serverMessageId?: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  pending?: boolean;
  quickReplies?: ScriptButton[];
  scripted?: boolean;
}

const FORM_MARKER = "<FORM_DMTMN/>";

export function MessageBubble({
  message,
  onFormSubmit,
  onQuickReply,
  disabled,
}: {
  message: ChatMessage;
  onFormSubmit?: (data: FormDmtmnData) => void;
  onQuickReply?: (btn: ScriptButton) => void;
  disabled?: boolean;
}) {
  const isUser = message.role === "user";
  const hasForm = !isUser && message.content.includes(FORM_MARKER);
  const textOnly = hasForm ? message.content.replace(FORM_MARKER, "").trim() : message.content;
  const {
    supported: ttsSupported,
    hasVietnameseVoice,
    speaking,
    speak,
    cancel,
  } = useSpeechSynthesis();

  const canReadAloud =
    !isUser &&
    !message.pending &&
    ttsSupported &&
    textOnly.trim().length > 0;

  function handleReadAloud() {
    if (speaking) {
      cancel();
      return;
    }
    if (!hasVietnameseVoice) {
      toast.info(
        "Thiết bị này chưa cài giọng tiếng Việt. Vào Settings → Time & language → Language → Add a language → Tiếng Việt (nhớ tick 'Speech') để cài, rồi khởi động lại trình duyệt.",
        { duration: 8000 }
      );
      return;
    }
    speak(textOnly);
  }

  const showFeedback =
    !isUser && !message.pending && !message.scripted && message.serverMessageId;

  return (
    <div className={cn("flex flex-col", isUser ? "items-end" : "items-start")}>
      <div
        className={cn(
          "flex w-full gap-2",
          isUser ? "justify-end" : "justify-start items-end"
        )}
      >
        {!isUser && (
          <div className="flex-shrink-0 w-9 h-9 rounded-full overflow-hidden bg-white ring-1 ring-slate-200 shadow-sm">
            <Image
              src="/bot-avatar.jpg"
              alt="Trợ lý AI"
              width={72}
              height={72}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div
          className={cn(
            "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
            isUser
              ? "bg-[color:var(--color-evn-blue)] text-white rounded-br-md"
              : "bg-slate-100 text-slate-900 rounded-bl-md"
          )}
        >
          {textOnly || (message.pending ? "…" : "")}
        </div>
      </div>
      {hasForm && onFormSubmit && (
        <FormDmtmn onSubmit={onFormSubmit} disabled={disabled ?? false} />
      )}
      {!isUser && message.quickReplies && message.quickReplies.length > 0 && onQuickReply && (
        <QuickReplyButtons
          buttons={message.quickReplies}
          onPick={onQuickReply}
          disabled={disabled}
        />
      )}
      {(canReadAloud || showFeedback) && (
        <div className="flex items-center gap-1 pl-11 mt-0.5">
          {canReadAloud && (
            <button
              type="button"
              onClick={handleReadAloud}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors",
                speaking
                  ? "text-[color:var(--color-evn-blue)] bg-slate-100"
                  : hasVietnameseVoice
                    ? "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              )}
              aria-label={
                speaking
                  ? "Dừng đọc"
                  : hasVietnameseVoice
                    ? "Nghe câu trả lời"
                    : "Thiết bị chưa cài giọng tiếng Việt"
              }
              title={
                speaking
                  ? "Dừng đọc"
                  : hasVietnameseVoice
                    ? "Nghe câu trả lời"
                    : "Thiết bị chưa cài giọng tiếng Việt — bấm để xem hướng dẫn"
              }
            >
              {speaking ? (
                <>
                  <VolumeX className="h-3.5 w-3.5" />
                  Dừng
                </>
              ) : (
                <>
                  <Volume2 className="h-3.5 w-3.5" />
                  Nghe
                </>
              )}
            </button>
          )}
          {showFeedback && <FeedbackButtons messageId={message.serverMessageId!} />}
        </div>
      )}
    </div>
  );
}
