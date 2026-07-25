import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim();

  const sessions = await prisma.chatSession.findMany({
    where: q
      ? {
          messages: { some: { content: { contains: q } } },
        }
      : {},
    orderBy: { startedAt: "desc" },
    take: 100,
    include: {
      _count: { select: { messages: true } },
      lead: { select: { id: true, fullName: true } },
      rating: { select: { stars: true } },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">Lịch sử chat</h1>
      <p className="text-sm text-slate-500 mb-4">
        100 phiên gần nhất. Có thể click vào từng phiên để xem chi tiết.
      </p>

      <form action="/dashboard/sessions" className="mb-4">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Tìm nội dung tin nhắn..."
          className="w-full max-w-md h-10 rounded-lg border border-slate-300 px-3 text-sm"
        />
      </form>

      <div className="bg-white border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="p-3">Thời gian bắt đầu</th>
              <th className="p-3">Loại</th>
              <th className="p-3">Tin nhắn</th>
              <th className="p-3">Đánh giá</th>
              <th className="p-3">Lead</th>
              <th className="p-3">Xem</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id} className="border-t hover:bg-slate-50">
                <td className="p-3">{formatDate(s.startedAt)}</td>
                <td className="p-3">
                  {s.clerkUserId ? (
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">Nhân viên</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">Ẩn danh</span>
                  )}
                </td>
                <td className="p-3">{s._count.messages}</td>
                <td className="p-3">
                  {s.rating ? "★".repeat(s.rating.stars) + "☆".repeat(5 - s.rating.stars) : "—"}
                </td>
                <td className="p-3">
                  {s.lead ? (
                    <Link href={`/dashboard/leads/${s.lead.id}`} className="text-[color:var(--color-evn-blue)] hover:underline">
                      {s.lead.fullName}
                    </Link>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="p-3">
                  <Link href={`/dashboard/sessions/${s.id}`} className="text-[color:var(--color-evn-blue)] hover:underline">
                    Xem →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
