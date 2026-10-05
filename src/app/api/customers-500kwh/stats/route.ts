import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Thống kê tổng hợp số lượng KH có sản lượng ≥500 kWh/tháng.
 * PUBLIC — chỉ trả số liệu tổng, KHÔNG tên/SĐT/địa chỉ cụ thể.
 * Chatbot /chat gọi endpoint này để trả lời câu hỏi tổng quan.
 *
 * Query params (tuỳ chọn):
 *   commune=<text>   lọc theo xã/phường (substring, không phân biệt hoa thường)
 *   minKwh=<int>     ngưỡng kWh tối thiểu (default 500)
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const commune = sp.get("commune")?.trim() ?? "";
  const minKwh = Math.max(500, Number(sp.get("minKwh")) || 500);

  const where: Record<string, unknown> = { consumptionKwh: { gte: minKwh } };
  if (commune) {
    where.commune = { contains: commune };
  }

  const [total, byType, top5Communes] = await Promise.all([
    prisma.highConsumptionCustomer.count({ where }),
    prisma.highConsumptionCustomer.groupBy({
      by: ["customerType"],
      where,
      _count: { _all: true },
      _sum: { consumptionKwh: true },
    }),
    prisma.highConsumptionCustomer.groupBy({
      by: ["commune"],
      where: { ...where, commune: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { commune: "desc" } },
      take: 10,
    }),
  ]);

  return Response.json({
    minKwh,
    communeFilter: commune || null,
    total,
    byType: {
      individual: byType.find((b) => b.customerType === "INDIVIDUAL")?._count._all ?? 0,
      org: byType.find((b) => b.customerType === "ORG")?._count._all ?? 0,
    },
    topCommunes: top5Communes.map((c) => ({
      commune: c.commune,
      count: c._count._all,
    })),
    note: "Dữ liệu tổng hợp phục vụ phát triển ĐMTMN. Chi tiết KH chỉ cho nhân viên PCDB tra tại /dashboard/customers-500kwh.",
  });
}
