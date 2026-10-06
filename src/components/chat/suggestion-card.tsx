"use client";

import { cn } from "@/lib/utils";

export function SuggestionCard({
  icon,
  label,
  onClick,
  className,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-4 text-left",
        "shadow-sm transition-all duration-200",
        "hover:border-[color:var(--color-evn-blue)] hover:shadow-md hover:-translate-y-0.5",
        "focus:outline-none focus:ring-2 focus:ring-[color:var(--color-evn-blue)]",
        className
      )}
    >
      <span className="text-2xl transition-transform duration-200 group-hover:scale-110">
        {icon}
      </span>
      <span className="text-sm font-medium text-slate-800">{label}</span>
    </button>
  );
}
