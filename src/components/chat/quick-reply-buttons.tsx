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
    <div className="mt-2 pl-11 flex flex-wrap gap-2 max-w-[85%]">
      {buttons.map((btn, idx) => (
        <button
          key={`${btn.label}-${idx}`}
          onClick={() => onPick(btn)}
          disabled={disabled}
          className="text-sm bg-white border border-slate-300 text-slate-700 rounded-full px-4 py-2 shadow-sm transition-all duration-150 hover:border-[color:var(--color-evn-blue)] hover:bg-[color:var(--color-evn-blue-light)] hover:text-[color:var(--color-evn-blue-dark)] hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}
