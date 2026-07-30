# Thiết kế: Ghi nhớ thông tin riêng theo người dùng (User Memory Notes)

Ngày: 2026-07-30

## Bối cảnh

Hiện tại chatbot `/chat` không có cách nào để một người dùng (kể cả quay lại nhiều lần trên cùng trình duyệt) yêu cầu bot ghi nhớ thông tin cá nhân của họ (địa chỉ, loại công tơ, v.v.) để dùng ở các lần chat sau. Bộ nhớ hiện có chỉ là lịch sử trong 1 `ChatSession` (20 message gần nhất).

Hệ thống đã có sẵn cơ chế định danh khách vãng lai quay lại: cookie `evn_chat_anon_id` (httpOnly, 1 năm) → `anonymousId` gắn vào mỗi `ChatSession` ([src/lib/anonymous-id.ts](../../../src/lib/anonymous-id.ts)). Người dùng đã đăng nhập Clerk dùng `clerkUserId` thay thế (2 trường loại trừ nhau, xem [route.ts:59](../../../src/app/api/chat/route.ts:59)).

**Phạm vi thiết kế này:** chỉ tính năng "nhớ riêng theo user". Tính năng "đóng góp vào KB chung" (thông tin do khách khai trở thành kiến thức cho mọi người) được xác định là một sub-project riêng, KHÔNG nằm trong phạm vi spec này.

## Mục tiêu

- Người dùng có thể chủ động yêu cầu chatbot ghi nhớ một thông tin (vd "nhớ giúp tôi ở phường Mường Thanh, dùng công tơ 1 pha").
- Thông tin này được dùng để cá nhân hoá câu trả lời ở các lần chat sau, **cùng trình duyệt/tài khoản đó** (không ảnh hưởng người dùng khác).
- Người dùng có thể xem lại và xóa (từng mục hoặc toàn bộ) thông tin đã lưu, ngay trong hội thoại chat.
- Cơ chế ghi nhớ **chỉ kích hoạt khi người dùng yêu cầu rõ ràng** — không tự động trích xuất từ hội thoại thông thường.

## Ngoài phạm vi (out of scope)

- Tự động trích xuất thông tin từ hội thoại mà không cần user yêu cầu.
- Đóng góp thông tin vào Knowledge Base chung cho mọi người dùng khác.
- Gộp danh tính khi 1 khách chuyển từ ẩn danh sang đăng nhập Clerk (note cũ theo `anonymousId` sẽ không tự động chuyển sang `clerkUserId` mới).
- Quản lý note qua `/dashboard` (chỉ quản lý qua lệnh chat ở bản này).

## Data model

Thêm bảng mới trong `prisma/schema.prisma`, không sửa bảng nào hiện có:

```prisma
model UserMemoryNote {
  id          String   @id @default(cuid())
  anonymousId String?
  clerkUserId String?
  content     String
  createdAt   DateTime @default(now())

  @@index([anonymousId])
  @@index([clerkUserId])
}
```

- Owner key: `anonymousId` HOẶC `clerkUserId`, theo đúng logic loại trừ đang dùng cho `ChatSession`.
- Giới hạn cứng **20 note/owner**. Khi đã đủ 20, yêu cầu "nhớ giúp tôi..." mới sẽ bị từ chối kèm thông báo "Bạn đã lưu đủ 20 thông tin, hãy xóa bớt trước khi thêm mới" — không tự động xóa note cũ để tránh mất dữ liệu ngầm.
- Migration mới phải được thêm thủ công vào mảng `MIGRATIONS` trong [scripts/apply-migrations.mjs](../../../scripts/apply-migrations.mjs) theo đúng convention hiện có của dự án (SQL idempotent `CREATE TABLE IF NOT EXISTS`).

## Luồng xử lý trong `/api/chat`

Vị trí chèn: ngay sau bước `moderate()` hiện tại ([route.ts:54-57](../../../src/app/api/chat/route.ts:54-57)), trước khi tạo/lấy `ChatSession`.

### Bước 1 — Lọc từ khóa (rẻ, không gọi LLM)

Kiểm tra `body.message` (không phân biệt hoa/thường, bỏ dấu để bắt biến thể) có chứa các cụm gợi ý lệnh bộ nhớ hay không, vd: "nhớ giúp", "ghi nhớ", "lưu lại giúp", "quên giúp", "quên hết", "xóa thông tin đã lưu", "xem thông tin đã lưu", "bạn đang nhớ gì", "thông tin đã lưu".

- **Không khớp** → bỏ qua toàn bộ, chạy pipeline hiện tại như cũ. 0 chi phí thêm.
- **Khớp** → xác định owner (`anonymousId` hoặc `clerkUserId`, tái dùng logic dòng 59), rẽ nhánh xử lý lệnh (bước 2), và **kết thúc bằng response ngay trong nhánh này** (giống cách nhánh `moderate()` trả `streamOneShot` và return, không đi tiếp vào RAG/chat chính).

### Bước 2 — Phân loại & xử lý lệnh

Một hàm LLM nhỏ mới (cùng pattern với `src/lib/rag/query-rewriter.ts` / `src/lib/rag/topic-classifier.ts` — model nhỏ/nhanh, tách biệt khỏi `CHAT_MODEL`) nhận vào `body.message` và danh sách note hiện có của owner, trả về 1 trong các kết quả:

| Kết quả LLM | Hành động |
|---|---|
| `NOT_A_MEMORY_COMMAND` | Không phải lệnh ghi nhớ thật sự (false positive ở bước từ khóa) → bỏ qua nhánh này, tiếp tục pipeline chat bình thường như không có gì xảy ra. |
| `VIEW` | Query DB, liệt kê toàn bộ note của owner dạng gạch đầu dòng, trả lời qua `streamOneShot` (không cần gọi `CHAT_MODEL`). Nếu rỗng → "Hiện chưa có thông tin nào được lưu." |
| `SAVE(content)` | Nếu owner đã có 20 note → từ chối kèm hướng dẫn xóa bớt. Ngược lại: LLM rút gọn câu thành 1 note súc tích, `prisma.userMemoryNote.create(...)`, xác nhận qua `streamOneShot`. |
| `FORGET_SPECIFIC(noteIds)` | LLM so khớp yêu cầu với danh sách note hiện có, trả về id note khớp. Nếu khớp rõ ràng → xóa, xác nhận. Nếu không chắc/không tìm thấy → hỏi lại user, không đoán bừa. |
| `FORGET_ALL` | Xóa toàn bộ note của owner, xác nhận. |

Toàn bộ nhánh 2 dùng `streamOneShot` có sẵn trong file, không đụng vào luồng `historyForLLM`/RAG.

### Bước 3 — Chèn note vào system prompt (áp dụng khi KHÔNG phải lệnh bộ nhớ, tức luồng chat bình thường)

Sau khi `systemPrompt` được xác định (dù nhánh `SYSTEM_PROMPT_MVP` hay nhánh RAG, [route.ts:94-117](../../../src/app/api/chat/route.ts:94-117)), thêm bước: load note của owner. Nếu danh sách không rỗng, nối thêm đoạn:

```
THÔNG TIN KHÁCH HÀNG ĐÃ YÊU CẦU GHI NHỚ (từ các lần chat trước):
- <note 1>
- <note 2>
...

Dùng thông tin này để cá nhân hoá câu trả lời khi liên quan. Không tự nhắc lại nếu không cần thiết.
```

Đặt logic này trong 1 helper dùng chung cho cả 2 nhánh prompt (vd `getUserMemoryBlock(ownerKey)` trong file mới `src/lib/memory/user-memory.ts`), gọi theo cùng cách `formData` đang được nối thêm vào `systemPrompt` ở [route.ts:119-138](../../../src/app/api/chat/route.ts:119-138).

## Edge cases đã quyết định

- **Chuyển từ ẩn danh sang đăng nhập Clerk**: note cũ theo `anonymousId` không tự động gộp sang `clerkUserId` mới. Chấp nhận giới hạn này ở bản đầu (nằm trong "Ngoài phạm vi").
- **Từ khóa bắt nhầm** (vd câu hỏi thường chứa từ "nhớ"/"quên"): bước LLM nhỏ ở Bước 2 sẽ trả `NOT_A_MEMORY_COMMAND` và pipeline quay lại luồng chat bình thường — false positive chỉ tốn thêm 1 lần gọi LLM nhỏ, không làm sai nội dung trả lời cuối cùng.
- **Giới hạn 20 note**: từ chối lưu thêm khi đầy, không tự động xóa note cũ.
- **Xóa nhầm**: nếu LLM không chắc chắn note nào khớp với yêu cầu "quên giúp tôi X", hệ thống hỏi lại thay vì tự chọn.

## File/thay đổi liên quan (ước lượng)

- `prisma/schema.prisma`: thêm model `UserMemoryNote`.
- 1 migration mới (`npx prisma migrate dev`) + entry mới trong `scripts/apply-migrations.mjs`.
- `src/lib/memory/user-memory.ts` (mới): CRUD note + `getUserMemoryBlock(ownerKey)` + hàm phân loại lệnh bằng LLM nhỏ.
- `src/app/api/chat/route.ts`: thêm bước lọc từ khóa + rẽ nhánh lệnh bộ nhớ (sau `moderate()`), thêm gọi `getUserMemoryBlock` khi build `systemPrompt`.

Không sửa bảng Prisma nào hiện có, không đổi hành vi luồng chat bình thường khi không có lệnh bộ nhớ.

## Kiểm thử thủ công (smoke test)

1. Gõ "nhớ giúp tôi ở phường Mường Thanh, dùng công tơ 1 pha" → nhận xác nhận đã lưu, không trả lời tư vấn kèm theo.
2. Mở lại chat (cùng trình duyệt, session mới) hỏi 1 câu liên quan (vd giá điện sinh hoạt) → câu trả lời có tham chiếu đến thông tin đã lưu khi phù hợp.
3. Gõ "xem thông tin đã lưu" → liệt kê đúng note đã lưu ở bước 1.
4. Gõ "quên giúp tôi thông tin về công tơ" → note tương ứng bị xóa, note khác (nếu có) vẫn còn.
5. Gõ "quên hết thông tin đã lưu" → toàn bộ note bị xóa, bước "xem thông tin đã lưu" trả về rỗng.
6. Gõ câu chứa từ "nhớ" nhưng không phải lệnh ghi nhớ (vd "mấy ngày ghi số công tơ điện, nhớ là...") → chatbot trả lời bình thường, không lưu note sai.
7. Lưu đủ 20 note, thử lưu thêm → nhận thông báo từ chối, hướng dẫn xóa bớt.
