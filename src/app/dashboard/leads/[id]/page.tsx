import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { LeadDetailPanel } from "@/components/dashboard/lead-detail-panel";
import { UNIT_LIST } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      unit: true,
      session: {
        include: {
          messages: { orderBy: { createdAt: "asc" } },
          rating: true,
        },
      },
    },
  });
  if (!lead) return notFound();

  return (
    <div className="max-w-4xl">
      <Link href="/dashboard/leads" className="text-sm text-slate-500 hover:underline">
        ← Danh sách lead
      </Link>

      <div className="mt-2 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border rounded-xl p-4">
          <h2 className="font-semibold text-slate-900 mb-3">Lịch sử trò chuyện</h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {lead.session.messages.map((m) => (
              <div
                key={m.id}
                className={m.role === "user" ? "text-right" : "text-left"}
              >
                <div
                  className={
                    "inline-block max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap " +
                    (m.role === "user"
                      ? "bg-[color:var(--color-evn-blue)] text-white"
                      : "bg-slate-100")
                  }
                >
                  {m.content}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{formatDate(m.createdAt)}</div>
              </div>
            ))}
          </div>
          {lead.session.rating && (
            <div className="mt-3 pt-3 border-t text-sm text-slate-600">
              Đánh giá: {"★".repeat(lead.session.rating.stars)}{"☆".repeat(5 - lead.session.rating.stars)}
              {lead.session.rating.comment && <div className="italic">&quot;{lead.session.rating.comment}&quot;</div>}
            </div>
          )}
        </div>

        <LeadDetailPanel
          lead={{
            id: lead.id,
            fullName: lead.fullName,
            phone: lead.phone,
            address: lead.address,
            interestTopic: lead.interestTopic,
            chatSummary: lead.chatSummary,
            status: lead.status,
            note: lead.note,
            assignedUnitCode: lead.unit?.code ?? null,
            createdAt: lead.createdAt.toISOString(),
          }}
          units={UNIT_LIST.map((u) => ({ code: u.code, name: u.name }))}
        />
      </div>
    </div>
  );
}
