import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const STATUSES = new Set(["MOI", "DA_LIEN_HE", "THANH_CONG", "TU_CHOI"]);

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json();
  const data: {
    status?: string;
    note?: string | null;
    assignedTo?: string | null;
    assignedUnit?: string | null;
  } = {};

  if (typeof body.status === "string") {
    if (!STATUSES.has(body.status)) return NextResponse.json({ error: "invalid status" }, { status: 400 });
    data.status = body.status;
  }
  if (body.note !== undefined) data.note = body.note ?? null;
  if (body.assignedTo !== undefined) data.assignedTo = body.assignedTo ?? null;
  if (body.assignedUnitCode !== undefined) {
    if (body.assignedUnitCode) {
      const unit = await prisma.unit.findUnique({ where: { code: body.assignedUnitCode } });
      if (!unit) return NextResponse.json({ error: "invalid unit" }, { status: 400 });
      data.assignedUnit = unit.id;
    } else {
      data.assignedUnit = null;
    }
  }

  const updated = await prisma.lead.update({ where: { id }, data });
  return NextResponse.json({ lead: updated });
}
