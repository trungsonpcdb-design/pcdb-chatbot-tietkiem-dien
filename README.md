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

## Milestone 3 (đã hoàn thành code)
- ✅ Feedback 👍/👎 mỗi câu trả lời + modal chọn lý do (`SAI_THONG_TIN`, `KHONG_DU_CHI_TIET`, ...)
- ✅ Rating 5 sao cuối phiên chat (trigger khi ẩn tab / idle 5 phút)
- ✅ Form ĐMTMN inline — chatbot phát hiện thiếu dữ liệu tự sinh marker `<FORM_DMTMN/>`, client render form, server inject ước tính vào prompt
- ✅ Lead capture modal — chatbot chủ động gợi ý khi phát hiện intent
- ✅ Dashboard `/dashboard/leads` cho nhân viên: filter theo status, detail có full chat + tóm tắt AI + đổi status/ghi chú/gán đơn vị
- ✅ Clerk webhook `/api/webhooks/clerk` sync user + role + đơn vị vào DB

## Milestone 4 (đã hoàn thành code)
- ✅ Dashboard tổng quan `/dashboard`: 4 KPI cards (phiên hôm nay, câu hỏi hôm nay, hài lòng, rating TB) + 3 biểu đồ SVG tự vẽ (donut chủ đề, bar 7 ngày, hbar lý do 👎)
- ✅ Lịch sử phiên chat `/dashboard/sessions`: list + tìm theo keyword, detail đọc full messages + feedback + rating
- ✅ Thống kê chi tiết `/dashboard/stats?range=7|30|90` + 20 câu 👎 gần nhất
- ✅ Admin quản lý user `/dashboard/admin/users`: đổi role (admin/staff/user) + đổi đơn vị, guard `requireAdmin()`
- ✅ Sidebar hoàn thiện, tự hiện link Admin theo role
- ✅ Flow "unanswered → doc": nhân viên biến câu hỏi chưa trả lời thành gợi ý bổ sung KB
- ✅ Không thêm thư viện chart — mọi biểu đồ vẽ tay bằng SVG

## Vận hành đầy đủ

Sản phẩm đã đủ tính năng cho pilot nội bộ:
- Khách hàng có công cụ chat 24/7
- Nhân viên có kênh nhận lead + review chất lượng bot
- Admin có KB quản lý tài liệu + phân quyền + số liệu vận hành

## Backlog dài hạn (phase 2)
- Export lead ra Excel
- Auto assign lead theo địa lý
- Email/Zalo notify nhân viên khi có lead mới
- Live handoff (WebSocket) — nhân viên chat trực tiếp thay bot
- Vision phân tích ảnh mái nhà / hóa đơn giấy
- Migrate vector search sang Pinecone khi > 10.000 chunks

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
| `CLERK_WEBHOOK_SECRET` | Clerk → Webhooks → endpoint signing secret | Prod (M3+) |

## Phân quyền admin (M3+)

Vào Clerk Dashboard → Users → chọn user → Public metadata:

```json
{ "role": "admin", "unitCode": "DBP" }
```

Webhook `/api/webhooks/clerk` sẽ đồng bộ role + đơn vị vào bảng `User`. `unitCode` phải khớp 1 trong 11 code của `UNIT_LIST` (DBP, TG, TA, NS, NSN, TCH, MA, MN, XNCT, PXPD, KHN).

**Setup webhook trên Clerk:**
1. Clerk Dashboard → Webhooks → Add endpoint.
2. URL: `https://<your-domain>.vercel.app/api/webhooks/clerk`
3. Events: `user.created`, `user.updated`, `user.deleted`.
4. Copy Signing Secret → paste vào `CLERK_WEBHOOK_SECRET`.

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
│   ├── dashboard/     # Clerk protected — home KPI + sessions + stats + leads + documents + unanswered + admin/users
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
