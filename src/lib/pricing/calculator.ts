// Hàm tính hóa đơn tiền điện — thuần, không side-effect.
// Hỗ trợ kỳ hóa đơn BẮC CẦU ngày đổi giá nhà nước (01/11/2026), chia tự động
// theo tỷ lệ ngày cho sinh hoạt; chốt chỉ số thực tế cho sản xuất / kinh doanh /
// hành chính sự nghiệp (có hoặc không TOU).

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

// Ngày đổi giá nhà nước theo QĐ 2892/QĐ-BCT.
// Sản lượng tiêu thụ TRƯỚC ngày này = giá cũ (QĐ 1279); từ ngày này trở đi = giá mới.
export const PRICE_CHANGE_DATE_ISO = "2026-11-01";

// ===== Chung =====
export interface TierBreakdown {
  rangeLabel: string;
  unitPrice: number;
  kwh: number;
  amount: number;
}

export interface BillSection {
  heading: string; // "Chi tiết giá cũ (QĐ 1279)" / "Chi tiết giá mới (QĐ 2892)"
  decision: Decision;
  lines: TierBreakdown[];
  subtotal: number;
}

export interface BillResult {
  sections: BillSection[];
  subtotal: number;
  vat: number;
  total: number;
}

function round(n: number): number {
  return Math.round(n);
}

function sum(lines: TierBreakdown[]): number {
  return lines.reduce((s, l) => s + l.amount, 0);
}

function makeBillResult(sections: BillSection[]): BillResult {
  const subtotal = sections.reduce((s, sec) => s + sec.subtotal, 0);
  const vat = round(subtotal * VAT_RATE);
  const total = subtotal + vat;
  return { sections, subtotal, vat, total };
}

// ===== Ngày & kỳ hóa đơn =====
function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function daysInclusive(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.floor(ms / (24 * 3600 * 1000)) + 1;
}

function daysInMonthOf(d: Date): number {
  // last day of the month = day 0 of next month
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export interface BillingSplit {
  totalDays: number;
  oldDays: number; // số ngày tiêu thụ ở giá cũ
  newDays: number; // số ngày tiêu thụ ở giá mới
  straddles: boolean; // true nếu kỳ bắc cầu ngày đổi giá
}

export function splitBillingPeriod(fromISO: string, toISO: string): BillingSplit {
  const from = parseISO(fromISO);
  const to = parseISO(toISO);
  const change = parseISO(PRICE_CHANGE_DATE_ISO);
  if (to.getTime() < from.getTime()) {
    return { totalDays: 0, oldDays: 0, newDays: 0, straddles: false };
  }
  const totalDays = daysInclusive(from, to);
  let oldDays = 0;
  if (from.getTime() < change.getTime()) {
    const oldEnd = to.getTime() < change.getTime() ? to : new Date(change.getTime() - 24 * 3600 * 1000);
    oldDays = daysInclusive(from, oldEnd);
    if (oldDays > totalDays) oldDays = totalDays;
    if (oldDays < 0) oldDays = 0;
  }
  const newDays = totalDays - oldDays;
  return {
    totalDays,
    oldDays,
    newDays,
    straddles: oldDays > 0 && newDays > 0,
  };
}

// ===== 1. SINH HOẠT =====
export interface ResidentialInput {
  totalKwh: number;
  households: number;
  fromISO: string;
  toISO: string;
  oldKwhOverride?: number;
}

// Allocate kWh vào các bậc; mỗi bậc step được scale theo (periodDays/totalDays * households).
// EVN rule: nếu totalDays = periodDays (không split), scale factor = households (như full-kỳ).
// Nếu split: scale = periodDays / totalDays * households.
function buildScaledLimits(tariff: ResidentialTariff, scaleFactor: number): number[] {
  const steps: number[] = [];
  let prevCeiling = 0;
  for (const t of tariff.tiers) {
    if (t.ceiling === Infinity) {
      steps.push(Infinity);
    } else {
      const origStep = t.ceiling - prevCeiling;
      steps.push(Math.max(0, round(origStep * scaleFactor)));
    }
    prevCeiling = t.ceiling;
  }
  return steps;
}

function allocateToResidentialTiers(
  kwh: number,
  tariff: ResidentialTariff,
  scaleFactor: number,
): TierBreakdown[] {
  const limits = buildScaledLimits(tariff, scaleFactor);
  const lines: TierBreakdown[] = [];
  let remaining = Math.max(0, kwh);
  let cumulativeDisplayed = 0;

  for (let i = 0; i < tariff.tiers.length; i++) {
    const step = limits[i];
    const isLast = i === tariff.tiers.length - 1;
    const kwhInTier = Math.min(remaining, step);
    const unitPrice = tariff.tiers[i].price;
    const amount = round(kwhInTier * unitPrice);
    const stepLabel = isLast
      ? `Bậc ${i + 1} (từ ${cumulativeDisplayed + 1} kWh trở lên)`
      : `Bậc ${i + 1} (${cumulativeDisplayed + 1} – ${cumulativeDisplayed + step} kWh)`;
    if (kwhInTier > 0) {
      lines.push({
        rangeLabel: stepLabel,
        unitPrice,
        kwh: kwhInTier,
        amount,
      });
    }
    remaining -= kwhInTier;
    cumulativeDisplayed += isLast ? kwhInTier : step;
    if (remaining <= 0) break;
  }
  return lines;
}

export function calcResidentialRealistic(
  input: ResidentialInput,
  split: BillingSplit,
): BillResult {
  const households = Math.max(1, Math.floor(input.households || 1));
  const { totalDays, oldDays, newDays, straddles } = split;
  if (totalDays === 0) return makeBillResult([]);

  const totalKwh = Math.max(0, input.totalKwh);
  const sections: BillSection[] = [];

  if (!straddles) {
    // Toàn kỳ cùng 1 biểu giá — scale ngưỡng bậc theo kỳDays/30 (công thức EVN)
    const tariff = oldDays === totalDays ? RESIDENTIAL_OLD : RESIDENTIAL_NEW;
    const scale = households * (totalDays / 30);
    const lines = allocateToResidentialTiers(totalKwh, tariff, scale);
    sections.push({
      heading:
        tariff === RESIDENTIAL_OLD
          ? `Chi tiết theo biểu giá cũ (QĐ 1279) — ${totalDays} ngày`
          : `Chi tiết theo biểu giá mới (QĐ 2892) — ${totalDays} ngày`,
      decision: tariff.decision,
      lines,
      subtotal: sum(lines),
    });
    return makeBillResult(sections);
  }

  // Kỳ bắc cầu: chia theo tỷ lệ ngày, hoặc dùng chốt chỉ số thực tế nếu caller cung cấp.
  let oldKwh: number;
  if (typeof input.oldKwhOverride === "number" && input.oldKwhOverride >= 0) {
    oldKwh = Math.min(Math.max(0, round(input.oldKwhOverride)), totalKwh);
  } else {
    oldKwh = round(totalKwh * (oldDays / totalDays));
  }
  const newKwh = totalKwh - oldKwh;
  // Scale ngưỡng bậc theo quy ước EVN: CẢ HAI segments dùng cùng divisor =
  // daysInMonth(fromDate's month) = số ngày của THÁNG ĐẦU KỲ (tháng chứa
  // ngày bắt đầu đọc chỉ số). VD kỳ 22/10 → 21/11 → divisor = 31 (tháng 10)
  // cho cả phần cũ (10 ngày) VÀ phần mới (21 ngày) → Bậc 1 QĐ 2892 cap =
  // 100 × 21/31 = 68 (khớp hóa đơn EVN).
  const from = parseISO(input.fromISO);
  const monthDays = daysInMonthOf(from);
  const oldScale = (oldDays / monthDays) * households;
  const newScale = (newDays / monthDays) * households;

  if (oldKwh > 0) {
    const oldLines = allocateToResidentialTiers(oldKwh, RESIDENTIAL_OLD, oldScale);
    sections.push({
      heading: `Chi tiết giá cũ (QĐ 1279) — ${oldDays} ngày, ${oldKwh} kWh`,
      decision: "QD1279",
      lines: oldLines,
      subtotal: sum(oldLines),
    });
  }
  if (newKwh > 0) {
    const newLines = allocateToResidentialTiers(newKwh, RESIDENTIAL_NEW, newScale);
    sections.push({
      heading: `Chi tiết giá mới (QĐ 2892) — ${newDays} ngày, ${newKwh} kWh`,
      decision: "QD2892",
      lines: newLines,
      subtotal: sum(newLines),
    });
  }
  return makeBillResult(sections);
}

// Hypothetical: toàn kỳ áp cùng 1 biểu giá.
// Scale ngưỡng bậc = min(kỳDays, monthDays) / monthDays, với monthDays =
// số ngày của THÁNG ĐẦU KỲ (tháng chứa fromDate).
// Tương đương quy ước EVN: kỳ hóa đơn tháng X được lập đầu tháng X+1, nhưng
// scale theo tháng X (tháng bắt đầu đọc chỉ số). VD kỳ 22/10 → 04/11 thuộc
// hóa đơn tháng 11 phát hành nhưng kỳ bắt đầu tháng 10 → monthDays = 31.
//   • Kỳ ngắn: scale = kỳDays / monthDays (VD 8 ngày tháng 11 → 8/30).
//   • Kỳ ≥ monthDays: scale = 1 (ngưỡng chuẩn, không upscale).
export function calcResidentialHypothetical(input: ResidentialInput, decision: Decision): BillResult {
  const tariff = decision === "QD2892" ? RESIDENTIAL_NEW : RESIDENTIAL_OLD;
  const households = Math.max(1, Math.floor(input.households || 1));
  const split = splitBillingPeriod(input.fromISO, input.toISO);
  const from = parseISO(input.fromISO);
  const monthDays = daysInMonthOf(from);
  const days = split.totalDays || monthDays;
  const scaleFactor = Math.min(days, monthDays) / monthDays;
  const scale = households * scaleFactor;
  const lines = allocateToResidentialTiers(Math.max(0, input.totalKwh), tariff, scale);
  const sections: BillSection[] = [
    {
      heading:
        decision === "QD2892"
          ? `Toàn kỳ ${days} ngày áp QĐ 2892 (giá mới)`
          : `Toàn kỳ ${days} ngày áp QĐ 1279 (giá cũ)`,
      decision,
      lines,
      subtotal: sum(lines),
    },
  ];
  return makeBillResult(sections);
}

// ===== 2 & 3. SẢN XUẤT / KINH DOANH — TOU hoặc flat =====
export interface TouAmounts {
  kwhNormal: number;
  kwhOffPeak: number;
  kwhPeak: number;
}

// Tạo lines từ 1 bộ (prices, amounts). Nếu flat (1 biểu giá) → chỉ có giờ BT.
function touToLines(amounts: TouAmounts, prices: TouPrices, flat: boolean): TierBreakdown[] {
  const lines: TierBreakdown[] = [];
  const n = Math.max(0, amounts.kwhNormal);
  const o = Math.max(0, amounts.kwhOffPeak);
  const p = Math.max(0, amounts.kwhPeak);
  if (flat) {
    if (n > 0) {
      lines.push({ rangeLabel: "Giờ bình thường (1 biểu giá)", unitPrice: prices.normal, kwh: n, amount: round(n * prices.normal) });
    }
  } else {
    if (n > 0) lines.push({ rangeLabel: "Giờ bình thường", unitPrice: prices.normal, kwh: n, amount: round(n * prices.normal) });
    if (o > 0) lines.push({ rangeLabel: "Giờ thấp điểm", unitPrice: prices.offPeak, kwh: o, amount: round(o * prices.offPeak) });
    if (p > 0) lines.push({ rangeLabel: "Giờ cao điểm", unitPrice: prices.peak, kwh: p, amount: round(p * prices.peak) });
  }
  return lines;
}

export interface TouStraddleInput {
  before: TouAmounts; // sản lượng chốt chỉ số trước 01/11/2026
  after: TouAmounts; // sản lượng chốt chỉ số từ 01/11/2026
  voltage: VoltageKey;
  flat: boolean; // 1 biểu giá vs 3 biểu giá
}

export function calcProductionRealistic(input: TouStraddleInput, split: BillingSplit): BillResult {
  const sections: BillSection[] = [];
  if (split.oldDays > 0 || sumTouAmounts(input.before) > 0) {
    const prices = productionPrices("QD1279", input.voltage);
    const lines = touToLines(input.before, prices, input.flat);
    if (lines.length > 0) {
      sections.push({
        heading: split.straddles ? `Chi tiết giá cũ (QĐ 1279) — ${split.oldDays} ngày` : "Chi tiết giá cũ (QĐ 1279)",
        decision: "QD1279",
        lines,
        subtotal: sum(lines),
      });
    }
  }
  if (split.newDays > 0 || sumTouAmounts(input.after) > 0) {
    const prices = productionPrices("QD2892", input.voltage);
    const lines = touToLines(input.after, prices, input.flat);
    if (lines.length > 0) {
      sections.push({
        heading: split.straddles ? `Chi tiết giá mới (QĐ 2892) — ${split.newDays} ngày` : "Chi tiết giá mới (QĐ 2892)",
        decision: "QD2892",
        lines,
        subtotal: sum(lines),
      });
    }
  }
  return makeBillResult(sections);
}

export interface BusinessStraddleInput extends TouStraddleInput {
  group: BusinessGroup;
}

export function calcBusinessRealistic(input: BusinessStraddleInput, split: BillingSplit): BillResult {
  const sections: BillSection[] = [];
  if (split.oldDays > 0 || sumTouAmounts(input.before) > 0) {
    const prices = businessPrices("QD1279", input.group, input.voltage);
    const lines = touToLines(input.before, prices, input.flat);
    if (lines.length > 0) {
      sections.push({
        heading: split.straddles ? `Chi tiết giá cũ (QĐ 1279) — ${split.oldDays} ngày` : "Chi tiết giá cũ (QĐ 1279)",
        decision: "QD1279",
        lines,
        subtotal: sum(lines),
      });
    }
  }
  if (split.newDays > 0 || sumTouAmounts(input.after) > 0) {
    const prices = businessPrices("QD2892", input.group, input.voltage);
    const lines = touToLines(input.after, prices, input.flat);
    if (lines.length > 0) {
      sections.push({
        heading: split.straddles ? `Chi tiết giá mới (QĐ 2892) — ${split.newDays} ngày` : "Chi tiết giá mới (QĐ 2892)",
        decision: "QD2892",
        lines,
        subtotal: sum(lines),
      });
    }
  }
  return makeBillResult(sections);
}

function sumTouAmounts(a: TouAmounts): number {
  return (a.kwhNormal || 0) + (a.kwhOffPeak || 0) + (a.kwhPeak || 0);
}

// ===== 4. HC-SN (flat, không TOU) =====
export interface AdminStraddleInput {
  kwhBefore: number;
  kwhAfter: number;
  group: AdminGroup;
  voltage: VoltageKey;
}

export function calcAdminRealistic(input: AdminStraddleInput, split: BillingSplit): BillResult {
  const sections: BillSection[] = [];
  if (split.oldDays > 0 || input.kwhBefore > 0) {
    const price = adminPrice("QD1279", input.group, input.voltage);
    const kwh = Math.max(0, input.kwhBefore);
    if (kwh > 0) {
      const line: TierBreakdown = {
        rangeLabel: "Toàn bộ sản lượng",
        unitPrice: price,
        kwh,
        amount: round(kwh * price),
      };
      sections.push({
        heading: split.straddles ? `Chi tiết giá cũ (QĐ 1279) — ${split.oldDays} ngày` : "Chi tiết giá cũ (QĐ 1279)",
        decision: "QD1279",
        lines: [line],
        subtotal: line.amount,
      });
    }
  }
  if (split.newDays > 0 || input.kwhAfter > 0) {
    const price = adminPrice("QD2892", input.group, input.voltage);
    const kwh = Math.max(0, input.kwhAfter);
    if (kwh > 0) {
      const line: TierBreakdown = {
        rangeLabel: "Toàn bộ sản lượng",
        unitPrice: price,
        kwh,
        amount: round(kwh * price),
      };
      sections.push({
        heading: split.straddles ? `Chi tiết giá mới (QĐ 2892) — ${split.newDays} ngày` : "Chi tiết giá mới (QĐ 2892)",
        decision: "QD2892",
        lines: [line],
        subtotal: line.amount,
      });
    }
  }
  return makeBillResult(sections);
}

// ===== Cột 2: "Nếu toàn kỳ áp 100% giá cũ QĐ 1279" =====
// Mục đích: cho user thấy hóa đơn sẽ như thế nào nếu không có đợt điều chỉnh
// giá 01/11/2026 (tức áp dụng biểu giá cũ cho toàn bộ kỳ).

export function calcResidentialAllOld(input: ResidentialInput): BillResult {
  return calcResidentialHypothetical(input, "QD1279");
}

function calcTouAllOld(
  input: TouStraddleInput,
  priceOld: TouPrices,
  heading: string,
): BillResult {
  const combined: TouAmounts = {
    kwhNormal: (input.before.kwhNormal || 0) + (input.after.kwhNormal || 0),
    kwhOffPeak: (input.before.kwhOffPeak || 0) + (input.after.kwhOffPeak || 0),
    kwhPeak: (input.before.kwhPeak || 0) + (input.after.kwhPeak || 0),
  };
  const lines = touToLines(combined, priceOld, input.flat);
  const sections: BillSection[] = [];
  if (lines.length > 0) {
    sections.push({
      heading,
      decision: "QD1279",
      lines,
      subtotal: sum(lines),
    });
  }
  return makeBillResult(sections);
}

export function calcProductionAllOld(input: TouStraddleInput): BillResult {
  const prices = productionPrices("QD1279", input.voltage);
  return calcTouAllOld(input, prices, "Toàn kỳ áp QĐ 1279 (giá cũ)");
}

export function calcBusinessAllOld(input: BusinessStraddleInput): BillResult {
  const prices = businessPrices("QD1279", input.group, input.voltage);
  return calcTouAllOld(input, prices, "Toàn kỳ áp QĐ 1279 (giá cũ)");
}

export function calcAdminAllOld(input: AdminStraddleInput): BillResult {
  const kwh = Math.max(0, (input.kwhBefore || 0) + (input.kwhAfter || 0));
  const price = adminPrice("QD1279", input.group, input.voltage);
  const sections: BillSection[] = [];
  if (kwh > 0) {
    const line: TierBreakdown = {
      rangeLabel: "Toàn bộ sản lượng",
      unitPrice: price,
      kwh,
      amount: round(kwh * price),
    };
    sections.push({
      heading: "Toàn kỳ áp QĐ 1279 (giá cũ)",
      decision: "QD1279",
      lines: [line],
      subtotal: line.amount,
    });
  }
  return makeBillResult(sections);
}

// Compare: trả về object chứa 2 bill (realistic left, allOld right)
export interface BillComparison {
  actual: BillResult; // cột trái — hóa đơn thực tế (có split nếu bắc cầu)
  allOld: BillResult; // cột phải — toàn kỳ áp QĐ 1279
  diffTotal: number; // actual.total - allOld.total
}

export function compareResidentialBills(
  input: ResidentialInput,
  split: BillingSplit,
): BillComparison {
  const actual = calcResidentialRealistic(input, split);
  const allOld = calcResidentialAllOld(input);
  return { actual, allOld, diffTotal: actual.total - allOld.total };
}

export function compareProductionBills(
  input: TouStraddleInput,
  split: BillingSplit,
): BillComparison {
  const actual = calcProductionRealistic(input, split);
  const allOld = calcProductionAllOld(input);
  return { actual, allOld, diffTotal: actual.total - allOld.total };
}

export function compareBusinessBills(
  input: BusinessStraddleInput,
  split: BillingSplit,
): BillComparison {
  const actual = calcBusinessRealistic(input, split);
  const allOld = calcBusinessAllOld(input);
  return { actual, allOld, diffTotal: actual.total - allOld.total };
}

export function compareAdminBills(
  input: AdminStraddleInput,
  split: BillingSplit,
): BillComparison {
  const actual = calcAdminRealistic(input, split);
  const allOld = calcAdminAllOld(input);
  return { actual, allOld, diffTotal: actual.total - allOld.total };
}

// ===== Tiện ích format =====
export function fmtVnd(n: number): string {
  return Math.round(n).toLocaleString("vi-VN");
}

export { type Decision };
