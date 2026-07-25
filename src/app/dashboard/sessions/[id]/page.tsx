import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate, cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await prisma.chatSession.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: { feedback: true },
      },
      lead: true,
      rating: true,
    },
  });
  if (!session) return notFound();

  return (
    <div className="max-w-3xl">
      <Link href="/dashboard/sessions" className="text-sm text-slate-500 hover:underline">
        ← Lịch sử chat
      </Link>

      <div className="mt-2 mb-4">
        <h1 className="text-xl font-semibold text-slate-900">Phiên chat {session.id.slice(0, 8)}…</h1>
        <div className="text-xs text-slate-500 mt-1">
          Bắt đầu {formatDate(session.startedAt)} · {session.messageCount} tin nhắn
          {session.rating && ` · Đánh giá ${session.rating.stars} ★`}
        </div>
      </div>

      {session.lead && (
        <Link
          href={`/dashboard/leads/${session.lead.id}`}
          className="inline-block mb-4 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-sm hover:bg-orange-100"
        >
          🎯 Đã tạo lead: <b>{session.lead.fullName}</b> ({session.lead.phone}) →
        </Link>
      )}

      <div className="space-y-3">
        {session.messages.map((m) => (
          <div key={m.id} className={cn("flex flex-col", m.role === "user" ? "items-end" : "items-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
                m.role === "user"
                  ? "bg-[color:var(--color-evn-blue)] text-white"
                  : "bg-slate-100"
              )}
            >
              {m.content}
            </div>
            <div className="text-xs text-slate-400 mt-0.5 flex gap-2">
              <span>{formatDate(m.createdAt)}</span>
              {m.topicTag && <span className="px-1.5 rounded bg-slate-200">{m.topicTag}</span>}
              {m.feedback && (
                <span>
                  {m.feedback.rating === "UP" ? "👍" : "👎"}
                  {m.feedback.reason ? ` (${m.feedback.reason})` : ""}
                </span>
              )}
              {m.latencyMs && <span>{m.latencyMs}ms</span>}
            </div>
          </div>
        ))}
      </div>

      {session.rating?.comment && (
        <div className="mt-6 border-t pt-4">
          <div className="font-semibold text-slate-900">Góp ý khách hàng</div>
          <div className="text-sm text-slate-700 italic">&quot;{session.rating.comment}&quot;</div>
        </div>
      )}
    </div>
  );
}
