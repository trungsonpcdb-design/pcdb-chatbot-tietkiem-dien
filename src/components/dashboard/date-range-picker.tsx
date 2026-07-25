"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { days: 7, label: "7 ngày" },
  { days: 30, label: "30 ngày" },
  { days: 90, label: "90 ngày" },
];

export function DateRangePicker({ current }: { current: number }) {
  return (
    <div className="flex gap-2">
      {OPTIONS.map((o) => (
        <Link
          key={o.days}
          href={`/dashboard/stats?range=${o.days}`}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm border transition",
            current === o.days
              ? "bg-[color:var(--color-evn-blue)] text-white border-transparent"
              : "border-slate-300 hover:bg-slate-100"
          )}
        >
          {o.label}
        </Link>
      ))}
    </div>
  );
}
