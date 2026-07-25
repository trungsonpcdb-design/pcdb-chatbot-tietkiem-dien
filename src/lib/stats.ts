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
  daily: { date: string; count: number }[];
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
  leadConversionRate: number;
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
