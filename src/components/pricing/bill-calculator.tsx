"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  VOLTAGE_OPTIONS,
  BUSINESS_GROUP_OPTIONS,
  ADMIN_GROUP_OPTIONS,
  DECISION_LABEL,
  type VoltageKey,
  type BusinessGroup,
  type AdminGroup,
} from "@/lib/pricing/tariffs";
import {
  calcResidentialBoth,
  calcProductionBoth,
  calcBusinessBoth,
  calcAdminBoth,
  fmtVnd,
  diffLabel,
  type BillResult,
} from "@/lib/pricing/calculator";

type Tab = "residential" | "production" | "business" | "admin";

const TABS: { key: Tab; label: string }[] = [
  { key: "residential", label: "🏠 Sinh hoạt" },
  { key: "production", label: "🏭 Sản xuất" },
  { key: "business", label: "🏪 Kinh doanh" },
  { key: "admin", label: "🏛️ HC-SN" },
];

function daysBetween(fromISO: string, toISO: string): number {
  const d1 = new Date(fromISO);
  const d2 = new Date(toISO);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 30;
  const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff);
}

function todayISO(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

interface CalcOutput {
  new: BillResult;
  old: BillResult;
  context?: string; // "Giá áp cho cấp điện áp X, nhóm Y"
}

export function BillCalculator({ compact = false }: { compact?: boolean }) {
  const [tab, setTab] = useState<Tab>("residential");

  // --- Sinh hoạt ---
  const [resFrom, setResFrom] = useState(todayISO(-30));
  const [resTo, setResTo] = useState(todayISO());
  const [resKwh, setResKwh] = useState<string>("");
  const [resHouseholds, setResHouseholds] = useState<string>("1");

  // --- Sản xuất / KD (dùng chung TOU input) ---
  const [touNormal, setTouNormal] = useState<string>("");
  const [touOff, setTouOff] = useState<string>("");
  const [touPeak, setTouPeak] = useState<string>("");

  // --- Voltage (chung sản xuất / KD / HCSN) ---
  const [voltage, setVoltage] = useState<VoltageKey>("V_LOW");

  // --- Kinh doanh ---
  const [bizGroup, setBizGroup] = useState<BusinessGroup>("OTHER");

  // --- HC-SN ---
  const [adminGroup, setAdminGroup] = useState<AdminGroup>("HEALTH_EDU");
  const [adminKwh, setAdminKwh] = useState<string>("");

  const [output, setOutput] = useState<CalcOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  function calculate() {
    setError(null);
    try {
      if (tab === "residential") {
        const kwh = Number(resKwh);
        if (!Number.isFinite(kwh) || kwh < 0) throw new Error("Nhập tổng điện năng tiêu thụ (kWh) hợp lệ.");
        const households = Math.max(1, Math.floor(Number(resHouseholds) || 1));
        const days = daysBetween(resFrom, resTo);
        const r = calcResidentialBoth({ totalKwh: kwh, households, billingDays: days });
        setOutput({
          ...r,
          context: `Kỳ ${days} ngày (${resFrom} → ${resTo}), ${households} hộ dùng chung công tơ, tổng ${kwh.toLocaleString("vi-VN")} kWh.`,
        });
      } else if (tab === "production") {
        const input = { kwhNormal: Number(touNormal) || 0, kwhOffPeak: Number(touOff) || 0, kwhPeak: Number(touPeak) || 0 };
        if (input.kwhNormal + input.kwhOffPeak + input.kwhPeak <= 0) throw new Error("Nhập sản lượng ít nhất 1 khung giờ.");
        const r = calcProductionBoth(input, voltage);
        const voltLabel = VOLTAGE_OPTIONS.find((v) => v.key === voltage)?.label ?? "";
        setOutput({
          new: r.new,
          old: r.old,
          context: `Sản xuất — ${voltLabel}. Tổng ${(input.kwhNormal + input.kwhOffPeak + input.kwhPeak).toLocaleString("vi-VN")} kWh.`,
        });
      } else if (tab === "business") {
        const input = { kwhNormal: Number(touNormal) || 0, kwhOffPeak: Number(touOff) || 0, kwhPeak: Number(touPeak) || 0 };
        if (input.kwhNormal + input.kwhOffPeak + input.kwhPeak <= 0) throw new Error("Nhập sản lượng ít nhất 1 khung giờ.");
        const r = calcBusinessBoth(input, bizGroup, voltage);
        const grp = BUSINESS_GROUP_OPTIONS.find((g) => g.key === bizGroup);
        const voltLabel = VOLTAGE_OPTIONS.find((v) => v.key === voltage)?.label ?? "";
        setOutput({
          new: r.new,
          old: r.old,
          context: `${grp?.label} — ${voltLabel}.${grp?.note ? " " + grp.note : ""}`,
        });
      } else {
        const kwh = Number(adminKwh);
        if (!Number.isFinite(kwh) || kwh < 0) throw new Error("Nhập tổng điện năng (kWh) hợp lệ.");
        const r = calcAdminBoth({ totalKwh: kwh }, adminGroup, voltage);
        const grp = ADMIN_GROUP_OPTIONS.find((g) => g.key === adminGroup);
        const voltLabel = VOLTAGE_OPTIONS.find((v) => v.key === voltage)?.label ?? "";
        setOutput({
          new: r.new,
          old: r.old,
          context: `${grp?.label} — ${voltLabel}. Tổng ${kwh.toLocaleString("vi-VN")} kWh.`,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setOutput(null);
    }
  }

  function reset() {
    setResKwh("");
    setResHouseholds("1");
    setTouNormal("");
    setTouOff("");
    setTouPeak("");
    setAdminKwh("");
    setOutput(null);
    setError(null);
  }

  const diff = useMemo(() => (output ? diffLabel(output.new.total, output.old.total) : null), [output]);

  return (
    <div className={cn("bg-white rounded-xl border shadow-sm", compact ? "p-3" : "p-4 sm:p-6")}>
      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key);
              setOutput(null);
              setError(null);
            }}
            className={cn(
              "px-3 py-2 text-sm font-medium border-b-2 transition-colors",
              tab === t.key
                ? "border-[color:var(--color-evn-blue)] text-[color:var(--color-evn-blue)]"
                : "border-transparent text-slate-500 hover:text-slate-800",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Form input */}
      <div className="grid gap-3 mb-4">
        {tab === "residential" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-slate-600 block mb-1">Từ ngày</label>
              <Input type="date" value={resFrom} onChange={(e) => setResFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Đến ngày</label>
              <Input type="date" value={resTo} onChange={(e) => setResTo(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Tổng điện năng tiêu thụ (kWh)</label>
              <Input
                type="number"
                min={0}
                inputMode="decimal"
                placeholder="VD: 250"
                value={resKwh}
                onChange={(e) => setResKwh(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Số hộ dùng chung công tơ</label>
              <Input
                type="number"
                min={1}
                step={1}
                value={resHouseholds}
                onChange={(e) => setResHouseholds(e.target.value)}
              />
            </div>
          </div>
        )}

        {(tab === "production" || tab === "business") && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              {tab === "business" && (
                <div>
                  <label className="text-xs text-slate-600 block mb-1">Nhóm kinh doanh</label>
                  <select
                    value={bizGroup}
                    onChange={(e) => setBizGroup(e.target.value as BusinessGroup)}
                    className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"
                  >
                    {BUSINESS_GROUP_OPTIONS.map((g) => (
                      <option key={g.key} value={g.key}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className={tab === "business" ? "" : "sm:col-span-2"}>
                <label className="text-xs text-slate-600 block mb-1">Cấp điện áp</label>
                <select
                  value={voltage}
                  onChange={(e) => setVoltage(e.target.value as VoltageKey)}
                  className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"
                >
                  {VOLTAGE_OPTIONS.map((v) => (
                    <option key={v.key} value={v.key}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="text-xs text-slate-600 block mb-1">Sản lượng giờ bình thường (kWh)</label>
                <Input type="number" min={0} placeholder="0" value={touNormal} onChange={(e) => setTouNormal(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-slate-600 block mb-1">Sản lượng giờ thấp điểm (kWh)</label>
                <Input type="number" min={0} placeholder="0" value={touOff} onChange={(e) => setTouOff(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-slate-600 block mb-1">Sản lượng giờ cao điểm (kWh)</label>
                <Input type="number" min={0} placeholder="0" value={touPeak} onChange={(e) => setTouPeak(e.target.value)} />
              </div>
            </div>
          </>
        )}

        {tab === "admin" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-slate-600 block mb-1">Nhóm</label>
              <select
                value={adminGroup}
                onChange={(e) => setAdminGroup(e.target.value as AdminGroup)}
                className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"
              >
                {ADMIN_GROUP_OPTIONS.map((g) => (
                  <option key={g.key} value={g.key}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Cấp điện áp</label>
              <select
                value={voltage}
                onChange={(e) => setVoltage(e.target.value as VoltageKey)}
                className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"
              >
                {VOLTAGE_OPTIONS.map((v) => (
                  <option key={v.key} value={v.key}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-600 block mb-1">Tổng điện năng tiêu thụ (kWh)</label>
              <Input
                type="number"
                min={0}
                placeholder="VD: 1500"
                value={adminKwh}
                onChange={(e) => setAdminKwh(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={calculate}>🔎 Tính toán</Button>
          <Button variant="outline" onClick={reset}>
            Xoá
          </Button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {/* Output: 2 columns */}
      {output && (
        <div className="mt-2">
          {output.context && (
            <p className="text-xs text-slate-500 mb-2 italic">{output.context}</p>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            <ResultPanel
              title={DECISION_LABEL.QD2892}
              highlight="new"
              result={output.new}
            />
            <ResultPanel
              title={DECISION_LABEL.QD1279}
              highlight="old"
              result={output.old}
            />
          </div>
          {diff && (
            <div
              className={cn(
                "mt-3 rounded-lg px-3 py-2 text-sm font-medium",
                diff.color === "red" && "bg-red-50 text-red-700 border border-red-200",
                diff.color === "green" && "bg-green-50 text-green-700 border border-green-200",
                diff.color === "slate" && "bg-slate-50 text-slate-700 border border-slate-200",
              )}
            >
              Chênh lệch: {diff.text}
            </div>
          )}
          <p className="text-xs text-slate-500 mt-3">
            Kết quả là ước tính tham khảo theo biểu giá công bố. Hóa đơn chính thức do PC Điện Biên phát hành có thể khác do kỳ bắc cầu, phụ thu, giảm trừ chính sách. VAT mặc định 8%.
          </p>
        </div>
      )}
    </div>
  );
}

function ResultPanel({ title, highlight, result }: { title: string; highlight: "new" | "old"; result: BillResult }) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3",
        highlight === "new" ? "border-[color:var(--color-evn-blue)] bg-blue-50/40" : "border-slate-200 bg-slate-50/40",
      )}
    >
      <div className="font-semibold text-sm mb-2">{title}</div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-500 border-b">
              <th className="text-left py-1 pr-2 font-medium">Khoản mục</th>
              <th className="text-right py-1 px-1 font-medium">Đơn giá</th>
              <th className="text-right py-1 px-1 font-medium">kWh</th>
              <th className="text-right py-1 pl-1 font-medium">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {result.lines.map((l, i) => (
              <tr key={i} className={cn("border-b border-slate-100", l.kwh === 0 && "text-slate-400")}>
                <td className="py-1 pr-2">{l.rangeLabel}</td>
                <td className="py-1 px-1 text-right tabular-nums">{fmtVnd(l.unitPrice)}</td>
                <td className="py-1 px-1 text-right tabular-nums">{l.kwh.toLocaleString("vi-VN")}</td>
                <td className="py-1 pl-1 text-right tabular-nums">{fmtVnd(l.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-slate-600">Tiền điện chưa thuế:</span>
          <span className="tabular-nums">{fmtVnd(result.subtotal)} đ</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Thuế GTGT (8%):</span>
          <span className="tabular-nums">{fmtVnd(result.vat)} đ</span>
        </div>
        <div className="flex justify-between font-bold text-sm pt-1 border-t">
          <span>Tổng cộng:</span>
          <span className="tabular-nums text-[color:var(--color-evn-blue)]">{fmtVnd(result.total)} đ</span>
        </div>
      </div>
    </div>
  );
}
