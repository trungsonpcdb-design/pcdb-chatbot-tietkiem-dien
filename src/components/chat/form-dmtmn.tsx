"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface FormDmtmnData {
  areaM2: number;
  orientation: string;
  roofType: string;
  monthlyBillVnd: number;
}

const ORIENTATIONS = ["Nam", "Đông Nam", "Tây Nam", "Đông", "Tây", "Bắc"];
const ROOF_TYPES = ["Mái tôn", "Mái bê tông", "Mái ngói"];

export function FormDmtmn({
  onSubmit,
  disabled,
}: {
  onSubmit: (data: FormDmtmnData) => void;
  disabled: boolean;
}) {
  const [submitted, setSubmitted] = useState(false);

  function handle(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitted) return;
    const fd = new FormData(e.currentTarget);
    const data: FormDmtmnData = {
      areaM2: Number(fd.get("area")),
      orientation: String(fd.get("orientation")),
      roofType: String(fd.get("roofType")),
      monthlyBillVnd: Number(String(fd.get("monthlyBill")).replace(/\D/g, "")),
    };
    setSubmitted(true);
    onSubmit(data);
  }

  return (
    <form
      onSubmit={handle}
      className="my-2 border-2 border-dashed border-[color:var(--color-evn-blue)] rounded-xl p-4 bg-white max-w-md space-y-3"
    >
      <div className="font-semibold text-sm">📋 Xin cho biết thêm để tôi tư vấn chính xác:</div>
      <div>
        <label className="text-xs text-slate-600">Diện tích mái (m²)</label>
        <Input name="area" type="number" required min={5} max={2000} placeholder="VD: 50" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-slate-600">Hướng mái</label>
          <select name="orientation" required className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm">
            {ORIENTATIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-600">Loại mái</label>
          <select name="roofType" required className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm">
            {ROOF_TYPES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-600">Hóa đơn điện TB/tháng (VNĐ)</label>
        <Input name="monthlyBill" type="text" required placeholder="VD: 1500000" inputMode="numeric" />
      </div>
      <Button type="submit" variant="primary" size="md" className="w-full" disabled={disabled || submitted}>
        {submitted ? "Đã gửi" : "Tính toán ngay"}
      </Button>
    </form>
  );
}
