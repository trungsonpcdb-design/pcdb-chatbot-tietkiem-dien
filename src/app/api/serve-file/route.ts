import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const url = new URL(req.url);
  const target = url.searchParams.get("url");
  if (!target) return new Response("Missing url param", { status: 400 });
  if (!target.startsWith("https://") && !target.startsWith("/uploads/")) {
    return new Response("Invalid url", { status: 400 });
  }

  if (target.startsWith("/uploads/")) {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const filePath = path.join(process.cwd(), "public", target);
    const buf = await fs.readFile(filePath);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": guessContentType(target),
        "Content-Disposition": `inline`,
      },
    });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const upstream = await fetch(target, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!upstream.ok) return new Response("Not found", { status: 404 });

  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/octet-stream",
      "Content-Disposition": upstream.headers.get("Content-Disposition") ?? "inline",
    },
  });
}

function guessContentType(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".docx"))
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (lower.endsWith(".txt")) return "text/plain; charset=utf-8";
  return "application/octet-stream";
}
