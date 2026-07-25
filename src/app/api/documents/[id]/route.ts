import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json();

  const data: {
    isActive?: boolean;
    supersededById?: string | null;
    effectiveTo?: Date | null;
    title?: string;
    category?: string;
  } = {};

  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (typeof body.supersededById === "string" || body.supersededById === null) {
    data.supersededById = body.supersededById;
    if (body.supersededById) {
      data.isActive = false;
      data.effectiveTo = new Date();
    }
  }
  if (typeof body.title === "string") data.title = body.title;
  if (typeof body.category === "string") data.category = body.category;

  const updated = await prisma.document.update({ where: { id }, data });
  return NextResponse.json({ document: updated });
}
