"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { estimateByArea, type SolarEstimate } from "@/lib/solar-constants";

function formatVnd(n: number): string {
  return n.toLocaleString("vi-VN") + " đ";
}

export function SolarCalcCard() {
  const [areaStr, setAreaStr] = useState("");
  const [withBess, setWithBess] = useState(true);
  const [result, setResult] = useState<SolarEstimate | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function handle(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const area = Number(areaStr);
    if (!Number.isFinite(area) || area < 10 || area > 5000) {
      setErr("Diện tích mái phải từ 10 đến 5000 m².");
      setResult(null);
      return;
    }
    setErr(null);
    setResult(estimateByArea(area, withBess));
  }

  return (
    <form
      onSubmit={handle}
      className="my-2 border-2 border-dashed border-[color:var(--color-evn-blue)] rounded-xl p-4 bg-white max-w-md space-y-3"
    >
      <div className="font-semibold text-sm">
        🔆 Ước tính chi phí lắp điện mặt trời mái nhà
      </div>

      <div>
        <label className="text-xs text-slate-600">Diện tích mái khả dụng (m²)</label>
        <Input
          type="number"
          min={10}
          max={5000}
          required
          placeholder="VD: 80"
          inputMode="numeric"
          value={areaStr}
          onChange={(e) => setAreaStr(e.target.value)}
        />
      </div>

      <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
        <input
          type="checkbox"
          checked={withBess}
          onChange={(e) => setWithBess(e.target.checked)}
          className="h-4 w-4 accent-[color:var(--color-evn-blue)]"
        />
        <span>Có lắp pin lưu trữ (BESS)</span>
      </label>

      {err && <div className="text-xs text-red-600">{err}</div>}

      <Button
        type="submit"
        variant="primary"
        size="md"
        className="w-full"
      >
        Tính ngay
      </Button>

      {result && (
        <div className="pt-3 border-t border-slate-200 space-y-1.5 text-sm">
          <div className="font-semibold text-slate-800">Kết quả ước tính:</div>
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
            <span className="text-slate-500">Diện tích mái:</span>
            <span className="font-medium">{result.areaM2} m²</span>

            <span className="text-slate-500">Công suất pin:</span>
            <span className="font-medium">{result.kwp} kWp</span>

            <span className="text-slate-500">Chi phí pin:</span>
            <span className="font-medium">{formatVnd(result.pinCost)}</span>

            {result.withBess && (
              <>
                <span className="text-slate-500">Dung lượng BESS:</span>
                <span className="font-medium">{result.bessKwh} kWh</span>

                <span className="text-slate-500">Chi phí BESS:</span>
                <span className="font-medium">{formatVnd(result.bessCost)}</span>
              </>
            )}

            <span className="text-slate-800 font-semibold border-t border-slate-200 pt-1 mt-1">
              Tổng đầu tư:
            </span>
            <span className="text-[color:var(--color-evn-blue)] font-bold border-t border-slate-200 pt-1 mt-1">
              {formatVnd(result.total)}
            </span>
          </div>

          <div className="text-[11px] italic text-slate-500 pt-2 leading-snug">
            ⚠ Giá trên mang tính chất tham khảo theo mặt bằng giá tại địa bàn tỉnh
            Điện Biên năm 2026. Chưa bao gồm VAT, khung sắt gia cố mái, chi phí
            vận chuyển vùng cao. Giá thực tế do nhà cung cấp báo.
          </div>
        </div>
      )}
    </form>
  );
}
