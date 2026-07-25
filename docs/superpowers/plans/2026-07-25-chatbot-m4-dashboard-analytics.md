# Milestone 4: Dashboard & Analytics — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Prerequisite:** Milestone 3 đã hoàn thành và deploy thành công.

**Goal:** Hoàn thiện khu vực nội bộ cho nhân viên PC Điện Biên: trang tổng quan với 4 KPI + 3 biểu đồ SVG tự vẽ, trang xem lịch sử session, trang thống kê chi tiết có filter, và trang admin quản lý user + phân quyền. Không thêm thư viện chart nặng — mọi biểu đồ vẽ tay bằng SVG/CSS.

**Architecture:**
- API `/api/stats` tổng hợp số liệu qua Prisma aggregate: session/message theo ngày, top topic, feedback ratio, avg rating, top câu hỏi bị 👎.
- 3 component chart thuần SVG: `DonutChart` (topic), `MonthlyBarChart` (câu hỏi theo ngày), `HorizontalBarChart` (top X).
- Trang admin `/dashboard/admin/users` chỉ cho `role=admin` — kiểm tra qua helper `requireAdmin()` đọc `User.role` trong DB.
- Session list + detail read-only để nhân viên review chatbot đã trả lời gì.

**Tech Stack:**
- Không thêm dependency mới. Reuse Next.js/Prisma/Clerk/Tailwind từ M1-M3.
- Nếu cần export CSV: dùng manual string concat (không cài lib).

---

## File Structure

| File | Trách nhiệm |
|------|-------------|
| `src/lib/auth.ts` | `getCurrentUser()`, `requireAdmin()` helpers |
| `src/lib/stats.ts` | Aggregate query helpers (7-day questions, top topics, feedback ratio, etc.) |
| `src/app/api/stats/route.ts` | GET tổng hợp cho dashboard home |
| `src/app/dashboard/page.tsx` | THAY THẾ placeholder: KPI cards + charts |
| `src/components/dashboard/kpi-card.tsx` | Card hiển thị 1 KPI |
| `src/components/dashboard/charts/donut-chart.tsx` | SVG donut |
| `src/components/dashboard/charts/monthly-bar-chart.tsx` | SVG bar dọc theo ngày |
| `src/components/dashboard/charts/horizontal-bar-chart.tsx` | SVG bar ngang top X |
| `src/components/dashboard/charts/index.ts` | Re-export |
| `src/app/dashboard/sessions/page.tsx` | List sessions + filter |
| `src/app/dashboard/sessions/[id]/page.tsx` | Detail 1 session |
| `src/app/dashboard/stats/page.tsx` | Thống kê chi tiết + filter theo range |
| `src/components/dashboard/date-range-picker.tsx` | Filter form 7/30/90 ngày |
| `src/app/dashboard/admin/users/page.tsx` | List users |
| `src/app/dashboard/admin/layout.tsx` | Guard `requireAdmin()` |
| `src/app/api/admin/users/route.ts` | GET list, PATCH role |
| `src/app/api/admin/users/[id]/route.ts` | PATCH role/unit |
| `src/components/dashboard/user-table.tsx` | Table users + đổi role |
| `src/app/dashboard/layout.tsx` | MODIFY: full sidebar + hiển thị link Admin nếu role admin |

Tổng ~17 file mới/sửa. Chia thành 11 task.

---

## Task 1: Auth helpers (getCurrentUser + requireAdmin)

**Files:** `src/lib/auth.ts`

- [ ] **Step 1: Ghi lib/auth.ts**

Ghi `src/lib/auth.ts`:

```ts
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { User } from "@/generated/prisma";

export async function getCurrentDbUser(): Promise<User | null> {
  const { userId } = await auth();
  if (!userId) return null;
  return prisma.user.findUnique({ where: { clerkId: userId } });
}

export async function requireDbUser(): Promise<User> {
  const user = await getCurrentDbUser();
  if (!user) {
    // User đã login Clerk nhưng chưa được sync (webhook chưa chạy) — force sync
    const clerk = await currentUser();
    if (!clerk) redirect("/sign-in");

    const email = clerk.emailAddresses[0]?.emailAddress;
    if (!email) throw new Error("Clerk user missing email");
    const defaultUnit = await prisma.unit.findUnique({ where: { code: "KHN" } });
    if (!defaultUnit) throw new Error("Default unit KHN not seeded");

    return prisma.user.create({
      data: {
        clerkId: clerk.id,
        email,
        fullName: [clerk.firstName, clerk.lastName].filter(Boolean).join(" ") || email,
        role: "user",
        unitId: defaultUnit.id,
      },
    });
  }
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireDbUser();
  if (user.role !== "admin") {
    redirect("/dashboard");
  }
  return user;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/auth.ts
git commit -m "feat(auth): db user helpers + requireAdmin"
```

---

## Task 2: Stats aggregation library

**Files:** `src/lib/stats.ts`

- [ ] **Step 1: Ghi stats.ts**

Ghi `src/lib/stats.ts`:

```ts
import { prisma } from "@/lib/prisma";
import type { TopicTag } from "@/lib/constants";

export interface DashboardStats {
  today: {
    sessions: number;
    userMessages: number;
    newLeads: number;
    feedbackUp: number;
    feedbackDown: number;
  };
  daily: { date: string; count: number }[]; // 7 ngày gần nhất
  topTopics: { tag: TopicTag; count: number }[];
  avgRating: number | null;
  topUnansweredReasons: { reason: string; count: number }[];
}

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const sevenDaysAgo = startOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));

  const [
    todaySessions,
    todayUserMessages,
    todayLeads,
    todayFbUp,
    todayFbDown,
    weekMessages,
    topicRows,
    ratingAgg,
    unansweredRows,
  ] = await Promise.all([
    prisma.chatSession.count({ where: { startedAt: { gte: todayStart } } }),
    prisma.message.count({
      where: { role: "user", createdAt: { gte: todayStart } },
    }),
    prisma.lead.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.messageFeedback.count({
      where: { rating: "UP", createdAt: { gte: todayStart } },
    }),
    prisma.messageFeedback.count({
      where: { rating: "DOWN", createdAt: { gte: todayStart } },
    }),
    prisma.message.findMany({
      where: { role: "user", createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.message.groupBy({
      by: ["topicTag"],
      where: { role: "assistant", topicTag: { not: null }, createdAt: { gte: sevenDaysAgo } },
      _count: true,
      orderBy: { _count: { topicTag: "desc" } },
      take: 6,
    }),
    prisma.sessionRating.aggregate({
      _avg: { stars: true },
      where: { createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.unansweredQuery.groupBy({
      by: ["reason"],
      where: { createdAt: { gte: sevenDaysAgo } },
      _count: true,
      orderBy: { _count: { reason: "desc" } },
    }),
  ]);

  // Group weekMessages by yyyy-mm-dd
  const daily: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = startOfDay(new Date(now.getTime() - i * 24 * 60 * 60 * 1000));
    const key = day.toISOString().slice(0, 10);
    daily.push({ date: key, count: 0 });
  }
  for (const m of weekMessages) {
    const key = m.createdAt.toISOString().slice(0, 10);
    const bucket = daily.find((d) => d.date === key);
    if (bucket) bucket.count += 1;
  }

  return {
    today: {
      sessions: todaySessions,
      userMessages: todayUserMessages,
      newLeads: todayLeads,
      feedbackUp: todayFbUp,
      feedbackDown: todayFbDown,
    },
    daily,
    topTopics: topicRows.map((r) => ({
      tag: (r.topicTag ?? "KHAC") as TopicTag,
      count: r._count,
    })),
    avgRating: ratingAgg._avg.stars ?? null,
    topUnansweredReasons: unansweredRows.map((r) => ({
      reason: r.reason,
      count: r._count,
    })),
  };
}

export interface DetailedStats {
  totalSessions: number;
  totalMessages: number;
  totalLeads: number;
  leadConversionRate: number; // leads / sessions
  avgMessagesPerSession: number;
  topDownVotedMessages: {
    messageId: string;
    content: string;
    reason: string | null;
    createdAt: Date;
  }[];
}

export async function getDetailedStats(fromDays: number): Promise<DetailedStats> {
  const now = new Date();
  const from = startOfDay(new Date(now.getTime() - fromDays * 24 * 60 * 60 * 1000));

  const [sessions, messages, leads, topDowns] = await Promise.all([
    prisma.chatSession.count({ where: { startedAt: { gte: from } } }),
    prisma.message.count({ where: { createdAt: { gte: from } } }),
    prisma.lead.count({ where: { createdAt: { gte: from } } }),
    prisma.messageFeedback.findMany({
      where: { rating: "DOWN", createdAt: { gte: from } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        message: { select: { id: true, content: true, createdAt: true } },
      },
    }),
  ]);

  return {
    totalSessions: sessions,
    totalMessages: messages,
    totalLeads: leads,
    leadConversionRate: sessions > 0 ? leads / sessions : 0,
    avgMessagesPerSession: sessions > 0 ? messages / sessions : 0,
    topDownVotedMessages: topDowns.map((f) => ({
      messageId: f.messageId,
      content: f.message.content,
      reason: f.reason,
      createdAt: f.message.createdAt,
    })),
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/stats.ts
git commit -m "feat(stats): dashboard + detailed aggregation queries"
```

---

## Task 3: KPI card + Chart components (SVG)

**Files:**
- Create: `src/components/dashboard/kpi-card.tsx`, `src/components/dashboard/charts/donut-chart.tsx`, `src/components/dashboard/charts/monthly-bar-chart.tsx`, `src/components/dashboard/charts/horizontal-bar-chart.tsx`, `src/components/dashboard/charts/index.ts`

- [ ] **Step 1: KpiCard**

Ghi `src/components/dashboard/kpi-card.tsx`:

```tsx
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function KpiCard({
  label,
  value,
  icon: Icon,
  accent = "blue",
  hint,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: "blue" | "green" | "orange" | "red";
  hint?: string;
}) {
  const accentMap = {
    blue: "text-[color:var(--color-evn-blue)] bg-blue-50",
    green: "text-green-700 bg-green-50",
    orange: "text-[color:var(--color-evn-orange)] bg-orange-50",
    red: "text-red-700 bg-red-50",
  };
  return (
    <div className="bg-white border rounded-xl p-4 flex items-start justify-between">
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-2xl font-bold text-slate-900 mt-0.5">{value}</div>
        {hint && <div className="text-xs text-slate-400 mt-0.5">{hint}</div>}
      </div>
      <div className={cn("rounded-lg p-2", accentMap[accent])}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: DonutChart SVG**

Ghi `src/components/dashboard/charts/donut-chart.tsx`:

```tsx
export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export function DonutChart({
  data,
  size = 180,
  thickness = 28,
}: {
  data: DonutSlice[];
  size?: number;
  thickness?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const radius = size / 2 - thickness / 2;
  const cx = size / 2;
  const cy = size / 2;
  const c = 2 * Math.PI * radius;

  let offset = 0;
  const arcs = data.map((d) => {
    const frac = total > 0 ? d.value / total : 0;
    const dash = frac * c;
    const arc = { color: d.color, dash, offset };
    offset += dash;
    return arc;
  });

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={thickness} />
        {arcs.map((a, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={a.color}
            strokeWidth={thickness}
            strokeDasharray={`${a.dash} ${c - a.dash}`}
            strokeDashoffset={-a.offset}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        ))}
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" className="fill-slate-900 font-bold" style={{ fontSize: "20px" }}>
          {total}
        </text>
      </svg>
      <div className="text-sm space-y-1">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: d.color }} />
            <span className="text-slate-700">{d.label}</span>
            <span className="text-slate-500 ml-auto">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: MonthlyBarChart**

Ghi `src/components/dashboard/charts/monthly-bar-chart.tsx`:

```tsx
export interface DailyBar {
  date: string; // yyyy-mm-dd
  count: number;
}

export function MonthlyBarChart({
  data,
  height = 140,
  color = "#0066B3",
}: {
  data: DailyBar[];
  height?: number;
  color?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div>
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((d) => {
          const h = (d.count / max) * height;
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t"
                style={{ height: Math.max(4, h), background: color, opacity: 0.85 }}
                title={`${d.date}: ${d.count} câu`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5 mt-2">
        {data.map((d) => (
          <div key={d.date} className="flex-1 text-center text-[10px] text-slate-500">
            {d.date.slice(5)}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: HorizontalBarChart**

Ghi `src/components/dashboard/charts/horizontal-bar-chart.tsx`:

```tsx
export interface HBarRow {
  label: string;
  value: number;
  color?: string;
}

export function HorizontalBarChart({
  rows,
  color = "#0066B3",
}: {
  rows: HBarRow[];
  color?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="space-y-1.5">
      {rows.map((r) => {
        const pct = (r.value / max) * 100;
        return (
          <div key={r.label}>
            <div className="flex justify-between text-xs mb-0.5">
              <span className="text-slate-700 truncate">{r.label}</span>
              <span className="text-slate-500 ml-2 shrink-0">{r.value}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded overflow-hidden">
              <div
                className="h-full rounded"
                style={{ width: `${pct}%`, background: r.color ?? color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 5: index barrel**

Ghi `src/components/dashboard/charts/index.ts`:

```ts
export { DonutChart } from "./donut-chart";
export { MonthlyBarChart } from "./monthly-bar-chart";
export { HorizontalBarChart } from "./horizontal-bar-chart";
```

- [ ] **Step 6: Commit**

```bash
git add src/components/dashboard/kpi-card.tsx src/components/dashboard/charts/
git commit -m "feat(dashboard): SVG chart primitives (donut, bar, hbar) + KPI card"
```

---

## Task 4: Dashboard home — thay placeholder

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Ghi lại dashboard home**

Ghi lại `src/app/dashboard/page.tsx`:

```tsx
import { MessageSquare, Users, ThumbsUp, Star } from "lucide-react";
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
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat(dashboard): full home page with KPIs + 3 charts"
```

---

## Task 5: Sessions list page

**Files:**
- Create: `src/app/dashboard/sessions/page.tsx`

- [ ] **Step 1: Sessions list**

Ghi `src/app/dashboard/sessions/page.tsx`:

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/sessions/page.tsx
git commit -m "feat(dashboard): sessions list with search"
```

---

## Task 6: Session detail page

**Files:** `src/app/dashboard/sessions/[id]/page.tsx`

- [ ] **Step 1: Detail page**

Ghi `src/app/dashboard/sessions/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

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
          <div className="text-sm text-slate-700 italic">"{session.rating.comment}"</div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Cập nhật sidebar**

Sửa `src/app/dashboard/layout.tsx` — thay `<div className="p-2">💬 Lịch sử chat (M4)</div>` bằng:

```tsx
<Link href="/dashboard/sessions" className="p-2 hover:bg-slate-800 rounded block">
  💬 Lịch sử chat
</Link>
```

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/sessions/[id]/page.tsx src/app/dashboard/layout.tsx
git commit -m "feat(dashboard): session detail with full message history + feedback"
```

---

## Task 7: Detailed stats page với filter range

**Files:**
- Create: `src/app/dashboard/stats/page.tsx`, `src/components/dashboard/date-range-picker.tsx`

- [ ] **Step 1: DateRangePicker**

Ghi `src/components/dashboard/date-range-picker.tsx`:

```tsx
"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { days: 7, label: "7 ngày" },
  { days: 30, label: "30 ngày" },
  { days: 90, label: "90 ngày" },
];

export function DateRangePicker({ current }: { current: number }) {
  return (
    <div className="flex gap-2">
      {OPTIONS.map((o) => (
        <Link
          key={o.days}
          href={`/dashboard/stats?range=${o.days}`}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm border transition",
            current === o.days
              ? "bg-[color:var(--color-evn-blue)] text-white border-transparent"
              : "border-slate-300 hover:bg-slate-100"
          )}
        >
          {o.label}
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Stats page**

Ghi `src/app/dashboard/stats/page.tsx`:

```tsx
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
```

- [ ] **Step 3: Sidebar link stats**

Trong `src/app/dashboard/layout.tsx`, thêm:

```tsx
<Link href="/dashboard/stats" className="p-2 hover:bg-slate-800 rounded block">
  📈 Thống kê chi tiết
</Link>
```

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/stats/ src/components/dashboard/date-range-picker.tsx src/app/dashboard/layout.tsx
git commit -m "feat(dashboard): detailed stats with 7/30/90 day filter + down-voted messages"
```

---

## Task 8: Admin — users management (list + change role/unit)

**Files:**
- Create: `src/app/dashboard/admin/layout.tsx`, `src/app/dashboard/admin/users/page.tsx`, `src/app/api/admin/users/route.ts`, `src/app/api/admin/users/[id]/route.ts`, `src/components/dashboard/user-table.tsx`

- [ ] **Step 1: Admin layout — guard admin**

Ghi `src/app/dashboard/admin/layout.tsx`:

```tsx
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}
```

- [ ] **Step 2: API list users**

Ghi `src/app/api/admin/users/route.ts`:

```ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await requireAdmin();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { unit: true },
  });
  return NextResponse.json({ users });
}
```

- [ ] **Step 3: API update user**

Ghi `src/app/api/admin/users/[id]/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await ctx.params;
  const body = await req.json();

  const data: { role?: string; unitId?: string } = {};
  if (body.role === "admin" || body.role === "user") data.role = body.role;
  if (typeof body.unitCode === "string") {
    const unit = await prisma.unit.findUnique({ where: { code: body.unitCode } });
    if (!unit) return NextResponse.json({ error: "invalid unit" }, { status: 400 });
    data.unitId = unit.id;
  }
  const updated = await prisma.user.update({ where: { id }, data, include: { unit: true } });
  return NextResponse.json({ user: updated });
}
```

- [ ] **Step 4: UserTable client**

Ghi `src/components/dashboard/user-table.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { UNIT_LIST } from "@/lib/constants";

interface UserRow {
  id: string;
  email: string;
  fullName: string;
  role: string;
  unitCode: string;
  unitName: string;
  createdAt: string;
}

export function UserTable({ users }: { users: UserRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function update(id: string, patch: Record<string, string>) {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Đã cập nhật");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="bg-white border rounded-xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="p-3">Nhân viên</th>
            <th className="p-3">Email</th>
            <th className="p-3">Vai trò</th>
            <th className="p-3">Đơn vị</th>
            <th className="p-3">Ngày tạo</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t">
              <td className="p-3 font-medium">{u.fullName}</td>
              <td className="p-3 text-slate-600 text-xs">{u.email}</td>
              <td className="p-3">
                <select
                  disabled={busy === u.id}
                  value={u.role}
                  onChange={(e) => update(u.id, { role: e.target.value })}
                  className="h-8 rounded border border-slate-300 px-2 text-xs"
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </td>
              <td className="p-3">
                <select
                  disabled={busy === u.id}
                  value={u.unitCode}
                  onChange={(e) => update(u.id, { unitCode: e.target.value })}
                  className="h-8 rounded border border-slate-300 px-2 text-xs"
                >
                  {UNIT_LIST.map((un) => (
                    <option key={un.code} value={un.code}>
                      {un.name}
                    </option>
                  ))}
                </select>
              </td>
              <td className="p-3 text-xs text-slate-500">{formatDate(u.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 5: Users page**

Ghi `src/app/dashboard/admin/users/page.tsx`:

```tsx
import { prisma } from "@/lib/prisma";
import { UserTable } from "@/components/dashboard/user-table";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { unit: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">Quản lý nhân viên</h1>
      <p className="text-sm text-slate-500 mb-4">
        Đổi vai trò và đơn vị cho nhân viên. Chỉ admin xem được trang này.
      </p>
      <UserTable
        users={users.map((u) => ({
          id: u.id,
          email: u.email,
          fullName: u.fullName,
          role: u.role,
          unitCode: u.unit.code,
          unitName: u.unit.name,
          createdAt: u.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/admin/ src/app/api/admin/ src/components/dashboard/user-table.tsx
git commit -m "feat(admin): users management (list + role/unit update)"
```

---

## Task 9: Cập nhật sidebar full + hiển thị link admin

**Files:** `src/app/dashboard/layout.tsx`

- [ ] **Step 1: Sidebar full với link admin conditional**

Ghi lại `src/app/dashboard/layout.tsx`:

```tsx
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { getCurrentDbUser } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentDbUser();
  const isAdmin = user?.role === "admin";

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-slate-900 text-white p-4">
        <Link href="/dashboard" className="text-lg font-semibold block mb-6">
          ⚡ EVN AI
        </Link>
        <nav className="text-sm space-y-1">
          <Link href="/dashboard" className="p-2 hover:bg-slate-800 rounded block">
            📊 Tổng quan
          </Link>
          <Link href="/dashboard/leads" className="p-2 hover:bg-slate-800 rounded block">
            👥 Lead khách hàng
          </Link>
          <Link href="/dashboard/sessions" className="p-2 hover:bg-slate-800 rounded block">
            💬 Lịch sử chat
          </Link>
          <Link href="/dashboard/documents" className="p-2 hover:bg-slate-800 rounded block">
            📚 Tài liệu (KB)
          </Link>
          <Link href="/dashboard/unanswered" className="p-2 hover:bg-slate-800 rounded block">
            ❓ Chưa trả lời
          </Link>
          <Link href="/dashboard/stats" className="p-2 hover:bg-slate-800 rounded block">
            📈 Thống kê
          </Link>
          {isAdmin && (
            <>
              <div className="pt-4 pb-1 px-2 text-xs uppercase text-slate-500">Admin</div>
              <Link href="/dashboard/admin/users" className="p-2 hover:bg-slate-800 rounded block">
                🔧 Nhân viên
              </Link>
            </>
          )}
        </nav>
      </aside>
      <main className="flex-1 flex flex-col">
        <header className="flex items-center justify-between p-4 border-b bg-white">
          <div className="text-sm text-slate-600">
            {user ? (
              <>
                <b>{user.fullName}</b> · {user.role} · <span className="text-slate-400">Đơn vị đã sync</span>
              </>
            ) : (
              "Đang tải..."
            )}
          </div>
          <UserButton afterSignOutUrl="/chat" />
        </header>
        <div className="flex-1 p-6 bg-slate-50">{children}</div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/layout.tsx
git commit -m "feat(dashboard): full sidebar + admin link + header user info"
```

---

## Task 10: Deploy + smoke test

- [ ] **Step 1: Push**

```bash
git push origin main
```

- [ ] **Step 2: Verify migration (không có migration mới M4 nếu không đổi schema)**

M4 không tạo migration mới. Nếu bạn có thêm chỉ mục hoặc field ở stats — thêm entry vào `apply-migrations.mjs`.

- [ ] **Step 3: Setup 1 admin trên production**

Trong Clerk dashboard → chọn 1 user (giám đốc / trưởng phòng) → Public metadata:

```json
{ "role": "admin", "unitCode": "DBP" }
```

Đợi webhook chạy (vài giây). Sau đó user đó vào `/dashboard/admin/users` xem được.

- [ ] **Step 4: Smoke test — 10 luồng**

Với tài khoản admin:
1. `/dashboard` — thấy 4 KPI cards + 3 biểu đồ, số liệu real-time.
2. Vào `/chat` gửi thêm vài câu → refresh `/dashboard` → KPI update.
3. Bấm 👍/👎 → dashboard hiển thị tỷ lệ hài lòng.
4. `/dashboard/sessions` → thấy list, tìm theo keyword hoạt động.
5. Click 1 session → thấy full messages + feedback + rating.
6. `/dashboard/stats?range=30` → thấy KPI 30 ngày + 20 câu 👎 nếu có.
7. Đổi filter 7/30/90 → trang reload đúng.
8. `/dashboard/admin/users` → thấy danh sách, đổi role 1 user → thấy status change immediately.
9. Đổi user thành `user` → user đó không thấy link "Nhân viên" trong sidebar sau khi refresh.
10. Truy cập `/dashboard/admin/users` bằng tài khoản `user` → bị redirect về `/dashboard`.

- [ ] **Step 5: Tag milestone**

```bash
git tag -a m4-dashboard -m "Milestone 4: Dashboard analytics deployed"
git push --tags
```

---

## Task 11: Update README + hoàn thiện

**Files:** `README.md`

- [ ] **Step 1: Sửa README**

```markdown
## Milestone 4 (hiện tại)
✅ Dashboard tổng quan: KPI hôm nay + biểu đồ 7 ngày + top chủ đề + lý do chưa trả lời
✅ Lịch sử chat: list phiên + tìm kiếm nội dung + xem chi tiết full messages
✅ Thống kê chi tiết: filter 7/30/90 ngày + 20 câu 👎 gần nhất
✅ Admin quản lý user: đổi role + đơn vị
✅ Sidebar hoàn thiện, hiện link admin theo role

## Vận hành đầy đủ

Sản phẩm đã đủ tính năng cho pilot nội bộ:
- Khách hàng có công cụ chat 24/7
- Nhân viên có kênh nhận lead + review chất lượng bot
- Admin có KB quản lý tài liệu + phân quyền + số liệu vận hành
```

- [ ] **Step 2: Commit + push**

```bash
git add README.md
git commit -m "docs: finalize README for M4 dashboard"
git push
```

---

## Definition of Done — Milestone 4

- [ ] `git tag m4-dashboard` tồn tại và đã push.
- [ ] Dashboard home load < 2s, hiển thị đúng số liệu.
- [ ] Biểu đồ SVG render mượt trên mobile + desktop.
- [ ] Admin đổi role user thành công, guard `requireAdmin()` hoạt động.
- [ ] Nhân viên không phải admin không thấy `/dashboard/admin/*`.
- [ ] Session detail hiển thị đầy đủ messages + feedback + rating + link tới lead.
- [ ] Stats filter 7/30/90 ngày hoạt động, URL param có state.

## Backlog dài hạn (phase 2)

- Export lead ra Excel (`xlsx` skill)
- Auto assign lead theo địa lý
- Notification email cho nhân viên khi có lead mới (`gmail.ts` wrapper)
- Live handoff — nhân viên chat trực tiếp thay chatbot (WebSocket)
- Retraining tài liệu dựa trên câu 👎 (bổ sung KB tự động)
- Multi-tenant cho các PC tỉnh khác
- Zalo Mini App / Facebook Messenger integration
- Voice input/output (STT + TTS tiếng Việt)
- Vision — phân tích ảnh mái nhà / hóa đơn giấy
- Migrate vector search sang Pinecone khi > 10.000 chunks
- Rate limit sang Upstash Redis khi multi-instance
