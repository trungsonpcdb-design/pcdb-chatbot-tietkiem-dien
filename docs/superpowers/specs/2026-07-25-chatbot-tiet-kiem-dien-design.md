# Thiết kế: Chatbot AI tư vấn Tiết kiệm điện & Điện mặt trời mái nhà

- **Ngày:** 2026-07-25
- **Chủ đầu tư:** Công ty Điện lực Điện Biên (PC Điện Biên) — EVNNPC
- **Tên dự án đề xuất:** `chatbot-tiet-kiem-dien`
- **Phạm vi:** Web app độc lập, phase 1 pilot nội bộ

---

## 1. Mục tiêu & Đối tượng

**Mục tiêu:** Xây dựng một chatbot AI trên web để:
1. Tư vấn khách hàng cách sử dụng điện tiết kiệm (hộ gia đình + doanh nghiệp/sản xuất).
2. Tư vấn khách hàng lắp đặt điện mặt trời mái nhà (kỹ thuật + tài chính + thủ tục).
3. Hỗ trợ nhân viên PC Điện Biên có công cụ tra cứu, thu thập lead, và cải thiện chất lượng tư vấn.

**Đối tượng người dùng:**
- **Khách hàng ngoài** — hộ dân, doanh nghiệp. Truy cập công khai, không cần đăng ký.
- **Nhân viên PC Điện Biên** — đăng nhập Clerk để vào dashboard quản lý.

**Chủ đề bao phủ (6 topic):**
1. Tiết kiệm điện sinh hoạt (`TIET_KIEM_SH`)
2. Tiết kiệm điện doanh nghiệp/sản xuất (`TIET_KIEM_DN`)
3. Điện mặt trời mái nhà — kỹ thuật (`DMTMN_KY_THUAT`)
4. Điện mặt trời mái nhà — tài chính (`DMTMN_TAI_CHINH`)
5. Tính hóa đơn tiền điện (`TINH_HOA_DON`)
6. Thủ tục hành chính ĐMTMN (`THU_TUC`)

---

## 2. Kiến trúc tổng thể

```
┌───────────────────────────────┐
│  Khách hàng ngoài (ẩn danh)   │──► Trang /chat công khai (cookie anonymousId)
└───────────────────────────────┘         │
                                          │
┌───────────────────────────────┐         │
│  Nhân viên PC Điện Biên       │──► Clerk Auth ──► Dashboard /dashboard/*
└───────────────────────────────┘         │              (lead, session, KB, stats)
                                          │
                                          ▼
                     ┌────────────────────────────────────┐
                     │  Next.js 16 App Router (Vercel)     │
                     │  ─ API /chat (SSE streaming)        │
                     │  ─ API /leads, /documents, /stats   │
                     └────────────────────────────────────┘
                                          │
                        ┌─────────────────┼──────────────────┐
                        ▼                 ▼                  ▼
                  ┌───────────┐    ┌────────────┐     ┌─────────────┐
                  │ OpenAI    │    │ Turso libsql│     │ Vercel Blob │
                  │ GPT-4o-   │    │ + vector    │     │ (private)   │
                  │ mini      │    │ embeddings  │     │ file gốc PDF│
                  │ +embedding│    │             │     │             │
                  └───────────┘    └────────────┘     └─────────────┘
```

**Stack cố định:**
- Next.js 16 App Router + Tailwind CSS v4 + shadcn/ui + lucide-react + sonner
- Clerk auth (v7) — chỉ bảo vệ `/dashboard/*`; `/chat` mở công khai
- Prisma 7 + Turso libsql (SQLite dialect)
- OpenAI SDK — model `gpt-4o-mini` (chat), `text-embedding-3-small` (vector 1536 dim)
- Vercel Blob (private) — lưu file gốc PDF/Word
- Vector store: cột `Bytes` trong Turso, cosine similarity in-memory (< 5.000 chunks) — có thể migrate sang Pinecone/libsql-vector index sau
- Streaming trả lời qua Server-Sent Events (SSE)

**Thương hiệu:**
- Màu chính `#0066B3` (xanh EVN chuẩn)
- Màu phụ `#F58220` (cam EVN)
- Font system, không load font ngoài

**Ước tính chi phí phase 1 (pilot 50 người/ngày, ~200 câu/ngày):**
- OpenAI: ~$5-15/tháng
- Vercel Hobby: $0
- Turso free tier: $0
- Clerk free tier: $0 (đủ 10k MAU)
- Vercel Blob free: $0 (đủ 500 MB)
- **Tổng: ~130-380k VND/tháng**

---

## 3. Data model (Prisma schema)

```prisma
// Đơn vị (seed cố định 11 đơn vị PC Điện Biên)
model Unit {
  id        String   @id @default(cuid())
  name      String   @unique
  code      String   @unique
  users     User[]
  leads     Lead[]
  createdAt DateTime @default(now())
}

model User {
  id         String   @id @default(cuid())
  clerkId    String   @unique
  email      String   @unique
  fullName   String
  role       String   @default("user")     // "admin" | "user"
  unitId     String
  unit       Unit     @relation(fields: [unitId], references: [id])
  createdAt  DateTime @default(now())
}

model ChatSession {
  id              String   @id @default(cuid())
  anonymousId     String?
  clerkUserId     String?
  ipHash          String?
  userAgent       String?
  startedAt       DateTime @default(now())
  lastMessageAt   DateTime @default(now())
  messageCount    Int      @default(0)
  messages        Message[]
  lead            Lead?
  rating          SessionRating?
  @@index([anonymousId])
  @@index([startedAt])
}

model Message {
  id         String       @id @default(cuid())
  sessionId  String
  session    ChatSession  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  role       String                          // "user" | "assistant" | "system"
  content    String
  citations  String?                         // JSON: [{docId, chunkId, snippet, page}]
  formData   String?                         // JSON dữ liệu form
  topicTag   String?
  tokensIn   Int?
  tokensOut  Int?
  latencyMs  Int?
  createdAt  DateTime     @default(now())
  feedback   MessageFeedback?
  @@index([sessionId, createdAt])
}

model MessageFeedback {
  id         String    @id @default(cuid())
  messageId  String    @unique
  message    Message   @relation(fields: [messageId], references: [id], onDelete: Cascade)
  rating     String                            // "UP" | "DOWN"
  reason     String?                           // "SAI_THONG_TIN" | "KHONG_DU_CHI_TIET" | "KHAC"
  createdAt  DateTime  @default(now())
}

model SessionRating {
  id         String       @id @default(cuid())
  sessionId  String       @unique
  session    ChatSession  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  stars      Int                                // 1..5
  comment    String?
  createdAt  DateTime     @default(now())
}

model Lead {
  id            String       @id @default(cuid())
  sessionId     String       @unique
  session       ChatSession  @relation(fields: [sessionId], references: [id])
  fullName      String
  phone         String
  address       String?
  interestTopic String
  chatSummary   String
  status        String       @default("MOI")    // "MOI" | "DA_LIEN_HE" | "THANH_CONG" | "TU_CHOI"
  assignedUnit  String?
  unit          Unit?        @relation(fields: [assignedUnit], references: [id])
  assignedTo    String?
  note          String?
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  @@index([status, createdAt])
}

model Document {
  id              String        @id @default(cuid())
  title           String
  category        String                             // "PHAP_LY" | "GIA_DIEN" | "KY_THUAT" | "TIET_KIEM"
  sourceType      String                             // "PDF" | "DOCX" | "TXT" | "URL"
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
  chunks          DocumentChunk[]
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
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
}
```

### Danh mục 11 đơn vị (seed cố định)

```ts
export const UNIT_LIST = [
  { code: "DBP", name: "Điện lực Điện Biên Phủ" },
  { code: "TG",  name: "Điện lực Tuần Giáo" },
  { code: "TA",  name: "Điện lực Thanh An" },
  { code: "NS",  name: "Điện lực Na Sang" },
  { code: "NSN", name: "Điện lực Na Son" },
  { code: "TCH", name: "Điện lực Tủa Chùa" },
  { code: "MA",  name: "Điện lực Mường Ảng" },
  { code: "MN",   name: "Điện lực Mường Nhé" },
  { code: "XNCT", name: "Xí nghiệp Cao thế" },
  { code: "PXPD", name: "Phân xưởng phát điện" },
  { code: "KHN",  name: "Khách hàng ngoài" },
];
```

---

## 4. Kiến trúc RAG

### 4.1 Ingest pipeline

```
Admin upload PDF/DOCX
  → [1] Lưu Vercel Blob (private)
  → [2] Extract text (pdf-parse hoặc mammoth)
  → [3] Chunk 500-800 tokens, overlap 100, cắt theo heading khi có
  → [4] Embed từng chunk qua text-embedding-3-small (1536 dim)
  → [5] Lưu DocumentChunk với Bytes vector
  → [6] Document.status = "INDEXED"
```

Chi phí: ~$0.003/tài liệu 100 trang.

Xử lý bất đồng bộ: giới hạn phase 1 < 50 trang cho inline (60s Vercel Hobby). Tài liệu lớn hơn cần Vercel Pro hoặc job queue (phase sau).

### 4.2 Query pipeline

```
User gửi câu hỏi
  → [1] Rate limit (anon 20/IP/giờ; logged-in 100/user/giờ)
  → [2] Moderation guard (chặn off-topic, xúc phạm)
  → [3] Rewrite câu hỏi (nếu follow-up) — dùng GPT-4o-mini
  → [4] Embed câu hỏi
  → [5] Vector search: top-5 chunk (isActive=true) có cosine > 0.5
  → [6] Nếu chunk cao nhất < 0.35 → xin lỗi + gợi ý lead capture
                                    → log UnansweredQuery(NO_DOCUMENT_MATCH)
  → [7] Build prompt SYSTEM + TÀI LIỆU + LỊCH SỬ + câu hỏi
  → [8] Stream response về client qua SSE, song song lưu Message + citations
  → [9] Phân loại topic tag (7 giá trị) → cập nhật Message.topicTag
```

### 4.3 System prompt cốt lõi

```
Bạn là trợ lý AI của EVN Điện Biên (Công ty Điện lực Điện Biên).
Bạn CHỈ tư vấn về:
  - Tiết kiệm điện (hộ gia đình & doanh nghiệp)
  - Điện mặt trời mái nhà (kỹ thuật, tài chính, thủ tục)
  - Cách tính hóa đơn tiền điện

QUY TẮC BẮT BUỘC:
1. Trả lời NGẮN GỌN, dùng tiếng Việt tự nhiên, dễ hiểu cho người dân.
2. CHỈ dùng thông tin trong "TÀI LIỆU THAM KHẢO" bên dưới.
3. Chỉ tham chiếu văn bản CÒN HIỆU LỰC; nếu không chắc → khuyến nghị
   khách liên hệ nhân viên Điện lực để xác nhận.
4. Nếu tài liệu không đủ để trả lời, nói rõ "Tôi chưa có đủ thông tin"
   và đề nghị khách để lại SĐT để nhân viên gọi lại.
5. Cuối câu, chèn citation dạng [1], [2] theo thứ tự chunk đã dùng.
6. KHÔNG bịa số liệu, không tự đưa ra khuyến nghị pháp lý ngoài văn bản.

TÀI LIỆU THAM KHẢO:
[1] {chunk1.content}
    (Nguồn: {doc1.title}, hiệu lực từ {effectiveFrom}, trang {pageNumber})
[2] ...
```

### 4.4 Công thức tính nhanh ĐMTMN (hard-code trong prompt khi có form_data)

- Công suất khuyến nghị (kWp) ≈ hóa đơn tháng (VNĐ) / 300.000
- Diện tích cần ≈ công suất (kWp) × 7 m² (panel 550W)
- Sản lượng ước tính ≈ công suất × 4 kWh/ngày (miền Bắc)
- Chi phí đầu tư ≈ công suất × 12 triệu VNĐ (giá TB 2026)
- Hoàn vốn ≈ chi phí / (tiết kiệm/tháng × 12)

Các công thức này là **ước tính sơ bộ**, LLM sẽ nhấn mạnh khách cần khảo sát thực tế.

### 4.5 Quản lý hiệu lực văn bản

- Admin không hard-code số hiệu văn bản trong code — mọi văn bản upload qua UI.
- Khi có văn bản mới thay thế: upload → chọn văn bản cũ → set `supersededById` + `isActive=false` cho cũ.
- RAG chỉ query các chunk thuộc `Document.isActive = true`.
- Dashboard cảnh báo tài liệu > 12 tháng chưa được review.

---

## 5. UI/UX

### 5.1 Khu vực công khai `/chat`

- Header EVN xanh #0066B3 + logo + tiêu đề "EVN Điện Biên — Trợ lý AI Tiết kiệm điện & ĐMTMN"
- Trang chủ: welcome + 4 câu hỏi gợi ý phổ biến (grid 2x2)
- Chat bubble: user bên phải xanh, assistant bên trái xám nhạt
- Mỗi assistant message có:
  - Nút "📎 Xem nguồn" (mở popover hiện snippet + tên tài liệu + trang)
  - Nút 👍 / 👎 (bấm gửi luôn, 👎 mở modal chọn lý do)
- Input cố định dưới cùng + nút "Gửi" (cam #F58220)
- Cuối phiên (đóng tab / im lặng 5 phút / bấm "Kết thúc chat"):
  - Modal rating 5 sao + comment tùy chọn
  - Nếu chưa có lead + user quan tâm ĐMTMN → hỏi "Bạn muốn nhân viên gọi lại tư vấn?"

### 5.2 Form thu thập thông tin ĐMTMN inline

Chatbot phát hiện thiếu dữ liệu → sinh marker `<FORM_DMTMN/>` → client render form:
- Diện tích mái (m²) — number
- Hướng mái — select (Nam, Đông Nam, Tây Nam, Đông, Tây, Bắc)
- Loại mái — select (Tôn, Bê tông, Ngói)
- Hóa đơn TB/tháng (VNĐ) — number
- Nút "Tính toán" → gửi lại message với metadata form_data

### 5.3 Khu vực nhân viên `/dashboard`

- **Sidebar trái:** Tổng quan | Lead | Lịch sử chat | Tài liệu (KB) | Câu hỏi chưa trả lời | Cài đặt | (Admin: Users)
- **`/dashboard`** — 4 KPI cards (Phiên chat / Câu hỏi / Lead mới / Hài lòng 👍) + biểu đồ cột 7 ngày + top chủ đề
- **`/dashboard/leads`** — table filter theo status/đơn vị, cột hành động (Đã liên hệ, Gán nhân viên)
- **`/dashboard/leads/[id]`** — chi tiết lead + full chat gốc + ô ghi chú
- **`/dashboard/sessions`** — table filter theo ngày, có link vào từng session để review
- **`/dashboard/documents`** — table tài liệu + nút Upload + nút Supersede + trạng thái hiệu lực
- **`/dashboard/unanswered`** — table câu hỏi chatbot chưa trả lời (LOW_CONFIDENCE / NO_DOCUMENT_MATCH) để admin bổ sung tài liệu
- **Phân quyền:**
  - `user` (role mặc định) — xem tất cả các trang trên, xem lead
  - `admin` — thêm `/dashboard/admin/users` để phân quyền + `/dashboard/admin/settings`

Biểu đồ vẽ tay SVG/CSS, không dùng chartlib nặng.

---

## 6. Cấu trúc thư mục

Xem chi tiết ở Section 5.A của brainstorm — tóm tắt các folder chính:

```
src/
├── app/
│   ├── chat/                # công khai
│   ├── dashboard/           # Clerk protected
│   ├── sign-in/, sign-up/   # Clerk pages
│   └── api/                 # chat, leads, documents, stats, webhooks
├── components/
│   ├── ui/                  # shadcn primitives
│   ├── chat/                # chat UI (bubble, input, form, modal)
│   ├── dashboard/           # sidebar, KPI, charts
│   └── shared/
├── lib/
│   ├── prisma.ts
│   ├── openai.ts
│   ├── rag/                 # chunker, embedder, vector-store, prompt-builder
│   ├── extractors/          # pdf, docx
│   ├── blob.ts, rate-limit.ts, moderation.ts, auth.ts
│   └── constants.ts         # UNIT_LIST, TOPIC_TAGS
└── generated/prisma/

prisma/
├── schema.prisma
└── migrations/

scripts/
├── apply-migrations.mjs     # Turso migration runner idempotent
└── seed-units.mjs           # Seed 11 đơn vị
```

---

## 7. Lộ trình 4 milestone

| # | Nội dung | Thời gian dự kiến | Deliverable |
|---|----------|-------------------|-------------|
| M1 | MVP chat công khai — Next.js + Clerk + Prisma + OpenAI (không RAG, prompt hard-code kiến thức chung) | Tuần 1-2 | Link chat trên Vercel, khách test được |
| M2 | RAG + Knowledge Base — upload PDF/DOCX, ingest, vector search, citation, supersede | Tuần 3-4 | Chatbot trả lời dựa văn bản thật |
| M3 | UX nâng cao + Lead — gợi ý câu hỏi, form ĐMTMN, feedback 👍/👎, rating 5 sao, lead capture, dashboard `/leads` | Tuần 5-6 | Nhân viên nhận và xử lý lead |
| M4 | Dashboard & Analytics — KPI, biểu đồ, lịch sử session, unanswered, admin/users | Tuần 7-8 | Vận hành đầy đủ, có số liệu |

---

## 8. Danh sách tài liệu chuẩn cần nạp (theo chủ đề)

**Nhóm 1 — Pháp lý & Chính sách ĐMTMN:**
- Nghị định về cơ chế khuyến khích ĐMTMN tự sản, tự tiêu (bản mới nhất còn hiệu lực)
- Thông tư hướng dẫn Nghị định trên
- Quyết định biểu giá bán lẻ điện hiện hành (bậc thang)
- Thông tư về mua bán điện với hệ ĐMTMN
- Luật Điện lực & văn bản sửa đổi hiện hành

**Nhóm 2 — Kỹ thuật:**
- TCVN hiện hành về hệ ĐMTMN nối lưới
- Quy trình đấu nối ĐMTMN của EVN
- Catalog panel/inverter phổ biến (Longi, JA, Trina, Huawei, Sungrow, Solis, Deye)

**Nhóm 3 — Tiết kiệm điện:**
- Cẩm nang tiết kiệm điện EVN (bản mới nhất)
- Hướng dẫn tiết kiệm điện cho hộ gia đình — Bộ Công Thương
- Hướng dẫn tiết kiệm cho doanh nghiệp vừa và nhỏ

**Nhóm 4 — Nội bộ EVN Điện Biên:**
- Quy trình tiếp nhận hồ sơ ĐMTMN của PC Điện Biên
- Danh bạ liên hệ các Điện lực huyện
- FAQ tổng đài đã tổng hợp

**Tối thiểu để chatbot hoạt động phase 2:** 4 tài liệu — nghị định ĐMTMN mới nhất, thông tư hướng dẫn, biểu giá bán lẻ điện hiện hành, cẩm nang tiết kiệm EVN.

**Lưu ý quan trọng:** Không hard-code số hiệu văn bản trong code — số hiệu do admin nhập khi upload. Kiến thức LLM đến 8/2025, không đủ chính xác để đoán văn bản 2026.

---

## 9. Rủi ro & Mitigation

| Rủi ro | Mitigation |
|--------|-----------|
| OpenAI charge quá mức do bị spam | Rate limit IP + max token/message + budget alert OpenAI |
| Chatbot "chém gió" ngoài văn bản | System prompt strict + guard rail + feedback 👎 để phát hiện |
| Văn bản hết hiệu lực nhưng chưa cập nhật | `effectiveTo` + `supersededBy` + dashboard cảnh báo > 12 tháng chưa review |
| Vercel Hobby timeout 60s cho tài liệu lớn | Giới hạn upload < 50 trang phase 1; nâng Pro nếu cần |
| Tiếng Việt dấu bị vỡ trong tên file Blob | Sanitize pathname + `filename*=UTF-8''` khi serve |
| Rò rỉ credential lên Git | `.gitignore` chặt, scan file trước commit |
| Câu hỏi sensitive về giá (khách hỏi giá lắp trọn gói) | Chatbot chỉ ước tính; luôn khuyến nghị liên hệ nhân viên chốt giá thực tế |

---

## 10. ENV variables

```dotenv
DATABASE_URL="libsql://chatbot-<...>.turso.io"
TURSO_AUTH_TOKEN=""

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...

OPENAI_API_KEY=sk-...

BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...

NEXT_PUBLIC_APP_URL=https://chatbot-tiet-kiem-dien.vercel.app
RATE_LIMIT_SALT="<random 32 chars>"
```

Bạn (user) chuẩn bị trước:
1. Vercel account + Turso account + Clerk app + OpenAI account (nạp $10 tối thiểu) + Vercel Blob private store
2. Danh sách tối thiểu 4 văn bản (mục 8) — tìm bản có hiệu lực tại thời điểm 07/2026
3. Logo EVN chất lượng cao (SVG hoặc PNG > 512px)

---

## 11. Ngoài phạm vi phase 1 (backlog)

- Nhúng widget vào website hiện có của PC Điện Biên (Zalo Mini App, Facebook Messenger)
- Voice input/output (STT/TTS)
- Upload ảnh (vision) — phân tích ảnh mái nhà / hóa đơn giấy
- Live handoff — nhân viên chat trực tiếp thay chatbot khi cần
- Đánh giá chất lượng câu trả lời (admin viết câu chuẩn để retrain)
- Tool calling (chatbot tự gọi function tính tiền điện chính xác thay vì LLM tự tính)
- Multi-tenant — cho các PC tỉnh khác dùng chung platform
