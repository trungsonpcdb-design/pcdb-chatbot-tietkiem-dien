import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const REASON_LABEL: Record<string, string> = {
  NO_DOCUMENT_MATCH: "Không có tài liệu phù hợp",
  LOW_CONFIDENCE: "Độ tin cậy thấp",
  OFF_TOPIC: "Ngoài phạm vi",
};

export default async function UnansweredPage() {
  const rows = await prisma.unansweredQuery.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-slate-900">Câu hỏi chưa trả lời được</h1>
        <p className="text-sm text-slate-500">
          Đây là những câu chatbot không tìm được tài liệu phù hợp. Hãy bổ sung tài liệu KB để chatbot trả lời được lần sau.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white border rounded-xl p-8 text-center text-slate-500">
          Chưa có câu hỏi nào. Hệ thống đang trả lời tốt!
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="p-3">Câu hỏi</th>
                <th className="p-3 w-40">Lý do</th>
                <th className="p-3 w-44">Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3 text-slate-800">{r.question}</td>
                  <td className="p-3">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs">
                      {REASON_LABEL[r.reason] ?? r.reason}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500">{formatDate(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
