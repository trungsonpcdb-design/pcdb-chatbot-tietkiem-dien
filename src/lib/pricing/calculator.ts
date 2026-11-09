// Hàm tính hóa đơn tiền điện — thuần, không side-effect.
// Dùng chung cho tiện ích /tinh-tien-dien và card trong chat.

import {
  VAT_RATE,
  RESIDENTIAL_NEW,
  RESIDENTIAL_OLD,
  productionPrices,
  businessPrices,
  adminPrice,
  type Decision,
  type VoltageKey,
  type BusinessGroup,
  type AdminGroup,
  type ResidentialTariff,
  type TouPrices,
} from "./tariffs";

// ===== Chung =====
export interface TierBreakdown {
  rangeLabel: string; // "0 – 100 kWh"
  unitPrice: number;
  kwh: number;
  amount: number;
}

export interface BillResult {
  lines: TierBreakdown[]; // bảng chi tiết hiển thị cho user
  subtotal: number; // tiền điện chưa thuế
  vat: number; // thuế GTGT
  total: number; // tổng cộng
}

function round(n: number): number {
  return Math.round(n);
}

function makeResult(lines: TierBreakdown[]): BillResult {
  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  const vat = round(subtotal * VAT_RATE);
  const total = subtotal + vat;
  return { lines, subtotal, vat, total };
}

// ===== 1. SINH HOẠT =====
export interface ResidentialInput {
  totalKwh: number; // tổng điện năng tiêu thụ trong kỳ (kWh)
  households: number; // số hộ dùng chung công tơ (mặc định 1)
  billingDays: number; // số ngày của kỳ tính (mặc định 30)
}

function buildTierLimits(tariff: ResidentialTariff, households: number, days: number): number[] {
  // Định mức mỗi bậc = ceiling-step × số hộ × (ngày / 30)
  const factor = households * (days / 30);
  const limits: number[] = [];
  for (let i = 0; i < tariff.tiers.length; i++) {
    if (i === tariff.tiers.length - 1) {
      limits.push(Infinity);
    } else {
      const ceilingPrev = i === 0 ? 0 : tariff.tiers[i - 1].ceiling;
      const step = tariff.tiers[i].ceiling - ceilingPrev;
      limits.push(step * factor);
    }
  }
  return limits;
}

function fmtTierLabel(prevCum: number, step: number, idx: number, isLast: boolean): string {
  const lo = Math.round(prevCum);
  if (isLast) return `Bậc ${idx + 1} (từ ${lo + 1} kWh trở lên)`;
  const hi = Math.round(prevCum + step);
  return `Bậc ${idx + 1} (${lo + 1} – ${hi} kWh)`;
}

export function calcResidential(input: ResidentialInput, tariff: ResidentialTariff): BillResult {
  const households = Math.max(1, Math.floor(input.households || 1));
  const days = Math.max(1, Math.floor(input.billingDays || 30));
  const remaining = { value: Math.max(0, input.totalKwh) };
  const limits = buildTierLimits(tariff, households, days);

  const lines: TierBreakdown[] = [];
  let prevCum = 0;
  for (let i = 0; i < tariff.tiers.length; i++) {
    const step = limits[i];
    const kwhInTier = Math.min(remaining.value, step);
    const unitPrice = tariff.tiers[i].price;
    const amount = round(kwhInTier * unitPrice);
    lines.push({
      rangeLabel: fmtTierLabel(prevCum, step, i, i === tariff.tiers.length - 1),
      unitPrice,
      kwh: Math.round(kwhInTier * 100) / 100,
      amount,
    });
    remaining.value -= kwhInTier;
    prevCum += step;
    if (remaining.value <= 0) {
      // vẫn giữ các dòng còn lại để UI hiển thị đủ bậc, nhưng kWh = 0
      for (let j = i + 1; j < tariff.tiers.length; j++) {
        const nextStep = limits[j];
        lines.push({
          rangeLabel: fmtTierLabel(prevCum, nextStep, j, j === tariff.tiers.length - 1),
          unitPrice: tariff.tiers[j].price,
          kwh: 0,
          amount: 0,
        });
        prevCum += nextStep;
      }
      break;
    }
  }
  return makeResult(lines);
}

export function calcResidentialBoth(input: ResidentialInput): { new: BillResult; old: BillResult } {
  return {
    new: calcResidential(input, RESIDENTIAL_NEW),
    old: calcResidential(input, RESIDENTIAL_OLD),
  };
}

// ===== 2. SẢN XUẤT / 3. KINH DOANH — có TOU =====
export interface TouInput {
  kwhNormal: number;
  kwhOffPeak: number;
  kwhPeak: number;
}

function calcTou(input: TouInput, prices: TouPrices): BillResult {
  const lines: TierBreakdown[] = [
    {
      rangeLabel: "Giờ bình thường",
      unitPrice: prices.normal,
      kwh: Math.max(0, input.kwhNormal),
      amount: round(Math.max(0, input.kwhNormal) * prices.normal),
    },
    {
      rangeLabel: "Giờ thấp điểm",
      unitPrice: prices.offPeak,
      kwh: Math.max(0, input.kwhOffPeak),
      amount: round(Math.max(0, input.kwhOffPeak) * prices.offPeak),
    },
    {
      rangeLabel: "Giờ cao điểm",
      unitPrice: prices.peak,
      kwh: Math.max(0, input.kwhPeak),
      amount: round(Math.max(0, input.kwhPeak) * prices.peak),
    },
  ];
  return makeResult(lines);
}

export function calcProductionBoth(
  input: TouInput,
  voltage: VoltageKey,
): { new: BillResult; old: BillResult; newPrices: TouPrices; oldPrices: TouPrices } {
  const newPrices = productionPrices("QD2892", voltage);
  const oldPrices = productionPrices("QD1279", voltage);
  return {
    new: calcTou(input, newPrices),
    old: calcTou(input, oldPrices),
    newPrices,
    oldPrices,
  };
}

export function calcBusinessBoth(
  input: TouInput,
  group: BusinessGroup,
  voltage: VoltageKey,
): { new: BillResult; old: BillResult; newPrices: TouPrices; oldPrices: TouPrices } {
  const newPrices = businessPrices("QD2892", group, voltage);
  const oldPrices = businessPrices("QD1279", group, voltage);
  return {
    new: calcTou(input, newPrices),
    old: calcTou(input, oldPrices),
    newPrices,
    oldPrices,
  };
}

// ===== 4. HÀNH CHÍNH SỰ NGHIỆP — 1 giá =====
export interface FlatInput {
  totalKwh: number;
}

export function calcAdminBoth(
  input: FlatInput,
  group: AdminGroup,
  voltage: VoltageKey,
): { new: BillResult; old: BillResult; newPrice: number; oldPrice: number } {
  const newPrice = adminPrice("QD2892", group, voltage);
  const oldPrice = adminPrice("QD1279", group, voltage);
  const kwh = Math.max(0, input.totalKwh);
  const mkLines = (price: number): TierBreakdown[] => [
    {
      rangeLabel: "Toàn bộ sản lượng",
      unitPrice: price,
      kwh,
      amount: round(kwh * price),
    },
  ];
  return {
    new: makeResult(mkLines(newPrice)),
    old: makeResult(mkLines(oldPrice)),
    newPrice,
    oldPrice,
  };
}

// Tiện ích format VNĐ
export function fmtVnd(n: number): string {
  return Math.round(n).toLocaleString("vi-VN");
}

export function diffLabel(newTotal: number, oldTotal: number): { text: string; color: "red" | "green" | "slate" } {
  const d = newTotal - oldTotal;
  if (d === 0) return { text: "Không đổi", color: "slate" };
  if (d < 0) return { text: `Tiết kiệm ${fmtVnd(-d)} đ so với giá cũ`, color: "green" };
  return { text: `Tăng ${fmtVnd(d)} đ so với giá cũ`, color: "red" };
}

export { type Decision };
