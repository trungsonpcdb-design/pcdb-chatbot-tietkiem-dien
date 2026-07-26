import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await ctx.params;
  const body = await req.json();

  const data: { role?: string; unitId?: string; status?: string } = {};
  if (body.role === "admin" || body.role === "user") data.role = body.role;
  if (body.status === "active" || body.status === "pending") data.status = body.status;
  if (typeof body.unitCode === "string") {
    const unit = await prisma.unit.findUnique({ where: { code: body.unitCode } });
    if (!unit) return NextResponse.json({ error: "invalid unit" }, { status: 400 });
    data.unitId = unit.id;
  }
  const updated = await prisma.user.update({ where: { id }, data, include: { unit: true } });
  return NextResponse.json({ user: updated });
}
