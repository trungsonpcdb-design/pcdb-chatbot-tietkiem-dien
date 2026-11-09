import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireAdmin();
  const count = await prisma.semanticCache.count();
  return NextResponse.json({ count });
}

export async function POST() {
  await requireAdmin();
  const before = await prisma.semanticCache.count();
  const result = await prisma.semanticCache.deleteMany({});
  return NextResponse.json({ before, deleted: result.count });
}
