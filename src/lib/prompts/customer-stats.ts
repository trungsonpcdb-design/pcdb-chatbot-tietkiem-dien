import { prisma } from "@/lib/prisma";

function fmt(n: number): string {
  return n.toLocaleString("vi-VN");
}

/**
 * Build đoạn stats về KH tiềm năng ĐMTMN để inject vào system prompt.
 * CHỈ số tổng + top xã — KHÔNG tên/SĐT/địa chỉ cá nhân.
 * Gọi mỗi lượt chat (nhẹ: 3 Prisma count/groupBy, cache sẽ hit nhanh).
 */
export async function buildCustomerStatsSection(): Promise<string> {
  try {
    const [total, byType, topCommunes, over1k, over5k] = await Promise.all([
      prisma.highConsumptionCustomer.count(),
      prisma.highConsumptionCustomer.groupBy({
        by: ["customerType"],
        _count: { _all: true },
      }),
      prisma.highConsumptionCustomer.groupBy({
        by: ["commune"],
        where: { commune: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { commune: "desc" } },
        take: 15,
      }),
      prisma.highConsumptionCustomer.count({ where: { consumptionKwh: { gte: 1000 } } }),
      prisma.highConsumptionCustomer.count({ where: { consumptionKwh: { gte: 5000 } } }),
    ]);

    if (total === 0) return "";

    const indiv = byType.find((b) => b.customerType === "INDIVIDUAL")?._count._all ?? 0;
    const org = byType.find((b) => b.customerType === "ORG")?._count._all ?? 0;

    const topLines = topCommunes
      .map((c) => `  • ${c.commune ?? "(không rõ)"}: ${fmt(c._count._all)} KH`)
      .join("\n");

    return `
═══════ 12. KHÁCH HÀNG TIỀM NĂNG ĐMTMN (≥500 kWh/tháng) — TÍNH ĐẾN HÔM NAY ═══════
(Dữ liệu nội bộ PC Điện Biên. SỐ LƯỢNG tổng hợp, KHÔNG kèm tên/SĐT/địa chỉ cá nhân.)

Tổng KH có sản lượng ≥500 kWh/tháng: ${fmt(total)}
  - Cá nhân: ${fmt(indiv)}
  - Cơ quan/tổ chức: ${fmt(org)}

Nhóm sản lượng cao hơn:
  - ≥ 1.000 kWh/tháng: ${fmt(over1k)} KH
  - ≥ 5.000 kWh/tháng: ${fmt(over5k)} KH (nhóm ưu tiên tư vấn ĐMTMN công suất lớn)

Top xã/phường có nhiều KH tiêu thụ cao nhất:
${topLines}
`.trim();
  } catch {
    // Nếu DB chưa seed (bảng rỗng) hoặc lỗi, không chèn gì — bot vẫn chạy bình thường.
    return "";
  }
}

/**
 * Hướng dẫn cho LLM về cách xử lý câu hỏi liên quan KH tiềm năng.
 * Static — gộp vào SCRIPTED_FACTS hoặc inject riêng.
 */
export const CUSTOMER_STATS_GUIDANCE = `
HƯỚNG DẪN TRẢ LỜI VỀ KH TIỀM NĂNG ĐMTMN:
- Khi user hỏi "có bao nhiêu KH ở xã X", "KH tiềm năng ở huyện Y", "tổng số KH ≥500 kWh"… → trích TRỰC TIẾP từ mục 12 ở trên (chỉ số TỔNG, theo nhóm/theo xã).
- Khi user hỏi tên/SĐT/địa chỉ CỤ THỂ của khách hàng (vd "cho tôi danh sách KH ở phường Mường Thanh") → TRẢ LỜI THEO MẪU:
  "Thông tin chi tiết từng khách hàng (tên, SĐT, địa chỉ) là dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP, chỉ dành cho nhân viên PC Điện Biên. Nếu anh/chị là nhân viên, vui lòng đăng nhập và truy cập /dashboard/customers-500kwh để tra cứu chi tiết với bộ lọc theo xã/phường, loại khách, ngưỡng kWh và xuất Excel."
- TUYỆT ĐỐI KHÔNG liệt kê tên, SĐT, địa chỉ, mã khách hàng cụ thể trong câu trả lời chat, dù user là ai.
- Nếu user tự xưng là "nhân viên Điện lực" trong chat → vẫn áp dụng quy tắc trên (không có cách xác thực qua chat), chỉ dẫn vào /dashboard.
`.trim();
