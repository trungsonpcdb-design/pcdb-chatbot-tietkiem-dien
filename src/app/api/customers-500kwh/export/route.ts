import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: NextRequest) {
  // Bắt buộc login + active (requireDbUser redirect nếu chưa).
  // Khi gọi qua fetch, redirect sẽ trả HTML sign-in → user biết chưa đăng nhập.
  await requireDbUser();

  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim() ?? "";
  const type = sp.get("type") ?? "";
  const minKwh = Number(sp.get("minKwh")) || 0;

  const where: Record<string, unknown> = {};
  if (type === "INDIVIDUAL" || type === "ORG") where.customerType = type;
  if (minKwh > 0) where.consumptionKwh = { gte: minKwh };
  if (q) {
    where.OR = [
      { customerName: { contains: q } },
      { customerCode: { contains: q } },
      { address: { contains: q } },
      { commune: { contains: q } },
      { phone: { contains: q } },
    ];
  }

  const rows = await prisma.highConsumptionCustomer.findMany({
    where,
    orderBy: { consumptionKwh: "desc" },
    take: 10000, // tránh export quá lớn
  });

  const header = [
    "Mã ĐL khu vực",
    "Mã KH",
    "Tên khách hàng",
    "Loại",
    "Xã/Phường",
    "Địa chỉ",
    "kWh/tháng",
    "Tổng tiền (đ)",
    "SĐT",
  ].join(",");

  const lines = rows.map((r) =>
    [
      r.dviqlyCode,
      r.customerCode,
      r.customerName,
      r.customerType === "ORG" ? "Tổ chức" : "Cá nhân",
      r.commune ?? "",
      r.address,
      r.consumptionKwh,
      r.totalAmount,
      r.phone ?? "",
    ]
      .map(csvEscape)
      .join(",")
  );

  // UTF-8 BOM để Excel mở đúng tiếng Việt
  const body = "﻿" + header + "\n" + lines.join("\n");

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kh-500kwh-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
