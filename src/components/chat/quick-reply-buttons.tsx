"use client";

import type { ScriptButton } from "@/lib/scripts";

export function QuickReplyButtons({
  buttons,
  onPick,
  disabled,
}: {
  buttons: ScriptButton[];
  onPick: (btn: ScriptButton) => void;
  disabled?: boolean;
}) {
  return (
    <div className="mt-2 pl-11 flex flex-wrap gap-2 max-w-[80%]">
      {buttons.map((btn, idx) => (
        <button
          key={`${btn.label}-${idx}`}
          onClick={() => onPick(btn)}
          disabled={disabled}
          className="text-sm border border-[color:var(--color-evn-blue)] text-[color:var(--color-evn-blue)] rounded-full px-3 py-1.5 hover:bg-[color:var(--color-evn-blue)] hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}
