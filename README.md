# Chatbot Tiết kiệm điện & ĐMTMN — PC Điện Biên

Web app chatbot AI tư vấn khách hàng của EVN Điện Biên về:
- Tiết kiệm điện (hộ gia đình & doanh nghiệp)
- Điện mặt trời mái nhà (kỹ thuật, tài chính, thủ tục)
- Cách tính hóa đơn tiền điện

## Milestone 1 (đã hoàn thành code)
- ✅ Trang chat công khai `/chat` — stream trả lời qua OpenAI GPT-4o-mini
- ✅ Cookie ẩn danh, rate limit theo IP (20 câu/giờ), moderation off-topic
- ✅ Lưu lịch sử chat vào Prisma + libsql (SQLite dev, Turso prod)
- ✅ Clerk auth cho `/dashboard` (skeleton)

## Milestone 2 (đã hoàn thành code)
- ✅ Upload PDF/DOCX/TXT vào Knowledge Base (`/dashboard/documents`)
- ✅ Ingest: extract → chunk theo heading VN → embed OpenAI `text-embedding-3-small` → lưu Turso vector `Bytes`
- ✅ RAG: query rewrite → cosine search top-5 → citation `[1] [2]` trong câu trả lời
- ✅ Popover "Xem nguồn" cho mỗi câu trả lời assistant
- ✅ Đánh dấu supersede (văn bản hết hiệu lực) — chỉ query chunk `isActive=true`
- ✅ Trang câu hỏi chưa trả lời được cho admin bổ sung KB
- ✅ Vercel Blob private cho file gốc + `/api/serve-file` với Bearer token

## Milestone tiếp theo
- M3: Feedback, rating, form ĐMTMN, lead capture
- M4: Dashboard analytics đầy đủ

## Local dev

```bash
npm install
cp .env.example .env
# Điền OPENAI_API_KEY + Clerk keys (xem section ENV bên dưới)

# Prisma migrate + seed 11 đơn vị PC Điện Biên
npx prisma migrate dev
npm run db:seed

# Chạy
npm run dev
```

Mở [http://localhost:3000/chat](http://localhost:3000/chat)

## ENV cần chuẩn bị

| Biến | Nguồn | Bắt buộc |
|------|-------|----------|
| `DATABASE_URL` | Turso (prod) hoặc `file:./dev.db` (dev) | ✓ |
| `TURSO_AUTH_TOKEN` | Turso dashboard (chỉ prod) | Chỉ prod |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | clerk.com | ✓ |
| `CLERK_SECRET_KEY` | clerk.com | ✓ |
| `OPENAI_API_KEY` | platform.openai.com (nạp min $10) | ✓ |
| `NEXT_PUBLIC_APP_URL` | Vercel domain hoặc `http://localhost:3000` | ✓ |
| `RATE_LIMIT_SALT` | `openssl rand -hex 16` | ✓ |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob store (Storage tab → Create Blob) | Prod (M2+) |

## Deploy Vercel

1. Push code lên GitHub.
2. Import repo trên Vercel — Framework: Next.js.
3. Trước khi deploy, điền env ở Settings → Environment Variables (Production).
4. Deploy. Migration Turso tự chạy trong build qua `scripts/apply-migrations.mjs`.
5. Seed 11 đơn vị 1 lần (từ máy local trỏ vào prod):
   ```bash
   DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." npm run db:seed
   ```

## Quan trọng khi tạo migration mới

Vercel **không** chạy `prisma migrate deploy` cho Turso. Mỗi migration mới **BẮT BUỘC** thêm vào mảng `MIGRATIONS` trong [scripts/apply-migrations.mjs](scripts/apply-migrations.mjs). SQL phải idempotent (`CREATE TABLE IF NOT EXISTS`).

Prisma 7 dùng file cấu hình riêng: xem [prisma.config.ts](prisma.config.ts).

## Cấu trúc thư mục

```
src/
├── app/
│   ├── chat/          # trang công khai (SSE streaming)
│   ├── dashboard/     # Clerk protected (skeleton — sẽ mở rộng ở M4)
│   ├── sign-in/, sign-up/  # Clerk auth pages
│   └── api/
│       ├── chat/      # POST — SSE streaming trả lời
│       └── health/    # GET — kiểm tra DB
├── components/
│   ├── ui/            # shadcn primitives (button, input, card, dialog)
│   ├── chat/          # chat UI (bubble, list, input, container)
│   └── shared/        # header EVN
├── lib/
│   ├── prisma.ts      # libsql adapter (Prisma 7)
│   ├── openai.ts      # OpenAI client singleton
│   ├── prompts/       # system-mvp.ts + system-rag.ts
│   ├── rag/           # chunker, embedder, vector-store, query-rewriter,
│   │                  # topic-classifier, prompt-builder
│   ├── extractors/    # pdf.ts (PDFParse v2) + docx.ts (mammoth)
│   ├── blob.ts        # Vercel Blob put/fetch wrapper
│   ├── tokenizer.ts
│   ├── anonymous-id.ts
│   ├── rate-limit.ts
│   ├── moderation.ts
│   ├── constants.ts   # UNIT_LIST, TOPIC_TAGS
│   └── utils.ts
└── generated/prisma/  # Prisma client (gitignored)
```

## Smoke test — 5 luồng

1. `/chat` load được, header xanh EVN.
2. Click câu gợi ý → nhận trả lời stream chữ chạy dần.
3. Gõ câu tự do → OpenAI trả lời phù hợp chủ đề (điện/ĐMTMN).
4. Gõ câu off-topic ("cá độ bóng đá") → moderation từ chối lịch sự.
5. Truy cập `/dashboard` khi chưa login → redirect Clerk sign-in.
