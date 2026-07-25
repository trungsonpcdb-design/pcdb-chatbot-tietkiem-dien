"use client";

import { useEffect, useRef } from "react";
import { MessageBubble, type ChatMessage } from "./message-bubble";
import type { FormDmtmnData } from "./form-dmtmn";

export function MessageList({
  messages,
  onFormSubmit,
  busy,
}: {
  messages: ChatMessage[];
  onFormSubmit?: (data: FormDmtmnData) => void;
  busy: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);
  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} onFormSubmit={onFormSubmit} disabled={busy} />
      ))}
      <div ref={endRef} />
    </div>
  );
}
