"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSpeechSynthesis } from "@/lib/hooks/use-speech-synthesis";
import type { Citation } from "./citation-popover";
import { FeedbackButtons } from "./feedback-buttons";
import { FormDmtmn, type FormDmtmnData } from "./form-dmtmn";
import { SolarCalcCard } from "./solar-calc-card";
import { QuickReplyButtons } from "./quick-reply-buttons";
import type { ScriptButton } from "@/lib/scripts";
import { TypingIndicator } from "./typing-indicator";

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
const SOLAR_CALC_MARKER = "<SOLAR_CALC/>";
const DL_REGEX = /\[\[DL:([^|\]]+)\|([^\]]+)\]\]/g;

function renderWithDownloads(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  DL_REGEX.lastIndex = 0;
  while ((m = DL_REGEX.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const url = m[1].trim();
    const label = m[2].trim();
    const filename = url.split("/").pop() ?? "mau.docx";
    parts.push(
      <a
        key={`${m.index}-${url}`}
        href={url}
        download={filename}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 font-semibold text-[color:var(--color-evn-blue)] underline decoration-dotted underline-offset-2 hover:bg-slate-200 rounded px-1"
      >
        {label}
      </a>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : [text];
}

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
  const hasSolarCalc = !isUser && message.content.includes(SOLAR_CALC_MARKER);
  let textOnly = message.content;
  if (hasForm) textOnly = textOnly.replace(FORM_MARKER, "").trim();
  if (hasSolarCalc) textOnly = textOnly.replace(SOLAR_CALC_MARKER, "").trim();
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
    <div className={cn("flex flex-col animate-bubble-in", isUser ? "items-end" : "items-start")}>
      <div
        className={cn(
          "flex w-full gap-2",
          isUser ? "justify-end" : "justify-start items-end"
        )}
      >
        {!isUser && (
          <div className="relative flex-shrink-0 w-9 h-9">
            {message.pending && (
              <span
                aria-hidden
                className="absolute inset-[-4px] rounded-full bg-[color:var(--color-evn-cyan-glow)] opacity-30 blur-md animate-pulse pointer-events-none"
              />
            )}
            <div className="relative z-10 w-9 h-9 rounded-full overflow-hidden bg-white ring-1 ring-slate-200 shadow-sm">
              <Image
                src="/bot-avatar.png"
                alt="Trợ lý AI"
                width={72}
                height={72}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
        <div
          className={cn(
            "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
            isUser
              ? "bg-gradient-to-br from-[color:var(--color-evn-blue)] to-[color:var(--color-evn-blue-dark)] text-white shadow-md rounded-br-md"
              : "bg-white border border-slate-200 text-slate-800 shadow-sm rounded-bl-md"
          )}
        >
          {textOnly
            ? isUser
              ? textOnly
              : renderWithDownloads(textOnly)
            : (message.pending ? <TypingIndicator /> : "")}
        </div>
      </div>
      {hasForm && onFormSubmit && (
        <FormDmtmn onSubmit={onFormSubmit} disabled={disabled ?? false} />
      )}
      {hasSolarCalc && <SolarCalcCard />}
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
                  ? "text-[color:var(--color-evn-blue)] bg-[color:var(--color-evn-blue-light)]"
                  : hasVietnameseVoice
                    ? "text-slate-500 hover:text-slate-800 hover:bg-[color:var(--color-evn-blue-light)]"
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
