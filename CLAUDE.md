# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Chatbot AI tư vấn khách hàng cho **Công ty Điện lực Điện Biên (PC Điện Biên)** — Next.js 16 App Router. Chủ đề: tiết kiệm điện, điện mặt trời mái nhà (ĐMTMN), tra cứu giá điện, CSKH. Có trang chat công khai `/chat` và dashboard nội bộ `/dashboard` cho nhân viên/admin.

## Commands

```bash
npm run dev              # dev server (localhost:3000/chat)
npm run build            # apply-migrations (Turso only) + prisma generate + next build
npm run start

npx prisma migrate dev   # tạo/áp migration lên dev.db (SQLite local)
npm run db:generate      # prisma generate thủ công (client → src/generated/prisma)
npm run db:seed          # seed 11 đơn vị PC Điện Biên (Unit table) — bắt buộc trước khi chạy app
npm run db:seed:kb       # seed dữ liệu Knowledge Base mẫu
```

Không có test runner hay lint script trong `package.json` — kiểm tra bằng `tsc` (qua `next build`) và smoke test thủ công theo README (mục "Smoke test — 5 luồng").

## Architecture

### Hai luồng hội thoại song song trên `/chat`

`ChatContainer` (`src/components/chat/chat-container.tsx`) quản lý cả hai, không có luồng "chuyển đổi" tường minh — chúng chỉ khác cách message được tạo ra:

1. **Quick-reply script (cây quyết định tĩnh)** — `src/lib/scripts/`. Mỗi topic là một `ScriptTree` (`types.ts`) gồm các `ScriptNode` với `buttons` trỏ tới node khác (`goto`), quay root (`root`), chuyển script (`switch`), quay picker (`picker`), hoặc leo thang (`escalate`). `picker.ts` là script gốc hiển thị menu chọn chủ đề đầu tiên. `index.ts` là registry (`SCRIPTS`) + `resolveInitialScriptId` (đọc `?kb=` query param để mở thẳng một script). Toàn bộ luồng này chạy **client-side, không gọi OpenAI** — chỉ render node/button có sẵn.
2. **Free-text chat (LLM)** — khi người dùng gõ tự do (hoặc submit form ĐMTMN), client POST `/api/chat`, nhận SSE stream (`event: session|delta|citations|suggest_lead|message_saved|done|error`) và ghép dần vào bong bóng chat đang "pending".

Khi thêm chủ đề quick-reply mới: xem [[feedback-picker-scripts-conventions]] (memory) cho convention đặt tên node/id.

### `/api/chat` — pipeline free-text (`src/app/api/chat/route.ts`)

Thứ tự xử lý mỗi request: rate limit (`rate-limit.ts`, theo IP hash hoặc Clerk userId) → moderation off-topic (`moderation.ts`) → tạo/lấy `ChatSession` + lưu `Message` role=user → lấy 20 message gần nhất làm history → `rewriteQuery` (dùng history để viết lại câu hỏi độc lập ngữ cảnh) → chọn system prompt:

- Nếu **chưa có** `Document` nào `isActive=true` trong KB → dùng `SYSTEM_PROMPT_MVP` (prompt tĩnh, không RAG).
- Nếu **có** → embed câu hỏi đã rewrite, `searchTopK` cosine similarity trong `vector-store.ts` (embedding lưu dạng `Bytes` trong SQLite/Turso, không dùng vector DB riêng), lọc theo `MIN_SCORE_ACCEPT`/`MIN_SCORE_USE`. Dưới ngưỡng accept → tự động ghi `UnansweredQuery` (để nhân viên bổ sung KB ở `/dashboard/unanswered`) và trả câu trả lời "chưa đủ thông tin". Trên ngưỡng use → `buildPromptWithContext` chèn chunk liên quan + citation marker `[n]` vào system prompt.

`SCRIPTED_FACTS` (`src/lib/prompts/scripted-facts.ts`) là dữ liệu tra cứu ngắn có cấu trúc (biểu giá điện, khung giờ TOU...) được inject thẳng vào prompt thay vì đi qua RAG ingest — xem [[feedback-scripted-facts-over-rag-ingest]]. Khi cần thêm loại dữ liệu tương tự (bảng số liệu chính thức, ít thay đổi), làm theo pattern này thay vì tạo Document/migration mới.

Sau khi OpenAI trả lời xong: lưu `Message` role=assistant (kèm `citations` JSON nếu marker `[n]` thực sự xuất hiện trong text), tăng `messageCount` của session, phân loại `topicTag` bất đồng bộ (`classifyTopic`, không block response), và nếu `shouldSuggestLead()` phát hiện tín hiệu quan tâm thì bắn `event: suggest_lead` để client mở `LeadCaptureModal`.

**Lưu ý:** citation `[n]` được sinh và lưu trong DB nhưng **không hiển thị** cho end-user trong UI chat hiện tại (đã bỏ "Xem nguồn" để chat tự nhiên hơn) — xem [[feedback-chatbot-no-citation-ui]]. Đừng thêm lại UI trích dẫn trừ khi được yêu cầu rõ.

### Auth & phân quyền (`src/lib/auth.ts`, `src/middleware.ts`)

Clerk bảo vệ toàn bộ `/dashboard(.*)` qua middleware. `requireDbUser()` tự tạo `User` trong DB ở lần đăng nhập đầu (unit mặc định `KHN` — "Khách hàng ngoài"), với `status="pending"` → redirect `/pending` cho tới khi admin đổi `status="active"` (qua `/dashboard/admin/users`). `requireAdmin()` guard thêm `role==="admin"`. Ngoài cơ chế DB status, còn có Clerk **allowlist** (`/api/admin/allowlist`) để chặn đăng ký ở tầng Clerk trước khi vào được app.

`role`/`unitId` gán thủ công qua `/dashboard/admin/users`, không đồng bộ tự động từ Clerk public metadata trong code hiện tại (README mô tả webhook `/api/webhooks/clerk` sync — kiểm tra route đó nếu cần xác nhận hành vi mới nhất trước khi dựa vào nó).

### Database (Prisma 7 + libSQL)

`prisma/schema.prisma` dùng `provider = "sqlite"` cho cả dev (`file:./dev.db`) lẫn prod (Turso, qua `@prisma/adapter-libsql`, config ở `src/lib/prisma.ts` + `prisma.config.ts`). Model chính: `Unit`, `User`, `ChatSession`→`Message`→`MessageFeedback`, `SessionRating`, `Lead`, `Document`→`DocumentChunk` (KB + embedding), `UnansweredQuery`.

**Quan trọng khi tạo migration mới:** Vercel không chạy `prisma migrate deploy` cho Turso trong build. Migration mới tạo bằng `npx prisma migrate dev` **bắt buộc** phải được thêm thủ công vào mảng `MIGRATIONS` trong [scripts/apply-migrations.mjs](scripts/apply-migrations.mjs) (đúng thứ tự timestamp), và SQL phải idempotent (`CREATE TABLE IF NOT EXISTS`...) vì script này tự chạy trong `npm run build`.

Prisma client được generate ra `src/generated/prisma/` (gitignored, import qua `@/generated/prisma`), không phải `node_modules/@prisma/client` mặc định.

### RAG pipeline (`src/lib/rag/`)

`chunker.ts` (chunk theo heading tiếng Việt) → `embedder.ts` (OpenAI `text-embedding-3-small`) chạy lúc ingest tài liệu (`/dashboard/documents`, qua `extractors/pdf.ts` dùng PDFParse v2 + `extractors/docx.ts` dùng mammoth). `query-rewriter.ts` và `topic-classifier.ts` gọi LLM riêng (nhỏ/nhanh) tách biệt khỏi model chat chính (`CHAT_MODEL` trong `openai.ts`). `vector-store.ts` chỉ query chunk của `Document` có `isActive=true` — tài liệu bị đánh dấu supersede (văn bản hết hiệu lực) sẽ không bao giờ được truy hồi dù vẫn còn trong DB. Nếu debug lỗi "chatbot trích văn bản đã hết hiệu lực", xem [[feedback-rag-outdated-quotes]] trước.

File gốc upload lưu Vercel Blob **private** (`blob.ts`), phục vụ lại qua `/api/serve-file` với Bearer token — không public URL trực tiếp.

### Dashboard (`/dashboard`)

Không dùng thư viện chart — mọi biểu đồ (`src/components/dashboard/charts/`) là SVG tự vẽ tay (donut, horizontal bar, monthly bar). Trang chính: `page.tsx` (KPI tổng quan), `sessions/` (lịch sử chat), `stats/` (thống kê theo range 7/30/90 ngày), `leads/` (quản lý lead từ chat), `documents/` (quản lý KB, upload/supersede), `unanswered/` (câu hỏi bot chưa trả lời được → nhân viên convert thành gợi ý bổ sung KB), `admin/users/` (phân quyền, chỉ admin).

### Branding

Luôn dùng "PC Điện Biên" / "Trợ lý AI" / tên đầy đủ "Công ty Điện lực Điện Biên" — **không** dùng "EVN Điện Biên" hay các biến thể EVN-first trong nội dung hiển thị cho người dùng (xem [[feedback-branding-pc-not-evn]]).

## Environment

Xem bảng đầy đủ trong [README.md](README.md#env-cần-chuẩn-bị). Biến bắt buộc để chạy dev: `DATABASE_URL` (mặc định `file:./dev.db`), `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `OPENAI_API_KEY`, `NEXT_PUBLIC_APP_URL`, `RATE_LIMIT_SALT`. `BLOB_READ_WRITE_TOKEN` và `CLERK_WEBHOOK_SECRET` chỉ cần khi test tính năng KB upload / webhook Clerk.

Deploy trên Vercel — nhớ bật scope **Preview** cho các biến này (không chỉ Production) để PR build không fail, xem [[references-vercel-preview-env]].
