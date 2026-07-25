import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

interface Body {
  sessionId: string;
  stars: number;
  comment?: string;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!body.sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  if (!Number.isInteger(body.stars) || body.stars < 1 || body.stars > 5)
    return NextResponse.json({ error: "stars 1-5" }, { status: 400 });

  const session = await prisma.chatSession.findUnique({ where: { id: body.sessionId } });
  if (!session) return NextResponse.json({ error: "session not found" }, { status: 404 });

  await prisma.sessionRating.upsert({
    where: { sessionId: body.sessionId },
    update: { stars: body.stars, comment: body.comment ?? null },
    create: {
      sessionId: body.sessionId,
      stars: body.stars,
      comment: body.comment ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}
