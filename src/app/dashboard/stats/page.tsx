import { getDetailedStats } from "@/lib/stats";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { MessageSquare, Users, TrendingUp, ThumbsDown } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const REASON_LABEL: Record<string, string> = {
  SAI_THONG_TIN: "Sai thông tin",
  KHONG_DU_CHI_TIET: "Không đủ chi tiết",
  KHONG_LIEN_QUAN: "Không đúng chủ đề",
  KHAC: "Khác",
};

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const sp = await searchParams;
  const range = Number(sp.range) || 30;
  const days = [7, 30, 90].includes(range) ? range : 30;

  const s = await getDetailedStats(days);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Thống kê chi tiết</h1>
          <p className="text-sm text-slate-500">Khoảng thời gian: {days} ngày gần nhất</p>
        </div>
        <DateRangePicker current={days} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Tổng phiên chat" value={s.totalSessions} icon={MessageSquare} accent="blue" />
        <KpiCard label="Tổng tin nhắn" value={s.totalMessages} icon={MessageSquare} accent="blue" />
        <KpiCard label="Tổng lead" value={s.totalLeads} icon={Users} accent="orange" />
        <KpiCard
          label="Tỷ lệ tạo lead"
          value={`${(s.leadConversionRate * 100).toFixed(1)}%`}
          icon={TrendingUp}
          accent="green"
          hint={`TB ${s.avgMessagesPerSession.toFixed(1)} tin/phiên`}
        />
      </div>

      <div className="bg-white border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <ThumbsDown className="w-4 h-4 text-red-500" />
          <h2 className="font-semibold text-slate-900">20 câu trả lời bị đánh giá 👎 gần đây</h2>
        </div>
        {s.topDownVotedMessages.length === 0 ? (
          <div className="text-center text-slate-500 py-6 text-sm">Không có 👎 trong khoảng thời gian này.</div>
        ) : (
          <div className="space-y-2">
            {s.topDownVotedMessages.map((m) => (
              <div key={m.messageId} className="border-l-4 border-red-300 pl-3 py-1">
                <div className="text-xs text-slate-500 flex gap-2">
                  <span>{formatDate(m.createdAt)}</span>
                  {m.reason && <span className="px-1.5 rounded bg-red-50 text-red-700">{REASON_LABEL[m.reason] ?? m.reason}</span>}
                </div>
                <div className="text-sm text-slate-800 mt-0.5">{m.content.slice(0, 400)}{m.content.length > 400 ? "..." : ""}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
