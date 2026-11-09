// Biểu giá bán điện của Bộ Công Thương — dữ liệu dùng cho tiện ích so sánh
// cũ (QĐ 1279/QĐ-BCT ngày 09/5/2025) vs mới (QĐ 2892/QĐ-BCT ngày 31/10/2026).
// Mọi đơn giá là đồng/kWh, CHƯA bao gồm VAT. VAT mặc định 8%.
//
// ⚠ Khi cập nhật số liệu ở đây, nhớ cập nhật đồng bộ với:
//   • src/lib/prompts/scripted-facts.ts (LLM dùng)
//   • src/lib/scripts/pricing.ts (quick-reply script)

export const VAT_RATE = 0.08; // 8% hiện hành

export type Decision = "QD2892" | "QD1279";

// ========== 1. SINH HOẠT — bậc thang ==========
// bậc {ceiling, price}; ceiling = kWh/hộ/tháng tích lũy; Infinity = bậc cuối.
export interface Tier {
  ceiling: number; // tính theo "1 hộ, kỳ 30 ngày"
  price: number;
}

export interface ResidentialTariff {
  decision: Decision;
  label: string;
  tiers: Tier[]; // định mức cho 1 hộ / 30 ngày
}

export const RESIDENTIAL_NEW: ResidentialTariff = {
  decision: "QD2892",
  label: "QĐ 2892/QĐ-BCT (áp dụng 01/11/2026) — 5 bậc",
  tiers: [
    { ceiling: 100, price: 1901 },
    { ceiling: 200, price: 2289 },
    { ceiling: 400, price: 2894 },
    { ceiling: 700, price: 3456 },
    { ceiling: Infinity, price: 3844 },
  ],
};

export const RESIDENTIAL_OLD: ResidentialTariff = {
  decision: "QD1279",
  label: "QĐ 1279/QĐ-BCT (trước 01/11/2026) — 6 bậc",
  tiers: [
    { ceiling: 50, price: 1984 },
    { ceiling: 100, price: 2050 },
    { ceiling: 200, price: 2380 },
    { ceiling: 300, price: 2998 },
    { ceiling: 400, price: 3350 },
    { ceiling: Infinity, price: 3460 },
  ],
};

// ========== 2. SẢN XUẤT — 3 giá TOU theo cấp điện áp ==========
export interface TouPrices {
  normal: number; // giờ bình thường
  offPeak: number; // giờ thấp điểm
  peak: number; // giờ cao điểm
}

// User chọn cấp điện áp cụ thể; code map sang nhóm cũ và mới tương ứng.
export type VoltageKey =
  | "V_110_220" // Cao áp 110–220 kV
  | "V_22_35" // Trung áp 22–35 kV
  | "V_6_10" // Trung áp 6–10 kV
  | "V_LOW"; // Hạ áp (dưới 1 kV)

export const VOLTAGE_OPTIONS: { key: VoltageKey; label: string }[] = [
  { key: "V_110_220", label: "Cao áp (110 – 220 kV)" },
  { key: "V_22_35", label: "Trung áp (22 – 35 kV)" },
  { key: "V_6_10", label: "Trung áp (6 – 10 kV)" },
  { key: "V_LOW", label: "Hạ áp (dưới 1 kV, tức 220V/380V)" },
];

// Giá sản xuất QĐ 2892 — nhóm theo mốc 220 / 35 / 1 kV
const PROD_NEW_BY_GROUP = {
  GE_220: { normal: 1771, offPeak: 1101, peak: 3110 },
  BTW_35_220: { normal: 1792, offPeak: 1123, peak: 3218 },
  BTW_1_35: { normal: 1814, offPeak: 1166, peak: 3348 },
  LOW: { normal: 1966, offPeak: 1274, peak: 3586 },
} as const;

// Giá sản xuất QĐ 1279 — nhóm theo mốc 110 / 22 / 6 kV
const PROD_OLD_BY_GROUP = {
  GE_110: { normal: 1811, offPeak: 1146, peak: 3266 },
  BTW_22_110: { normal: 1833, offPeak: 1190, peak: 3398 },
  BTW_6_22: { normal: 1899, offPeak: 1234, peak: 3508 },
  LT_6: { normal: 1987, offPeak: 1300, peak: 3640 },
} as const;

export function productionPrices(
  decision: Decision,
  voltage: VoltageKey,
): TouPrices {
  if (decision === "QD2892") {
    if (voltage === "V_110_220") return PROD_NEW_BY_GROUP.BTW_35_220; // 110kV nằm trong 35–<220
    if (voltage === "V_22_35") return PROD_NEW_BY_GROUP.BTW_1_35;
    if (voltage === "V_6_10") return PROD_NEW_BY_GROUP.BTW_1_35;
    return PROD_NEW_BY_GROUP.LOW;
  }
  // QĐ 1279
  if (voltage === "V_110_220") return PROD_OLD_BY_GROUP.GE_110;
  if (voltage === "V_22_35") return PROD_OLD_BY_GROUP.BTW_22_110;
  if (voltage === "V_6_10") return PROD_OLD_BY_GROUP.BTW_6_22;
  return PROD_OLD_BY_GROUP.LT_6;
}

// ========== 3. KINH DOANH ==========
// QĐ 2892: 3 nhóm (lưu trú DL / sạc XE / KD khác) × 2 cấp điện áp.
// QĐ 1279: nhóm chung × 3 cấp điện áp.
export type BusinessGroup = "TOURISM" | "EV" | "OTHER";

export const BUSINESS_GROUP_OPTIONS: { key: BusinessGroup; label: string; note?: string }[] = [
  {
    key: "TOURISM",
    label: "Cơ sở lưu trú du lịch (khách sạn, nhà nghỉ, homestay, resort)",
    note: "QĐ 2892 hưởng ưu đãi: giá bằng sản xuất cùng cấp điện áp.",
  },
  {
    key: "EV",
    label: "Trạm/trụ sạc xe điện",
    note: "QĐ 2892 có khung giá riêng cho hạ tầng xe điện.",
  },
  {
    key: "OTHER",
    label: "Kinh doanh khác (nhà hàng, cửa hàng, dịch vụ thương mại thông thường)",
  },
];

const BIZ_NEW = {
  TOURISM: {
    MID: { normal: 1814, offPeak: 1166, peak: 3348 }, // trung áp > 1 kV
    LOW: { normal: 1966, offPeak: 1274, peak: 3586 },
  },
  EV: {
    MID: { normal: 2549, offPeak: 1534, peak: 3758 },
    LOW: { normal: 2700, offPeak: 1620, peak: 4212 },
  },
  OTHER: {
    MID: { normal: 2829, offPeak: 1577, peak: 4924 },
    LOW: { normal: 3089, offPeak: 1880, peak: 5313 },
  },
} as const;

const BIZ_OLD_BY_GROUP = {
  GE_22: { normal: 2887, offPeak: 1609, peak: 5025 },
  BTW_6_22: { normal: 3108, offPeak: 1829, peak: 5202 },
  LT_6: { normal: 3152, offPeak: 1918, peak: 5422 },
} as const;

export function businessPrices(
  decision: Decision,
  group: BusinessGroup,
  voltage: VoltageKey,
): TouPrices {
  if (decision === "QD2892") {
    const isMid = voltage !== "V_LOW";
    return isMid ? BIZ_NEW[group].MID : BIZ_NEW[group].LOW;
  }
  // QĐ 1279 chỉ có 1 bảng cho mọi nhóm KD
  if (voltage === "V_110_220" || voltage === "V_22_35") return BIZ_OLD_BY_GROUP.GE_22;
  if (voltage === "V_6_10") return BIZ_OLD_BY_GROUP.BTW_6_22;
  return BIZ_OLD_BY_GROUP.LT_6;
}

// ========== 4. HÀNH CHÍNH, SỰ NGHIỆP (1 giá, không TOU) ==========
export type AdminGroup = "HEALTH_EDU" | "PUBLIC_LIGHTING";

export const ADMIN_GROUP_OPTIONS: { key: AdminGroup; label: string }[] = [
  { key: "HEALTH_EDU", label: "Cơ sở y tế, giáo dục (bệnh viện, trường học, nhà trẻ)" },
  { key: "PUBLIC_LIGHTING", label: "Chiếu sáng công cộng, đơn vị hành chính sự nghiệp" },
];

// QĐ 2892 ngưỡng > 1 kV vs ≤ 1 kV
const ADMIN_NEW = {
  HEALTH_EDU: { MID: 1901, LOW: 2030 },
  PUBLIC_LIGHTING: { MID: 2095, LOW: 2181 },
} as const;

// QĐ 1279 ngưỡng ≥ 6 kV vs < 6 kV
const ADMIN_OLD = {
  HEALTH_EDU: { MID: 1940, LOW: 2072 },
  PUBLIC_LIGHTING: { MID: 2138, LOW: 2226 },
} as const;

export function adminPrice(
  decision: Decision,
  group: AdminGroup,
  voltage: VoltageKey,
): number {
  const isMid = voltage !== "V_LOW";
  if (decision === "QD2892") {
    return isMid ? ADMIN_NEW[group].MID : ADMIN_NEW[group].LOW;
  }
  // QĐ 1279: ngưỡng 6 kV
  const isMidOld = voltage === "V_110_220" || voltage === "V_22_35" || voltage === "V_6_10";
  return isMidOld ? ADMIN_OLD[group].MID : ADMIN_OLD[group].LOW;
}

// Metadata để hiển thị trong UI
export const DECISION_LABEL: Record<Decision, string> = {
  QD2892: "QĐ 2892/QĐ-BCT (từ 01/11/2026)",
  QD1279: "QĐ 1279/QĐ-BCT (trước 01/11/2026)",
};
