# Semantic Cache MVP — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm lớp semantic cache trước LLM call trong `/api/chat` — auto-cache câu trả lời của LLM theo embedding của câu đã rewrite, hit khi cosine ≥ 0.95, invalidate khi user 👎.

**Architecture:** Thêm 1 Prisma model `SemanticCache` (sqlite/Turso), 1 module `src/lib/rag/cache-store.ts` cho CRUD + cosine search, chèn 2 bước (check-before-LLM, write-after-stream) vào `src/app/api/chat/route.ts`, 1 dòng invalidate trong `src/app/api/chat/feedback/route.ts`.

**Tech Stack:** Prisma 7 + libSQL (Turso), existing `@/lib/rag/embedder` (encodeVector/decodeVector, text-embedding-3-small 1536-dim), SSE streaming trong Next.js App Router, TypeScript strict.

**Lưu ý về testing:** Project không có test runner (xem CLAUDE.md). Mỗi task kiểm bằng `npx tsc --noEmit` sạch + smoke test thủ công trên dev server (`npm run dev`) + check Prisma Studio khi cần. Không viết Jest/Vitest test.

---

## File structure

| File | Loại | Trách nhiệm |
|---|---|---|
| `prisma/schema.prisma` | modify | +model SemanticCache + back-relation Message.semanticCache |
| `prisma/migrations/<ts>_add_semantic_cache/migration.sql` | create (prisma gen) | DDL cho bảng mới + index |
| `scripts/apply-migrations.mjs` | modify | +entry vào MIGRATIONS array (idempotent SQL cho Turso prod) |
| `src/lib/rag/cache-store.ts` | create | `searchCache`, `saveCache`, `invalidateByMessage`, `bumpHit`, `CACHE_SIMILARITY_THRESHOLD`, `shouldSkipCache` |
| `src/app/api/chat/route.ts` | modify | Chuyển `embedQuery` lên sớm, chèn cache lookup trước RAG/MVP branch, saveCache sau khi stream xong |
| `src/app/api/chat/feedback/route.ts` | modify | Nếu rating=="DOWN" → gọi `invalidateByMessage(messageId)` |

---

## Task 1 — Prisma schema + migration

**Files:**
- Modify: `prisma/schema.prisma` (append after `MessageFeedback` model, add 1 line to Message)
- Create: `prisma/migrations/<ts>_add_semantic_cache/migration.sql` (prisma generates)
- Modify: `scripts/apply-migrations.mjs` (append to MIGRATIONS array)

- [ ] **Step 1: Thêm back-relation vào Message model**

Edit `prisma/schema.prisma`, trong block `model Message { ... }`, thêm 1 dòng sau `feedback   MessageFeedback?`:

```prisma
  semanticCache SemanticCache?
```

- [ ] **Step 2: Append SemanticCache model**

Thêm vào cuối file `prisma/schema.prisma`:

```prisma
model SemanticCache {
  id                String    @id @default(cuid())
  question          String
  questionEmbedding Bytes
  answer            String
  citations         String?
  topicTag          String?
  mode              String
  sourceMessageId   String    @unique
  sourceMessage     Message   @relation(fields: [sourceMessageId], references: [id], onDelete: Cascade)
  hitCount          Int       @default(0)
  lastHitAt         DateTime?
  createdAt         DateTime  @default(now())

  @@index([topicTag])
  @@index([createdAt])
}
```

- [ ] **Step 3: Generate migration**

Run: `npx prisma migrate dev --name add_semantic_cache`

Expected: tạo folder `prisma/migrations/<timestamp>_add_semantic_cache/` chứa `migration.sql`, apply xong vào `dev.db`, regenerate Prisma Client vào `src/generated/prisma/`.

- [ ] **Step 4: Make migration SQL idempotent cho Turso**

Mở file `prisma/migrations/<ts>_add_semantic_cache/migration.sql`. Prisma gen ra:

```sql
CREATE TABLE "SemanticCache" ( ... );
CREATE UNIQUE INDEX "SemanticCache_sourceMessageId_key" ON "SemanticCache"("sourceMessageId");
CREATE INDEX "SemanticCache_topicTag_idx" ON "SemanticCache"("topicTag");
CREATE INDEX "SemanticCache_createdAt_idx" ON "SemanticCache"("createdAt");
```

Edit để prefix `IF NOT EXISTS`:

```sql
CREATE TABLE IF NOT EXISTS "SemanticCache" ( ... );
CREATE UNIQUE INDEX IF NOT EXISTS "SemanticCache_sourceMessageId_key" ON "SemanticCache"("sourceMessageId");
CREATE INDEX IF NOT EXISTS "SemanticCache_topicTag_idx" ON "SemanticCache"("topicTag");
CREATE INDEX IF NOT EXISTS "SemanticCache_createdAt_idx" ON "SemanticCache"("createdAt");
```

Giữ nguyên nội dung column của `CREATE TABLE`. Lý do: `apply-migrations.mjs` chạy trên prod Turso có thể re-apply nếu `_applied_migrations` không ghi được — SQL phải chịu được re-run.

- [ ] **Step 5: Thêm entry vào MIGRATIONS array**

Edit `scripts/apply-migrations.mjs`, trong mảng `MIGRATIONS` thêm phần tử CUỐI (sau entry `20261005120000_add_high_consumption_customers`):

```js
  { id: "<timestamp>_add_semantic_cache", file: "prisma/migrations/<timestamp>_add_semantic_cache/migration.sql" },
```

Thay `<timestamp>` bằng timestamp thực do prisma gen (dạng `YYYYMMDDHHMMSS`).

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -v "^\.next" | head -5`

Expected: không có output (sạch, bỏ qua lỗi `.next/dev/types/*` do Turbopack).

- [ ] **Step 7: Verify DB local**

Run: `npx prisma studio` → browser tab mở → check SemanticCache table xuất hiện, 0 rows.

Dừng Prisma Studio (Ctrl+C) sau khi check xong.

- [ ] **Step 8: Commit**

```bash
git add prisma/schema.prisma prisma/migrations scripts/apply-migrations.mjs
git commit -m "feat(cache): add SemanticCache model + migration

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 2 — Cache store module

**Files:**
- Create: `src/lib/rag/cache-store.ts`

- [ ] **Step 1: Tạo module với skeleton + constants**

Create `src/lib/rag/cache-store.ts`:

```ts
import { prisma } from "@/lib/prisma";
import { decodeVector, encodeVector } from "./embedder";

export const CACHE_SIMILARITY_THRESHOLD = 0.95;

export interface CacheHit {
  id: string;
  question: string;
  answer: string;
  citations: string | null;
  topicTag: string | null;
  mode: "MVP" | "RAG";
  sourceMessageId: string;
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
```

Lý do duplicate `cosine` thay vì import từ `vector-store.ts`: hàm `cosine` ở đó là `function` không exported (xem `src/lib/rag/vector-store.ts:15`). Để tránh thay đổi vector-store, duplicate (chỉ 10 dòng).

- [ ] **Step 2: Implement `searchCache`**

Append vào `src/lib/rag/cache-store.ts`:

```ts
export async function searchCache(
  embedding: Float32Array,
  threshold: number = CACHE_SIMILARITY_THRESHOLD
): Promise<CacheHit | null> {
  const rows = await prisma.semanticCache.findMany({
    select: {
      id: true,
      question: true,
      questionEmbedding: true,
      answer: true,
      citations: true,
      topicTag: true,
      mode: true,
      sourceMessageId: true,
    },
  });
  if (rows.length === 0) return null;

  let best: CacheHit | null = null;
  for (const r of rows) {
    const vec = decodeVector(r.questionEmbedding);
    const score = cosine(embedding, vec);
    if (score < threshold) continue;
    if (!best || score > best.score) {
      best = {
        id: r.id,
        question: r.question,
        answer: r.answer,
        citations: r.citations,
        topicTag: r.topicTag,
        mode: r.mode as "MVP" | "RAG",
        sourceMessageId: r.sourceMessageId,
        score,
      };
    }
  }
  return best;
}
```

- [ ] **Step 3: Implement `saveCache`**

Append:

```ts
export async function saveCache(input: {
  question: string;
  embedding: Float32Array;
  answer: string;
  citations: string | null;
  topicTag: string | null;
  mode: "MVP" | "RAG";
  sourceMessageId: string;
}): Promise<void> {
  await prisma.semanticCache.create({
    data: {
      question: input.question,
      questionEmbedding: encodeVector(input.embedding),
      answer: input.answer,
      citations: input.citations,
      topicTag: input.topicTag,
      mode: input.mode,
      sourceMessageId: input.sourceMessageId,
    },
  });
}
```

- [ ] **Step 4: Implement `invalidateByMessage` + `bumpHit`**

Append:

```ts
export async function invalidateByMessage(messageId: string): Promise<void> {
  await prisma.semanticCache.deleteMany({ where: { sourceMessageId: messageId } });
}

export async function bumpHit(id: string): Promise<void> {
  await prisma.semanticCache.update({
    where: { id },
    data: { hitCount: { increment: 1 }, lastHitAt: new Date() },
  });
}
```

- [ ] **Step 5: Implement `shouldSkipCache` helper**

Append:

```ts
import { isMemoryCommandCandidate } from "@/lib/memory/keyword-filter";

export function shouldSkipCache(input: {
  message: string;
  formData?: unknown;
}): boolean {
  if (input.formData) return true;
  if (isMemoryCommandCandidate(input.message)) return true;
  return false;
}
```

Lý do skip: form ĐMTMN có data per-user (diện tích/hóa đơn cụ thể), memory command tùy từng user. Moderation + rate-limit đã chặn request ở tầng trước nên không cần check trong `shouldSkipCache`. Case "chưa đủ thông tin" (UnansweredQuery) sẽ được xử lý tại call site trong route.ts (chỉ saveCache khi stream LLM thực sự chạy xong).

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -v "^\.next" | head -5`

Expected: không có output.

- [ ] **Step 7: Commit**

```bash
git add src/lib/rag/cache-store.ts
git commit -m "feat(cache): add cache-store module (search/save/invalidate/bump)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 3 — Integrate cache vào /api/chat

**Files:**
- Modify: `src/app/api/chat/route.ts`

- [ ] **Step 1: Thêm imports**

Edit `src/app/api/chat/route.ts`. Trong block import đầu file, sau dòng `import { estimateFromForm } from "@/lib/solar-constants";`, thêm:

```ts
import { searchCache, saveCache, bumpHit, shouldSkipCache, CACHE_SIMILARITY_THRESHOLD } from "@/lib/rag/cache-store";
```

- [ ] **Step 2: Chuyển embedQuery lên sớm (ngoài branch RAG)**

Trong hàm POST, tìm block sau `rewriteQuery`. Hiện tại `embedQuery` chỉ gọi trong branch RAG (sau `if (hasDocuments)`). Chuyển lên NGAY sau khi có `rewritten`:

```ts
const priorTurns = historyForLLM.slice(0, -1);
const rewritten =
  priorTurns.length > 0 ? await rewriteQuery(body.message, priorTurns) : body.message;

// NEW: embed sớm để dùng cho cả cache lookup và RAG
const skipCache = shouldSkipCache({ message: body.message, formData: body.formData });
const queryEmbedding = !skipCache ? await embedQuery(rewritten) : null;
```

Sau đó trong branch RAG, DÙNG LẠI `queryEmbedding` thay vì gọi `embedQuery` lần nữa. Tức là thay:

```ts
const queryVec = await embedQuery(rewritten);
const topChunks = await searchTopK(queryVec, 5);
```

Bằng:

```ts
const queryVec = queryEmbedding ?? await embedQuery(rewritten);
const topChunks = await searchTopK(queryVec, 5);
```

(Fallback `?? await embedQuery(rewritten)` cho case `skipCache=true` → `queryEmbedding=null` nhưng vẫn vào RAG, vd formData — vẫn cần embed cho RAG retrieval.)

- [ ] **Step 3: Thêm cache lookup — hit path**

Ngay SAU block khai báo `queryEmbedding` (và TRƯỚC `const [hasDocuments, customerStats]`), thêm cache lookup:

```ts
if (queryEmbedding) {
  const hit = await searchCache(queryEmbedding, CACHE_SIMILARITY_THRESHOLD);
  if (hit) {
    const assistantId = (await prisma.message.create({
      data: {
        sessionId,
        role: "assistant",
        content: hit.answer,
        citations: hit.citations,
        topicTag: hit.topicTag,
      },
    })).id;

    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { messageCount: { increment: 2 }, lastMessageAt: new Date() },
    });

    // Fire-and-forget bump
    bumpHit(hit.id).catch((err) => console.error("[cache] bumpHit failed", err));

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`event: session\ndata: ${JSON.stringify({ sessionId })}\n\n`));
        controller.enqueue(encoder.encode(`event: delta\ndata: ${JSON.stringify({ text: hit.answer })}\n\n`));
        controller.enqueue(encoder.encode(`event: message_saved\ndata: ${JSON.stringify({ messageId: assistantId })}\n\n`));
        controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });
  }
}
```

Lưu ý: tăng `messageCount` 2 vì đã có 1 Message user được lưu trước đó + 1 assistant vừa tạo. Nếu `prisma.chatSession.update` ở nhánh miss hiện tại chỉ tăng 1, kiểm tra lại code hiện tại và match style.

**Cần verify thực tế** trước khi code: đọc `route.ts` block hiện tại để biết chính xác thứ tự tăng messageCount (có thể đã tăng 1 cho user Message rồi). Nếu đã +1 trước đó cho user, chỉ cần +1 ở đây.

- [ ] **Step 4: Thêm saveCache sau stream LLM thành công**

Tìm block cuối hàm POST — sau khi loop `for await (const chunk of openaiStream)` xong và `prisma.message.create` cho assistant. Sau khi lưu Message assistant, trước khi `controller.close()` hoặc tương đương, thêm:

```ts
// NEW: save cache if applicable
if (queryEmbedding && !skipCache && fullText.trim().length > 0) {
  // KHÔNG cache câu "chưa đủ thông tin" (đã return ở nhánh NO_DOCUMENT_MATCH ở trên, nên tới đây là OK)
  const mode = citationMap.length > 0 ? "RAG" : "MVP";
  saveCache({
    question: rewritten,
    embedding: queryEmbedding,
    answer: fullText,
    citations: citationsJson,
    topicTag: null, // classifyTopic sẽ chạy fire-and-forget sau, không chờ
    mode,
    sourceMessageId: assistantMessageId, // lấy từ Message.create ngay trên
  }).catch((err) => console.error("[cache] saveCache failed", err));
}
```

Yêu cầu: biến `assistantMessageId` phải tồn tại — đọc code hiện tại tìm chỗ `prisma.message.create` lưu assistant message, lấy `.id` vào biến `assistantMessageId`. Nếu chưa có, thêm:

```ts
const assistant = await prisma.message.create({ data: { ... } });
const assistantMessageId = assistant.id;
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -v "^\.next" | head -10`

Expected: không có output. Nếu lỗi về `citationsJson` chưa định nghĩa trong scope cache save, scope-up biến đó bằng khai báo `let citationsJson: string | null = null;` ở đầu block xử lý SSE.

- [ ] **Step 6: Smoke test — cold miss**

Terminal 1: `npm run dev` (nếu chưa chạy).

Browser: `http://localhost:3000/chat` → chat 1 câu "giá điện bậc 3 là bao nhiêu".

Expected:
- Bot trả lời như bình thường (có thể 2-5s).
- Mở Prisma Studio: SemanticCache có 1 row mới với `hitCount=0`, `question` = câu đã rewrite, `mode` = MVP hoặc RAG tùy KB.

- [ ] **Step 7: Smoke test — cache hit**

Browser: refresh `/chat` → chat lại câu y hệt "giá điện bậc 3 là bao nhiêu".

Expected:
- Bot trả lời GẦN NHƯ TỨC THỜI (<300ms).
- Prisma Studio: row cũ `hitCount=1`, `lastHitAt` cập nhật.
- Content trả về giống hệt lần trước.

- [ ] **Step 8: Smoke test — similar question (threshold boundary)**

Chat câu "bậc 3 giá bao nhiêu tiền" (ngữ nghĩa gần nhưng text khác).

Expected tùy threshold:
- Nếu score ≥ 0.95: hit (serve same answer, hitCount++).
- Nếu score < 0.95: miss (gọi LLM, saveCache row mới).

Note: 0.95 là tight, câu khác text có thể miss. Nếu muốn tune, chỉnh `CACHE_SIMILARITY_THRESHOLD` trong `cache-store.ts`.

- [ ] **Step 9: Commit**

```bash
git add src/app/api/chat/route.ts
git commit -m "feat(cache): check SemanticCache before LLM call, auto-save after stream

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 4 — Invalidate on 👎 feedback

**Files:**
- Modify: `src/app/api/chat/feedback/route.ts`

- [ ] **Step 1: Thêm import**

Edit `src/app/api/chat/feedback/route.ts`. Sau dòng `import { prisma } from "@/lib/prisma";`, thêm:

```ts
import { invalidateByMessage } from "@/lib/rag/cache-store";
```

- [ ] **Step 2: Gọi invalidate sau upsert khi DOWN**

Sau block `await prisma.messageFeedback.upsert({ ... });` (hiện ở line 35-43), thêm:

```ts
if (body.rating === "DOWN") {
  await invalidateByMessage(body.messageId);
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -v "^\.next" | head -5`

Expected: không có output.

- [ ] **Step 4: Smoke test — invalidate**

Browser: chat 1 câu đã được cache ở Task 3 (vd "giá điện bậc 3 là bao nhiêu").

Hover câu trả lời bot → bấm 👎 → chọn lý do (vd "SAI_THONG_TIN") → submit.

Expected:
- Prisma Studio refresh SemanticCache: row tương ứng BIẾN MẤT.
- Prisma Studio refresh MessageFeedback: có row mới `rating=DOWN`.

- [ ] **Step 5: Smoke test — re-cache sau invalidate**

Browser: chat lại câu y hệt.

Expected:
- Bot trả lời (COLD MISS vì cache đã xóa), 2-5s.
- Prisma Studio SemanticCache: row mới xuất hiện, `hitCount=0`.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/chat/feedback/route.ts
git commit -m "feat(cache): invalidate SemanticCache when user feedback is DOWN

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 5 — Deploy + verify production

- [ ] **Step 1: Push to origin/main**

```bash
git push origin main
```

Expected: 4 commit (Task 1-4) được push.

- [ ] **Step 2: Chờ Vercel deploy**

Run: 
```bash
until gh api "repos/trungsonpcdb-design/pcdb-chatbot-tietkiem-dien/deployments?per_page=1" --jq '.[0].sha' 2>/dev/null | grep -q "^$(git rev-parse --short HEAD)"; do sleep 5; done && DEP_ID=$(gh api "repos/trungsonpcdb-design/pcdb-chatbot-tietkiem-dien/deployments?per_page=1" --jq '.[0].id') && gh api "repos/trungsonpcdb-design/pcdb-chatbot-tietkiem-dien/deployments/$DEP_ID/statuses" --jq '.[0] | {state, environment_url, created_at}'
```

Expected: `{state: "success", ...}`.

Lưu ý: Vercel build sẽ chạy `npm run build` → gọi `apply-migrations.mjs` → sẽ apply migration mới lên Turso prod (vì entry đã add ở Task 1 step 5). Nếu quên step 5, bảng SemanticCache KHÔNG tồn tại trên Turso prod → runtime error khi query. Theo [[references-infra-pcdb]].

- [ ] **Step 3: Verify production**

Browser: mở `https://pcdb-chatbot-tietkiem-dien.vercel.app/chat` (hoặc custom domain).

Repeat Task 3 Step 6-8 trên production:
1. Chat 1 câu mới → bot trả → check prod DB (Turso) có row.
2. Chat lại → verify hit nhanh.
3. 👎 → verify row xóa.

Để check Turso prod DB, có thể dùng Turso CLI hoặc query qua Prisma với `DATABASE_URL` prod (cẩn thận).

- [ ] **Step 4 (optional): Update project memory**

Nếu hiệu quả cache rõ ràng (giảm latency rõ rệt, hit rate hợp lý), bổ sung dòng cho `MEMORY.md` nhắc Semantic Cache đang chạy production + similarity threshold 0.95.

---

## Rollback

Nếu phát hiện bug nghiêm trọng sau deploy (vd cache serve câu sai hàng loạt, DB corrupt):

**Rollback nhanh (không cần migration rollback):**

```bash
git revert HEAD~3..HEAD  # revert 3 commit code (Task 2-4), giữ migration Task 1
git push origin main
```

Vercel sẽ redeploy không có logic cache. Bảng `SemanticCache` vẫn tồn tại trên DB nhưng không ai query — không ảnh hưởng. Có thể drop sau khi điều tra xong.

Nếu phát hiện migration SQL lỗi (hiếm, vì chỉ CREATE TABLE):

```bash
# Trên Turso prod CLI
turso db shell <db-name>
DROP TABLE IF EXISTS SemanticCache;
DELETE FROM _applied_migrations WHERE id = '<ts>_add_semantic_cache';
.quit
```

Rồi revert commit Task 1 và push.

---

## Self-review checklist (đã rà)

- ✅ Mỗi task có file path chính xác.
- ✅ Code steps có đủ code block, không "add appropriate handling".
- ✅ Types nhất quán: `CacheHit`, `Mode = "MVP"|"RAG"`, `encodeVector/decodeVector` khớp giữa Task 2 và 3.
- ✅ Scope: 5 task, 1 implementation plan, không cần decompose.
- ✅ Mỗi task kết thúc bằng commit riêng để revert được từng phần.
- ✅ Testing adapted cho project không có test runner (dùng tsc + Prisma Studio + smoke test).

## Related memories

- [[references-infra-pcdb]] — Turso prod cần apply-migrations.mjs manual entry
- [[feedback-verify-vercel-autodeploy]] — pattern poll deployment sau push
- [[feedback-scripted-facts-over-rag-ingest]] — cache là loại data cross-cutting, không fit vào SCRIPTED_FACTS pattern
