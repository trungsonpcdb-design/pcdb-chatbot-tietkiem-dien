# Semantic Cache — Design (MVP)

**Ngày:** 2026-10-07
**Tác giả:** Ly Trung Son + Claude Opus 4.7
**Trạng thái:** Approved, chờ implementation plan

## Mục tiêu

Thêm lớp semantic cache trước LLM call trong `/api/chat` để:
1. **Giảm chi phí OpenAI** — câu hỏi lặp không gọi lại LLM.
2. **Giảm latency** — cache hit trả <100ms thay vì chờ LLM 2-5s.
3. **Đồng nhất câu trả lời** — câu giống nhau ra câu trả lời giống nhau (giảm biến thiên của LLM).

Cân bằng cả 3 mục tiêu, không ưu tiên 1 tuyệt đối.

## Scope MVP

Minimal — chỉ 3 thứ:
- Schema + migration mới.
- Logic cache check/write trong `/api/chat`.
- Invalidate entry khi user feedback 👎.

**Không bao gồm trong MVP** (có thể làm sau):
- Admin UI (/dashboard/cache) xem/xóa cache thủ công.
- Metrics dashboard (hit rate, cost saved).
- TTL / auto-expire.
- Invalidate cascade khi admin mark supersede Document.
- Preseed từ `UnansweredQuery` hoặc Message history cũ.
- Mode 2-stage (exact-match hash → embedding fallback).

## Chiến lược trigger

**Auto-cache ngay, invalidate chặt:**
- Mọi câu LLM trả lời thành công → lưu cache ngay.
- Mọi cache hit → serve ngay (không chờ approve).
- 👎 feedback → xóa entry đó (next time cùng câu sẽ gọi LLM lại).

## Kiến trúc

### Request flow (POST /api/chat)

```
1. auth + rate-limit + moderation           (giữ nguyên)
2. load/create ChatSession                   (giữ nguyên)
3. lưu Message role=user                     (giữ nguyên)
4. fetch 20 message gần nhất làm history     (giữ nguyên)
5. rewriteQuery(message, history)            (giữ nguyên — chuyển lên sớm trong flow)
6. embedQuery(rewritten)                     (giữ nguyên logic, chuyển ra khỏi branch RAG)

7. [NEW] skipCache = shouldSkipCache(body)
       - true nếu: body.formData có mặt (câu ĐMTMN form, per-user)
                   HOẶC isMemoryCommandCandidate(message) (câu memory)

8. [NEW] if !skipCache:
       hit = searchCache(embedding, threshold=0.95)
       if hit:
           stream hit.answer qua SSE
           lưu Message role=assistant (link sourceMessageId=hit.sourceMessageId? KHÔNG — tạo Message mới, không link)
           bump SemanticCache { hitCount++, lastHitAt=now }
           return

9. [MISS hoặc skipCache] — chạy flow cũ:
       - nếu Document count > 0 → RAG retrieval
       - nếu score < MIN_SCORE_ACCEPT → ghi UnansweredQuery + trả lời "chưa đủ thông tin" (KHÔNG cache)
       - else → gọi OpenAI stream

10. sau khi stream xong:
       - lưu Message role=assistant (giữ nguyên)
       - classifyTopic bất đồng bộ (giữ nguyên)
       - [NEW] if !skipCache && không là câu "chưa đủ thông tin":
             saveCache({
                 question: rewritten,
                 questionEmbedding: embedding,
                 answer: fullText,
                 citations: citationsJson,
                 topicTag: null (hoặc chờ classifyTopic xong),
                 mode: "MVP" | "RAG",
                 sourceMessageId: assistantMessageId
             })
```

### Invalidation flow (feedback 👎)

```
POST /api/chat/feedback
→ prisma.messageFeedback.upsert({...})  (hiện có)
→ [NEW] if feedback kind === "DOWN":
     prisma.semanticCache.deleteMany({ where: { sourceMessageId: body.messageId } })
```

## Schema

```prisma
model SemanticCache {
  id                String   @id @default(cuid())
  question          String                     // câu đã rewrite (không phải raw message user gõ)
  questionEmbedding Bytes                      // Float32 1536-dim, cùng encoding với DocumentChunk.embedding
  answer            String                     // text LLM đã trả, có markup (markdown, [[DL:...]])
  citations         String?                    // JSON array CitationRef[]; null nếu MVP mode hoặc không có citation
  topicTag          String?                    // "GIA_DIEN" | "DMTMN" | ... — populate khi classifyTopic xong
  mode              String                     // "MVP" (prompt tĩnh, không RAG) | "RAG" (có doc KB)
  sourceMessageId   String   @unique           // link tới Message gốc để invalidate khi 👎
  sourceMessage     Message  @relation(fields: [sourceMessageId], references: [id], onDelete: Cascade)
  hitCount          Int      @default(0)       // số lần cache này được serve
  lastHitAt         DateTime?                  // thời điểm hit cuối
  createdAt         DateTime @default(now())

  @@index([topicTag])
}

// Message model thêm 1 back-relation (không bắt buộc nhưng tiện cho query):
// semanticCache SemanticCache?
```

## Component mới

### `src/lib/rag/cache-store.ts`

Reuse encode/decode embedding từ `vector-store.ts` (hoặc export helper nếu chưa có).

```ts
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

export async function searchCache(
  embedding: Float32Array,
  threshold: number
): Promise<CacheHit | null>;

export async function saveCache(input: {
  question: string;
  embedding: Float32Array;
  answer: string;
  citations: string | null;
  topicTag: string | null;
  mode: "MVP" | "RAG";
  sourceMessageId: string;
}): Promise<void>;

export async function invalidateByMessage(messageId: string): Promise<void>;

export async function bumpHit(id: string): Promise<void>;
```

`searchCache` tính cosine similarity trong application layer giống `searchTopK` (SQLite không có vector native). Load tất cả rows đang có (hoặc top N theo createdAt desc nếu bảng lớn), tính cosine, trả top-1 nếu ≥ threshold. Với MVP (< 10k rows) OK không cần index chuyên dụng.

## Config / Constants

```ts
// src/lib/rag/cache-store.ts hoặc src/lib/openai.ts
export const CACHE_SIMILARITY_THRESHOLD = 0.95;
```

Tight threshold để tránh false positive (câu khác ý nhưng gần nhau về embedding). Có thể lower sau khi quan sát hit rate.

## Edge cases — KHÔNG cache

| Case | Lý do |
|---|---|
| `body.formData` có mặt (form ĐMTMN) | Data per-user (diện tích/hóa đơn cụ thể) — không reusable |
| `isMemoryCommandCandidate(message) === true` | Memory command tùy user |
| `moderate(message).allowed === false` | Block trước LLM, không có answer để cache |
| Rate-limit chặn (429) | Chưa gọi LLM |
| RAG mode: `highest < MIN_SCORE_ACCEPT` → trả "chưa đủ thông tin" + ghi `UnansweredQuery` | Câu trả lời generic, cache sẽ ghim user vào "chưa trả được" ngay cả khi KB sau này thêm doc. SKIP để lần sau tính lại. |

## Migration

Theo [[references-infra-pcdb]]: `npx prisma migrate dev --name add_semantic_cache` tạo migration, rồi **BẮT BUỘC** thêm thủ công vào mảng `MIGRATIONS` trong `scripts/apply-migrations.mjs` (idempotent `CREATE TABLE IF NOT EXISTS` + `CREATE INDEX IF NOT EXISTS`).

## Files sẽ chạm

| File | Loại thay đổi |
|---|---|
| `prisma/schema.prisma` | +model SemanticCache + back-relation trong Message |
| `prisma/migrations/<timestamp>_add_semantic_cache/migration.sql` | Migration mới |
| `scripts/apply-migrations.mjs` | +entry vào MIGRATIONS array (idempotent SQL) |
| `src/lib/rag/vector-store.ts` | Export helper `encodeEmbedding`/`decodeEmbedding` để cache-store reuse (nếu chưa export) |
| `src/lib/rag/cache-store.ts` | Mới — searchCache, saveCache, invalidateByMessage, bumpHit |
| `src/app/api/chat/route.ts` | Rewrite flow: embed sớm, check cache, write cache sau stream, skip edge cases |
| `src/app/api/chat/feedback/route.ts` | +call invalidateByMessage khi feedback DOWN (sau `prisma.messageFeedback.upsert`) |

## Testing / Verification

Không có test runner trong project (xem CLAUDE.md). Verify bằng:
1. `tsc --noEmit` sạch.
2. `npx prisma migrate dev` chạy local không lỗi, DB có bảng mới.
3. Smoke test thủ công trên dev server:
   - Chat câu "giá điện bậc 3 là bao nhiêu" (RAG hoặc MVP tùy KB) → trả lời bình thường.
   - Chat lại câu y hệt → **nhanh hơn hẳn (<200ms)**, verify qua devtools network tab (vẫn SSE stream nhưng tất cả delta đến gần như cùng lúc).
   - Trong DB (Prisma Studio): row `SemanticCache` tồn tại, `hitCount=1`, `lastHitAt` cập nhật.
   - Bấm 👎 trên câu trả lời → check DB thấy row bị xóa.
   - Chat lại câu đó lần nữa → cold miss, gọi LLM như lần đầu.

## Tradeoffs & Rủi ro

| Rủi ro | Đánh giá | Mitigation |
|---|---|---|
| Cache phục vụ câu trả lời LỖI | Trung bình — LLM có thể trả sai, cache sẽ serve lại nhiều lần | 👎 invalidate; threshold 0.95 cao để chỉ hit câu rất tương tự |
| DB phình to | Thấp — ước tính 8KB/row × 10k rows = 80 MB | Phase sau có thể thêm TTL hoặc LRU |
| Embedding mismatch khi đổi model | Cao nếu đổi `text-embedding-3-small` → model khác | Thêm field `embeddingModel` trong migration kế tiếp; clear cache khi migrate |
| Cache hit nhưng user mong câu khác (vd query cùng ngữ cảnh nhưng khác history) | Trung bình | MVP không care về history trong cache key — rewriteQuery đã inject context vào `rewritten` nên tạm OK. Nếu lộ bug thì phải cache theo [rewritten + session.recentTopic] |
| Classify topic đến sau cache save → `topicTag=null` | Thấp | Chỉ ảnh hưởng index theo topic. Có thể update topicTag sau trong fire-and-forget của classifyTopic |

## Phase sau (ngoài MVP)

- **TTL 30 ngày**: cron xóa `SemanticCache` cũ > 30 ngày.
- **Document supersede cascade**: khi admin `isActive=false` 1 Document, xóa cache entries có mode=RAG & citations tham chiếu doc đó.
- **Admin UI `/dashboard/cache`**: table list + search + delete thủ công + metrics (hit rate, câu top-10).
- **Preseed từ UnansweredQuery**: khi nhân viên add doc giải quyết UnansweredQuery, tự chạy câu đó qua LLM 1 lần để seed cache.
- **Mode 2-stage**: exact-match hash SHA256(normalizedText) trước; miss thì fallback embedding search. Tăng tốc cho câu đã trùng tuyệt đối.

## Links

- Ticket/discussion: (session 2026-10-07, chat trực tiếp với Claude)
- Related: `src/lib/rag/vector-store.ts` (cosine similarity reference), `UnansweredQuery` model
