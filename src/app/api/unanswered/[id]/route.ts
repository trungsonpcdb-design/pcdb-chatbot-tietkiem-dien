import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const reviewed = typeof body.reviewed === "boolean" ? body.reviewed : true;

  const row = await prisma.unansweredQuery.update({
    where: { id },
    data: { reviewed },
  });

  return NextResponse.json({ ok: true, row });
}
