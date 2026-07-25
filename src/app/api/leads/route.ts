import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getOpenAI, CHAT_MODEL } from "@/lib/openai";

export const runtime = "nodejs";

interface CreateBody {
  sessionId: string;
  fullName: string;
  phone: string;
  address?: string;
  interestTopic: string;
  assignedUnit?: string;
}

const PHONE_REGEX = /^(0|\+84)(\d{9,10})$/;

async function summarizeChat(sessionId: string): Promise<string> {
  const messages = await prisma.message.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    take: 20,
    select: { role: true, content: true },
  });
  if (messages.length === 0) return "(Chưa có tin nhắn nào)";
  const conversation = messages
    .map((m) => `${m.role === "user" ? "Khách" : "Bot"}: ${m.content}`)
    .join("\n");
  const openai = getOpenAI();
  const res = await openai.chat.completions.create({
    model: CHAT_MODEL,
    max_tokens: 200,
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "Tóm tắt cuộc chat sau bằng 2-3 câu tiếng Việt tự nhiên, tập trung vào nhu cầu khách hàng và những gì bot đã tư vấn. Không giải thích thêm.",
      },
      { role: "user", content: conversation },
    ],
  });
  return res.choices[0]?.message?.content?.trim() ?? "";
}

export async function POST(req: NextRequest) {
  let body: CreateBody;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!body.sessionId || !body.fullName || !body.phone) {
    return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
  }
  if (!PHONE_REGEX.test(body.phone.replace(/\s/g, ""))) {
    return NextResponse.json({ error: "SĐT không hợp lệ" }, { status: 400 });
  }

  const session = await prisma.chatSession.findUnique({ where: { id: body.sessionId } });
  if (!session) return NextResponse.json({ error: "Phiên chat không tồn tại" }, { status: 404 });

  const existing = await prisma.lead.findUnique({ where: { sessionId: body.sessionId } });
  if (existing) return NextResponse.json({ error: "Phiên này đã đăng ký lead" }, { status: 409 });

  let unitId: string | null = null;
  if (body.assignedUnit) {
    const unit = await prisma.unit.findUnique({ where: { code: body.assignedUnit } });
    if (!unit) return NextResponse.json({ error: "Đơn vị không hợp lệ" }, { status: 400 });
    unitId = unit.id;
  }

  const summary = await summarizeChat(body.sessionId).catch(() => "");

  const lead = await prisma.lead.create({
    data: {
      sessionId: body.sessionId,
      fullName: body.fullName.trim(),
      phone: body.phone.replace(/\s/g, ""),
      address: body.address?.trim() || null,
      interestTopic: body.interestTopic,
      chatSummary: summary,
      assignedUnit: unitId,
    },
  });

  return NextResponse.json({ lead });
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const unit = url.searchParams.get("unit");

  const leads = await prisma.lead.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(unit ? { unit: { code: unit } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { unit: true },
  });

  return NextResponse.json({ leads });
}
