/**
 * Hằng số & công thức ƯỚC TÍNH ĐMTMN dùng chung cho cả client (SolarCalcCard)
 * và server (API /api/chat form flow). Đây là NGUỒN CHÂN LÝ DUY NHẤT —
 * phải trùng với bảng mục 9 trong `src/lib/prompts/scripted-facts.ts`.
 *
 * Nguồn: Bảng ước tính của PC Điện Biên năm 2026 (VBHN 52/VBHN-BCT).
 * Đơn giá CHƯA gồm VAT, chưa gồm khung sắt gia cố mái.
 */

export const M2_PER_KWP = 6;
export const PRICE_PER_KWP = 9_800_000;
export const PRICE_PER_KWH_BESS = 2_800_000;
export const TOTAL_PER_KWP_WITH_BESS = PRICE_PER_KWP + PRICE_PER_KWH_BESS;

/** Sản lượng điện mặt trời tiêu biểu/kWp/ngày tại Điện Biên. */
export const DAILY_KWH_PER_KWP = 4;

/**
 * Tiền điện tiết kiệm được mỗi tháng cho mỗi kWp lắp đặt (xấp xỉ).
 * ≈ 4 kWh/ngày × 30 ngày × ~2.500 đ/kWh ≈ 300.000 đ/tháng.
 * Dùng để quy đổi hóa đơn hiện tại → kWp cần để bù.
 */
export const BILL_PER_KWP_PER_MONTH = 300_000;

/** kWp tối đa có thể lắp dựa trên diện tích mái. */
export function kwpFromRoof(areaM2: number): number {
  return Math.max(1, Math.round(areaM2 / M2_PER_KWP));
}

/** kWp cần để bù hóa đơn điện trung bình hàng tháng. */
export function kwpFromBill(monthlyBillVnd: number): number {
  const raw = (monthlyBillVnd / BILL_PER_KWP_PER_MONTH) * 10;
  return Math.round(raw) / 10;
}

export interface SolarEstimate {
  areaM2: number;
  kwp: number;
  pinCost: number;
  bessKwh: number;
  bessCost: number;
  total: number;
  withBess: boolean;
}

/**
 * Ước tính chi phí trọn gói theo diện tích mái (dùng cho SolarCalcCard —
 * khách tự nhập, tự xem kết quả).
 */
export function estimateByArea(areaM2: number, withBess: boolean): SolarEstimate {
  const kwp = kwpFromRoof(areaM2);
  const pinCost = kwp * PRICE_PER_KWP;
  const bessKwh = withBess ? kwp : 0;
  const bessCost = bessKwh * PRICE_PER_KWH_BESS;
  return {
    areaM2,
    kwp,
    pinCost,
    bessKwh,
    bessCost,
    total: pinCost + bessCost,
    withBess,
  };
}

export interface AdvisorEstimate {
  kwpByRoof: number;
  kwpByBill: number;
  recommendedKw: number;
  recommendedAreaM2: number;
  dailyKwh: number;
  monthlyKwh: number;
  pinOnlyCostVnd: number;
  withBessCostVnd: number;
  bessKwh: number;
  /** true khi mái không đủ chỗ để bù toàn bộ hóa đơn. */
  isRoofBottleneck: boolean;
  /** kWp dư ra sau khi lắp đủ bù hóa đơn (>= 0). */
  extraKwpCapacity: number;
}

/**
 * Ước tính tư vấn khi khách submit form (có cả diện tích mái + hóa đơn).
 * Trả về đủ dữ liệu để backend inject vào system prompt — LLM đọc và trình bày
 * cho khách, không tự ý tính lại.
 */
export function estimateFromForm(input: {
  areaM2: number;
  monthlyBillVnd: number;
}): AdvisorEstimate {
  const kwpByRoof = kwpFromRoof(input.areaM2);
  const kwpByBill = kwpFromBill(input.monthlyBillVnd);
  const isRoofBottleneck = kwpByBill > kwpByRoof;
  const recommendedKw = Math.max(1, Math.round(Math.min(kwpByBill, kwpByRoof)));
  const recommendedAreaM2 = recommendedKw * M2_PER_KWP;
  const dailyKwh = recommendedKw * DAILY_KWH_PER_KWP;
  const monthlyKwh = dailyKwh * 30;
  const pinOnlyCostVnd = recommendedKw * PRICE_PER_KWP;
  const withBessCostVnd = recommendedKw * TOTAL_PER_KWP_WITH_BESS;
  const extraKwpCapacity = Math.max(0, kwpByRoof - recommendedKw);
  return {
    kwpByRoof,
    kwpByBill,
    recommendedKw,
    recommendedAreaM2,
    dailyKwh,
    monthlyKwh,
    pinOnlyCostVnd,
    withBessCostVnd,
    bessKwh: recommendedKw,
    isRoofBottleneck,
    extraKwpCapacity,
  };
}
