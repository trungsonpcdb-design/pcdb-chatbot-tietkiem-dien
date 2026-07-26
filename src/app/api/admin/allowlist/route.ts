import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireAdmin();
  const clerk = await clerkClient();
  const res = await clerk.allowlistIdentifiers.getAllowlistIdentifierList();
  return NextResponse.json({
    items: res.data.map((it) => ({
      id: it.id,
      identifier: it.identifier,
      createdAt: it.createdAt,
    })),
  });
}

export async function POST(req: NextRequest) {
  await requireAdmin();
  const body = await req.json();
  const identifier = typeof body.identifier === "string" ? body.identifier.trim() : "";
  if (!identifier) return NextResponse.json({ error: "identifier required" }, { status: 400 });

  const clerk = await clerkClient();
  try {
    const item = await clerk.allowlistIdentifiers.createAllowlistIdentifier({
      identifier,
      notify: false,
    });
    return NextResponse.json({ item: { id: item.id, identifier: item.identifier } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
