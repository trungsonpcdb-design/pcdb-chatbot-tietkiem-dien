# Chat UI Redesign — Hero + Bubble + Animation

**Ngày:** 2026-10-06
**Phạm vi:** Trang `/chat` công khai (end-user). Không đụng dashboard, header EVN, backend, RAG, scripts.
**Thời gian ước tính:** 1.5 tuần.

## Bối cảnh

Hội đồng bảo vệ sáng kiến (2026-10-06) chê giao diện trang chat ở 4 điểm:
1. Trông quá đơn giản/thô sơ, chưa đủ nhận diện EVN/PC Điện Biên.
2. Thiếu màn hình chào/giới thiệu khi mới vào.
3. Bubble chat và layout nhìn chán, giống template.
4. Thiếu hiệu ứng/animation — nhìn tĩnh.

Thiết kế này giải quyết cả 4 điểm bằng **hướng hỗn hợp "EVN chính thống + AI-feel"**: giữ nguyên nhận diện EVN (header, màu xanh, logo PC Điện Biên) + thêm hero screen có avatar glow, bubble chat nâng cấp, typing indicator, fade-in animation.

## Nguyên tắc

- **Không phá luồng cũ:** picker / quick-reply / free-text / RAG / voice đều hoạt động y hệt. Thay đổi hoàn toàn ở lớp view.
- **Không thêm dependency:** chỉ Tailwind + CSS keyframe thuần. Không framer-motion, không library animation.
- **Giữ nguyên header EVN** (`src/components/shared/evn-header.tsx`) — đã có logo + 2 tiêu đề + slogan "Thắp sáng niềm tin" + nút "Nhân viên đăng nhập". Chỉ redesign vùng chat bên dưới header.
- **Giữ nguyên 2 tiêu đề:** "Trợ lý AI của Công ty Điện lực Điện Biên" và "Tư vấn sử dụng điện tiết kiệm và điện mặt trời mái nhà" (yêu cầu user).

## Luồng người dùng mới

**Trước:** Vào `/chat` → thấy ngay bong bóng bot picker đầu tiên với 5 nút chọn chủ đề.

**Sau:**
```
/chat (lần đầu, messages.length === 0)
  ├─ EvnHeader (giữ nguyên)
  └─ HeroWelcome (chiếm vùng chat):
       ├─ Avatar bot 96×96 với 2 lớp glow pulse
       ├─ Title: "Xin chào! Tôi là Trợ lý AI của Công ty Điện lực Điện Biên"
       ├─ Subtitle: "Hỏi tôi về tiết kiệm điện, ĐMTMN, giá điện, CSKH"
       └─ 5 SuggestionCard tương ứng 5 entry của PICKER_ENTRIES:
            • 🏠 Tư vấn tiết kiệm điện trong gia đình → switch script `home-savings`
            • 🏢 Tư vấn tiết kiệm điện trong Văn phòng, tòa nhà, công nghiệp → `office`
            • ☀️ Tư vấn Điện mặt trời mái nhà → `solar`
            • 💵 Tra cứu giá bán điện → `pricing`
            • 📞 Liên hệ CSKH → `cskh`

Interaction:
  - Bấm card → hero fade-out 200ms → script tương ứng khởi động (như bấm nút picker cũ)
  - Gõ chat free-text → hero fade-out 200ms → gọi /api/chat như hiện tại
  - Sau khi hero biến mất, KHÔNG quay lại được trong session đó (giống ChatGPT)
```

**Khôi phục menu chủ đề sau khi hero đã biến mất:** không có đường quay về picker trong session đó — user phải refresh trang (giống ChatGPT). Không bổ sung nút footer để không làm bẩn input bar. Nếu phase 2 cần, mới thêm.

## Component mới

### HeroWelcome (`src/components/chat/hero-welcome.tsx`)

Props:
```ts
{ onPickTopic: (scriptId: string, label: string) => void }
```

Render:
- Container: `flex flex-col items-center justify-center flex-1 px-4 py-8 gap-6`
- Avatar wrapper 96×96 với 2 lớp glow:
  - Lớp 1 (sát): `absolute inset-0 rounded-full bg-[color:var(--color-evn-blue)] opacity-30 blur-xl animate-pulse` (period 2s)
  - Lớp 2 (ngoài): `absolute inset-[-8px] rounded-full bg-[color:var(--color-evn-cyan-glow)] opacity-20 blur-2xl animate-pulse` (period 3s qua `animation-duration: 3s`)
  - Avatar ảnh `z-10`: `<Image src="/bot-avatar.png" width={96} height={96} className="relative z-10 rounded-full ring-2 ring-white shadow-lg" />`
- Title: `text-2xl sm:text-3xl font-bold text-[color:var(--color-evn-blue-dark)] text-center max-w-xl`
- Subtitle: `text-sm sm:text-base text-slate-600 text-center max-w-xl`
- Grid card:
  - Desktop (`sm:`): `grid grid-cols-2 gap-3 max-w-2xl w-full`. Card 5 (CSKH) `sm:col-span-2`.
  - Mobile: `grid grid-cols-1 gap-2 w-full`.
  - Map `PICKER_ENTRIES` → `<SuggestionCard>`.

### SuggestionCard (`src/components/chat/suggestion-card.tsx`)

Props:
```ts
{ icon: string; label: string; onClick: () => void; className?: string }
```

Phân tách emoji ra khỏi label để render size riêng. Ví dụ `"🏠 Tư vấn tiết kiệm điện trong gia đình"` tách thành `icon="🏠"` + `label="Tư vấn tiết kiệm điện trong gia đình"`.

Render:
```html
<button class="group flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-4 text-left
               shadow-sm transition-all duration-200
               hover:border-[color:var(--color-evn-blue)] hover:shadow-md hover:-translate-y-0.5">
  <span class="text-2xl transition-transform duration-200 group-hover:scale-110">{icon}</span>
  <span class="text-sm font-medium text-slate-800">{label}</span>
</button>
```

### TypingIndicator (`src/components/chat/typing-indicator.tsx`)

Render 3 chấm nhảy sóng:
```html
<div class="flex items-center gap-1 py-1">
  <span class="typing-dot w-2 h-2 rounded-full bg-slate-400" style="animation-delay: 0ms"></span>
  <span class="typing-dot w-2 h-2 rounded-full bg-slate-400" style="animation-delay: 150ms"></span>
  <span class="typing-dot w-2 h-2 rounded-full bg-slate-400" style="animation-delay: 300ms"></span>
</div>
```

Keyframe `bounce-dot` và class `.typing-dot` khai báo trong `globals.css` (xem bên dưới).

## Component sửa

### ChatContainer (`src/components/chat/chat-container.tsx`)

Thay đổi:
1. **Bỏ khởi tạo picker ở mount:** đổi `useState<ChatMessage[]>(() => [buildScriptMessage(rootNode)])` → `useState<ChatMessage[]>(() => [])`.
2. Thêm state `const [showHero, setShowHero] = useState(messages.length === 0)`.
3. Hàm mới `handleHeroPick(scriptId: string, label: string)`:
   - `setShowHero(false)`
   - Dựng synthetic `ScriptButton`: `{ label, action: { type: "switch", scriptId } }` và gọi lại `handleQuickReply(syntheticBtn)` — tránh duplicate logic switch/load/push.
4. Trong `send()` và `sendForm()`: thêm `setShowHero(false)` ở đầu.
5. Trong `handleQuickReply()`: thêm `setShowHero(false)` phòng khi hero vẫn còn (edge case).
6. Truyền `showHero={showHero}` và `onHeroPick={handleHeroPick}` xuống `<MessageList>`.
7. Logic greeting speech (useEffect dòng 52–81): giữ nguyên; chạy đè lên hero cũng ok vì chỉ nói chào.

### MessageList (`src/components/chat/message-list.tsx`)

Thay đổi:
1. Thêm props: `showHero: boolean`, `onHeroPick: (scriptId, label) => void`.
2. Nếu `showHero && messages.length === 0` → render `<HeroWelcome onPickTopic={onHeroPick} />` thay cho map messages.
3. Nếu không → render list như hiện tại.
4. Giữ nguyên scroll logic.

### MessageBubble (`src/components/chat/message-bubble.tsx`)

Thay đổi:
1. Wrapper ngoài cùng (`<div class="flex flex-col ...">`): thêm class `animate-bubble-in`.
2. Bubble bot: đổi class từ `bg-slate-100 text-slate-900 rounded-bl-md` → `bg-white border border-slate-200 shadow-sm text-slate-800 rounded-bl-md`. Padding `px-4 py-3` (hiện `py-2.5`).
3. Bubble user: đổi class từ `bg-[color:var(--color-evn-blue)] text-white rounded-br-md` → `bg-gradient-to-br from-[color:var(--color-evn-blue)] to-[color:var(--color-evn-blue-dark)] text-white shadow-md rounded-br-md`.
4. Avatar nhỏ (block `w-9 h-9` dòng 117): thêm wrapper position-relative; khi `message.pending && !message.scripted`, render thêm `<span class="absolute inset-[-4px] rounded-full bg-[color:var(--color-evn-cyan-glow)] opacity-30 blur-md animate-pulse pointer-events-none" />` ngay trước ảnh. Avatar `relative z-10`.
5. Khi `message.pending` và `textOnly === ""`: thay `"…"` bằng `<TypingIndicator />`.
6. Nút "Nghe" và feedback: giữ class, chỉ đổi `hover:bg-slate-100` → `hover:bg-blue-50`.

### QuickReplyButtons (`src/components/chat/quick-reply-buttons.tsx`)

Cần xem file hiện tại khi implement. Target:
- Pill `rounded-full border px-4 py-2 bg-white border-slate-300 text-sm text-slate-700`
- Hover `hover:border-[color:var(--color-evn-blue)] hover:bg-blue-50 hover:-translate-y-0.5`
- Transition `transition-all duration-150`
- Giữ nguyên emoji đầu label, không tách như SuggestionCard.

### globals.css (`src/app/globals.css`)

Thêm vào `@theme`:
```css
--color-evn-blue-light: #e0f2fe;
--color-evn-cyan-glow: #22d3ee;
--color-chat-surface: #ffffff;
```

Thêm cuối file (sau `body { ... }`):
```css
@keyframes bounce-dot {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-4px); }
}
.typing-dot {
  animation: bounce-dot 1s infinite;
  display: inline-block;
}

@keyframes fade-slide-up {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-bubble-in {
  animation: fade-slide-up 250ms ease-out;
}
```

Hero chuyển sang message list: **swap instant**, không animate hero-out. Lý do: message mới vào đã có `animate-bubble-in` fade-slide-up riêng, đủ cảm giác chuyển cảnh mượt mà. Pattern "render hero + delay unmount" phức tạp hơn, không đáng cho hiệu ứng chỉ 200ms. Nếu demo thấy chuyển cảnh cứng, mới cân nhắc thêm keyframe `hero-fade-out`.

## Màu + typography

Giữ nguyên font `system-ui`. Chỉ dùng 3 cấp text:
- Hero title: `text-2xl sm:text-3xl font-bold text-[color:var(--color-evn-blue-dark)]`
- Hero subtitle + card label: `text-sm sm:text-base text-slate-600` / `text-sm font-medium text-slate-800`
- Bubble: `text-sm leading-relaxed` (giữ)

Token màu mới (xem globals.css ở trên).

## Luồng dữ liệu

Không đổi. Hero chỉ là lớp view phía trước. Bấm card = gọi function trong ChatContainer tương đương `handleQuickReply` với action `switch` — giống hệt bấm nút picker. API, SSE, RAG, session, moderation, rate-limit đều nguyên vẹn.

## Error handling

Không có error path mới. Nếu `getScript(scriptId)` trả `null` (edge case khi `PICKER_ENTRIES` lệch với registry) → giữ fallback hiện tại: switch về PICKER_SCRIPT_ID + node `not-ready`.

## Testing

Smoke test thủ công:
1. Mở `/chat` → thấy hero với avatar glow, 5 card đúng thứ tự PICKER_ENTRIES.
2. Bấm từng card → chuyển vào script tương ứng, hero biến mất, user echo xuất hiện với tên chủ đề.
3. Mở `/chat` → gõ tin "Giá điện bậc 1 bao nhiêu?" → hero biến mất, bot stream câu trả lời RAG như cũ, có typing indicator 3 chấm trong khi chờ delta đầu tiên.
4. Mỗi tin nhắn mới (user/bot) có fade-slide-up khi xuất hiện.
5. Avatar bot nhỏ trong bubble có glow pulse khi `pending`, tắt khi stream xong.
6. Nút quick-reply hover thấy nhấc lên và viền xanh EVN.
7. Nút "Nghe" vẫn hoạt động, voice vẫn hoạt động, feedback/rating/lead vẫn trigger.
8. Test mobile (viewport 375): hero stack 1 cột, card đọc được, không tràn ngang.
9. Test với query param `?kb=solar` → bỏ qua hero, vào thẳng script solar (vì có `initialScriptId` khác picker — logic cần thêm điều kiện trong ChatContainer: `showHero` chỉ true khi `initialScriptId === PICKER_SCRIPT_ID`).

Không có test runner tự động trong repo.

## Phạm vi KHÔNG làm

- Dark mode
- Sidebar lịch sử chat
- Suggested questions động theo ngữ cảnh sau khi vào chat
- Thay avatar bot (giữ `/bot-avatar.png`)
- Dashboard, trang đăng nhập, trang pending
- Thêm framer-motion hoặc library animation khác
- Thay đổi logic RAG, prompt, scripts, voice hooks
- Thay đổi header EVN

## Rủi ro

1. **Hero biến mất mãi mãi sau first interaction, user không thấy picker nữa.** Chấp nhận — user gõ "menu" sẽ ra RAG trả lời. Nếu demo phàn nàn, phase 2 thêm nút footer.
2. **Avatar glow pulse có thể gây mỏi mắt / overexposed trên màn chiếu.** Opacity thấp (0.2–0.3) nên nhẹ. Nếu demo chê, giảm xuống 0.15.
3. **Mobile hero chiếm hết màn hình, phải scroll xuống thấy input.** Chấp nhận — bấm card là qua ngay.
4. **Script query param `?kb=solar` cần skip hero.** Đã note trong Testing #9; thêm điều kiện `showHero` chỉ true khi `initialScriptId === PICKER_SCRIPT_ID`.

## Deliverable

PR vào `main` chứa:
- 3 component mới (`hero-welcome.tsx`, `suggestion-card.tsx`, `typing-indicator.tsx`)
- 4 component sửa (`chat-container.tsx`, `message-list.tsx`, `message-bubble.tsx`, `quick-reply-buttons.tsx`)
- `globals.css` thêm token màu + 3 keyframe
- Không migration DB, không env mới, không script build thay đổi
- Smoke test manual theo mục Testing

## Next

Sau khi spec duyệt → chuyển sang `writing-plans` để lập kế hoạch implementation từng bước.
