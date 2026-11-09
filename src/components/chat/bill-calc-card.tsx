"use client";

import { BillCalculator } from "@/components/pricing/bill-calculator";

export function BillCalcCard() {
  return (
    <div className="my-2 w-full max-w-2xl rounded-xl border-2 border-dashed border-[color:var(--color-evn-blue)] bg-white/50 p-2">
      <div className="text-xs font-semibold text-[color:var(--color-evn-blue)] mb-2 px-1">
        🧮 Tính thử tiền điện — so sánh biểu giá mới (QĐ 2892) ↔ cũ (QĐ 1279)
      </div>
      <BillCalculator compact />
    </div>
  );
}
