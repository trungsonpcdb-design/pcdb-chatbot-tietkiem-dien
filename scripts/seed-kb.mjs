#!/usr/bin/env node
/**
 * Seed Knowledge Base từ thư mục `tailieu/`.
 *
 * Cách dùng:
 *   npm run db:seed:kb                       # tất cả PHAP_LY, đơn giản nhất
 *   npm run db:seed:kb -- --category=KY_THUAT
 *   npm run db:seed:kb -- --folder=./mydocs --category=TIET_KIEM
 *
 * Chạy được nhiều lần: đã có Document cùng `fileName` sẽ bỏ qua.
 * Không lên Blob — dev mode. blobUrl để null.
 */
import "dotenv/config";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import OpenAI from "openai";
import { PrismaClient } from "../src/generated/prisma/index.js";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// ---------- CLI args ----------
const args = new Map();
for (const a of process.argv.slice(2)) {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/);
  if (m) args.set(m[1], m[2] ?? "true");
}
const FOLDER = args.get("folder") ?? "./tailieu";
const CATEGORY = args.get("category") ?? "PHAP_LY";
const ALLOWED_CATEGORIES = new Set(["PHAP_LY", "GIA_DIEN", "KY_THUAT", "TIET_KIEM"]);
if (!ALLOWED_CATEGORIES.has(CATEGORY)) {
  console.error(`[seed-kb] category không hợp lệ: ${CATEGORY}. Chọn: ${[...ALLOWED_CATEGORIES].join(", ")}`);
  process.exit(1);
}

// ---------- env ----------
const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
const openaiKey = process.env.OPENAI_API_KEY;
if (!openaiKey) {
  console.error("[seed-kb] OPENAI_API_KEY chưa được set trong .env");
  process.exit(1);
}

// ---------- clients ----------
const isRemote = dbUrl.startsWith("libsql://") || dbUrl.startsWith("https://");
const adapter = new PrismaLibSql({
  url: dbUrl,
  authToken: isRemote ? process.env.TURSO_AUTH_TOKEN : undefined,
});
const prisma = new PrismaClient({ adapter });
const openai = new OpenAI({ apiKey: openaiKey });

// ---------- utilities (mirror src/lib/rag) ----------
const TARGET_TOKENS = 600;
const MAX_TOKENS = 800;
const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_BATCH = 100;
const HEADING_REGEX =
  /^(?:(?:Điều|Chương|Mục|Phần)\s+[IVXLCDM\d]+[.:]?|\d+\.\s+[A-ZĐÁÀẢÃẠẤẦẨẪẬĂẮẰẲẴẶÉÈẺẼẸẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤỨỪỬỮỰÝỲỶỸỴ])/;

function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.trim().split(/\s+/).length * 1.5);
}

function chunkDocument({ pages, fullText }) {
  const chunks = [];
  let idx = 0;
  const sources = pages
    ? pages.map((p) => ({ text: p.text, pageNumber: p.pageNumber }))
    : [{ text: fullText ?? "", pageNumber: undefined }];

  for (const src of sources) {
    if (!src.text.trim()) continue;
    const paragraphs = src.text.split(/\n{2,}|\r{2,}/).map((p) => p.trim()).filter(Boolean);
    let current = [];
    let curTokens = 0;
    let heading;

    const flush = () => {
      if (current.length === 0) return;
      chunks.push({
        content: current.join("\n\n"),
        chunkIndex: idx++,
        pageNumber: src.pageNumber,
        heading,
      });
    };

    for (const para of paragraphs) {
      const firstLine = para.split("\n")[0]?.trim() ?? "";
      if (HEADING_REGEX.test(firstLine) && firstLine.length < 200) {
        flush();
        current = [];
        curTokens = 0;
        heading = firstLine;
      }
      const t = estimateTokens(para);
      if (curTokens + t > MAX_TOKENS && current.length > 0) {
        flush();
        const last = current[current.length - 1];
        current = [last];
        curTokens = estimateTokens(last);
      }
      current.push(para);
      curTokens += t;
      if (curTokens >= TARGET_TOKENS) {
        flush();
        const last = current[current.length - 1];
        current = [last];
        curTokens = estimateTokens(last);
      }
    }
    flush();
  }
  return chunks.filter((c) => c.content.trim().length > 30);
}

async function extractPdf(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const r = await parser.getText();
    return { pages: r.pages.map((p) => ({ pageNumber: p.num, text: p.text.trim() })) };
  } finally {
    await parser.destroy();
  }
}

async function embedTexts(texts) {
  const out = [];
  for (let i = 0; i < texts.length; i += EMBEDDING_BATCH) {
    const batch = texts.slice(i, i + EMBEDDING_BATCH);
    const res = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: batch });
    for (const item of res.data) out.push(new Float32Array(item.embedding));
  }
  return out;
}

function encodeVector(v) {
  const bytes = new Uint8Array(v.byteLength);
  bytes.set(new Uint8Array(v.buffer, v.byteOffset, v.byteLength));
  return bytes;
}

// ---------- main ----------
function guessTitle(fileName) {
  return fileName
    .replace(/\.(pdf|docx|txt)$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function ingestFile(filePath) {
  const fileName = path.basename(filePath);
  const ext = path.extname(fileName).toLowerCase();
  if (![".pdf", ".docx", ".txt"].includes(ext)) {
    console.log(`[seed-kb] skip (không hỗ trợ): ${fileName}`);
    return { skipped: true };
  }

  const existing = await prisma.document.findFirst({ where: { fileName } });
  if (existing) {
    console.log(`[seed-kb] skip (đã tồn tại): ${fileName}`);
    return { skipped: true };
  }

  const buffer = await readFile(filePath);
  const size = (await stat(filePath)).size;
  const sourceType = ext === ".pdf" ? "PDF" : ext === ".docx" ? "DOCX" : "TXT";
  console.log(`[seed-kb] processing ${fileName} (${sourceType}, ${(size / 1024).toFixed(1)} KB)...`);

  let chunks;
  if (sourceType === "PDF") {
    const parsed = await extractPdf(buffer);
    chunks = chunkDocument({ pages: parsed.pages });
  } else if (sourceType === "DOCX") {
    const parsed = await mammoth.extractRawText({ buffer });
    chunks = chunkDocument({ fullText: parsed.value });
  } else {
    chunks = chunkDocument({ fullText: buffer.toString("utf-8") });
  }

  if (chunks.length === 0) {
    console.log(`[seed-kb] skip (không extract được nội dung): ${fileName}`);
    return { skipped: true };
  }
  if (chunks.length > 500) {
    console.log(`[seed-kb] skip (quá dài ${chunks.length} chunks): ${fileName}`);
    return { skipped: true };
  }

  console.log(`[seed-kb]   ${chunks.length} chunks → embedding...`);
  const embeddings = await embedTexts(chunks.map((c) => c.content));

  const doc = await prisma.document.create({
    data: {
      title: guessTitle(fileName),
      category: CATEGORY,
      sourceType,
      blobUrl: null,
      fileName,
      fileSize: size,
      uploadedBy: "seed-script",
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

  console.log(`[seed-kb] ✓ ${fileName} → Document ${doc.id} (${chunks.length} chunks)`);
  return { ok: true, chunkCount: chunks.length };
}

async function main() {
  const abs = path.resolve(FOLDER);
  console.log(`[seed-kb] folder: ${abs}`);
  console.log(`[seed-kb] category: ${CATEGORY}`);

  let entries;
  try {
    entries = await readdir(abs);
  } catch (err) {
    console.error(`[seed-kb] không đọc được thư mục: ${abs}`);
    console.error(err.message);
    process.exit(1);
  }

  const results = { ok: 0, skipped: 0, failed: 0, chunks: 0 };
  for (const name of entries) {
    const fp = path.join(abs, name);
    const st = await stat(fp);
    if (!st.isFile()) continue;
    try {
      const r = await ingestFile(fp);
      if (r.ok) {
        results.ok++;
        results.chunks += r.chunkCount;
      } else results.skipped++;
    } catch (err) {
      results.failed++;
      console.error(`[seed-kb] ✗ ${name}: ${err.message}`);
    }
  }

  console.log(
    `\n[seed-kb] xong. ok=${results.ok} skipped=${results.skipped} failed=${results.failed} chunks=${results.chunks}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
