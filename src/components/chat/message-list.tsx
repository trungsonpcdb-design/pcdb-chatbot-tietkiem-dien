"use client";

import { useEffect, useRef } from "react";
import { MessageBubble, type ChatMessage } from "./message-bubble";
import { HeroWelcome } from "./hero-welcome";
import type { FormDmtmnData } from "./form-dmtmn";
import type { ScriptButton } from "@/lib/scripts";

export function MessageList({
  messages,
  onFormSubmit,
  onQuickReply,
  onHeroPick,
  showHero,
  busy,
}: {
  messages: ChatMessage[];
  onFormSubmit?: (data: FormDmtmnData) => void;
  onQuickReply?: (btn: ScriptButton) => void;
  onHeroPick: (scriptId: string, label: string) => void;
  showHero: boolean;
  busy: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  if (showHero && messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto">
        <HeroWelcome onPickTopic={onHeroPick} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
      {messages.map((m) => (
        <MessageBubble
          key={m.id}
          message={m}
          onFormSubmit={onFormSubmit}
          onQuickReply={onQuickReply}
          disabled={busy}
        />
      ))}
      <div ref={endRef} />
    </div>
  );
}
