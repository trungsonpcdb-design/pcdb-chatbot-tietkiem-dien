# Chat UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thiết kế lại trang `/chat` công khai với hero screen có avatar glow + 5 card gợi ý, bubble chat mới, typing indicator, fade-in animation — giải quyết 4 điểm hội đồng chê, giữ nguyên luồng picker/RAG/voice.

**Architecture:** Chỉ sửa lớp view (React component + CSS). Backend/API/RAG/scripts không đổi. Hero là lớp phủ phía trước MessageList, bấm card = switch script như picker. Dùng CSS keyframe thuần, không framer-motion.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4, shadcn/ui, lucide-react. Không thêm dependency mới.

**Spec:** `docs/superpowers/specs/2026-10-06-chat-ui-redesign-design.md`

**Repo note:** không có test runner tự động. Verification = `npx tsc --noEmit` + xem bằng mắt trong `npm run dev` tại `localhost:3000/chat`.

---

## File structure

**Create:**
- `src/components/chat/hero-welcome.tsx` — hero screen (avatar glow + title + grid 5 card)
- `src/components/chat/suggestion-card.tsx` — 1 card gợi ý
- `src/components/chat/typing-indicator.tsx` — 3 chấm nhảy

**Modify:**
- `src/app/globals.css` — thêm 3 token màu + 2 keyframe + 2 class animation
- `src/components/chat/chat-container.tsx` — state `showHero` + hàm `handleHeroPick`
- `src/components/chat/message-list.tsx` — render hero hoặc message list
- `src/components/chat/message-bubble.tsx` — bubble mới + glow pending + typing indicator + animate-bubble-in
- `src/components/chat/quick-reply-buttons.tsx` — pill style mới

---

## Task 1: CSS tokens + keyframes

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Thêm 3 token màu mới vào `@theme`**

Mở `src/app/globals.css`, thay block `@theme`:

```css
@theme {
  --color-evn-blue: #0066b3;
  --color-evn-blue-dark: #004b85;
  --color-evn-orange: #f58220;
  --color-evn-orange-dark: #c8681a;
  --color-bg-page: #f8fafc;
  --color-evn-blue-light: #e0f2fe;
  --color-evn-cyan-glow: #22d3ee;
  --color-chat-surface: #ffffff;
}
```

- [ ] **Step 2: Thêm 2 keyframe + 2 class animation cuối file**

Append vào cuối `src/app/globals.css` (sau block `body { ... }`):

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

- [ ] **Step 3: Verify type/build**

Run:
```bash
npx tsc --noEmit
```
Expected: không có lỗi mới (CSS không ảnh hưởng TS, chủ yếu để chắc chắn không phá build).

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(chat-ui): add color tokens + bounce-dot + fade-slide-up keyframes

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 2: TypingIndicator component

**Files:**
- Create: `src/components/chat/typing-indicator.tsx`

- [ ] **Step 1: Tạo file component**

Tạo mới `src/components/chat/typing-indicator.tsx`:

```tsx
export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1" aria-label="Đang soạn trả lời">
      <span
        className="typing-dot w-2 h-2 rounded-full bg-slate-400"
        style={{ animationDelay: "0ms" }}
      />
      <span
        className="typing-dot w-2 h-2 rounded-full bg-slate-400"
        style={{ animationDelay: "150ms" }}
      />
      <span
        className="typing-dot w-2 h-2 rounded-full bg-slate-400"
        style={{ animationDelay: "300ms" }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify type**

Run:
```bash
npx tsc --noEmit
```
Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/chat/typing-indicator.tsx
git commit -m "feat(chat-ui): add TypingIndicator (3 bouncing dots)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 3: SuggestionCard component

**Files:**
- Create: `src/components/chat/suggestion-card.tsx`

- [ ] **Step 1: Tạo file component**

Tạo mới `src/components/chat/suggestion-card.tsx`:

```tsx
"use client";

import { cn } from "@/lib/utils";

export function SuggestionCard({
  icon,
  label,
  onClick,
  className,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-4 text-left",
        "shadow-sm transition-all duration-200",
        "hover:border-[color:var(--color-evn-blue)] hover:shadow-md hover:-translate-y-0.5",
        "focus:outline-none focus:ring-2 focus:ring-[color:var(--color-evn-blue)]",
        className
      )}
    >
      <span className="text-2xl transition-transform duration-200 group-hover:scale-110">
        {icon}
      </span>
      <span className="text-sm font-medium text-slate-800">{label}</span>
    </button>
  );
}
```

- [ ] **Step 2: Verify type**

Run:
```bash
npx tsc --noEmit
```
Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/chat/suggestion-card.tsx
git commit -m "feat(chat-ui): add SuggestionCard (clickable topic card for hero)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 4: HeroWelcome component

**Files:**
- Create: `src/components/chat/hero-welcome.tsx`

- [ ] **Step 1: Tạo file component**

Tạo mới `src/components/chat/hero-welcome.tsx`:

```tsx
"use client";

import Image from "next/image";
import { SuggestionCard } from "./suggestion-card";
import { PICKER_ENTRIES } from "@/lib/scripts/picker";

function splitIconAndLabel(raw: string): { icon: string; label: string } {
  const firstSpace = raw.indexOf(" ");
  if (firstSpace === -1) return { icon: "", label: raw };
  return {
    icon: raw.slice(0, firstSpace),
    label: raw.slice(firstSpace + 1),
  };
}

export function HeroWelcome({
  onPickTopic,
}: {
  onPickTopic: (scriptId: string, label: string) => void;
}) {
  const cards = PICKER_ENTRIES.map((e) => ({
    scriptId: e.scriptId,
    fullLabel: e.label,
    ...splitIconAndLabel(e.label),
  }));

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 py-8 gap-6">
      {/* Avatar với 2 lớp glow */}
      <div className="relative w-24 h-24">
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-[color:var(--color-evn-blue)] opacity-30 blur-xl animate-pulse"
        />
        <span
          aria-hidden
          className="absolute inset-[-8px] rounded-full bg-[color:var(--color-evn-cyan-glow)] opacity-20 blur-2xl animate-pulse"
          style={{ animationDuration: "3s" }}
        />
        <Image
          src="/bot-avatar.png"
          alt="Trợ lý AI"
          width={96}
          height={96}
          priority
          className="relative z-10 rounded-full ring-2 ring-white shadow-lg object-cover"
        />
      </div>

      <div className="text-center max-w-xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-[color:var(--color-evn-blue-dark)]">
          Xin chào! Tôi là Trợ lý AI của Công ty Điện lực Điện Biên
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600">
          Hỏi tôi về tiết kiệm điện, điện mặt trời mái nhà, giá điện, CSKH
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
        {cards.slice(0, 4).map((c) => (
          <SuggestionCard
            key={c.scriptId}
            icon={c.icon}
            label={c.label}
            onClick={() => onPickTopic(c.scriptId, c.fullLabel)}
          />
        ))}
        {cards[4] && (
          <SuggestionCard
            key={cards[4].scriptId}
            icon={cards[4].icon}
            label={cards[4].label}
            onClick={() => onPickTopic(cards[4].scriptId, cards[4].fullLabel)}
            className="sm:col-span-2"
          />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify type**

Run:
```bash
npx tsc --noEmit
```
Expected: pass. (Nếu lỗi import `PICKER_ENTRIES` không được export tại `@/lib/scripts/picker`: nó đã có `export const PICKER_ENTRIES` tại dòng 3 `src/lib/scripts/picker.ts`, path đúng.)

- [ ] **Step 3: Commit**

```bash
git add src/components/chat/hero-welcome.tsx
git commit -m "feat(chat-ui): add HeroWelcome screen with glowing avatar + 5 topic cards

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 5: QuickReplyButtons — pill style mới

**Files:**
- Modify: `src/components/chat/quick-reply-buttons.tsx`

- [ ] **Step 1: Thay toàn bộ nội dung file**

Mở `src/components/chat/quick-reply-buttons.tsx`, thay toàn bộ:

```tsx
"use client";

import type { ScriptButton } from "@/lib/scripts";

export function QuickReplyButtons({
  buttons,
  onPick,
  disabled,
}: {
  buttons: ScriptButton[];
  onPick: (btn: ScriptButton) => void;
  disabled?: boolean;
}) {
  return (
    <div className="mt-2 pl-11 flex flex-wrap gap-2 max-w-[85%]">
      {buttons.map((btn, idx) => (
        <button
          key={`${btn.label}-${idx}`}
          onClick={() => onPick(btn)}
          disabled={disabled}
          className="text-sm bg-white border border-slate-300 text-slate-700 rounded-full px-4 py-2 shadow-sm transition-all duration-150 hover:border-[color:var(--color-evn-blue)] hover:bg-[color:var(--color-evn-blue-light)] hover:text-[color:var(--color-evn-blue-dark)] hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify type**

Run:
```bash
npx tsc --noEmit
```
Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/chat/quick-reply-buttons.tsx
git commit -m "feat(chat-ui): redesign QuickReplyButtons as elevated pills with hover lift

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 6: MessageBubble — bubble styles, glow pending, typing indicator, fade-in

**Files:**
- Modify: `src/components/chat/message-bubble.tsx`

- [ ] **Step 1: Thêm import TypingIndicator**

Trong `src/components/chat/message-bubble.tsx`, thêm import ở đầu file sau các import hiện tại:

```tsx
import { TypingIndicator } from "./typing-indicator";
```

- [ ] **Step 2: Áp class animate-bubble-in cho wrapper ngoài cùng**

Tìm block return (hiện tại dòng ~108):
```tsx
return (
    <div className={cn("flex flex-col", isUser ? "items-end" : "items-start")}>
```

Đổi thành:
```tsx
return (
    <div className={cn("flex flex-col animate-bubble-in", isUser ? "items-end" : "items-start")}>
```

- [ ] **Step 3: Avatar bot thêm wrapper relative + glow khi pending**

Tìm block avatar (hiện tại dòng ~116–126):
```tsx
{!isUser && (
  <div className="flex-shrink-0 w-9 h-9 rounded-full overflow-hidden bg-white ring-1 ring-slate-200 shadow-sm">
    <Image
      src="/bot-avatar.png"
      alt="Trợ lý AI"
      width={72}
      height={72}
      className="w-full h-full object-cover"
    />
  </div>
)}
```

Thay bằng:
```tsx
{!isUser && (
  <div className="relative flex-shrink-0 w-9 h-9">
    {message.pending && (
      <span
        aria-hidden
        className="absolute inset-[-4px] rounded-full bg-[color:var(--color-evn-cyan-glow)] opacity-30 blur-md animate-pulse pointer-events-none"
      />
    )}
    <div className="relative z-10 w-9 h-9 rounded-full overflow-hidden bg-white ring-1 ring-slate-200 shadow-sm">
      <Image
        src="/bot-avatar.png"
        alt="Trợ lý AI"
        width={72}
        height={72}
        className="w-full h-full object-cover"
      />
    </div>
  </div>
)}
```

- [ ] **Step 4: Bubble style mới cho bot và user**

Tìm block bubble class (hiện tại dòng ~127–134):
```tsx
<div
  className={cn(
    "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
    isUser
      ? "bg-[color:var(--color-evn-blue)] text-white rounded-br-md"
      : "bg-slate-100 text-slate-900 rounded-bl-md"
  )}
>
```

Thay bằng:
```tsx
<div
  className={cn(
    "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
    isUser
      ? "bg-gradient-to-br from-[color:var(--color-evn-blue)] to-[color:var(--color-evn-blue-dark)] text-white shadow-md rounded-br-md"
      : "bg-white border border-slate-200 text-slate-800 shadow-sm rounded-bl-md"
  )}
>
```

- [ ] **Step 5: Thay "…" bằng TypingIndicator khi pending và chưa có text**

Tìm nội dung trong div bubble (hiện tại dòng ~135–139):
```tsx
{textOnly
  ? isUser
    ? textOnly
    : renderWithDownloads(textOnly)
  : (message.pending ? "…" : "")}
```

Thay bằng:
```tsx
{textOnly
  ? isUser
    ? textOnly
    : renderWithDownloads(textOnly)
  : (message.pending ? <TypingIndicator /> : "")}
```

- [ ] **Step 6: Đổi hover color nút "Nghe" sang blue-50**

Tìm block className của nút Nghe (dòng ~159–166):
```tsx
className={cn(
  "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors",
  speaking
    ? "text-[color:var(--color-evn-blue)] bg-slate-100"
    : hasVietnameseVoice
      ? "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
      : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
)}
```

Thay bằng:
```tsx
className={cn(
  "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors",
  speaking
    ? "text-[color:var(--color-evn-blue)] bg-[color:var(--color-evn-blue-light)]"
    : hasVietnameseVoice
      ? "text-slate-500 hover:text-slate-800 hover:bg-[color:var(--color-evn-blue-light)]"
      : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
)}
```

- [ ] **Step 7: Verify type**

Run:
```bash
npx tsc --noEmit
```
Expected: pass.

- [ ] **Step 8: Commit**

```bash
git add src/components/chat/message-bubble.tsx
git commit -m "feat(chat-ui): redesign MessageBubble with gradient user bubble, white bot bubble, pending-state avatar glow, TypingIndicator, fade-slide-up animation

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 7: ChatContainer — thêm showHero state + handleHeroPick

**Files:**
- Modify: `src/components/chat/chat-container.tsx`

- [ ] **Step 1: Bỏ khởi tạo picker ở mount**

Tìm (dòng ~36–41):
```tsx
const [messages, setMessages] = useState<ChatMessage[]>(() => {
  const script = getScript(initialScriptId);
  if (!script) return [];
  const rootNode = script.nodes[script.rootId];
  return rootNode ? [buildScriptMessage(rootNode)] : [];
});
```

Thay bằng:
```tsx
const [messages, setMessages] = useState<ChatMessage[]>(() => {
  // Nếu initialScriptId KHÁC picker (user mở ?kb=solar chẳng hạn),
  // vẫn load thẳng script đó như trước, bỏ qua hero.
  if (initialScriptId === PICKER_SCRIPT_ID) return [];
  const script = getScript(initialScriptId);
  if (!script) return [];
  const rootNode = script.nodes[script.rootId];
  return rootNode ? [buildScriptMessage(rootNode)] : [];
});
const [showHero, setShowHero] = useState<boolean>(
  initialScriptId === PICKER_SCRIPT_ID
);
```

- [ ] **Step 2: Thêm `setShowHero(false)` ở đầu `send`**

Tìm (dòng ~179):
```tsx
const send = useCallback(async (text: string) => {
  setBusy(true);
```

Thay bằng:
```tsx
const send = useCallback(async (text: string) => {
  setShowHero(false);
  setBusy(true);
```

- [ ] **Step 3: Thêm `setShowHero(false)` ở đầu `sendForm`**

Tìm (dòng ~293–295):
```tsx
const sendForm = useCallback(
  async (data: FormDmtmnData) => {
    setBusy(true);
```

Thay bằng:
```tsx
const sendForm = useCallback(
  async (data: FormDmtmnData) => {
    setShowHero(false);
    setBusy(true);
```

- [ ] **Step 4: Thêm `setShowHero(false)` đầu `handleQuickReply`**

Tìm (dòng ~229–232):
```tsx
const handleQuickReply = useCallback(
  (btn: ScriptButton) => {
    const currentScript = getScript(currentScriptId);
    if (!currentScript) return;
```

Thay bằng:
```tsx
const handleQuickReply = useCallback(
  (btn: ScriptButton) => {
    setShowHero(false);
    const currentScript = getScript(currentScriptId);
    if (!currentScript) return;
```

- [ ] **Step 5: Thêm hàm `handleHeroPick`**

Thêm hàm mới ngay sau khai báo `handleQuickReply` (trước `const sendForm`):

```tsx
const handleHeroPick = useCallback(
  (scriptId: string, label: string) => {
    const syntheticBtn: ScriptButton = {
      label,
      action: { type: "switch", scriptId },
    };
    handleQuickReply(syntheticBtn);
  },
  [handleQuickReply]
);
```

- [ ] **Step 6: Truyền prop xuống MessageList**

Tìm (dòng ~330–337):
```tsx
return (
  <div className="flex flex-1 flex-col bg-white">
    <MessageList
      messages={messages}
      onFormSubmit={sendForm}
      onQuickReply={handleQuickReply}
      busy={busy}
    />
```

Thay bằng:
```tsx
return (
  <div className="flex flex-1 flex-col bg-white">
    <MessageList
      messages={messages}
      onFormSubmit={sendForm}
      onQuickReply={handleQuickReply}
      onHeroPick={handleHeroPick}
      showHero={showHero}
      busy={busy}
    />
```

- [ ] **Step 7: Verify type**

Run:
```bash
npx tsc --noEmit
```
Expected: tạm thời sẽ lỗi vì MessageList chưa có props `onHeroPick`/`showHero`. Chấp nhận lỗi này, sẽ sửa ở Task 8.

- [ ] **Step 8: Chưa commit — chờ Task 8 xong rồi commit chung ChatContainer + MessageList**

(Vì 2 file này ràng buộc nhau qua props, commit chung tránh commit intermediate state không build được.)

---

## Task 8: MessageList — render hero hoặc messages

**Files:**
- Modify: `src/components/chat/message-list.tsx`

- [ ] **Step 1: Thay toàn bộ file**

Mở `src/components/chat/message-list.tsx`, thay toàn bộ nội dung:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { MessageBubble, type ChatMessage } from "./message-bubble";
import { HeroWelcome } from "./hero-welcome";
import type { FormDmtmnData } from "./form-dmtmn";
import type { ScriptButton } from "@/lib/scripts";

export function MessageList({
  messages,
  onFormSubmit,
  onQuickReply,
  onHeroPick,
  showHero,
  busy,
}: {
  messages: ChatMessage[];
  onFormSubmit?: (data: FormDmtmnData) => void;
  onQuickReply?: (btn: ScriptButton) => void;
  onHeroPick: (scriptId: string, label: string) => void;
  showHero: boolean;
  busy: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  if (showHero && messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto">
        <HeroWelcome onPickTopic={onHeroPick} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
      {messages.map((m) => (
        <MessageBubble
          key={m.id}
          message={m}
          onFormSubmit={onFormSubmit}
          onQuickReply={onQuickReply}
          disabled={busy}
        />
      ))}
      <div ref={endRef} />
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run:
```bash
npx tsc --noEmit
```
Expected: pass (lỗi từ Task 7 giờ đã được sửa).

- [ ] **Step 3: Commit chung Task 7 + Task 8**

```bash
git add src/components/chat/chat-container.tsx src/components/chat/message-list.tsx
git commit -m "feat(chat-ui): add hero welcome screen as entrypoint instead of picker-first

- ChatContainer: showHero state + handleHeroPick
- MessageList: render HeroWelcome when showHero && no messages
- Bấm card hero = synthetic switch button → chạy nhánh switch của handleQuickReply
- Giữ nguyên hành vi khi mở với ?kb=... (bỏ qua hero, vào thẳng script)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 9: Smoke test đầy đủ

**Files:** không sửa, chỉ test thủ công.

- [ ] **Step 1: Khởi động dev server**

Run:
```bash
npm run dev
```
Mở `http://localhost:3000/chat` trong trình duyệt.

- [ ] **Step 2: Verify hero screen hiển thị đúng**

Checklist:
- [ ] Avatar bot 96×96 ở giữa, có 2 lớp glow (xanh đậm sát + cyan nhạt rộng hơn), pulse nhẹ.
- [ ] Title "Xin chào! Tôi là Trợ lý AI của Công ty Điện lực Điện Biên" hiển thị bold xanh EVN đậm.
- [ ] Subtitle "Hỏi tôi về tiết kiệm điện, điện mặt trời mái nhà, giá điện, CSKH".
- [ ] 5 card đúng thứ tự: 🏠 gia đình, 🏢 văn phòng/CN, ☀️ ĐMTMN, 💵 giá bán điện, 📞 CSKH.
- [ ] Desktop: 4 card đầu grid 2×2, card CSKH span 2 cột ở dưới.
- [ ] Mobile (resize ≤640px): tất cả stack 1 cột.
- [ ] Hover card: viền chuyển xanh EVN, shadow tăng, nhấc lên 2px, icon scale 1.1.

- [ ] **Step 3: Verify flow khi bấm card**

Checklist:
- [ ] Bấm card "🏠 Tư vấn tiết kiệm điện trong gia đình":
  - Hero biến mất.
  - User echo "🏠 Tư vấn tiết kiệm điện trong gia đình" hiện bên phải (bubble xanh gradient).
  - Bot message root của script `home-savings` hiện bên trái với các nút quick-reply mới (pill nền trắng viền slate, hover lift + xanh EVN).
  - Cả hai bubble fade-slide-up khi xuất hiện.
- [ ] Refresh trang → hero lại hiện.
- [ ] Bấm card "💵 Tra cứu giá bán điện": tương tự, chuyển vào script `pricing`.

- [ ] **Step 4: Verify flow khi gõ free-text**

Checklist:
- [ ] Refresh trang, gõ "Giá điện bậc 1 bao nhiêu?" rồi Enter:
  - Hero biến mất.
  - User bubble xanh gradient hiện bên phải.
  - Bot bubble trắng xuất hiện với **TypingIndicator** 3 chấm nhảy sóng (chấm 2 trễ 150ms, chấm 3 trễ 300ms).
  - Avatar bot bên trái bubble có **glow cyan pulse** khi đang `pending`.
  - Khi SSE delta đầu tiên về, chấm biến mất, text stream vào.
  - Khi stream xong, glow avatar tắt.
- [ ] Tin nhắn mới fade-slide-up khi xuất hiện.

- [ ] **Step 5: Verify voice và các luồng khác không bị phá**

Checklist:
- [ ] Nút mic trong input vẫn hoạt động (bấm → đỏ pulse → nói → tự submit).
- [ ] Nút "🔊 Nghe" dưới câu trả lời bot vẫn phát âm, hover sang màu xanh nhạt (blue-light) thay vì slate.
- [ ] Nút feedback (👍/👎) vẫn gửi được (nếu có `serverMessageId`).
- [ ] Modal rating hiện sau khi đóng tab (test với 1+ user message trong session).
- [ ] Lead capture modal: với câu hỏi gợi ý quan tâm (ví dụ "Lắp ĐMTMN hết bao nhiêu tiền?"), modal hiện sau 1.5s.

- [ ] **Step 6: Verify entrypoint `?kb=...` bỏ qua hero**

Checklist:
- [ ] Mở `http://localhost:3000/chat?kb=solar`:
  - KHÔNG thấy hero.
  - Vào thẳng script `solar` root node với quick-reply buttons.
- [ ] Mở `http://localhost:3000/chat?kb=cskh`: vào thẳng script `cskh`.
- [ ] Mở `http://localhost:3000/chat` (không có query): hero hiện lại bình thường.

- [ ] **Step 7: Verify responsive mobile**

Trong DevTools responsive mode, chọn viewport 375×812 (iPhone SE/13 mini):
- [ ] Hero stack 1 cột, 5 card dọc, mỗi card đọc được, không tràn ngang.
- [ ] Avatar glow không bị lệch ngoài khung.
- [ ] Title xuống dòng mượt, không bị cắt.
- [ ] Bubble chat max-width 80% vẫn ổn, không chạm sát 2 mép.
- [ ] Quick-reply buttons wrap xuống dòng mới nếu quá dài.
- [ ] Input bar không bị che bởi bàn phím ảo (thực tế test trên device thật nếu có).

- [ ] **Step 8: Verify build production không lỗi**

Run:
```bash
npm run build
```
Expected: build success, không lỗi TypeScript hay runtime trong khi gen static page.

- [ ] **Step 9: Commit smoke-test note (optional)**

Nếu phát hiện bug trong smoke test → fix + commit riêng. Nếu không có bug → không commit (bước này không sinh code).

---

## Final checklist

Khi tất cả 9 task xong:

- [ ] 3 file mới (`hero-welcome.tsx`, `suggestion-card.tsx`, `typing-indicator.tsx`) tồn tại.
- [ ] 5 file sửa (`globals.css`, `chat-container.tsx`, `message-list.tsx`, `message-bubble.tsx`, `quick-reply-buttons.tsx`).
- [ ] `npx tsc --noEmit` pass.
- [ ] `npm run build` pass.
- [ ] Smoke test 7 checklist đều pass.
- [ ] Không thêm dependency mới (xem `package.json` diff — không nên có thay đổi).
- [ ] Header EVN, dashboard, backend, scripts, RAG không bị đụng.

Khi tất cả pass, chạy skill `superpowers:finishing-a-development-branch` để quyết định merge/PR/cleanup, hoặc trực tiếp tạo PR.
