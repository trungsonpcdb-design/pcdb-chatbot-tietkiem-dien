import { cn } from "@/lib/utils";
import { CitationPopover, type Citation } from "./citation-popover";
import { FeedbackButtons } from "./feedback-buttons";

export interface ChatMessage {
  id: string;
  serverMessageId?: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  pending?: boolean;
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex flex-col", isUser ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
          isUser
            ? "bg-[color:var(--color-evn-blue)] text-white rounded-br-md"
            : "bg-slate-100 text-slate-900 rounded-bl-md"
        )}
      >
        {message.content || (message.pending ? "…" : "")}
      </div>
      {!isUser && !message.pending && (
        <div className="flex items-center gap-1">
          {message.serverMessageId && <FeedbackButtons messageId={message.serverMessageId} />}
          {message.citations && message.citations.length > 0 && (
            <CitationPopover citations={message.citations} />
          )}
        </div>
      )}
    </div>
  );
}
