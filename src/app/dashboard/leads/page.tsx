import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LeadTable } from "@/components/dashboard/lead-table";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_FILTERS = [
  { code: null, label: "Tất cả" },
  { code: "MOI", label: "Mới" },
  { code: "DA_LIEN_HE", label: "Đã liên hệ" },
  { code: "THANH_CONG", label: "Thành công" },
  { code: "TU_CHOI", label: "Từ chối" },
];

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const status = sp.status;

  const leads = await prisma.lead.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { unit: true },
  });

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-slate-900">Lead khách hàng</h1>
        <p className="text-sm text-slate-500">Danh sách khách để lại thông tin qua chatbot.</p>
      </div>
      <div className="flex gap-2 mb-4">
        {STATUS_FILTERS.map((f) => {
          const active = (status ?? null) === f.code;
          return (
            <Link
              key={f.label}
              href={f.code ? `/dashboard/leads?status=${f.code}` : `/dashboard/leads`}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm border transition",
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
      <LeadTable
        leads={leads.map((l) => ({
          id: l.id,
          fullName: l.fullName,
          phone: l.phone,
          address: l.address,
          interestTopic: l.interestTopic,
          status: l.status,
          unitName: l.unit?.name ?? null,
          createdAt: l.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
