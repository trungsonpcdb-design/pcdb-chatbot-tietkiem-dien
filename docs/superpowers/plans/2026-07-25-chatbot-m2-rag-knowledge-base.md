# Milestone 2: RAG + Knowledge Base — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Prerequisite:** Milestone 1 đã hoàn thành và deploy thành công.

**Goal:** Nâng cấp chatbot từ "prompt hard-code" (M1) sang **RAG** (Retrieval-Augmented Generation): admin upload PDF/DOCX vào Knowledge Base → hệ thống tự extract, chunk, embed → chatbot query vector store và trả lời **dựa trên tài liệu thật** kèm citation. Có UI quản lý tài liệu + đánh dấu văn bản hết hiệu lực (supersede).

**Architecture:**
- Ingest pipeline chạy inline trong API route (< 60s giới hạn Vercel Hobby, tài liệu < 50 trang). Extract text (pdf-parse / mammoth) → chunk 500-800 tokens overlap 100 theo heading → embed batch qua OpenAI `text-embedding-3-small` (1536 dim) → lưu vector dạng `Bytes` trong Turso.
- Query pipeline: rewrite câu hỏi (nếu follow-up) → embed → vector search top-5 in-memory cosine (chỉ query các chunk thuộc `Document.isActive=true`) → nếu điểm cao nhất < 0.35 log `UnansweredQuery`; nếu OK build prompt có TÀI LIỆU THAM KHẢO → stream trả lời có citation `[1], [2]` → sau khi xong, phân loại topic tag.
- File gốc lưu Vercel Blob **private**, serve qua route `/api/serve-file` kèm Bearer token.

**Tech Stack:**
- Thêm: `pdf-parse`, `mammoth`, `@vercel/blob`
- Reuse: OpenAI SDK, Prisma, libsql

---

## File Structure

Thêm vào cấu trúc M1:

| File | Trách nhiệm |
|------|-------------|
| `prisma/schema.prisma` | THÊM: `Document`, `DocumentChunk`, `UnansweredQuery` |
| `prisma/migrations/20260805100000_add_kb/migration.sql` | Tables + cột mới |
| `scripts/apply-migrations.mjs` | THÊM entry migration mới |
| `src/lib/extractors/pdf.ts` | pdf-parse wrapper |
| `src/lib/extractors/docx.ts` | mammoth wrapper |
| `src/lib/rag/chunker.ts` | Chia chunk theo heading, overlap tokens |
| `src/lib/rag/embedder.ts` | Batch embed qua OpenAI |
| `src/lib/rag/vector-store.ts` | In-memory cosine similarity |
| `src/lib/rag/query-rewriter.ts` | Rewrite follow-up questions |
| `src/lib/rag/topic-classifier.ts` | Phân loại 7 topic tags |
| `src/lib/rag/prompt-builder.ts` | Build system prompt với TÀI LIỆU THAM KHẢO |
| `src/lib/blob.ts` | Vercel Blob wrapper (put/get private) |
| `src/lib/tokenizer.ts` | Đếm token đơn giản (word * 1.3) |
| `src/app/api/documents/route.ts` | GET list, POST upload+ingest |
| `src/app/api/documents/[id]/route.ts` | DELETE, PATCH (supersede) |
| `src/app/api/serve-file/route.ts` | Stream Blob private với Bearer |
| `src/app/api/chat/route.ts` | MODIFY: thêm RAG pipeline |
| `src/app/dashboard/documents/page.tsx` | List tài liệu |
| `src/app/dashboard/documents/new/page.tsx` | Upload UI |
| `src/app/dashboard/documents/[id]/page.tsx` | Chi tiết + supersede |
| `src/app/dashboard/unanswered/page.tsx` | List câu hỏi chatbot không trả lời được |
| `src/components/chat/citation-popover.tsx` | Popup "Xem nguồn" |
| `src/components/chat/message-bubble.tsx` | MODIFY: nhận `citations` prop, render nút xem nguồn |
| `src/components/dashboard/document-form.tsx` | Form upload + metadata |
| `src/components/dashboard/document-list-table.tsx` | Table tài liệu |
| `src/components/dashboard/supersede-dialog.tsx` | Dialog chọn văn bản thay thế |
| `src/lib/prompts/system-rag.ts` | System prompt CÓ RAG (thay `system-mvp.ts` khi có tài liệu) |

Tổng ~27 file mới/sửa. Chia thành 15 task.

---

## Task 1: Cài dependencies M2

**Files:** `package.json`

- [ ] **Step 1: Cài deps**

```bash
npm install pdf-parse mammoth @vercel/blob
npm install -D @types/pdf-parse
```

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(m2): install pdf-parse, mammoth, vercel blob"
```

---

## Task 2: Extend schema + migration M2

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260805100000_add_kb/migration.sql`
- Modify: `scripts/apply-migrations.mjs`

- [ ] **Step 1: Thêm 3 model vào schema.prisma**

Append vào `prisma/schema.prisma`:

```prisma
model Document {
  id              String        @id @default(cuid())
  title           String
  category        String                             // "PHAP_LY" | "GIA_DIEN" | "KY_THUAT" | "TIET_KIEM"
  sourceType      String                             // "PDF" | "DOCX" | "TXT"
  sourceUrl       String?
  blobUrl         String?
  fileName        String?
  fileSize        Int?
  publishedAt     DateTime?
  effectiveFrom   DateTime?
  effectiveTo     DateTime?
  supersededById  String?
  supersededBy    Document?     @relation("Supersede", fields: [supersededById], references: [id])
  supersedes      Document[]    @relation("Supersede")
  isActive        Boolean       @default(true)
  uploadedBy      String
  status          String        @default("INDEXED")  // "PROCESSING" | "INDEXED" | "ERROR"
  errorMessage    String?
  chunks          DocumentChunk[]
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([isActive, category])
}

model DocumentChunk {
  id          String    @id @default(cuid())
  documentId  String
  document    Document  @relation(fields: [documentId], references: [id], onDelete: Cascade)
  chunkIndex  Int
  content     String
  pageNumber  Int?
  heading     String?
  embedding   Bytes?
  createdAt   DateTime  @default(now())

  @@index([documentId, chunkIndex])
}

model UnansweredQuery {
  id         String   @id @default(cuid())
  sessionId  String
  question   String
  reason     String                             // "LOW_CONFIDENCE" | "NO_DOCUMENT_MATCH" | "OFF_TOPIC"
  reviewed   Boolean  @default(false)
  createdAt  DateTime @default(now())

  @@index([reviewed, createdAt])
}
```

Sửa `Message` model để thêm `citations` và `topicTag`:

```prisma
model Message {
  id         String       @id @default(cuid())
  sessionId  String
  session    ChatSession  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  role       String
  content    String
  citations  String?                            // JSON: [{docId, chunkId, snippet, page, heading}]
  topicTag   String?
  tokensIn   Int?
  tokensOut  Int?
  latencyMs  Int?
  createdAt  DateTime     @default(now())

  @@index([sessionId, createdAt])
}
```

- [ ] **Step 2: Tạo migration**

```bash
npx prisma migrate dev --name add_kb
```

Ghi nhớ tên folder được sinh (VD `20260805103012_add_kb`) — dùng ở Step 3.

- [ ] **Step 3: Cập nhật apply-migrations.mjs**

Sửa mảng `MIGRATIONS`:

```js
const MIGRATIONS = [
  { id: "20260725120000_init", file: "prisma/migrations/20260725120000_init/migration.sql" },
  { id: "20260805103012_add_kb", file: "prisma/migrations/20260805103012_add_kb/migration.sql" },
];
```

(Thay timestamp đúng với folder thực tế.)

- [ ] **Step 4: Verify migration SQL idempotent**

Đọc file `prisma/migrations/<timestamp>_add_kb/migration.sql`. Nếu có `CREATE TABLE "Document"` mà không phải `CREATE TABLE IF NOT EXISTS "Document"` — sửa lại thêm `IF NOT EXISTS`. Với `ALTER TABLE "Message" ADD COLUMN "citations" TEXT` và `... "topicTag" TEXT` — SQLite tự IF NOT EXISTS via runner.

- [ ] **Step 5: Regenerate Prisma client**

```bash
npx prisma generate
```

- [ ] **Step 6: Commit**

```bash
git add prisma/ scripts/apply-migrations.mjs
git commit -m "feat(db): m2 schema add Document/DocumentChunk/UnansweredQuery + citations on Message"
```

---

## Task 3: Extractors PDF + DOCX

**Files:**
- Create: `src/lib/extractors/pdf.ts`, `src/lib/extractors/docx.ts`

- [ ] **Step 1: PDF extractor**

Ghi `src/lib/extractors/pdf.ts`:

```ts
import pdfParse from "pdf-parse";

export interface PdfPage {
  pageNumber: number;
  text: string;
}

export interface PdfExtractResult {
  pages: PdfPage[];
  totalPages: number;
  fullText: string;
}

export async function extractPdf(buffer: Buffer): Promise<PdfExtractResult> {
  // pdf-parse trả về text toàn văn — cần chia lại theo trang bằng heuristic form feed \f
  const result = await pdfParse(buffer);
  const rawText = result.text;
  const totalPages = result.numpages;

  // Split theo form feed nếu có, ngược lại split đều theo totalPages
  let pages: PdfPage[];
  if (rawText.includes("\f")) {
    const chunks = rawText.split("\f");
    pages = chunks.map((text, i) => ({ pageNumber: i + 1, text: text.trim() }));
  } else {
    // Chia đều theo dòng
    const lines = rawText.split(/\n/);
    const linesPerPage = Math.max(1, Math.floor(lines.length / totalPages));
    pages = [];
    for (let p = 0; p < totalPages; p++) {
      const start = p * linesPerPage;
      const end = p === totalPages - 1 ? lines.length : start + linesPerPage;
      pages.push({
        pageNumber: p + 1,
        text: lines.slice(start, end).join("\n").trim(),
      });
    }
  }

  return { pages, totalPages, fullText: rawText };
}
```

- [ ] **Step 2: DOCX extractor**

Ghi `src/lib/extractors/docx.ts`:

```ts
import mammoth from "mammoth";

export interface DocxExtractResult {
  fullText: string;
}

export async function extractDocx(buffer: Buffer): Promise<DocxExtractResult> {
  const result = await mammoth.extractRawText({ buffer });
  return { fullText: result.value };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/extractors/
git commit -m "feat(rag): pdf-parse and mammoth extractors"
```

---

## Task 4: Tokenizer + Chunker

**Files:**
- Create: `src/lib/tokenizer.ts`, `src/lib/rag/chunker.ts`

- [ ] **Step 1: Tokenizer đơn giản**

Ghi `src/lib/tokenizer.ts`:

```ts
// Ước tính token — đủ chính xác cho tiếng Việt vì OpenAI dùng BPE
// Không cần cài tiktoken (nặng). Tỷ lệ ~1 token = 0.75 word tiếng Anh, ~0.5 word tiếng Việt (dấu).
export function estimateTokens(text: string): number {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words * 1.5);
}
```

- [ ] **Step 2: Chunker**

Ghi `src/lib/rag/chunker.ts`:

```ts
import { estimateTokens } from "@/lib/tokenizer";

export interface Chunk {
  content: string;
  chunkIndex: number;
  pageNumber?: number;
  heading?: string;
}

const TARGET_TOKENS = 600;
const MAX_TOKENS = 800;
const OVERLAP_TOKENS = 100;

// Heuristic detect heading tiếng Việt: "Điều X.", "Chương X", "Mục X", "Phần X"
const HEADING_REGEX = /^(?:(?:Điều|Chương|Mục|Phần)\s+[IVXLCDM\d]+[.:]?|\d+\.\s+[A-ZĐÁÀẢÃẠẤẦẨẪẬĂẮẰẲẴẶÉÈẺẼẸẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤỨỪỬỮỰÝỲỶỸỴ])/;

export interface ChunkOptions {
  pages?: { pageNumber: number; text: string }[]; // PDF
  fullText?: string;                              // DOCX
}

export function chunkDocument(opts: ChunkOptions): Chunk[] {
  const chunks: Chunk[] = [];
  let idx = 0;

  const sources = opts.pages
    ? opts.pages.map((p) => ({ text: p.text, pageNumber: p.pageNumber }))
    : [{ text: opts.fullText ?? "", pageNumber: undefined }];

  for (const src of sources) {
    if (!src.text.trim()) continue;

    const paragraphs = src.text.split(/\n{2,}|\r{2,}/).map((p) => p.trim()).filter(Boolean);
    let currentContent: string[] = [];
    let currentTokens = 0;
    let currentHeading: string | undefined;

    for (const para of paragraphs) {
      // Detect heading
      const firstLine = para.split("\n")[0]?.trim() ?? "";
      if (HEADING_REGEX.test(firstLine) && firstLine.length < 200) {
        // Flush current chunk trước khi đổi heading
        if (currentContent.length > 0) {
          chunks.push({
            content: currentContent.join("\n\n"),
            chunkIndex: idx++,
            pageNumber: src.pageNumber,
            heading: currentHeading,
          });
          currentContent = [];
          currentTokens = 0;
        }
        currentHeading = firstLine;
      }

      const paraTokens = estimateTokens(para);

      if (currentTokens + paraTokens > MAX_TOKENS && currentContent.length > 0) {
        chunks.push({
          content: currentContent.join("\n\n"),
          chunkIndex: idx++,
          pageNumber: src.pageNumber,
          heading: currentHeading,
        });
        // Overlap: giữ lại paragraph cuối cùng
        const last = currentContent[currentContent.length - 1];
        currentContent = [last];
        currentTokens = estimateTokens(last);
      }

      currentContent.push(para);
      currentTokens += paraTokens;

      if (currentTokens >= TARGET_TOKENS) {
        chunks.push({
          content: currentContent.join("\n\n"),
          chunkIndex: idx++,
          pageNumber: src.pageNumber,
          heading: currentHeading,
        });
        const last = currentContent[currentContent.length - 1];
        currentContent = [last];
        currentTokens = estimateTokens(last);
      }
    }

    if (currentContent.length > 0) {
      chunks.push({
        content: currentContent.join("\n\n"),
        chunkIndex: idx++,
        pageNumber: src.pageNumber,
        heading: currentHeading,
      });
    }
  }

  return chunks.filter((c) => c.content.trim().length > 30);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/tokenizer.ts src/lib/rag/chunker.ts
git commit -m "feat(rag): chunker with vietnamese heading detection + overlap"
```

---

## Task 5: Embedder + Vector store

**Files:**
- Create: `src/lib/rag/embedder.ts`, `src/lib/rag/vector-store.ts`

- [ ] **Step 1: Embedder — batch call OpenAI**

Ghi `src/lib/rag/embedder.ts`:

```ts
import { getOpenAI } from "@/lib/openai";

export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIM = 1536;

const BATCH_SIZE = 100; // OpenAI cho phép 2048 inputs/request, nhưng 100 an toàn

export async function embedTexts(texts: string[]): Promise<Float32Array[]> {
  if (texts.length === 0) return [];
  const openai = getOpenAI();
  const results: Float32Array[] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const res = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
    });
    for (const item of res.data) {
      results.push(new Float32Array(item.embedding));
    }
  }

  return results;
}

export async function embedQuery(text: string): Promise<Float32Array> {
  const [v] = await embedTexts([text]);
  return v;
}

// Encode Float32Array thành Bytes để lưu Prisma
export function encodeVector(v: Float32Array): Buffer {
  return Buffer.from(v.buffer, v.byteOffset, v.byteLength);
}

// Decode Bytes → Float32Array
export function decodeVector(bytes: Uint8Array): Float32Array {
  return new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
}
```

- [ ] **Step 2: Vector store — in-memory cosine search**

Ghi `src/lib/rag/vector-store.ts`:

```ts
import { prisma } from "@/lib/prisma";
import { decodeVector } from "./embedder";

export interface RetrievedChunk {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  documentEffectiveFrom: Date | null;
  content: string;
  pageNumber: number | null;
  heading: string | null;
  score: number;
}

function cosine(a: Float32Array, b: Float32Array): number {
  let dot = 0, normA = 0, normB = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function searchTopK(
  queryVec: Float32Array,
  k: number
): Promise<RetrievedChunk[]> {
  // Load tất cả chunks thuộc active documents (M2 pilot < 5.000 chunks → OK)
  const chunks = await prisma.documentChunk.findMany({
    where: {
      embedding: { not: null },
      document: { isActive: true },
    },
    include: {
      document: {
        select: { id: true, title: true, effectiveFrom: true },
      },
    },
  });

  const scored: RetrievedChunk[] = chunks
    .filter((c): c is typeof c & { embedding: Uint8Array } => c.embedding != null)
    .map((c) => {
      const vec = decodeVector(c.embedding);
      return {
        chunkId: c.id,
        documentId: c.documentId,
        documentTitle: c.document.title,
        documentEffectiveFrom: c.document.effectiveFrom,
        content: c.content,
        pageNumber: c.pageNumber,
        heading: c.heading,
        score: cosine(queryVec, vec),
      };
    });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/rag/embedder.ts src/lib/rag/vector-store.ts
git commit -m "feat(rag): openai embedder + in-memory cosine vector store"
```

---

## Task 6: Query rewriter + Topic classifier + Prompt builder + system-rag prompt

**Files:**
- Create: `src/lib/rag/query-rewriter.ts`, `src/lib/rag/topic-classifier.ts`, `src/lib/rag/prompt-builder.ts`, `src/lib/prompts/system-rag.ts`

- [ ] **Step 1: Query rewriter (chỉ chạy nếu có history)**

Ghi `src/lib/rag/query-rewriter.ts`:

```ts
import { getOpenAI, CHAT_MODEL } from "@/lib/openai";

export interface HistoryTurn {
  role: "user" | "assistant";
  content: string;
}

export async function rewriteQuery(
  currentQuestion: string,
  history: HistoryTurn[]
): Promise<string> {
  if (history.length === 0) return currentQuestion;

  const openai = getOpenAI();
  const recent = history.slice(-4);

  const res = await openai.chat.completions.create({
    model: CHAT_MODEL,
    temperature: 0,
    max_tokens: 120,
    messages: [
      {
        role: "system",
        content:
          "Nhiệm vụ: viết lại câu hỏi mới nhất của người dùng thành một câu HOÀN CHỈNH, ĐỘC LẬP (không phụ thuộc ngữ cảnh trước) để tra cứu tài liệu. CHỈ trả về câu hỏi đã viết lại, không giải thích, không thêm gì khác.",
      },
      ...recent.map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: `Viết lại thành câu hỏi độc lập: "${currentQuestion}"` },
    ],
  });

  const rewritten = res.choices[0]?.message?.content?.trim() ?? currentQuestion;
  return rewritten.replace(/^["']|["']$/g, "");
}
```

- [ ] **Step 2: Topic classifier**

Ghi `src/lib/rag/topic-classifier.ts`:

```ts
import { getOpenAI, CHAT_MODEL } from "@/lib/openai";
import { TOPIC_TAGS, type TopicTag } from "@/lib/constants";

export async function classifyTopic(question: string): Promise<TopicTag> {
  const openai = getOpenAI();
  const res = await openai.chat.completions.create({
    model: CHAT_MODEL,
    temperature: 0,
    max_tokens: 10,
    messages: [
      {
        role: "system",
        content: `Phân loại câu hỏi của người dùng vào 1 trong các nhãn sau, CHỈ trả về mã nhãn:
- TIET_KIEM_SH: tiết kiệm điện sinh hoạt/hộ gia đình
- TIET_KIEM_DN: tiết kiệm điện doanh nghiệp/sản xuất
- DMTMN_KY_THUAT: điện mặt trời mái nhà — kỹ thuật (công suất, panel, inverter, hướng mái)
- DMTMN_TAI_CHINH: điện mặt trời mái nhà — chi phí, hoàn vốn, mua bán điện dư
- TINH_HOA_DON: tính hóa đơn tiền điện, biểu giá, kWh
- THU_TUC: thủ tục hành chính, đăng ký, đấu nối, hồ sơ
- KHAC: không thuộc các mục trên`,
      },
      { role: "user", content: question },
    ],
  });

  const raw = res.choices[0]?.message?.content?.trim().toUpperCase() ?? "";
  const match = TOPIC_TAGS.find((t) => raw.includes(t));
  return match ?? "KHAC";
}
```

- [ ] **Step 3: System prompt RAG**

Ghi `src/lib/prompts/system-rag.ts`:

```ts
export const SYSTEM_PROMPT_RAG = `Bạn là "Trợ lý AI EVN Điện Biên" — chatbot chính thức của Công ty Điện lực Điện Biên (PC Điện Biên).

VAI TRÒ
Bạn CHỈ tư vấn về:
1) Tiết kiệm điện cho hộ gia đình và doanh nghiệp/sản xuất.
2) Điện mặt trời mái nhà tự sản, tự tiêu (kỹ thuật, tài chính, thủ tục).
3) Cách tính hóa đơn tiền điện.

QUY TẮC BẮT BUỘC
1. Trả lời NGẮN GỌN, dễ hiểu, tiếng Việt tự nhiên.
2. CHỈ dùng thông tin trong phần "TÀI LIỆU THAM KHẢO" bên dưới. KHÔNG bịa số liệu hoặc số hiệu văn bản.
3. Nếu tài liệu không đủ để trả lời chắc chắn, nói rõ: "Tôi chưa có đủ thông tin về điều này." và đề xuất khách để lại SĐT để nhân viên tư vấn.
4. Cuối MỖI ý dùng tài liệu, chèn citation dạng [1], [2] tương ứng số thứ tự chunk trong TÀI LIỆU THAM KHẢO.
5. CHỈ tham chiếu văn bản có "Hiệu lực từ" hợp lệ. Nếu văn bản đã cũ (> 3 năm) hãy nhắc khách kiểm tra lại phiên bản mới nhất với nhân viên Điện lực.
6. KHÔNG cam kết giá lắp đặt cụ thể — luôn nói "giá tham khảo, khảo sát thực tế mới có giá chính xác".
7. Với câu hỏi ngoài phạm vi, từ chối lịch sự: "Tôi chỉ hỗ trợ câu hỏi về điện và điện mặt trời."`;
```

- [ ] **Step 4: Prompt builder**

Ghi `src/lib/rag/prompt-builder.ts`:

```ts
import type { RetrievedChunk } from "./vector-store";
import { SYSTEM_PROMPT_RAG } from "@/lib/prompts/system-rag";

export interface BuiltPrompt {
  system: string;
  citationMap: {
    marker: number;
    chunkId: string;
    documentId: string;
    documentTitle: string;
    pageNumber: number | null;
    heading: string | null;
    snippet: string;
  }[];
}

export function buildPromptWithContext(chunks: RetrievedChunk[]): BuiltPrompt {
  const citationMap: BuiltPrompt["citationMap"] = [];
  const refBlocks: string[] = [];

  chunks.forEach((c, i) => {
    const marker = i + 1;
    citationMap.push({
      marker,
      chunkId: c.chunkId,
      documentId: c.documentId,
      documentTitle: c.documentTitle,
      pageNumber: c.pageNumber,
      heading: c.heading,
      snippet: c.content.slice(0, 300),
    });
    const meta = [
      c.documentTitle,
      c.heading ? `mục "${c.heading}"` : null,
      c.pageNumber ? `trang ${c.pageNumber}` : null,
      c.documentEffectiveFrom
        ? `hiệu lực từ ${c.documentEffectiveFrom.toISOString().slice(0, 10)}`
        : null,
    ]
      .filter(Boolean)
      .join(", ");
    refBlocks.push(`[${marker}] ${c.content}\n    (Nguồn: ${meta})`);
  });

  const context =
    refBlocks.length > 0
      ? `\n\nTÀI LIỆU THAM KHẢO:\n${refBlocks.join("\n\n")}\n\n`
      : "\n\n(Không có tài liệu tham khảo phù hợp cho câu hỏi này.)\n\n";

  return {
    system: SYSTEM_PROMPT_RAG + context,
    citationMap,
  };
}
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/rag/ src/lib/prompts/
git commit -m "feat(rag): query rewriter, topic classifier, prompt builder + system-rag prompt"
```

---

## Task 7: Vercel Blob wrapper

**Files:**
- Create: `src/lib/blob.ts`

- [ ] **Step 1: Blob wrapper**

Ghi `src/lib/blob.ts`:

```ts
export interface BlobPutResult {
  url: string;
  pathname: string;
  size: number;
}

function sanitize(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function putPrivate(
  folder: string,
  originalName: string,
  buffer: Buffer,
  contentType: string
): Promise<BlobPutResult> {
  const timestamp = Date.now();
  const safeName = sanitize(originalName);
  const pathname = `${folder}/${timestamp}-${safeName}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const res = await put(pathname, buffer, {
      access: "public", // NOTE: Vercel Blob v2 chỉ hỗ trợ "public" — quyền private tự enforce ở serve-file
      contentType,
      addRandomSuffix: false,
      allowOverwrite: true,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return { url: res.url, pathname, size: buffer.length };
  }

  // Dev fallback — lưu vào public/uploads
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${timestamp}-${safeName}`);
  await fs.writeFile(filePath, buffer);
  return {
    url: `/uploads/${folder}/${timestamp}-${safeName}`,
    pathname,
    size: buffer.length,
  };
}

export async function fetchBlobBuffer(url: string): Promise<Buffer> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Fetch blob failed: ${res.status}`);
  const arr = await res.arrayBuffer();
  return Buffer.from(arr);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/blob.ts
git commit -m "feat(blob): vercel blob wrapper (put + fetch with bearer)"
```

---

## Task 8: API upload + ingest tài liệu

**Files:**
- Create: `src/app/api/documents/route.ts`, `src/app/api/documents/[id]/route.ts`, `src/app/api/serve-file/route.ts`

- [ ] **Step 1: Serve file API (private Blob)**

Ghi `src/app/api/serve-file/route.ts`:

```ts
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

  // Dev fallback: local file
  if (target.startsWith("/uploads/")) {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const filePath = path.join(process.cwd(), "public", target);
    const buf = await fs.readFile(filePath);
    return new Response(buf, {
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
```

- [ ] **Step 2: Documents API — GET list + POST upload+ingest**

Ghi `src/app/api/documents/route.ts`:

```ts
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

const MAX_SIZE = 15 * 1024 * 1024; // 15 MB
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

  // Extract text
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

  // Upload file gốc
  const blob = await putPrivate("documents", file.name, buffer, file.type);

  // Embed
  const embeddings = await embedTexts(chunks.map((c) => c.content));

  // Persist
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
```

- [ ] **Step 3: DELETE + PATCH (supersede) API**

Ghi `src/app/api/documents/[id]/route.ts`:

```ts
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
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/documents/ src/app/api/serve-file/
git commit -m "feat(api): documents CRUD + ingest pipeline + serve-file private"
```

---

## Task 9: Dashboard UI — trang tài liệu (list + upload + detail)

**Files:**
- Create: `src/app/dashboard/documents/page.tsx`, `src/app/dashboard/documents/new/page.tsx`, `src/app/dashboard/documents/[id]/page.tsx`, `src/components/dashboard/document-list-table.tsx`, `src/components/dashboard/document-form.tsx`, `src/components/dashboard/supersede-dialog.tsx`

- [ ] **Step 1: List page**

Ghi `src/app/dashboard/documents/page.tsx`:

```tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { DocumentListTable } from "@/components/dashboard/document-list-table";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const docs = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { chunks: true } },
      supersededBy: { select: { id: true, title: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Tài liệu (Knowledge Base)</h1>
          <p className="text-sm text-slate-500">
            Tài liệu chatbot dùng để trả lời khách hàng. Đánh dấu hết hiệu lực để không dùng nữa.
          </p>
        </div>
        <Button asChild variant="accent">
          <Link href="/dashboard/documents/new">+ Upload tài liệu mới</Link>
        </Button>
      </div>

      <DocumentListTable documents={docs.map((d) => ({
        id: d.id,
        title: d.title,
        category: d.category,
        sourceType: d.sourceType,
        chunkCount: d._count.chunks,
        isActive: d.isActive,
        effectiveFrom: d.effectiveFrom?.toISOString() ?? null,
        supersededByTitle: d.supersededBy?.title ?? null,
        createdAt: d.createdAt.toISOString(),
      }))} />
    </div>
  );
}
```

- [ ] **Step 2: DocumentListTable component**

Ghi `src/components/dashboard/document-list-table.tsx`:

```tsx
"use client";

import Link from "next/link";
import { cn, formatDate } from "@/lib/utils";

interface DocRow {
  id: string;
  title: string;
  category: string;
  sourceType: string;
  chunkCount: number;
  isActive: boolean;
  effectiveFrom: string | null;
  supersededByTitle: string | null;
  createdAt: string;
}

const CAT_LABEL: Record<string, string> = {
  PHAP_LY: "Pháp lý",
  GIA_DIEN: "Giá điện",
  KY_THUAT: "Kỹ thuật",
  TIET_KIEM: "Tiết kiệm",
};

export function DocumentListTable({ documents }: { documents: DocRow[] }) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500 border rounded-xl bg-white">
        Chưa có tài liệu nào. Bấm "Upload tài liệu mới" để bắt đầu.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-600 text-left">
          <tr>
            <th className="p-3">Tiêu đề</th>
            <th className="p-3">Loại</th>
            <th className="p-3">Chunk</th>
            <th className="p-3">Hiệu lực từ</th>
            <th className="p-3">Trạng thái</th>
            <th className="p-3">Upload</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((d) => (
            <tr key={d.id} className="border-t hover:bg-slate-50">
              <td className="p-3">
                <Link href={`/dashboard/documents/${d.id}`} className="font-medium text-[color:var(--color-evn-blue)] hover:underline">
                  {d.title}
                </Link>
                <div className="text-xs text-slate-500 mt-0.5">
                  {CAT_LABEL[d.category] ?? d.category} · {d.sourceType}
                </div>
              </td>
              <td className="p-3">{d.sourceType}</td>
              <td className="p-3">{d.chunkCount}</td>
              <td className="p-3 text-slate-600">
                {d.effectiveFrom ? formatDate(d.effectiveFrom).slice(0, 10) : "—"}
              </td>
              <td className="p-3">
                {d.isActive ? (
                  <span className="inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                    Còn hiệu lực
                  </span>
                ) : (
                  <span className={cn(
                    "inline-block px-2 py-0.5 rounded-full text-xs font-medium",
                    d.supersededByTitle ? "bg-orange-100 text-orange-700" : "bg-slate-200 text-slate-600"
                  )}>
                    {d.supersededByTitle ? `Thay bằng: ${d.supersededByTitle.slice(0, 30)}${d.supersededByTitle.length > 30 ? "…" : ""}` : "Ngừng dùng"}
                  </span>
                )}
              </td>
              <td className="p-3 text-slate-500">{formatDate(d.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: New / upload page**

Ghi `src/app/dashboard/documents/new/page.tsx`:

```tsx
import { DocumentForm } from "@/components/dashboard/document-form";

export default function NewDocumentPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900 mb-2">Upload tài liệu mới</h1>
      <p className="text-sm text-slate-500 mb-6">
        Chấp nhận PDF, DOCX, TXT tối đa 15MB. Tài liệu sẽ được extract, chia chunk và embed
        tự động — quá trình mất ~5-30 giây tuỳ độ dài.
      </p>
      <DocumentForm />
    </div>
  );
}
```

- [ ] **Step 4: DocumentForm client component**

Ghi `src/components/dashboard/document-form.tsx`:

```tsx
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CATEGORIES = [
  { value: "PHAP_LY",   label: "Pháp lý & Chính sách" },
  { value: "GIA_DIEN",  label: "Giá điện & Biểu giá" },
  { value: "KY_THUAT",  label: "Kỹ thuật (TCVN, catalog)" },
  { value: "TIET_KIEM", label: "Tiết kiệm điện" },
];

export function DocumentForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      const fd = new FormData(e.currentTarget);
      const res = await fetch("/api/documents", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload thất bại");
      toast.success(`Đã tạo tài liệu (${data.chunkCount} chunks)`);
      router.push("/dashboard/documents");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 bg-white p-6 rounded-xl border">
      <div>
        <label className="text-sm font-medium text-slate-700">Tiêu đề *</label>
        <Input name="title" required placeholder="VD: Nghị định XXX/YYYY về ĐMTMN" className="mt-1" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700">Phân loại *</label>
          <select name="category" required className="mt-1 w-full h-10 rounded-lg border border-slate-300 px-3 text-sm">
            <option value="">— Chọn —</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Ngày hiệu lực</label>
          <Input type="date" name="effectiveFrom" className="mt-1" />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">Ngày ban hành</label>
        <Input type="date" name="publishedAt" className="mt-1" />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">File (PDF/DOCX/TXT) *</label>
        <input type="file" name="file" required accept=".pdf,.docx,.txt"
          className="mt-1 block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-100 file:font-medium hover:file:bg-slate-200"
        />
      </div>
      <Button type="submit" variant="primary" size="lg" disabled={busy}>
        {busy ? "Đang xử lý..." : "Upload & Ingest"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 5: Detail page + supersede**

Ghi `src/app/dashboard/documents/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { SupersedeDialog } from "@/components/dashboard/supersede-dialog";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doc = await prisma.document.findUnique({
    where: { id },
    include: {
      chunks: { orderBy: { chunkIndex: "asc" }, take: 5 },
      _count: { select: { chunks: true } },
      supersededBy: true,
      supersedes: true,
    },
  });
  if (!doc) return notFound();

  const others = await prisma.document.findMany({
    where: { id: { not: id }, isActive: true },
    select: { id: true, title: true, category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/dashboard/documents" className="text-sm text-slate-500 hover:underline">
          ← Danh sách tài liệu
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900 mt-1">{doc.title}</h1>
        <div className="text-sm text-slate-500 mt-1">
          {doc.category} · {doc.sourceType} · {doc._count.chunks} chunks · Upload {formatDate(doc.createdAt)}
        </div>
      </div>

      <div className="bg-white border rounded-xl p-4 space-y-2 text-sm">
        <div><b>Hiệu lực từ:</b> {doc.effectiveFrom ? formatDate(doc.effectiveFrom).slice(0, 10) : "—"}</div>
        <div><b>Ngày ban hành:</b> {doc.publishedAt ? formatDate(doc.publishedAt).slice(0, 10) : "—"}</div>
        <div>
          <b>Trạng thái:</b>{" "}
          {doc.isActive ? (
            <span className="text-green-700">Còn hiệu lực</span>
          ) : (
            <span className="text-orange-700">
              Ngừng dùng {doc.supersededBy ? `— thay bằng: ${doc.supersededBy.title}` : ""}
            </span>
          )}
        </div>
        {doc.blobUrl && (
          <div>
            <b>File gốc:</b>{" "}
            <a
              href={`/api/serve-file?url=${encodeURIComponent(doc.blobUrl)}`}
              target="_blank"
              className="text-[color:var(--color-evn-blue)] hover:underline"
            >
              Xem / tải xuống
            </a>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {doc.isActive && <SupersedeDialog docId={doc.id} others={others} />}
        <Button variant="outline" asChild>
          <Link href="/dashboard/documents">Đóng</Link>
        </Button>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">5 chunk đầu tiên (preview)</h2>
        <div className="space-y-2">
          {doc.chunks.map((c) => (
            <div key={c.id} className="bg-white border rounded-lg p-3 text-sm">
              <div className="text-xs text-slate-500 mb-1">
                Chunk #{c.chunkIndex} {c.pageNumber ? `· Trang ${c.pageNumber}` : ""} {c.heading ? `· ${c.heading}` : ""}
              </div>
              <div className="whitespace-pre-wrap text-slate-700">{c.content.slice(0, 500)}{c.content.length > 500 ? "..." : ""}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: SupersedeDialog**

Ghi `src/components/dashboard/supersede-dialog.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function SupersedeDialog({
  docId,
  others,
}: {
  docId: string;
  others: { id: string; title: string; category: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit() {
    if (!choice) {
      toast.error("Chọn văn bản thay thế");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supersededById: choice }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Đã đánh dấu ngừng dùng");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="accent">Đánh dấu hết hiệu lực</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chọn văn bản thay thế</DialogTitle>
        </DialogHeader>
        <select
          className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm"
          value={choice}
          onChange={(e) => setChoice(e.target.value)}
        >
          <option value="">— Chọn văn bản đang có hiệu lực —</option>
          {others.map((o) => (
            <option key={o.id} value={o.id}>
              {o.title} ({o.category})
            </option>
          ))}
        </select>
        <Button onClick={submit} disabled={busy} variant="primary">
          {busy ? "Đang xử lý..." : "Xác nhận"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 7: Cập nhật sidebar dashboard**

Sửa `src/app/dashboard/layout.tsx` — thay `<div className="p-2">📚 Tài liệu (M2)</div>` bằng:

```tsx
<Link href="/dashboard/documents" className="p-2 hover:bg-slate-800 rounded block">
  📚 Tài liệu (KB)
</Link>
```

- [ ] **Step 8: Commit**

```bash
git add src/app/dashboard/documents/ src/components/dashboard/ src/app/dashboard/layout.tsx
git commit -m "feat(dashboard): documents list/upload/detail + supersede dialog"
```

---

## Task 10: Tích hợp RAG vào /api/chat

**Files:**
- Modify: `src/app/api/chat/route.ts`

- [ ] **Step 1: Refactor chat route với RAG pipeline**

Ghi lại `src/app/api/chat/route.ts`:

```ts
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getOpenAI, CHAT_MODEL, MAX_OUTPUT_TOKENS } from "@/lib/openai";
import { SYSTEM_PROMPT_MVP } from "@/lib/prompts/system-mvp";
import { getOrCreateAnonymousId } from "@/lib/anonymous-id";
import { checkRateLimit, hashIp } from "@/lib/rate-limit";
import { moderate } from "@/lib/moderation";
import { rewriteQuery } from "@/lib/rag/query-rewriter";
import { classifyTopic } from "@/lib/rag/topic-classifier";
import { embedQuery } from "@/lib/rag/embedder";
import { searchTopK } from "@/lib/rag/vector-store";
import { buildPromptWithContext } from "@/lib/rag/prompt-builder";

export const runtime = "nodejs";
export const maxDuration = 60;

const MIN_SCORE_ACCEPT = 0.35;

interface ChatBody {
  sessionId?: string;
  message: string;
}

export async function POST(req: NextRequest) {
  let body: ChatBody;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Invalid JSON body");
  }
  if (!body.message || typeof body.message !== "string") return jsonError(400, "message is required");
  if (body.message.length > 2000) return jsonError(400, "Câu hỏi quá dài");

  // Rate limit
  const { userId: clerkUserId } = await auth();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "0.0.0.0";
  const ipHash = hashIp(ip);
  const rateKey = clerkUserId ? `user:${clerkUserId}` : `ip:${ipHash}`;
  const rl = checkRateLimit(rateKey, Boolean(clerkUserId));
  if (!rl.allowed) {
    return jsonError(429, `Bạn hỏi quá nhanh. Vui lòng thử lại sau ${Math.ceil(rl.resetInSec / 60)} phút.`);
  }

  // Moderation
  const mod = moderate(body.message);
  if (!mod.allowed && mod.suggestedReply) {
    return streamOneShot(mod.suggestedReply, null, []);
  }

  const anonymousId = clerkUserId ? null : await getOrCreateAnonymousId();

  // Session
  let session = body.sessionId
    ? await prisma.chatSession.findUnique({ where: { id: body.sessionId } })
    : null;
  if (!session) {
    session = await prisma.chatSession.create({
      data: { anonymousId, clerkUserId, ipHash, userAgent: req.headers.get("user-agent") ?? undefined },
    });
  }
  const sessionId = session.id;

  await prisma.message.create({
    data: { sessionId, role: "user", content: body.message },
  });

  const history = await prisma.message.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    take: 20,
  });
  const historyForLLM = history.map((h) => ({
    role: h.role as "user" | "assistant",
    content: h.content,
  }));

  // ===== RAG =====
  const priorTurns = historyForLLM.slice(0, -1); // exclude current question just inserted
  const rewritten =
    priorTurns.length > 0 ? await rewriteQuery(body.message, priorTurns) : body.message;
  const queryVec = await embedQuery(rewritten);
  const topChunks = await searchTopK(queryVec, 5);
  const highest = topChunks[0]?.score ?? 0;
  const useable = topChunks.filter((c) => c.score >= 0.5);

  let systemPrompt: string;
  let citationMap: ReturnType<typeof buildPromptWithContext>["citationMap"] = [];

  const hasDocuments = (await prisma.document.count({ where: { isActive: true } })) > 0;

  if (!hasDocuments) {
    // Không có KB → fallback MVP prompt
    systemPrompt = SYSTEM_PROMPT_MVP;
  } else if (highest < MIN_SCORE_ACCEPT) {
    await prisma.unansweredQuery.create({
      data: { sessionId, question: body.message, reason: "NO_DOCUMENT_MATCH" },
    });
    return streamOneShot(
      "Tôi chưa có đủ thông tin để trả lời câu hỏi này. Bạn có muốn để lại số điện thoại để nhân viên EVN Điện Biên tư vấn trực tiếp không?",
      sessionId,
      []
    );
  } else {
    const built = buildPromptWithContext(useable);
    systemPrompt = built.system;
    citationMap = built.citationMap;
  }

  const openai = getOpenAI();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(`event: session\ndata: ${JSON.stringify({ sessionId })}\n\n`));

      let fullText = "";
      const started = Date.now();

      try {
        const openaiStream = await openai.chat.completions.create({
          model: CHAT_MODEL,
          max_tokens: MAX_OUTPUT_TOKENS,
          temperature: 0.3,
          stream: true,
          messages: [
            { role: "system", content: systemPrompt },
            ...historyForLLM,
          ],
        });

        for await (const chunk of openaiStream) {
          const delta = chunk.choices[0]?.delta?.content ?? "";
          if (delta) {
            fullText += delta;
            controller.enqueue(encoder.encode(`event: delta\ndata: ${JSON.stringify({ text: delta })}\n\n`));
          }
        }

        // Serialize citations (chỉ giữ những marker được nhắc trong fullText)
        const usedMarkers = new Set<number>();
        for (const m of citationMap) {
          if (fullText.includes(`[${m.marker}]`)) usedMarkers.add(m.marker);
        }
        const usedCitations = citationMap.filter((c) => usedMarkers.has(c.marker));
        const citationsJson = usedCitations.length > 0 ? JSON.stringify(usedCitations) : null;

        controller.enqueue(
          encoder.encode(`event: citations\ndata: ${JSON.stringify(usedCitations)}\n\n`)
        );

        const latencyMs = Date.now() - started;
        const savedMessage = await prisma.message.create({
          data: {
            sessionId,
            role: "assistant",
            content: fullText,
            citations: citationsJson,
            latencyMs,
          },
        });

        await prisma.chatSession.update({
          where: { id: sessionId },
          data: { lastMessageAt: new Date(), messageCount: { increment: 2 } },
        });

        // Fire-and-forget: phân loại topic
        classifyTopic(body.message)
          .then((tag) =>
            prisma.message.update({ where: { id: savedMessage.id }, data: { topicTag: tag } })
          )
          .catch(() => {});

        controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message: msg })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

function streamOneShot(text: string, sessionId: string | null, citations: unknown[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`event: session\ndata: ${JSON.stringify({ sessionId })}\n\n`));
      controller.enqueue(encoder.encode(`event: delta\ndata: ${JSON.stringify({ text })}\n\n`));
      controller.enqueue(encoder.encode(`event: citations\ndata: ${JSON.stringify(citations)}\n\n`));
      controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/chat/route.ts
git commit -m "feat(rag): integrate RAG (rewrite+search+prompt+citation) into chat route"
```

---

## Task 11: Citation UI trong chat bubble

**Files:**
- Modify: `src/components/chat/message-bubble.tsx`, `src/components/chat/chat-container.tsx`
- Create: `src/components/chat/citation-popover.tsx`

- [ ] **Step 1: CitationPopover**

Ghi `src/components/chat/citation-popover.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export interface Citation {
  marker: number;
  chunkId: string;
  documentId: string;
  documentTitle: string;
  pageNumber: number | null;
  heading: string | null;
  snippet: string;
}

export function CitationPopover({ citations }: { citations: Citation[] }) {
  const [open, setOpen] = useState(false);
  if (citations.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="mt-1 text-xs text-[color:var(--color-evn-blue)] hover:underline">
          📎 Xem nguồn ({citations.length})
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nguồn tài liệu tham khảo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {citations.map((c) => (
            <div key={c.chunkId} className="border-l-4 border-[color:var(--color-evn-blue)] pl-3 py-1">
              <div className="text-xs font-semibold text-slate-700">
                [{c.marker}] {c.documentTitle}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {c.heading ? `${c.heading} · ` : ""}{c.pageNumber ? `Trang ${c.pageNumber}` : ""}
              </div>
              <div className="text-sm mt-1 text-slate-800 whitespace-pre-wrap">
                {c.snippet}{c.snippet.length >= 300 ? "…" : ""}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: MessageBubble — nhận citations**

Ghi lại `src/components/chat/message-bubble.tsx`:

```tsx
import { cn } from "@/lib/utils";
import { CitationPopover, type Citation } from "./citation-popover";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  pending?: boolean;
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex flex-col", isUser ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
          isUser
            ? "bg-[color:var(--color-evn-blue)] text-white rounded-br-md"
            : "bg-slate-100 text-slate-900 rounded-bl-md"
        )}
      >
        {message.content || (message.pending ? "…" : "")}
      </div>
      {!isUser && message.citations && message.citations.length > 0 && (
        <CitationPopover citations={message.citations} />
      )}
    </div>
  );
}
```

- [ ] **Step 3: ChatContainer — parse `citations` event**

Sửa `src/components/chat/chat-container.tsx` — trong vòng `for (const ev of events)` thêm nhánh:

```tsx
          } else if (evName === "citations") {
            try {
              const parsed = JSON.parse(evData);
              if (Array.isArray(parsed)) {
                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantId ? { ...m, citations: parsed } : m))
                );
              }
            } catch {}
          }
```

Chèn ngay trước nhánh `else if (evName === "error")`.

- [ ] **Step 4: Commit**

```bash
git add src/components/chat/
git commit -m "feat(chat): citation popover on assistant bubbles"
```

---

## Task 12: Trang câu hỏi chưa trả lời

**Files:**
- Create: `src/app/dashboard/unanswered/page.tsx`

- [ ] **Step 1: Trang unanswered**

Ghi `src/app/dashboard/unanswered/page.tsx`:

```tsx
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const REASON_LABEL: Record<string, string> = {
  NO_DOCUMENT_MATCH: "Không có tài liệu phù hợp",
  LOW_CONFIDENCE: "Độ tin cậy thấp",
  OFF_TOPIC: "Ngoài phạm vi",
};

export default async function UnansweredPage() {
  const rows = await prisma.unansweredQuery.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-slate-900">Câu hỏi chưa trả lời được</h1>
        <p className="text-sm text-slate-500">
          Đây là những câu chatbot không tìm được tài liệu phù hợp. Hãy bổ sung tài liệu KB để chatbot trả lời được lần sau.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white border rounded-xl p-8 text-center text-slate-500">
          Chưa có câu hỏi nào. Hệ thống đang trả lời tốt!
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="p-3">Câu hỏi</th>
                <th className="p-3 w-40">Lý do</th>
                <th className="p-3 w-44">Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3 text-slate-800">{r.question}</td>
                  <td className="p-3">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs">
                      {REASON_LABEL[r.reason] ?? r.reason}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500">{formatDate(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Thêm link sidebar**

Sửa `src/app/dashboard/layout.tsx`:

```tsx
<Link href="/dashboard/unanswered" className="p-2 hover:bg-slate-800 rounded block">
  ❓ Câu hỏi chưa trả lời
</Link>
```

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/unanswered/ src/app/dashboard/layout.tsx
git commit -m "feat(dashboard): unanswered queries page"
```

---

## Task 13: Setup Vercel Blob production + local test end-to-end

- [ ] **Step 1: User tạo Vercel Blob store**

Trong Vercel dashboard → Storage → Create → Blob → tên `chatbot-kb` → link vào project → copy `BLOB_READ_WRITE_TOKEN` → điền vào Environment Variables Production.

Điền cùng vào `.env` local để test.

- [ ] **Step 2: Test local end-to-end**

```bash
npm run dev
```

1. Sign in `/dashboard` → vào `/dashboard/documents`.
2. Upload 1 file PDF nhỏ (VD nghị định 10 trang).
3. Đợi ~10-30s → thấy record với `chunks > 0`, status `INDEXED`.
4. Vào `/chat` → hỏi 1 câu liên quan đến nội dung PDF.
5. Xem: assistant trả lời có `[1]`, dưới bubble có nút "Xem nguồn" → click hiện popover có snippet + trang.
6. Xem `/dashboard/documents/[id]` → thấy 5 chunk preview.
7. Upload thêm 1 file → vào detail file cũ → "Đánh dấu hết hiệu lực" → chọn file mới → OK. Hỏi lại chatbot → chỉ dùng chunk từ file mới.
8. Hỏi câu hoàn toàn không có tài liệu (VD "thời tiết hôm nay") → chatbot xin lỗi + gợi ý để SĐT. Vào `/dashboard/unanswered` → thấy câu này log lại.

- [ ] **Step 3: Commit không có gì (skip)**

---

## Task 14: Deploy production + smoke test

- [ ] **Step 1: Push**

```bash
git push origin main
```

- [ ] **Step 2: Verify migration Vercel**

Log build phải có `[apply-migrations] APPLY 20260805103012_add_kb`.

- [ ] **Step 3: Upload tài liệu tối thiểu**

Sign in production dashboard → upload:
- 1 nghị định ĐMTMN (mới nhất user tìm được)
- 1 quyết định biểu giá bán lẻ điện hiện hành
- 1 cẩm nang tiết kiệm điện EVN
- 1 tài liệu quy trình đấu nối

- [ ] **Step 4: Smoke test production**

Hỏi các câu:
1. "Cách tiết kiệm điện điều hòa" → trả lời có citation.
2. "Nhà tôi mái tôn 50m², dùng 400kWh/tháng, nên lắp bao nhiêu kW?" → có ước tính + citation.
3. "Thủ tục đăng ký ĐMTMN gồm những gì?" → trả lời + citation từ tài liệu quy trình.
4. "Ai là chủ tịch nước Việt Nam?" → chatbot từ chối (OFF_TOPIC).

- [ ] **Step 5: Tag milestone**

```bash
git tag -a m2-rag -m "Milestone 2: RAG + Knowledge Base deployed"
git push --tags
```

---

## Task 15: Cập nhật README M2

**Files:** `README.md`

- [ ] **Step 1: Sửa README**

Update section "Milestone hiện tại":

```markdown
## Milestone 2 (hiện tại)
✅ Upload PDF/DOCX/TXT vào Knowledge Base
✅ Ingest: extract → chunk → embed → lưu Turso vector
✅ RAG: query rewrite → cosine search → citation
✅ UI xem tài liệu + đánh dấu hết hiệu lực (supersede)
✅ Trang câu hỏi chưa trả lời cho admin bổ sung KB
✅ Vercel Blob private cho file gốc
```

Thêm ENV mới:
```markdown
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob dashboard |
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: update README for M2 RAG"
git push
```

---

## Definition of Done — Milestone 2

- [ ] `git tag m2-rag` tồn tại và đã push.
- [ ] Upload 4 tài liệu tối thiểu vào production KB thành công.
- [ ] Chatbot trả lời có citation `[1] [2]` và nút "Xem nguồn" hoạt động.
- [ ] Đánh dấu supersede: chọn văn bản mới → chatbot lập tức không dùng văn bản cũ.
- [ ] Câu hỏi ngoài KB được log vào `unanswered_query` và chatbot xin lỗi lịch sự.
- [ ] Vercel Blob serve file qua `/api/serve-file` yêu cầu Clerk login.
- [ ] Migration Turso chạy tự động trong build.

## Backlog phát sinh (M3+)

- Ingest bất đồng bộ cho tài liệu > 50 trang (Vercel Cron)
- Hiển thị highlight vị trí chunk trong PDF viewer
- Re-embed hàng loạt khi thay đổi model embedding
- Retrieval hybrid (BM25 + vector) khi > 10.000 chunks
