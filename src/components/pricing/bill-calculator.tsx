"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  VOLTAGE_OPTIONS,
  BUSINESS_GROUP_OPTIONS,
  ADMIN_GROUP_OPTIONS,
  type VoltageKey,
  type BusinessGroup,
  type AdminGroup,
} from "@/lib/pricing/tariffs";
import {
  PRICE_CHANGE_DATE_ISO,
  splitBillingPeriod,
  compareResidentialBills,
  compareProductionBills,
  compareBusinessBills,
  compareAdminBills,
  fmtVnd,
  type BillResult,
  type BillingSplit,
  type BillComparison,
  type ResidentialInput,
} from "@/lib/pricing/calculator";

type Tab = "residential" | "production" | "business" | "admin";

const TABS: { key: Tab; label: string }[] = [
  { key: "residential", label: "🏠 Sinh hoạt" },
  { key: "production", label: "🏭 Sản xuất" },
  { key: "business", label: "🏪 Kinh doanh" },
  { key: "admin", label: "🏛️ HC-SN" },
];

function todayISO(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

interface Output {
  bills: BillComparison;
  split: BillingSplit;
  context: string;
}

export function BillCalculator({ compact = false }: { compact?: boolean }) {
  const [tab, setTab] = useState<Tab>("residential");

  const [fromDate, setFromDate] = useState(todayISO(-30));
  const [toDate, setToDate] = useState(todayISO());

  const [resKwh, setResKwh] = useState("");
  const [resHouseholds, setResHouseholds] = useState("1");
  const [resHasMeterReading, setResHasMeterReading] = useState(false);
  const [resOldKwh, setResOldKwh] = useState("");

  const [voltage, setVoltage] = useState<VoltageKey>("V_LOW");
  const [meterType, setMeterType] = useState<"flat" | "tou">("flat");

  const [beforeNormal, setBeforeNormal] = useState("");
  const [beforeOff, setBeforeOff] = useState("");
  const [beforePeak, setBeforePeak] = useState("");
  const [afterNormal, setAfterNormal] = useState("");
  const [afterOff, setAfterOff] = useState("");
  const [afterPeak, setAfterPeak] = useState("");

  const [bizGroup, setBizGroup] = useState<BusinessGroup>("OTHER");
  const [adminGroup, setAdminGroup] = useState<AdminGroup>("HEALTH_EDU");
  const [adminKwhBefore, setAdminKwhBefore] = useState("");
  const [adminKwhAfter, setAdminKwhAfter] = useState("");

  const [output, setOutput] = useState<Output | null>(null);
  const [error, setError] = useState<string | null>(null);

  const split = useMemo(() => splitBillingPeriod(fromDate, toDate), [fromDate, toDate]);
  const straddles = split.straddles;

  useEffect(() => {
    if (!straddles && resHasMeterReading) {
      setResHasMeterReading(false);
      setResOldKwh("");
    }
  }, [straddles, resHasMeterReading]);

  function calculate() {
    setError(null);
    try {
      if (split.totalDays === 0) throw new Error("Đến ngày phải lớn hơn hoặc bằng Từ ngày.");

      if (tab === "residential") {
        const kwh = Number(resKwh);
        if (!Number.isFinite(kwh) || kwh < 0) throw new Error("Nhập tổng điện năng tiêu thụ (kWh) hợp lệ.");
        const households = Math.max(1, Math.floor(Number(resHouseholds) || 1));
        const input: ResidentialInput = { totalKwh: kwh, households, fromISO: fromDate, toISO: toDate };
        let oldKwhNote = "";
        if (straddles && resHasMeterReading) {
          const oldKwh = Number(resOldKwh);
          if (!Number.isFinite(oldKwh) || oldKwh < 0) {
            throw new Error("Nhập sản lượng chốt chỉ số ngày 01/11/2026 hợp lệ.");
          }
          if (oldKwh > kwh) {
            throw new Error(
              `Sản lượng chốt chỉ số (${oldKwh.toLocaleString("vi-VN")} kWh) không được lớn hơn tổng (${kwh.toLocaleString("vi-VN")} kWh).`,
            );
          }
          input.oldKwhOverride = oldKwh;
          const newKwh = kwh - oldKwh;
          oldKwhNote = ` · chốt chỉ số 01/11: ${oldKwh.toLocaleString("vi-VN")} kWh trước + ${newKwh.toLocaleString("vi-VN")} kWh sau.`;
        }
        const bills = compareResidentialBills(input, split);
        setOutput({
          bills,
          split,
          context: `Kỳ ${split.totalDays} ngày · ${households} hộ dùng chung công tơ · tổng ${kwh.toLocaleString("vi-VN")} kWh.${oldKwhNote}`,
        });
      } else if (tab === "production" || tab === "business") {
        const before = {
          kwhNormal: Number(beforeNormal) || 0,
          kwhOffPeak: Number(beforeOff) || 0,
          kwhPeak: Number(beforePeak) || 0,
        };
        const after = {
          kwhNormal: Number(afterNormal) || 0,
          kwhOffPeak: Number(afterOff) || 0,
          kwhPeak: Number(afterPeak) || 0,
        };
        const total =
          before.kwhNormal + before.kwhOffPeak + before.kwhPeak + after.kwhNormal + after.kwhOffPeak + after.kwhPeak;
        if (total <= 0) throw new Error("Nhập sản lượng ít nhất 1 ô (trước hoặc sau).");
        const touInput = { before, after, voltage, flat: meterType === "flat" };
        if (tab === "production") {
          const bills = compareProductionBills(touInput, split);
          const voltLabel = VOLTAGE_OPTIONS.find((v) => v.key === voltage)?.label ?? "";
          setOutput({
            bills,
            split,
            context: `Sản xuất · ${voltLabel} · ${meterType === "flat" ? "1 biểu giá" : "3 biểu giá"} · tổng ${total.toLocaleString("vi-VN")} kWh.`,
          });
        } else {
          const bizInput = { ...touInput, group: bizGroup };
          const bills = compareBusinessBills(bizInput, split);
          const grp = BUSINESS_GROUP_OPTIONS.find((g) => g.key === bizGroup);
          const voltLabel = VOLTAGE_OPTIONS.find((v) => v.key === voltage)?.label ?? "";
          setOutput({
            bills,
            split,
            context: `${grp?.label} · ${voltLabel} · ${meterType === "flat" ? "1 biểu giá" : "3 biểu giá"} · tổng ${total.toLocaleString("vi-VN")} kWh.`,
          });
        }
      } else {
        const before = Number(adminKwhBefore) || 0;
        const after = Number(adminKwhAfter) || 0;
        if (before + after <= 0) throw new Error("Nhập sản lượng ít nhất 1 ô (trước hoặc sau).");
        const input = { kwhBefore: before, kwhAfter: after, group: adminGroup, voltage };
        const bills = compareAdminBills(input, split);
        const grp = ADMIN_GROUP_OPTIONS.find((g) => g.key === adminGroup);
        const voltLabel = VOLTAGE_OPTIONS.find((v) => v.key === voltage)?.label ?? "";
        setOutput({
          bills,
          split,
          context: `${grp?.label} · ${voltLabel} · tổng ${(before + after).toLocaleString("vi-VN")} kWh.`,
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
    setResHasMeterReading(false);
    setResOldKwh("");
    setBeforeNormal("");
    setBeforeOff("");
    setBeforePeak("");
    setAfterNormal("");
    setAfterOff("");
    setAfterPeak("");
    setAdminKwhBefore("");
    setAdminKwhAfter("");
    setOutput(null);
    setError(null);
  }

  const showBeforeSide = straddles;
  const tou = meterType === "tou";

  return (
    <div className={cn("bg-white rounded-xl border shadow-sm", compact ? "p-3" : "p-4 sm:p-6")}>
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

      <div className="grid gap-3 sm:grid-cols-3 mb-3">
        <div>
          <label className="text-xs text-slate-600 block mb-1">Từ ngày</label>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-slate-600 block mb-1">Đến ngày</label>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-slate-600 block mb-1">Ngày đổi giá nhà nước</label>
          <Input type="date" value={PRICE_CHANGE_DATE_ISO} disabled className="bg-slate-50" />
        </div>
      </div>
      {split.totalDays > 0 && (
        <div className={cn("text-xs mb-3 rounded-lg px-3 py-2", straddles ? "bg-amber-50 text-amber-800 border border-amber-200" : "bg-slate-50 text-slate-600")}>
          Kỳ <strong>{split.totalDays}</strong> ngày.
          {straddles ? (
            <>
              {" "}
              Kỳ BẮC CẦU: <strong>{split.oldDays}</strong> ngày áp giá cũ, <strong>{split.newDays}</strong> ngày áp giá mới.
            </>
          ) : (
            <>
              {" "}
              Toàn kỳ áp {split.oldDays === split.totalDays ? "giá cũ (QĐ 1279)" : "giá mới (QĐ 2892)"}.
            </>
          )}
        </div>
      )}

      <div className="grid gap-3 mb-4">
        {tab === "residential" && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs text-slate-600 block mb-1">Tổng điện năng tiêu thụ (kWh)</label>
                <Input type="number" min={0} inputMode="decimal" placeholder="VD: 500" value={resKwh} onChange={(e) => setResKwh(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-slate-600 block mb-1">Số hộ dùng chung công tơ</label>
                <Input type="number" min={1} step={1} value={resHouseholds} onChange={(e) => setResHouseholds(e.target.value)} />
              </div>
            </div>
            {straddles && (
              <div className="rounded-lg border bg-slate-50/60 p-3">
                <label className="flex items-start gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={resHasMeterReading}
                    onChange={(e) => setResHasMeterReading(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    <strong>Có chốt chỉ số ngày 01/11/2026</strong>{" "}
                    <span className="text-xs text-slate-500">
                      (nhập sản lượng thực tế thay vì để hệ thống chia theo tỷ lệ ngày)
                    </span>
                  </span>
                </label>
                {resHasMeterReading && (
                  <div className="mt-3">
                    <label className="text-xs text-slate-600 block mb-1">
                      Sản lượng chốt chỉ số ngày 01/11/2026 (kWh)
                    </label>
                    <Input
                      type="number"
                      min={0}
                      inputMode="decimal"
                      placeholder="VD: 104"
                      value={resOldKwh}
                      onChange={(e) => setResOldKwh(e.target.value)}
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Phần điện năng tiêu thụ TRƯỚC ngày 01/11/2026 — xem cột &quot;Điện TK&quot; dòng &quot;Chỉ số ngày 01/11/2026&quot; trên hóa đơn PC Điện Biên.
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
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
                      <option key={g.key} value={g.key}>{g.label}</option>
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
                    <option key={v.key} value={v.key}>{v.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={meterType === "flat"} onChange={() => setMeterType("flat")} />
                <span>1 biểu giá (flat)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={meterType === "tou"} onChange={() => setMeterType("tou")} />
                <span>3 biểu giá (TOU)</span>
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {showBeforeSide && (
                <div className="rounded-lg border p-3 bg-slate-50/60">
                  <div className="text-xs font-semibold text-slate-700 mb-2">
                    Chốt chỉ số TRƯỚC 01/11/2026 ({split.oldDays} ngày, giá cũ)
                  </div>
                  <div className="grid gap-2">
                    <KwhField label={tou ? "SL giờ bình thường" : "SL điện (kWh)"} value={beforeNormal} setValue={setBeforeNormal} />
                    {tou && (
                      <>
                        <KwhField label="SL giờ thấp điểm" value={beforeOff} setValue={setBeforeOff} />
                        <KwhField label="SL giờ cao điểm" value={beforePeak} setValue={setBeforePeak} />
                      </>
                    )}
                  </div>
                </div>
              )}
              <div className={cn("rounded-lg border p-3 bg-blue-50/40", !showBeforeSide && "md:col-span-2")}>
                <div className="text-xs font-semibold text-slate-700 mb-2">
                  {straddles ? `Chốt chỉ số SAU 01/11/2026 (${split.newDays} ngày, giá mới)` : "Sản lượng tiêu thụ trong kỳ"}
                </div>
                <div className="grid gap-2">
                  <KwhField label={tou ? "SL giờ bình thường" : "SL điện (kWh)"} value={afterNormal} setValue={setAfterNormal} />
                  {tou && (
                    <>
                      <KwhField label="SL giờ thấp điểm" value={afterOff} setValue={setAfterOff} />
                      <KwhField label="SL giờ cao điểm" value={afterPeak} setValue={setAfterPeak} />
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {tab === "admin" && (
          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs text-slate-600 block mb-1">Nhóm</label>
                <select
                  value={adminGroup}
                  onChange={(e) => setAdminGroup(e.target.value as AdminGroup)}
                  className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"
                >
                  {ADMIN_GROUP_OPTIONS.map((g) => (
                    <option key={g.key} value={g.key}>{g.label}</option>
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
                    <option key={v.key} value={v.key}>{v.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {showBeforeSide && (
                <div className="rounded-lg border p-3 bg-slate-50/60">
                  <div className="text-xs font-semibold text-slate-700 mb-2">
                    Chốt chỉ số TRƯỚC 01/11/2026 ({split.oldDays} ngày, giá cũ)
                  </div>
                  <KwhField label="SL điện (kWh)" value={adminKwhBefore} setValue={setAdminKwhBefore} />
                </div>
              )}
              <div className={cn("rounded-lg border p-3 bg-blue-50/40", !showBeforeSide && "md:col-span-2")}>
                <div className="text-xs font-semibold text-slate-700 mb-2">
                  {straddles ? `Chốt chỉ số SAU 01/11/2026 (${split.newDays} ngày, giá mới)` : "Sản lượng tiêu thụ trong kỳ"}
                </div>
                <KwhField label="SL điện (kWh)" value={adminKwhAfter} setValue={setAdminKwhAfter} />
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={calculate}>🔎 Tính toán</Button>
          <Button variant="outline" onClick={reset}>Xoá</Button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {output && <TwoColumnResult output={output} />}
    </div>
  );
}

function KwhField({
  label,
  value,
  setValue,
}: {
  label: string;
  value: string;
  setValue: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-[11px] text-slate-500 block mb-0.5">{label}</label>
      <Input type="number" min={0} inputMode="decimal" placeholder="0" value={value} onChange={(e) => setValue(e.target.value)} />
    </div>
  );
}

function TwoColumnResult({ output }: { output: Output }) {
  const { bills, context, split } = output;
  const diff = bills.diffTotal;

  return (
    <div className="mt-2">
      {context && <p className="text-xs text-slate-500 mb-2 italic">{context}</p>}
      <div className="grid gap-3 md:grid-cols-2">
        <BillPanel
          title={
            split.straddles
              ? "🧾 Hóa đơn thực tế (tháng 11, tính theo giá mới bao gồm cả ngày tính giá cũ)"
              : "🧾 Hóa đơn thực tế"
          }
          highlight="actual"
          result={bills.actual}
        />
        <BillPanel
          title="📎 Nếu 100% áp giá cũ QĐ 1279 (toàn kỳ)"
          highlight="allOld"
          result={bills.allOld}
        />
      </div>
      <div className="mt-3 rounded-lg px-3 py-2 text-sm font-medium bg-red-50 text-red-700 border border-red-200">
        Chênh lệch (thực tế − 100% giá cũ):{" "}
        <strong className="tabular-nums">
          {diff > 0 ? "+" : ""}
          {fmtVnd(diff)} đ
        </strong>
        {bills.allOld.total > 0 && (
          <>
            {" "}
            <strong className="tabular-nums">
              ({diff > 0 ? "+" : ""}
              {((diff / bills.allOld.total) * 100).toFixed(2)}%)
            </strong>
          </>
        )}
        {diff < 0 && " — hóa đơn thực tế RẺ HƠN so với giữ nguyên giá cũ."}
        {diff > 0 && " — hóa đơn thực tế ĐẮT HƠN so với giữ nguyên giá cũ."}
      </div>
      <p className="text-xs text-slate-500 mt-3">
        Kết quả là ước tính tham khảo theo biểu giá công bố. Hóa đơn chính thức do PC Điện Biên phát hành có thể khác do công tơ chốt chỉ số thực tế. VAT 8%.
      </p>
    </div>
  );
}

function BillPanel({
  title,
  highlight,
  result,
}: {
  title: string;
  highlight: "actual" | "allOld";
  result: BillResult;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3",
        highlight === "actual" ? "border-[color:var(--color-evn-blue)] bg-blue-50/40" : "border-amber-200 bg-amber-50/30",
      )}
    >
      <div className="font-semibold text-sm mb-2">{title}</div>
      {result.sections.length === 0 && (
        <div className="text-xs text-slate-500 italic">Không có dữ liệu.</div>
      )}
      {result.sections.map((section, idx) => (
        <div key={idx} className="mb-2">
          <div
            className={cn(
              "text-[11px] font-semibold mb-1 px-2 py-1 rounded",
              section.decision === "QD2892" ? "bg-blue-100 text-[color:var(--color-evn-blue)]" : "bg-amber-100 text-amber-800",
            )}
          >
            {section.heading}
          </div>
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
                {section.lines.map((l, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-1 pr-2">{l.rangeLabel}</td>
                    <td className="py-1 px-1 text-right tabular-nums">{fmtVnd(l.unitPrice)}</td>
                    <td className="py-1 px-1 text-right tabular-nums">{l.kwh.toLocaleString("vi-VN")}</td>
                    <td className="py-1 pl-1 text-right tabular-nums">{fmtVnd(l.amount)}</td>
                  </tr>
                ))}
                <tr className="border-b border-slate-200 text-slate-700">
                  <td colSpan={3} className="py-1 pr-2 text-right font-medium">Cộng</td>
                  <td className="py-1 pl-1 text-right tabular-nums font-semibold">{fmtVnd(section.subtotal)} đ</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ))}
      <div className="mt-2 text-xs space-y-1 border-t pt-2">
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
