import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

interface Body {
  messageId: string;
  rating: "UP" | "DOWN";
  reason?: string;
}

const REASONS = new Set([
  "SAI_THONG_TIN",
  "KHONG_DU_CHI_TIET",
  "KHONG_LIEN_QUAN",
  "KHAC",
]);

export async function POST(req: NextRequest) {
  let body: Body;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!body.messageId) return NextResponse.json({ error: "messageId required" }, { status: 400 });
  if (body.rating !== "UP" && body.rating !== "DOWN")
    return NextResponse.json({ error: "rating must be UP or DOWN" }, { status: 400 });
  if (body.reason && !REASONS.has(body.reason))
    return NextResponse.json({ error: "invalid reason" }, { status: 400 });

  const msg = await prisma.message.findUnique({ where: { id: body.messageId } });
  if (!msg) return NextResponse.json({ error: "message not found" }, { status: 404 });
  if (msg.role !== "assistant")
    return NextResponse.json({ error: "chỉ feedback cho message assistant" }, { status: 400 });

  await prisma.messageFeedback.upsert({
    where: { messageId: body.messageId },
    update: { rating: body.rating, reason: body.reason ?? null },
    create: {
      messageId: body.messageId,
      rating: body.rating,
      reason: body.reason ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}
