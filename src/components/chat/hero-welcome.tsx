"use client";

import Image from "next/image";
import { SuggestionCard } from "./suggestion-card";
import { PICKER_ENTRIES } from "@/lib/scripts/picker";

function splitIconAndLabel(raw: string): { icon: string; label: string } {
  const firstSpace = raw.indexOf(" ");
  if (firstSpace === -1) return { icon: "", label: raw };
  return {
    icon: raw.slice(0, firstSpace),
    label: raw.slice(firstSpace + 1),
  };
}

export function HeroWelcome({
  onPickTopic,
}: {
  onPickTopic: (scriptId: string, label: string) => void;
}) {
  const cards = PICKER_ENTRIES.map((e) => ({
    scriptId: e.scriptId,
    fullLabel: e.label,
    ...splitIconAndLabel(e.label),
  }));

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 py-8 gap-6">
      {/* Avatar với 2 lớp glow */}
      <div className="relative w-24 h-24">
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-[color:var(--color-evn-blue)] opacity-30 blur-xl animate-pulse"
        />
        <span
          aria-hidden
          className="absolute inset-[-8px] rounded-full bg-[color:var(--color-evn-cyan-glow)] opacity-20 blur-2xl animate-pulse"
          style={{ animationDuration: "3s" }}
        />
        <Image
          src="/bot-avatar.png"
          alt="Trợ lý AI"
          width={96}
          height={96}
          priority
          className="relative z-10 rounded-full ring-2 ring-white shadow-lg object-cover"
        />
      </div>

      <div className="text-center max-w-xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-[color:var(--color-evn-blue-dark)]">
          Xin chào! Tôi là Trợ lý AI của Công ty Điện lực Điện Biên
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600">
          Hỏi tôi về tiết kiệm điện, điện mặt trời mái nhà, giá điện, CSKH
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
        {cards.slice(0, 4).map((c) => (
          <SuggestionCard
            key={c.scriptId}
            icon={c.icon}
            label={c.label}
            onClick={() => onPickTopic(c.scriptId, c.fullLabel)}
          />
        ))}
        {cards[4] && (
          <SuggestionCard
            key={cards[4].scriptId}
            icon={cards[4].icon}
            label={cards[4].label}
            onClick={() => onPickTopic(cards[4].scriptId, cards[4].fullLabel)}
            className="sm:col-span-2"
          />
        )}
      </div>
    </div>
  );
}
