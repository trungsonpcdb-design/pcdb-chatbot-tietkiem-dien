import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "CLERK_WEBHOOK_SECRET not set" }, { status: 500 });

  const payload = await req.text();
  const headers = {
    "svix-id": req.headers.get("svix-id") ?? "",
    "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
    "svix-signature": req.headers.get("svix-signature") ?? "",
  };

  const wh = new Webhook(secret);
  let event: { type: string; data: Record<string, unknown> };
  try {
    event = wh.verify(payload, headers) as { type: string; data: Record<string, unknown> };
  } catch {
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }

  if (event.type === "user.created" || event.type === "user.updated") {
    const user = event.data as {
      id: string;
      email_addresses: { email_address: string; id: string }[];
      first_name?: string;
      last_name?: string;
      public_metadata?: { role?: string; unitCode?: string };
    };
    const email = user.email_addresses[0]?.email_address;
    if (!email) return NextResponse.json({ ok: true });

    const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || email;
    const role = user.public_metadata?.role === "admin" ? "admin" : "user";
    const unitCode = user.public_metadata?.unitCode ?? "KHN";

    const unit = await prisma.unit.findUnique({ where: { code: unitCode } });
    if (!unit) return NextResponse.json({ error: "unit not found" }, { status: 400 });

    await prisma.user.upsert({
      where: { clerkId: user.id },
      update: { email, fullName, role, unitId: unit.id },
      create: { clerkId: user.id, email, fullName, role, unitId: unit.id },
    });
  } else if (event.type === "user.deleted") {
    const id = String(event.data.id ?? "");
    if (id) await prisma.user.deleteMany({ where: { clerkId: id } });
  }

  return NextResponse.json({ ok: true });
}
