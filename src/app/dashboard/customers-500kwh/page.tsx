import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { Customer500Table } from "@/components/dashboard/customer-500-table";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const TYPE_FILTERS = [
  { code: null, label: "Tất cả" },
  { code: "INDIVIDUAL", label: "Cá nhân" },
  { code: "ORG", label: "Cơ quan/Tổ chức" },
];

const KWH_FILTERS = [
  { code: null, label: "Không lọc" },
  { code: "500", label: "≥ 500 kWh" },
  { code: "1000", label: "≥ 1.000 kWh" },
  { code: "5000", label: "≥ 5.000 kWh" },
  { code: "10000", label: "≥ 10.000 kWh" },
];

function formatVnd(n: number): string {
  return n.toLocaleString("vi-VN");
}

export default async function Customers500Page({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    type?: string;
    minKwh?: string;
    page?: string;
  }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const type = sp.type ?? "";
  const minKwh = Number(sp.minKwh) || 0;
  const page = Math.max(1, Number(sp.page) || 1);

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

  const [total, rows, byType, topKwh] = await Promise.all([
    prisma.highConsumptionCustomer.count({ where }),
    prisma.highConsumptionCustomer.findMany({
      where,
      orderBy: { consumptionKwh: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    // Thống kê tổng (không áp filter) để hiển thị KPI
    prisma.highConsumptionCustomer.groupBy({
      by: ["customerType"],
      _count: { _all: true },
      _sum: { consumptionKwh: true, totalAmount: true },
    }),
    prisma.highConsumptionCustomer.count({ where: { consumptionKwh: { gte: 1000 } } }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const sumIndiv = byType.find((b) => b.customerType === "INDIVIDUAL");
  const sumOrg = byType.find((b) => b.customerType === "ORG");

  function makeHref(partial: Record<string, string | number | undefined | null>) {
    const params = new URLSearchParams();
    const next = { q, type, minKwh: minKwh || "", page, ...partial };
    for (const [k, v] of Object.entries(next)) {
      if (v === "" || v === null || v === undefined || v === 0) continue;
      params.set(k, String(v));
    }
    const qs = params.toString();
    return qs ? `/dashboard/customers-500kwh?${qs}` : `/dashboard/customers-500kwh`;
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-slate-900">
          Khách hàng tiềm năng ĐMTMN (sản lượng ≥ 500 kWh/tháng)
        </h1>
        <p className="text-sm text-slate-500">
          Danh sách khách hàng tiêu thụ điện cao trên địa bàn tỉnh Điện Biên — phục vụ phát triển
          lắp đặt điện mặt trời mái nhà tự sản tự tiêu.
        </p>
        <p className="mt-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 inline-block">
          ⚠ Dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP. Chỉ sử dụng nội bộ phục vụ công tác CSKH
          và tư vấn phát triển ĐMTMN. Không chia sẻ ra ngoài.
        </p>
      </div>

      {/* KPI tổng */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="rounded-lg bg-white border border-slate-200 p-4">
          <div className="text-xs text-slate-500">Khách hàng cá nhân</div>
          <div className="text-2xl font-semibold text-slate-900 mt-1">
            {formatVnd(sumIndiv?._count._all ?? 0)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Σ kWh: {formatVnd(sumIndiv?._sum.consumptionKwh ?? 0)}
          </div>
        </div>
        <div className="rounded-lg bg-white border border-slate-200 p-4">
          <div className="text-xs text-slate-500">Cơ quan / tổ chức</div>
          <div className="text-2xl font-semibold text-slate-900 mt-1">
            {formatVnd(sumOrg?._count._all ?? 0)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Σ kWh: {formatVnd(sumOrg?._sum.consumptionKwh ?? 0)}
          </div>
        </div>
        <div className="rounded-lg bg-white border border-slate-200 p-4">
          <div className="text-xs text-slate-500">KH ≥ 1.000 kWh/tháng</div>
          <div className="text-2xl font-semibold text-[color:var(--color-evn-blue)] mt-1">
            {formatVnd(topKwh)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Nhóm ưu tiên tư vấn ĐMTMN</div>
        </div>
      </div>

      {/* Bộ lọc */}
      <form className="mb-3 flex flex-wrap gap-2 items-center" method="GET">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="🔍 Tên / mã KH / địa chỉ / xã / SĐT…"
          className="flex-1 min-w-[260px] rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
        {type && <input type="hidden" name="type" value={type} />}
        {minKwh > 0 && <input type="hidden" name="minKwh" value={minKwh} />}
        <button
          type="submit"
          className="rounded-md bg-[color:var(--color-evn-blue)] text-white px-4 py-1.5 text-sm font-medium"
        >
          Tìm
        </button>
        {(q || type || minKwh > 0) && (
          <Link
            href="/dashboard/customers-500kwh"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
          >
            ✕ Xoá lọc
          </Link>
        )}
      </form>

      <div className="flex flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-500 mr-1">Nhóm:</span>
          {TYPE_FILTERS.map((f) => {
            const active = (type || null) === f.code;
            return (
              <Link
                key={f.label}
                href={makeHref({ type: f.code ?? "", page: 1 })}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs border transition",
                  active
                    ? "bg-[color:var(--color-evn-blue)] text-white border-transparent"
                    : "border-slate-300 hover:bg-slate-100"
                )}
              >
                {f.label}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-1 ml-4">
          <span className="text-xs text-slate-500 mr-1">kWh/tháng:</span>
          {KWH_FILTERS.map((f) => {
            const active = String(minKwh || "") === (f.code ?? "");
            return (
              <Link
                key={f.label}
                href={makeHref({ minKwh: f.code ?? "", page: 1 })}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs border transition",
                  active
                    ? "bg-[color:var(--color-evn-blue)] text-white border-transparent"
                    : "border-slate-300 hover:bg-slate-100"
                )}
              >
                {f.label}
              </Link>
            );
          })}
        </div>
        <Link
          href={(() => {
            const p = new URLSearchParams();
            if (q) p.set("q", q);
            if (type) p.set("type", type);
            if (minKwh) p.set("minKwh", String(minKwh));
            const qs = p.toString();
            return `/api/customers-500kwh/export${qs ? `?${qs}` : ""}`;
          })()}
          className="ml-auto px-3 py-1.5 rounded-md border border-slate-300 text-sm hover:bg-slate-100"
        >
          📥 Xuất CSV
        </Link>
      </div>

      <div className="text-sm text-slate-500 mb-2">
        {total === 0 ? (
          "Không có khách hàng khớp bộ lọc."
        ) : (
          <>
            Khớp <span className="font-semibold text-slate-900">{formatVnd(total)}</span> khách hàng
            — hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)}
          </>
        )}
      </div>

      <Customer500Table
        rows={rows.map((r) => ({
          id: r.id,
          dviqlyCode: r.dviqlyCode,
          customerCode: r.customerCode,
          customerName: r.customerName,
          address: r.address,
          commune: r.commune,
          consumptionKwh: r.consumptionKwh,
          totalAmount: r.totalAmount,
          phone: r.phone,
          customerType: r.customerType,
        }))}
      />

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-1 mt-4 flex-wrap">
          <Link
            href={makeHref({ page: Math.max(1, page - 1) })}
            className={cn(
              "px-3 py-1 rounded border text-sm",
              page <= 1 ? "pointer-events-none opacity-40 border-slate-200" : "border-slate-300 hover:bg-slate-100"
            )}
          >
            ← Trước
          </Link>
          <span className="text-sm text-slate-600 px-3">
            Trang {page} / {pageCount}
          </span>
          <Link
            href={makeHref({ page: Math.min(pageCount, page + 1) })}
            className={cn(
              "px-3 py-1 rounded border text-sm",
              page >= pageCount
                ? "pointer-events-none opacity-40 border-slate-200"
                : "border-slate-300 hover:bg-slate-100"
            )}
          >
            Sau →
          </Link>
        </div>
      )}
    </div>
  );
}
