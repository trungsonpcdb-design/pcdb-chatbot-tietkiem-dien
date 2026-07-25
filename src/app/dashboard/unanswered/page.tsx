import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { UnansweredRowActions } from "@/components/dashboard/unanswered-row-actions";

export const dynamic = "force-dynamic";

const REASON_LABEL: Record<string, string> = {
  NO_DOCUMENT_MATCH: "Không có tài liệu phù hợp",
  LOW_CONFIDENCE: "Độ tin cậy thấp",
  OFF_TOPIC: "Ngoài phạm vi",
};

type Filter = "pending" | "reviewed" | "all";

function tabClass(active: boolean) {
  return `px-3 py-1.5 rounded-lg text-sm ${
    active ? "bg-[color:var(--color-evn-blue)] text-white" : "bg-white border text-slate-700 hover:bg-slate-50"
  }`;
}

export default async function UnansweredPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const sp = await searchParams;
  const filter: Filter = sp.filter === "reviewed" ? "reviewed" : sp.filter === "all" ? "all" : "pending";
  const where = filter === "pending" ? { reviewed: false } : filter === "reviewed" ? { reviewed: true } : {};

  const [rows, pendingCount, reviewedCount] = await Promise.all([
    prisma.unansweredQuery.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.unansweredQuery.count({ where: { reviewed: false } }),
    prisma.unansweredQuery.count({ where: { reviewed: true } }),
  ]);

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-slate-900">Câu hỏi chưa trả lời được</h1>
        <p className="text-sm text-slate-500">
          Bổ sung tài liệu KB để chatbot trả lời được lần sau. Đánh dấu &ldquo;Đã xử lý&rdquo; để loại khỏi danh sách chờ.
        </p>
      </div>

      <div className="flex gap-2 mb-4">
        <Link href="/dashboard/unanswered?filter=pending" className={tabClass(filter === "pending")}>
          Chờ xử lý ({pendingCount})
        </Link>
        <Link href="/dashboard/unanswered?filter=reviewed" className={tabClass(filter === "reviewed")}>
          Đã xử lý ({reviewedCount})
        </Link>
        <Link href="/dashboard/unanswered?filter=all" className={tabClass(filter === "all")}>
          Tất cả ({pendingCount + reviewedCount})
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white border rounded-xl p-8 text-center text-slate-500">
          {filter === "pending" ? "Không còn câu hỏi chờ xử lý. Hệ thống đang trả lời tốt!" : "Chưa có dữ liệu."}
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="p-3">Câu hỏi</th>
                <th className="p-3 w-40">Lý do</th>
                <th className="p-3 w-40">Thời gian</th>
                <th className="p-3 w-56">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className={`border-t ${r.reviewed ? "bg-slate-50/50 text-slate-500" : ""}`}>
                  <td className="p-3">{r.question}</td>
                  <td className="p-3">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs">
                      {REASON_LABEL[r.reason] ?? r.reason}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500">{formatDate(r.createdAt)}</td>
                  <td className="p-3">
                    <UnansweredRowActions id={r.id} question={r.question} reviewed={r.reviewed} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
