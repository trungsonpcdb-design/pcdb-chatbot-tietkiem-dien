import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function KpiCard({
  label,
  value,
  icon: Icon,
  accent = "blue",
  hint,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: "blue" | "green" | "orange" | "red";
  hint?: string;
}) {
  const accentMap = {
    blue: "text-[color:var(--color-evn-blue)] bg-blue-50",
    green: "text-green-700 bg-green-50",
    orange: "text-[color:var(--color-evn-orange)] bg-orange-50",
    red: "text-red-700 bg-red-50",
  };
  return (
    <div className="bg-white border rounded-xl p-4 flex items-start justify-between">
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-2xl font-bold text-slate-900 mt-0.5">{value}</div>
        {hint && <div className="text-xs text-slate-400 mt-0.5">{hint}</div>}
      </div>
      <div className={cn("rounded-lg p-2", accentMap[accent])}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}
