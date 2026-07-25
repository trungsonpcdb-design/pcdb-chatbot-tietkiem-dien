import { MessageSquare, Users, ThumbsUp } from "lucide-react";
import { getDashboardStats } from "@/lib/stats";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { DonutChart, MonthlyBarChart, HorizontalBarChart } from "@/components/dashboard/charts";

export const dynamic = "force-dynamic";

const TOPIC_LABEL: Record<string, string> = {
  TIET_KIEM_SH: "Tiết kiệm SH",
  TIET_KIEM_DN: "Tiết kiệm DN",
  DMTMN_KY_THUAT: "ĐMTMN — Kỹ thuật",
  DMTMN_TAI_CHINH: "ĐMTMN — Tài chính",
  TINH_HOA_DON: "Tính hóa đơn",
  THU_TUC: "Thủ tục",
  KHAC: "Khác",
};

const TOPIC_COLOR: Record<string, string> = {
  TIET_KIEM_SH: "#0ea5e9",
  TIET_KIEM_DN: "#0066B3",
  DMTMN_KY_THUAT: "#f59e0b",
  DMTMN_TAI_CHINH: "#F58220",
  TINH_HOA_DON: "#10b981",
  THU_TUC: "#8b5cf6",
  KHAC: "#94a3b8",
};

export default async function DashboardHome() {
  const stats = await getDashboardStats();
  const feedbackTotal = stats.today.feedbackUp + stats.today.feedbackDown;
  const satisfactionPct = feedbackTotal > 0
    ? Math.round((stats.today.feedbackUp / feedbackTotal) * 100)
    : null;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">Tổng quan hôm nay</h1>
      <p className="text-sm text-slate-500 mb-4">
        Số liệu 7 ngày gần nhất
        {stats.avgRating !== null && ` · Trung bình đánh giá: ${stats.avgRating.toFixed(1)} ★`}
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Phiên chat hôm nay" value={stats.today.sessions} icon={MessageSquare} accent="blue" />
        <KpiCard label="Câu hỏi hôm nay" value={stats.today.userMessages} icon={MessageSquare} accent="blue" />
        <KpiCard label="Lead mới" value={stats.today.newLeads} icon={Users} accent="orange" />
        <KpiCard
          label="Hài lòng"
          value={satisfactionPct !== null ? `${satisfactionPct}%` : "—"}
          icon={ThumbsUp}
          accent={satisfactionPct !== null && satisfactionPct >= 70 ? "green" : "red"}
          hint={`${stats.today.feedbackUp} 👍 / ${stats.today.feedbackDown} 👎`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-900">Câu hỏi mỗi ngày (7 ngày)</h2>
          </div>
          <MonthlyBarChart data={stats.daily} />
        </div>

        <div className="bg-white border rounded-xl p-4">
          <h2 className="font-semibold text-slate-900 mb-3">Top chủ đề (7 ngày)</h2>
          {stats.topTopics.length > 0 ? (
            <DonutChart
              data={stats.topTopics.map((t) => ({
                label: TOPIC_LABEL[t.tag] ?? t.tag,
                value: t.count,
                color: TOPIC_COLOR[t.tag] ?? "#94a3b8",
              }))}
              size={160}
            />
          ) : (
            <div className="text-center text-slate-500 py-6 text-sm">Chưa có dữ liệu</div>
          )}
        </div>

        {stats.topUnansweredReasons.length > 0 && (
          <div className="lg:col-span-3 bg-white border rounded-xl p-4">
            <h2 className="font-semibold text-slate-900 mb-3">Lý do chatbot chưa trả lời được</h2>
            <HorizontalBarChart
              rows={stats.topUnansweredReasons.map((r) => ({
                label:
                  r.reason === "NO_DOCUMENT_MATCH"
                    ? "Không có tài liệu phù hợp"
                    : r.reason === "LOW_CONFIDENCE"
                    ? "Độ tin cậy thấp"
                    : "Ngoài phạm vi",
                value: r.count,
                color: "#F58220",
              }))}
            />
            <div className="mt-2 text-xs text-slate-500">
              💡 Bổ sung tài liệu vào <a href="/dashboard/documents" className="text-[color:var(--color-evn-blue)] hover:underline">Knowledge Base</a> để cải thiện.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
