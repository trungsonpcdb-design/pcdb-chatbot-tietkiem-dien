import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { putPrivate } from "@/lib/blob";
import { extractPdf } from "@/lib/extractors/pdf";
import { extractDocx } from "@/lib/extractors/docx";
import { chunkDocument } from "@/lib/rag/chunker";
import { embedTexts, encodeVector } from "@/lib/rag/embedder";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_SIZE = 15 * 1024 * 1024;
const ALLOWED = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const docs = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { chunks: true } },
      supersededBy: { select: { id: true, title: true } },
    },
  });
  return NextResponse.json({ documents: docs });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  const title = String(form.get("title") ?? "").trim();
  const category = String(form.get("category") ?? "").trim();
  const effectiveFrom = form.get("effectiveFrom")
    ? new Date(String(form.get("effectiveFrom")))
    : null;
  const publishedAt = form.get("publishedAt")
    ? new Date(String(form.get("publishedAt")))
    : null;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Thiếu file" }, { status: 400 });
  }
  if (!title) return NextResponse.json({ error: "Thiếu tiêu đề" }, { status: 400 });
  if (!category) return NextResponse.json({ error: "Thiếu phân loại" }, { status: 400 });
  if (file.size > MAX_SIZE)
    return NextResponse.json({ error: "File > 15MB" }, { status: 400 });
  if (!ALLOWED.has(file.type))
    return NextResponse.json({ error: "Chỉ chấp nhận PDF/DOCX/TXT" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const sourceType =
    file.type === "application/pdf"
      ? "PDF"
      : file.type === "text/plain"
      ? "TXT"
      : "DOCX";

  let chunks;
  try {
    if (sourceType === "PDF") {
      const parsed = await extractPdf(buffer);
      chunks = chunkDocument({ pages: parsed.pages });
    } else if (sourceType === "DOCX") {
      const parsed = await extractDocx(buffer);
      chunks = chunkDocument({ fullText: parsed.fullText });
    } else {
      chunks = chunkDocument({ fullText: buffer.toString("utf-8") });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Extract lỗi: ${msg}` }, { status: 500 });
  }

  if (chunks.length === 0) {
    return NextResponse.json({ error: "Không trích được nội dung" }, { status: 400 });
  }
  if (chunks.length > 500) {
    return NextResponse.json(
      { error: "Tài liệu quá dài (> 500 chunks). Vui lòng chia nhỏ." },
      { status: 400 }
    );
  }

  const blob = await putPrivate("documents", file.name, buffer, file.type);
  const embeddings = await embedTexts(chunks.map((c) => c.content));

  const doc = await prisma.document.create({
    data: {
      title,
      category,
      sourceType,
      blobUrl: blob.url,
      fileName: file.name,
      fileSize: file.size,
      publishedAt,
      effectiveFrom,
      uploadedBy: userId,
      status: "INDEXED",
      chunks: {
        create: chunks.map((c, i) => ({
          chunkIndex: c.chunkIndex,
          content: c.content,
          pageNumber: c.pageNumber ?? null,
          heading: c.heading ?? null,
          embedding: encodeVector(embeddings[i]),
        })),
      },
    },
  });

  return NextResponse.json({ document: doc, chunkCount: chunks.length });
}
