import Image from "next/image";
import { cn } from "@/lib/utils";
import { CitationPopover, type Citation } from "./citation-popover";
import { FeedbackButtons } from "./feedback-buttons";
import { FormDmtmn, type FormDmtmnData } from "./form-dmtmn";

export interface ChatMessage {
  id: string;
  serverMessageId?: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  pending?: boolean;
}

const FORM_MARKER = "<FORM_DMTMN/>";

export function MessageBubble({
  message,
  onFormSubmit,
  disabled,
}: {
  message: ChatMessage;
  onFormSubmit?: (data: FormDmtmnData) => void;
  disabled?: boolean;
}) {
  const isUser = message.role === "user";
  const hasForm = !isUser && message.content.includes(FORM_MARKER);
  const textOnly = hasForm ? message.content.replace(FORM_MARKER, "").trim() : message.content;

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
      {!isUser && !message.pending && (
        <div className="flex items-center gap-1 pl-11">
          {message.serverMessageId && <FeedbackButtons messageId={message.serverMessageId} />}
          {message.citations && message.citations.length > 0 && (
            <CitationPopover citations={message.citations} />
          )}
        </div>
      )}
    </div>
  );
}
