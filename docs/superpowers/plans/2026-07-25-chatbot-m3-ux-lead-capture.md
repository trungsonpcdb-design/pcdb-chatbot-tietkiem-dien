# Milestone 3: UX nâng cao + Lead capture — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Prerequisite:** Milestone 2 đã hoàn thành và deploy thành công.

**Goal:** Nâng cấp trải nghiệm khách hàng và mở luồng thu thập lead:
- Feedback 👍/👎 mỗi câu trả lời (👎 mở modal chọn lý do).
- Rating 1-5 sao khi kết thúc phiên chat (đóng tab / 5 phút không hoạt động / nút "Kết thúc").
- Form thu thập thông tin ĐMTMN inline trong chat (chatbot phát hiện thiếu dữ kiện → sinh marker `<FORM_DMTMN/>` → client render form).
- Lead capture modal: chatbot chủ động hỏi khách để lại SĐT khi tư vấn xong hoặc không trả lời được.
- Dashboard `/dashboard/leads` cho nhân viên xử lý lead (đổi status, ghi chú, gán đơn vị).
- Clerk webhook sync user vào bảng `User` khi có nhân viên đăng nhập lần đầu.

**Architecture:**
- 3 model mới: `MessageFeedback`, `SessionRating`, `Lead`.
- Client-side detect phiên kết thúc bằng `visibilitychange` + timeout 5 phút.
- Form ĐMTMN: parse marker `<FORM_DMTMN/>` từ text stream → thay bằng React component → khi submit gửi message có metadata `{ type:"form_data", data:{...} }`.
- Clerk webhook `/api/webhooks/clerk` (verified qua svix) → upsert User + Unit mặc định (KHN — Khách hàng ngoài).

**Tech Stack:**
- Thêm: `svix` (verify Clerk webhook), `@radix-ui/react-radio-group` (rating modal)
- Reuse: mọi thứ M1+M2

---

## File Structure

| File | Trách nhiệm |
|------|-------------|
| `prisma/schema.prisma` | THÊM: `MessageFeedback`, `SessionRating`, `Lead`; sửa `ChatSession` + `Message` thêm relation + trường `formData` |
| `prisma/migrations/20260819100000_add_feedback_lead/migration.sql` | Tables mới + cột `formData` |
| `scripts/apply-migrations.mjs` | THÊM entry mới |
| `src/app/api/chat/feedback/route.ts` | POST feedback 👍/👎 |
| `src/app/api/chat/rating/route.ts` | POST rating cuối phiên |
| `src/app/api/leads/route.ts` | GET list, POST create |
| `src/app/api/leads/[id]/route.ts` | PATCH update status/note/assigned |
| `src/app/api/webhooks/clerk/route.ts` | User sync |
| `src/app/api/chat/route.ts` | MODIFY: xử lý `formData` từ client + inject vào prompt; MODIFY: intent detection lead capture |
| `src/components/chat/message-bubble.tsx` | MODIFY: thêm nút 👍/👎 |
| `src/components/chat/feedback-buttons.tsx` | Thumbs up/down + modal reason |
| `src/components/chat/rating-modal.tsx` | 5 sao + comment |
| `src/components/chat/lead-capture-modal.tsx` | Xin SĐT |
| `src/components/chat/form-dmtmn.tsx` | Form inline chat |
| `src/components/chat/chat-container.tsx` | MODIFY: parse FORM_DMTMN marker, session end detection, mở lead/rating modal |
| `src/app/dashboard/leads/page.tsx` | List + filter |
| `src/app/dashboard/leads/[id]/page.tsx` | Detail + chat log + note |
| `src/components/dashboard/lead-table.tsx` | Table row leads |
| `src/components/dashboard/lead-status-badge.tsx` | Badge màu theo status |
| `src/lib/lead-intent.ts` | Detect intent để mở lead capture |
| `src/lib/session-lifecycle.ts` | Client helper detect end-session |
| `src/lib/prompts/system-rag.ts` | MODIFY: thêm rule "khi có đủ thông tin ĐMTMN, chèn `<FORM_DMTMN/>` nếu thiếu" và "gợi ý lead capture khi kết thúc tư vấn" |

Tổng ~20 file mới/sửa. Chia thành 12 task.

---

## Task 1: Cài deps + extend schema M3

**Files:**
- Modify: `package.json`, `prisma/schema.prisma`
- Create: `prisma/migrations/20260819100000_add_feedback_lead/migration.sql`
- Modify: `scripts/apply-migrations.mjs`

- [ ] **Step 1: Cài deps**

```bash
npm install svix @radix-ui/react-radio-group
```

- [ ] **Step 2: Thêm 3 model + sửa quan hệ**

Append vào `prisma/schema.prisma`:

```prisma
model MessageFeedback {
  id         String    @id @default(cuid())
  messageId  String    @unique
  message    Message   @relation(fields: [messageId], references: [id], onDelete: Cascade)
  rating     String                             // "UP" | "DOWN"
  reason     String?                            // "SAI_THONG_TIN" | "KHONG_DU_CHI_TIET" | "KHONG_LIEN_QUAN" | "KHAC"
  createdAt  DateTime  @default(now())
}

model SessionRating {
  id         String       @id @default(cuid())
  sessionId  String       @unique
  session    ChatSession  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  stars      Int
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
```

Sửa `Message` — thêm relation feedback + trường formData:

```prisma
model Message {
  id         String       @id @default(cuid())
  sessionId  String
  session    ChatSession  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  role       String
  content    String
  citations  String?
  formData   String?                            // JSON — data user điền trong form ĐMTMN
  topicTag   String?
  tokensIn   Int?
  tokensOut  Int?
  latencyMs  Int?
  createdAt  DateTime     @default(now())
  feedback   MessageFeedback?

  @@index([sessionId, createdAt])
}
```

Sửa `ChatSession` — thêm relations:

```prisma
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
```

Sửa `Unit` — thêm relation `leads`:

```prisma
model Unit {
  id        String   @id @default(cuid())
  name      String   @unique
  code      String   @unique
  users     User[]
  leads     Lead[]
  createdAt DateTime @default(now())
}
```

- [ ] **Step 3: Tạo migration**

```bash
npx prisma migrate dev --name add_feedback_lead
```

Ghi nhớ timestamp folder → cập nhật `scripts/apply-migrations.mjs`:

```js
const MIGRATIONS = [
  { id: "20260725120000_init", file: "prisma/migrations/20260725120000_init/migration.sql" },
  { id: "20260805103012_add_kb", file: "prisma/migrations/20260805103012_add_kb/migration.sql" },
  { id: "20260819103000_add_feedback_lead", file: "prisma/migrations/20260819103000_add_feedback_lead/migration.sql" },
];
```

(Đổi timestamp cho khớp thực tế.)

- [ ] **Step 4: Regenerate + commit**

```bash
npx prisma generate
git add package.json package-lock.json prisma/ scripts/apply-migrations.mjs
git commit -m "feat(db): m3 add MessageFeedback + SessionRating + Lead"
```

---

## Task 2: API feedback + rating

**Files:**
- Create: `src/app/api/chat/feedback/route.ts`, `src/app/api/chat/rating/route.ts`

- [ ] **Step 1: Feedback route**

Ghi `src/app/api/chat/feedback/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

interface Body {
  messageId: string;
  rating: "UP" | "DOWN";
  reason?: string;
}

const REASONS = new Set([
  "SAI_THONG_TIN",
  "KHONG_DU_CHI_TIET",
  "KHONG_LIEN_QUAN",
  "KHAC",
]);

export async function POST(req: NextRequest) {
  let body: Body;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!body.messageId) return NextResponse.json({ error: "messageId required" }, { status: 400 });
  if (body.rating !== "UP" && body.rating !== "DOWN")
    return NextResponse.json({ error: "rating must be UP or DOWN" }, { status: 400 });
  if (body.reason && !REASONS.has(body.reason))
    return NextResponse.json({ error: "invalid reason" }, { status: 400 });

  // Chỉ cho phép feedback vào assistant message
  const msg = await prisma.message.findUnique({ where: { id: body.messageId } });
  if (!msg) return NextResponse.json({ error: "message not found" }, { status: 404 });
  if (msg.role !== "assistant")
    return NextResponse.json({ error: "chỉ feedback cho message assistant" }, { status: 400 });

  await prisma.messageFeedback.upsert({
    where: { messageId: body.messageId },
    update: { rating: body.rating, reason: body.reason ?? null },
    create: {
      messageId: body.messageId,
      rating: body.rating,
      reason: body.reason ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Rating route**

Ghi `src/app/api/chat/rating/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

interface Body {
  sessionId: string;
  stars: number;
  comment?: string;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!body.sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  if (!Number.isInteger(body.stars) || body.stars < 1 || body.stars > 5)
    return NextResponse.json({ error: "stars 1-5" }, { status: 400 });

  const session = await prisma.chatSession.findUnique({ where: { id: body.sessionId } });
  if (!session) return NextResponse.json({ error: "session not found" }, { status: 404 });

  await prisma.sessionRating.upsert({
    where: { sessionId: body.sessionId },
    update: { stars: body.stars, comment: body.comment ?? null },
    create: {
      sessionId: body.sessionId,
      stars: body.stars,
      comment: body.comment ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/chat/
git commit -m "feat(api): feedback (up/down) + session rating endpoints"
```

---

## Task 3: FeedbackButtons component + tích hợp vào MessageBubble

**Files:**
- Create: `src/components/chat/feedback-buttons.tsx`
- Modify: `src/components/chat/message-bubble.tsx`

- [ ] **Step 1: FeedbackButtons**

Ghi `src/components/chat/feedback-buttons.tsx`:

```tsx
"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const REASONS = [
  { code: "SAI_THONG_TIN", label: "Sai thông tin" },
  { code: "KHONG_DU_CHI_TIET", label: "Không đủ chi tiết" },
  { code: "KHONG_LIEN_QUAN", label: "Không đúng chủ đề" },
  { code: "KHAC", label: "Khác" },
];

export function FeedbackButtons({ messageId }: { messageId: string }) {
  const [state, setState] = useState<"none" | "up" | "down">("none");
  const [reasonOpen, setReasonOpen] = useState(false);

  async function sendUp() {
    setState("up");
    try {
      await fetch("/api/chat/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, rating: "UP" }),
      });
      toast.success("Cảm ơn phản hồi của bạn!");
    } catch {
      toast.error("Gửi feedback thất bại");
    }
  }

  function openDown() {
    setState("down");
    setReasonOpen(true);
  }

  async function sendDown(reasonCode: string) {
    try {
      await fetch("/api/chat/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, rating: "DOWN", reason: reasonCode }),
      });
      toast.success("Đã ghi nhận. Chúng tôi sẽ cải thiện.");
      setReasonOpen(false);
    } catch {
      toast.error("Gửi feedback thất bại");
    }
  }

  return (
    <div className="mt-1 flex gap-1">
      <button
        onClick={sendUp}
        disabled={state !== "none"}
        aria-label="Hữu ích"
        className={cn(
          "p-1.5 rounded hover:bg-slate-100 transition",
          state === "up" && "text-green-600 bg-green-50"
        )}
      >
        <ThumbsUp className="w-3.5 h-3.5" />
      </button>
      <Dialog open={reasonOpen} onOpenChange={setReasonOpen}>
        <DialogTrigger asChild>
          <button
            onClick={openDown}
            disabled={state === "up"}
            aria-label="Không hữu ích"
            className={cn(
              "p-1.5 rounded hover:bg-slate-100 transition",
              state === "down" && "text-red-600 bg-red-50"
            )}
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lý do bạn không hài lòng?</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {REASONS.map((r) => (
              <Button key={r.code} variant="outline" onClick={() => sendDown(r.code)}>
                {r.label}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 2: MessageBubble — thêm feedback**

Sửa `src/components/chat/message-bubble.tsx` — thêm import và render:

```tsx
import { cn } from "@/lib/utils";
import { CitationPopover, type Citation } from "./citation-popover";
import { FeedbackButtons } from "./feedback-buttons";

export interface ChatMessage {
  id: string;
  serverMessageId?: string;
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
      {!isUser && !message.pending && (
        <div className="flex items-center gap-1">
          {message.serverMessageId && <FeedbackButtons messageId={message.serverMessageId} />}
          {message.citations && message.citations.length > 0 && (
            <CitationPopover citations={message.citations} />
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: /api/chat trả về serverMessageId**

Trong `src/app/api/chat/route.ts`, sau khi tạo `savedMessage`, thêm event trước `event: done`:

```ts
controller.enqueue(
  encoder.encode(`event: message_saved\ndata: ${JSON.stringify({ id: savedMessage.id })}\n\n`)
);
```

- [ ] **Step 4: ChatContainer — nhận `message_saved`**

Sửa `src/components/chat/chat-container.tsx` — trong vòng parse event, thêm:

```tsx
          } else if (evName === "message_saved") {
            try {
              const parsed = JSON.parse(evData);
              if (parsed.id) {
                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantId ? { ...m, serverMessageId: parsed.id } : m))
                );
              }
            } catch {}
          }
```

- [ ] **Step 5: Commit**

```bash
git add src/components/chat/feedback-buttons.tsx src/components/chat/message-bubble.tsx src/components/chat/chat-container.tsx src/app/api/chat/route.ts
git commit -m "feat(chat): thumbs up/down feedback + reason modal"
```

---

## Task 4: RatingModal + session end detection

**Files:**
- Create: `src/components/chat/rating-modal.tsx`, `src/lib/session-lifecycle.ts`
- Modify: `src/components/chat/chat-container.tsx`

- [ ] **Step 1: session-lifecycle helper**

Ghi `src/lib/session-lifecycle.ts`:

```ts
// Trigger callback khi user đóng tab hoặc idle 5 phút
export function attachSessionEndListeners(cb: () => void): () => void {
  const IDLE_MS = 5 * 60 * 1000;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;

  const resetIdle = () => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(cb, IDLE_MS);
  };

  const onVisibility = () => {
    if (document.visibilityState === "hidden") cb();
  };

  const onBeforeUnload = () => cb();

  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("beforeunload", onBeforeUnload);
  window.addEventListener("mousemove", resetIdle, { passive: true });
  window.addEventListener("keydown", resetIdle, { passive: true });
  resetIdle();

  return () => {
    if (idleTimer) clearTimeout(idleTimer);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("beforeunload", onBeforeUnload);
    window.removeEventListener("mousemove", resetIdle);
    window.removeEventListener("keydown", resetIdle);
  };
}
```

- [ ] **Step 2: RatingModal**

Ghi `src/components/chat/rating-modal.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RatingModal({
  open,
  onOpenChange,
  sessionId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sessionId: string | null;
}) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!sessionId || stars === 0) return;
    setBusy(true);
    try {
      await fetch("/api/chat/rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, stars, comment: comment.trim() || undefined }),
      });
      toast.success("Cảm ơn bạn đã đánh giá!");
      onOpenChange(false);
    } catch {
      toast.error("Gửi đánh giá thất bại");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đánh giá cuộc trò chuyện</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center gap-1 py-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setStars(n)}
              aria-label={`${n} sao`}
              className="p-1"
            >
              <Star
                className={cn(
                  "w-8 h-8 transition",
                  n <= stars ? "fill-[color:var(--color-evn-orange)] text-[color:var(--color-evn-orange)]" : "text-slate-300"
                )}
              />
            </button>
          ))}
        </div>
        <textarea
          rows={3}
          placeholder="Góp ý cho chúng tôi (không bắt buộc)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full rounded-lg border border-slate-300 p-2 text-sm resize-none"
        />
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Bỏ qua</Button>
          <Button variant="primary" onClick={submit} disabled={busy || stars === 0}>
            {busy ? "Đang gửi..." : "Gửi đánh giá"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Tích hợp vào ChatContainer**

Sửa `src/components/chat/chat-container.tsx` — thêm import + state + hook:

```tsx
import { useEffect, useCallback, useRef, useState } from "react";
import { RatingModal } from "./rating-modal";
import { attachSessionEndListeners } from "@/lib/session-lifecycle";
```

Trong component, thêm state:

```tsx
const [ratingOpen, setRatingOpen] = useState(false);
const ratingShownRef = useRef(false);
```

Thêm useEffect (đặt sau khai báo `sessionIdRef`):

```tsx
useEffect(() => {
  const detach = attachSessionEndListeners(() => {
    // chỉ show khi có ít nhất 2 message (1 user + 1 assistant)
    if (
      !ratingShownRef.current &&
      messages.filter((m) => m.role === "user").length >= 1 &&
      sessionIdRef.current
    ) {
      ratingShownRef.current = true;
      setRatingOpen(true);
    }
  });
  return detach;
}, [messages]);
```

Thêm cuối JSX (trước `</div>`):

```tsx
<RatingModal
  open={ratingOpen}
  onOpenChange={setRatingOpen}
  sessionId={sessionIdRef.current}
/>
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/session-lifecycle.ts src/components/chat/rating-modal.tsx src/components/chat/chat-container.tsx
git commit -m "feat(chat): 5-star rating modal on session end"
```

---

## Task 5: FormDMTMN inline + parser marker

**Files:**
- Create: `src/components/chat/form-dmtmn.tsx`
- Modify: `src/components/chat/message-bubble.tsx`, `src/components/chat/chat-container.tsx`, `src/lib/prompts/system-rag.ts`, `src/app/api/chat/route.ts`

- [ ] **Step 1: FormDMTMN component**

Ghi `src/components/chat/form-dmtmn.tsx`:

```tsx
"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface FormDmtmnData {
  areaM2: number;
  orientation: string;
  roofType: string;
  monthlyBillVnd: number;
}

const ORIENTATIONS = ["Nam", "Đông Nam", "Tây Nam", "Đông", "Tây", "Bắc"];
const ROOF_TYPES = ["Mái tôn", "Mái bê tông", "Mái ngói"];

export function FormDmtmn({
  onSubmit,
  disabled,
}: {
  onSubmit: (data: FormDmtmnData) => void;
  disabled: boolean;
}) {
  const [submitted, setSubmitted] = useState(false);

  function handle(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitted) return;
    const fd = new FormData(e.currentTarget);
    const data: FormDmtmnData = {
      areaM2: Number(fd.get("area")),
      orientation: String(fd.get("orientation")),
      roofType: String(fd.get("roofType")),
      monthlyBillVnd: Number(String(fd.get("monthlyBill")).replace(/\D/g, "")),
    };
    setSubmitted(true);
    onSubmit(data);
  }

  return (
    <form
      onSubmit={handle}
      className="my-2 border-2 border-dashed border-[color:var(--color-evn-blue)] rounded-xl p-4 bg-white max-w-md space-y-3"
    >
      <div className="font-semibold text-sm">📋 Xin cho biết thêm để tôi tư vấn chính xác:</div>
      <div>
        <label className="text-xs text-slate-600">Diện tích mái (m²)</label>
        <Input name="area" type="number" required min={5} max={2000} placeholder="VD: 50" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-slate-600">Hướng mái</label>
          <select name="orientation" required className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm">
            {ORIENTATIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-600">Loại mái</label>
          <select name="roofType" required className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm">
            {ROOF_TYPES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-600">Hóa đơn điện TB/tháng (VNĐ)</label>
        <Input name="monthlyBill" type="text" required placeholder="VD: 1500000" inputMode="numeric" />
      </div>
      <Button type="submit" variant="primary" size="md" className="w-full" disabled={disabled || submitted}>
        {submitted ? "Đã gửi" : "Tính toán ngay"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Sửa MessageBubble — render FORM_DMTMN**

Sửa `src/components/chat/message-bubble.tsx` — parse marker và tách content:

```tsx
import { cn } from "@/lib/utils";
import { CitationPopover, type Citation } from "./citation-popover";
import { FeedbackButtons } from "./feedback-buttons";
import { FormDmtmn, type FormDmtmnData } from "./form-dmtmn";

export interface ChatMessage {
  id: string;
  serverMessageId?: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  pending?: boolean;
}

const FORM_MARKER = "<FORM_DMTMN/>";

export function MessageBubble({
  message,
  onFormSubmit,
  disabled,
}: {
  message: ChatMessage;
  onFormSubmit?: (data: FormDmtmnData) => void;
  disabled?: boolean;
}) {
  const isUser = message.role === "user";
  const hasForm = !isUser && message.content.includes(FORM_MARKER);
  const textOnly = hasForm ? message.content.replace(FORM_MARKER, "").trim() : message.content;

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
        {textOnly || (message.pending ? "…" : "")}
      </div>
      {hasForm && onFormSubmit && (
        <FormDmtmn onSubmit={onFormSubmit} disabled={disabled ?? false} />
      )}
      {!isUser && !message.pending && (
        <div className="flex items-center gap-1">
          {message.serverMessageId && <FeedbackButtons messageId={message.serverMessageId} />}
          {message.citations && message.citations.length > 0 && (
            <CitationPopover citations={message.citations} />
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: MessageList — forward props**

Sửa `src/components/chat/message-list.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { MessageBubble, type ChatMessage } from "./message-bubble";
import type { FormDmtmnData } from "./form-dmtmn";

export function MessageList({
  messages,
  onFormSubmit,
  busy,
}: {
  messages: ChatMessage[];
  onFormSubmit?: (data: FormDmtmnData) => void;
  busy: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);
  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} onFormSubmit={onFormSubmit} disabled={busy} />
      ))}
      <div ref={endRef} />
    </div>
  );
}
```

- [ ] **Step 4: ChatContainer — gửi formData**

Sửa `src/components/chat/chat-container.tsx` — thêm `sendForm` và pass vào MessageList. Đổi `<MessageList messages={messages} />` thành:

```tsx
<MessageList messages={messages} onFormSubmit={sendForm} busy={busy} />
```

Thêm hàm `sendForm` bên trong component:

```tsx
const sendForm = useCallback(
  async (data: FormDmtmnData) => {
    setBusy(true);
    const summary = `[Form ĐMTMN] Diện tích ${data.areaM2}m², hướng ${data.orientation}, ${data.roofType}, hóa đơn ${data.monthlyBillVnd.toLocaleString("vi-VN")}đ/tháng.`;
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: summary,
    };
    const assistantId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantId, role: "assistant", content: "", pending: true },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          message: summary,
          formData: data,
        }),
      });
      if (!res.ok || !res.body) throw new Error("Gửi form thất bại");
      await consumeSSE(res.body, assistantId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  },
  []
);
```

Refactor logic parse SSE (khối `while(true) { reader.read()...}`) ra hàm helper `consumeSSE(body, assistantId)` để tái sử dụng — full refactor:

```tsx
const consumeSSE = useCallback(async (body: ReadableStream<Uint8Array>, assistantId: string) => {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    const events = buf.split("\n\n");
    buf = events.pop() ?? "";

    for (const ev of events) {
      const evName = ev.match(/^event:\s*(\S+)/m)?.[1];
      const evData = ev.match(/^data:\s*(.+)$/m)?.[1];
      if (!evName || !evData) continue;

      if (evName === "session") {
        try {
          const parsed = JSON.parse(evData);
          if (parsed.sessionId) sessionIdRef.current = parsed.sessionId;
        } catch {}
      } else if (evName === "delta") {
        try {
          const parsed = JSON.parse(evData);
          if (parsed.text) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + parsed.text, pending: false }
                  : m
              )
            );
          }
        } catch {}
      } else if (evName === "citations") {
        try {
          const parsed = JSON.parse(evData);
          if (Array.isArray(parsed)) {
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, citations: parsed } : m))
            );
          }
        } catch {}
      } else if (evName === "message_saved") {
        try {
          const parsed = JSON.parse(evData);
          if (parsed.id) {
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, serverMessageId: parsed.id } : m))
            );
          }
        } catch {}
      } else if (evName === "error") {
        try {
          const parsed = JSON.parse(evData);
          throw new Error(parsed.message || "Lỗi từ server");
        } catch (e) {
          throw e instanceof Error ? e : new Error(String(e));
        }
      }
    }
  }
}, []);
```

Cập nhật `send()` để tái sử dụng `consumeSSE`.

- [ ] **Step 5: /api/chat nhận formData và inject vào prompt**

Sửa `src/app/api/chat/route.ts`:

```ts
interface ChatBody {
  sessionId?: string;
  message: string;
  formData?: {
    areaM2: number;
    orientation: string;
    roofType: string;
    monthlyBillVnd: number;
  };
}
```

Sau khi tạo `savedMessage`, nếu có `formData` → thêm vào system prompt trước khi gọi OpenAI:

Ngay trước `openai.chat.completions.create`, thêm:

```ts
let systemPromptFinal = systemPrompt;
if (body.formData) {
  const f = body.formData;
  const suggestedKw = Math.round((f.monthlyBillVnd / 300000) * 10) / 10;
  const area = Math.round(suggestedKw * 7);
  const dailyKwh = Math.round(suggestedKw * 4);
  const capitalM = Math.round(suggestedKw * 12);
  systemPromptFinal += `\n\nDỮ LIỆU KHÁCH HÀNG CUNG CẤP:
- Diện tích mái: ${f.areaM2} m²
- Hướng mái: ${f.orientation}
- Loại mái: ${f.roofType}
- Hóa đơn TB/tháng: ${f.monthlyBillVnd.toLocaleString("vi-VN")} VNĐ

ƯỚC TÍNH SƠ BỘ (dùng để tư vấn, luôn nhấn mạnh cần khảo sát thực tế):
- Công suất khuyến nghị: ~${suggestedKw} kWp
- Diện tích cần: ~${area} m²
- Sản lượng: ~${dailyKwh} kWh/ngày
- Chi phí đầu tư tham khảo: ~${capitalM} triệu VNĐ

Hãy tư vấn dựa trên các thông số trên + tài liệu tham khảo. So sánh diện tích cần với diện tích khách có (${f.areaM2} m²) để đánh giá khả thi. KHÔNG chèn <FORM_DMTMN/> vào câu trả lời lần này.`;
}
```

Và trong `messages` gọi OpenAI, dùng `systemPromptFinal` thay `systemPrompt`.

Sau khi save Message, nếu có formData → lưu vào cột `formData`:

```ts
const savedMessage = await prisma.message.create({
  data: {
    sessionId,
    role: "assistant",
    content: fullText,
    citations: citationsJson,
    latencyMs,
    formData: body.formData ? JSON.stringify(body.formData) : null,
  },
});
```

- [ ] **Step 6: Cập nhật system prompt để LLM biết chèn marker**

Sửa `src/lib/prompts/system-rag.ts` — append vào cuối:

```ts
export const SYSTEM_PROMPT_RAG = `...(nội dung cũ)...

QUY TẮC ĐẶC BIỆT VỀ FORM ĐMTMN
Nếu người dùng hỏi về việc lắp điện mặt trời mái nhà (kW nên lắp, chi phí, sản lượng, hoàn vốn) mà THIẾU các thông tin sau:
- Diện tích mái nhà
- Hóa đơn điện trung bình/tháng
- Hướng và loại mái

Hãy trả lời NGẮN GỌN 1 câu ("Để tư vấn chính xác, xin cho biết thêm thông tin sau:") rồi chèn CHÍNH XÁC token: <FORM_DMTMN/>
Sau khi có "DỮ LIỆU KHÁCH HÀNG CUNG CẤP" (đã được inject), KHÔNG chèn lại marker này.`;
```

- [ ] **Step 7: Commit**

```bash
git add src/components/chat/ src/lib/prompts/system-rag.ts src/app/api/chat/route.ts
git commit -m "feat(chat): inline DMTMN form + prompt marker + estimator injection"
```

---

## Task 6: LeadCaptureModal + intent detection

**Files:**
- Create: `src/lib/lead-intent.ts`, `src/components/chat/lead-capture-modal.tsx`
- Modify: `src/components/chat/chat-container.tsx`, `src/app/api/chat/route.ts`

- [ ] **Step 1: Intent detector server-side**

Ghi `src/lib/lead-intent.ts`:

```ts
// Detect trên server: khi nào chatbot nên gợi ý khách để lại SĐT
const TRIGGER_KEYWORDS = [
  "khảo sát", "báo giá", "tư vấn trực tiếp", "gọi lại",
  "để lại số", "liên hệ", "nhân viên",
];

export function shouldSuggestLead(userMessage: string, assistantReply: string): boolean {
  const combined = (userMessage + " " + assistantReply).toLowerCase();
  return TRIGGER_KEYWORDS.some((k) => combined.includes(k));
}
```

- [ ] **Step 2: LeadCaptureModal**

Ghi `src/components/chat/lead-capture-modal.tsx`:

```tsx
"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UNIT_LIST } from "@/lib/constants";

const PHONE_REGEX = /^(0|\+84)(\d{9,10})$/;

export function LeadCaptureModal({
  open,
  onOpenChange,
  sessionId,
  interestTopic,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sessionId: string | null;
  interestTopic: string;
}) {
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!sessionId) return;
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const fullName = String(fd.get("fullName") ?? "").trim();
    const phone = String(fd.get("phone") ?? "").trim().replace(/\s/g, "");
    const address = String(fd.get("address") ?? "").trim();
    const unit = String(fd.get("unit") ?? "").trim();

    if (!fullName || !phone) {
      toast.error("Vui lòng nhập họ tên và số điện thoại");
      setBusy(false);
      return;
    }
    if (!PHONE_REGEX.test(phone)) {
      toast.error("Số điện thoại không hợp lệ (VD: 0912345678)");
      setBusy(false);
      return;
    }

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          fullName,
          phone,
          address: address || undefined,
          assignedUnit: unit || undefined,
          interestTopic,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gửi thất bại");
      toast.success("Đã gửi. Nhân viên EVN sẽ liên hệ sớm nhất!");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nhận tư vấn trực tiếp từ EVN Điện Biên</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Input name="fullName" required placeholder="Họ tên *" />
          <Input name="phone" required placeholder="Số điện thoại * (VD: 0912345678)" />
          <Input name="address" placeholder="Địa chỉ (khu vực bạn ở)" />
          <select name="unit" className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm">
            <option value="">— Chọn Điện lực khu vực (tuỳ chọn) —</option>
            {UNIT_LIST.filter((u) => u.code !== "KHN" && u.code !== "XNCT" && u.code !== "PXPD").map((u) => (
              <option key={u.code} value={u.code}>{u.name}</option>
            ))}
          </select>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Đóng</Button>
            <Button type="submit" variant="primary" disabled={busy}>
              {busy ? "Đang gửi..." : "Gửi thông tin"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: /api/chat gợi ý lead qua event**

Sửa `src/app/api/chat/route.ts` — sau khi `savedMessage`, kiểm tra intent:

```ts
import { shouldSuggestLead } from "@/lib/lead-intent";
```

Trước `event: done`:

```ts
const suggestLead = shouldSuggestLead(body.message, fullText);
if (suggestLead) {
  const currentTopic = savedMessage.topicTag ?? "KHAC";
  controller.enqueue(
    encoder.encode(`event: suggest_lead\ndata: ${JSON.stringify({ interestTopic: currentTopic })}\n\n`)
  );
}
```

Cũng gợi ý lead khi rơi vào nhánh `NO_DOCUMENT_MATCH`. Trong hàm `streamOneShot`, cho phép thêm event `suggest_lead`:

```ts
function streamOneShot(text: string, sessionId: string | null, citations: unknown[], suggestLead?: string): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`event: session\ndata: ${JSON.stringify({ sessionId })}\n\n`));
      controller.enqueue(encoder.encode(`event: delta\ndata: ${JSON.stringify({ text })}\n\n`));
      controller.enqueue(encoder.encode(`event: citations\ndata: ${JSON.stringify(citations)}\n\n`));
      if (suggestLead) {
        controller.enqueue(encoder.encode(`event: suggest_lead\ndata: ${JSON.stringify({ interestTopic: suggestLead })}\n\n`));
      }
      controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
      controller.close();
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache" } });
}
```

Và trong nhánh NO_DOCUMENT_MATCH:

```ts
return streamOneShot(
  "Tôi chưa có đủ thông tin để trả lời câu hỏi này. Bạn có muốn để lại số điện thoại để nhân viên EVN Điện Biên tư vấn trực tiếp không?",
  sessionId,
  [],
  "KHAC"
);
```

- [ ] **Step 4: ChatContainer — mở LeadCaptureModal khi nhận event**

Sửa `src/components/chat/chat-container.tsx` — thêm state:

```tsx
const [leadOpen, setLeadOpen] = useState(false);
const [leadTopic, setLeadTopic] = useState("KHAC");
const leadShownRef = useRef(false);
```

Trong `consumeSSE`, thêm nhánh:

```tsx
      } else if (evName === "suggest_lead") {
        try {
          const parsed = JSON.parse(evData);
          if (!leadShownRef.current) {
            leadShownRef.current = true;
            setLeadTopic(parsed.interestTopic ?? "KHAC");
            setTimeout(() => setLeadOpen(true), 1500); // đợi assistant chạy chữ xong
          }
        } catch {}
      }
```

Render trong JSX:

```tsx
<LeadCaptureModal
  open={leadOpen}
  onOpenChange={setLeadOpen}
  sessionId={sessionIdRef.current}
  interestTopic={leadTopic}
/>
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/lead-intent.ts src/components/chat/lead-capture-modal.tsx src/components/chat/chat-container.tsx src/app/api/chat/route.ts
git commit -m "feat(chat): lead capture modal triggered by chat intent"
```

---

## Task 7: API /leads (create + list + update)

**Files:**
- Create: `src/app/api/leads/route.ts`, `src/app/api/leads/[id]/route.ts`

- [ ] **Step 1: /api/leads (POST create — public, GET list — auth)**

Ghi `src/app/api/leads/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getOpenAI, CHAT_MODEL } from "@/lib/openai";

export const runtime = "nodejs";

interface CreateBody {
  sessionId: string;
  fullName: string;
  phone: string;
  address?: string;
  interestTopic: string;
  assignedUnit?: string;
}

const PHONE_REGEX = /^(0|\+84)(\d{9,10})$/;

async function summarizeChat(sessionId: string): Promise<string> {
  const messages = await prisma.message.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    take: 20,
    select: { role: true, content: true },
  });
  if (messages.length === 0) return "(Chưa có tin nhắn nào)";
  const conversation = messages
    .map((m) => `${m.role === "user" ? "Khách" : "Bot"}: ${m.content}`)
    .join("\n");
  const openai = getOpenAI();
  const res = await openai.chat.completions.create({
    model: CHAT_MODEL,
    max_tokens: 200,
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "Tóm tắt cuộc chat sau bằng 2-3 câu tiếng Việt tự nhiên, tập trung vào nhu cầu khách hàng và những gì bot đã tư vấn. Không giải thích thêm.",
      },
      { role: "user", content: conversation },
    ],
  });
  return res.choices[0]?.message?.content?.trim() ?? "";
}

export async function POST(req: NextRequest) {
  let body: CreateBody;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!body.sessionId || !body.fullName || !body.phone) {
    return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
  }
  if (!PHONE_REGEX.test(body.phone.replace(/\s/g, ""))) {
    return NextResponse.json({ error: "SĐT không hợp lệ" }, { status: 400 });
  }
  if (body.assignedUnit) {
    const unit = await prisma.unit.findUnique({ where: { code: body.assignedUnit } });
    if (!unit) return NextResponse.json({ error: "Đơn vị không hợp lệ" }, { status: 400 });
  }

  const session = await prisma.chatSession.findUnique({ where: { id: body.sessionId } });
  if (!session) return NextResponse.json({ error: "Phiên chat không tồn tại" }, { status: 404 });

  const existing = await prisma.lead.findUnique({ where: { sessionId: body.sessionId } });
  if (existing) return NextResponse.json({ error: "Phiên này đã đăng ký lead" }, { status: 409 });

  const summary = await summarizeChat(body.sessionId).catch(() => "");

  const unitId = body.assignedUnit
    ? (await prisma.unit.findUnique({ where: { code: body.assignedUnit } }))?.id
    : undefined;

  const lead = await prisma.lead.create({
    data: {
      sessionId: body.sessionId,
      fullName: body.fullName.trim(),
      phone: body.phone.replace(/\s/g, ""),
      address: body.address?.trim() || null,
      interestTopic: body.interestTopic,
      chatSummary: summary,
      assignedUnit: unitId ?? null,
    },
  });

  return NextResponse.json({ lead });
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const unit = url.searchParams.get("unit");

  const leads = await prisma.lead.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(unit ? { unit: { code: unit } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { unit: true },
  });

  return NextResponse.json({ leads });
}
```

- [ ] **Step 2: PATCH lead**

Ghi `src/app/api/leads/[id]/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const STATUSES = new Set(["MOI", "DA_LIEN_HE", "THANH_CONG", "TU_CHOI"]);

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json();
  const data: {
    status?: string;
    note?: string | null;
    assignedTo?: string | null;
    assignedUnit?: string | null;
  } = {};

  if (typeof body.status === "string") {
    if (!STATUSES.has(body.status)) return NextResponse.json({ error: "invalid status" }, { status: 400 });
    data.status = body.status;
  }
  if (body.note !== undefined) data.note = body.note ?? null;
  if (body.assignedTo !== undefined) data.assignedTo = body.assignedTo ?? null;
  if (body.assignedUnitCode !== undefined) {
    if (body.assignedUnitCode) {
      const unit = await prisma.unit.findUnique({ where: { code: body.assignedUnitCode } });
      if (!unit) return NextResponse.json({ error: "invalid unit" }, { status: 400 });
      data.assignedUnit = unit.id;
    } else {
      data.assignedUnit = null;
    }
  }

  const updated = await prisma.lead.update({ where: { id }, data });
  return NextResponse.json({ lead: updated });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/leads/
git commit -m "feat(api): leads create (public) + list/update (auth) with AI summary"
```

---

## Task 8: Dashboard /leads list + filters

**Files:**
- Create: `src/app/dashboard/leads/page.tsx`, `src/components/dashboard/lead-table.tsx`, `src/components/dashboard/lead-status-badge.tsx`

- [ ] **Step 1: LeadStatusBadge**

Ghi `src/components/dashboard/lead-status-badge.tsx`:

```tsx
import { cn } from "@/lib/utils";

const MAP: Record<string, { label: string; className: string }> = {
  MOI:         { label: "Mới",           className: "bg-blue-100 text-blue-700" },
  DA_LIEN_HE:  { label: "Đã liên hệ",    className: "bg-yellow-100 text-yellow-800" },
  THANH_CONG:  { label: "Thành công",    className: "bg-green-100 text-green-700" },
  TU_CHOI:     { label: "Từ chối",       className: "bg-slate-200 text-slate-700" },
};

export function LeadStatusBadge({ status }: { status: string }) {
  const info = MAP[status] ?? { label: status, className: "bg-slate-100" };
  return (
    <span className={cn("inline-block px-2 py-0.5 rounded-full text-xs font-medium", info.className)}>
      {info.label}
    </span>
  );
}
```

- [ ] **Step 2: LeadTable**

Ghi `src/components/dashboard/lead-table.tsx`:

```tsx
"use client";

import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { LeadStatusBadge } from "./lead-status-badge";

interface LeadRow {
  id: string;
  fullName: string;
  phone: string;
  address: string | null;
  interestTopic: string;
  status: string;
  unitName: string | null;
  createdAt: string;
}

const TOPIC_LABEL: Record<string, string> = {
  TIET_KIEM_SH: "Tiết kiệm SH",
  TIET_KIEM_DN: "Tiết kiệm DN",
  DMTMN_KY_THUAT: "ĐMTMN — Kỹ thuật",
  DMTMN_TAI_CHINH: "ĐMTMN — Tài chính",
  TINH_HOA_DON: "Tính hóa đơn",
  THU_TUC: "Thủ tục",
  KHAC: "Khác",
};

export function LeadTable({ leads }: { leads: LeadRow[] }) {
  if (leads.length === 0) {
    return (
      <div className="bg-white border rounded-xl p-8 text-center text-slate-500">
        Chưa có lead nào.
      </div>
    );
  }
  return (
    <div className="bg-white border rounded-xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="p-3">Khách hàng</th>
            <th className="p-3">SĐT</th>
            <th className="p-3">Chủ đề</th>
            <th className="p-3">Đơn vị</th>
            <th className="p-3">Trạng thái</th>
            <th className="p-3">Thời gian</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr key={l.id} className="border-t hover:bg-slate-50">
              <td className="p-3">
                <Link href={`/dashboard/leads/${l.id}`} className="font-medium text-[color:var(--color-evn-blue)] hover:underline">
                  {l.fullName}
                </Link>
                {l.address && <div className="text-xs text-slate-500">{l.address}</div>}
              </td>
              <td className="p-3 font-mono text-xs">{l.phone}</td>
              <td className="p-3">{TOPIC_LABEL[l.interestTopic] ?? l.interestTopic}</td>
              <td className="p-3 text-slate-600">{l.unitName ?? "—"}</td>
              <td className="p-3"><LeadStatusBadge status={l.status} /></td>
              <td className="p-3 text-slate-500 text-xs">{formatDate(l.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: Page**

Ghi `src/app/dashboard/leads/page.tsx`:

```tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LeadTable } from "@/components/dashboard/lead-table";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_FILTERS = [
  { code: null, label: "Tất cả" },
  { code: "MOI", label: "Mới" },
  { code: "DA_LIEN_HE", label: "Đã liên hệ" },
  { code: "THANH_CONG", label: "Thành công" },
  { code: "TU_CHOI", label: "Từ chối" },
];

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const status = sp.status;

  const leads = await prisma.lead.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { unit: true },
  });

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-slate-900">Lead khách hàng</h1>
        <p className="text-sm text-slate-500">Danh sách khách để lại thông tin qua chatbot.</p>
      </div>
      <div className="flex gap-2 mb-4">
        {STATUS_FILTERS.map((f) => {
          const active = (status ?? null) === f.code;
          return (
            <Link
              key={f.label}
              href={f.code ? `/dashboard/leads?status=${f.code}` : `/dashboard/leads`}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm border transition",
                active
                  ? "bg-[color:var(--color-evn-blue)] text-white border-transparent"
                  : "border-slate-300 hover:bg-slate-100"
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </div>
      <LeadTable
        leads={leads.map((l) => ({
          id: l.id,
          fullName: l.fullName,
          phone: l.phone,
          address: l.address,
          interestTopic: l.interestTopic,
          status: l.status,
          unitName: l.unit?.name ?? null,
          createdAt: l.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
```

- [ ] **Step 4: Sidebar link**

Sửa `src/app/dashboard/layout.tsx`, thay `<div className="p-2">👥 Lead khách hàng (M3)</div>` bằng:

```tsx
<Link href="/dashboard/leads" className="p-2 hover:bg-slate-800 rounded block">
  👥 Lead khách hàng
</Link>
```

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/leads/page.tsx src/components/dashboard/lead-table.tsx src/components/dashboard/lead-status-badge.tsx src/app/dashboard/layout.tsx
git commit -m "feat(dashboard): leads list page with status filter"
```

---

## Task 9: Dashboard /leads/[id] detail + update status/note

**Files:**
- Create: `src/app/dashboard/leads/[id]/page.tsx`, `src/components/dashboard/lead-detail-panel.tsx`

- [ ] **Step 1: Detail page**

Ghi `src/app/dashboard/leads/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { LeadDetailPanel } from "@/components/dashboard/lead-detail-panel";
import { UNIT_LIST } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      unit: true,
      session: {
        include: {
          messages: { orderBy: { createdAt: "asc" } },
          rating: true,
        },
      },
    },
  });
  if (!lead) return notFound();

  return (
    <div className="max-w-4xl">
      <Link href="/dashboard/leads" className="text-sm text-slate-500 hover:underline">
        ← Danh sách lead
      </Link>

      <div className="mt-2 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border rounded-xl p-4">
          <h2 className="font-semibold text-slate-900 mb-3">Lịch sử trò chuyện</h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {lead.session.messages.map((m) => (
              <div
                key={m.id}
                className={
                  m.role === "user"
                    ? "text-right"
                    : "text-left"
                }
              >
                <div
                  className={
                    "inline-block max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap " +
                    (m.role === "user"
                      ? "bg-[color:var(--color-evn-blue)] text-white"
                      : "bg-slate-100")
                  }
                >
                  {m.content}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{formatDate(m.createdAt)}</div>
              </div>
            ))}
          </div>
          {lead.session.rating && (
            <div className="mt-3 pt-3 border-t text-sm text-slate-600">
              Đánh giá: {"★".repeat(lead.session.rating.stars)}{"☆".repeat(5 - lead.session.rating.stars)}
              {lead.session.rating.comment && <div className="italic">"{lead.session.rating.comment}"</div>}
            </div>
          )}
        </div>

        <LeadDetailPanel
          lead={{
            id: lead.id,
            fullName: lead.fullName,
            phone: lead.phone,
            address: lead.address,
            interestTopic: lead.interestTopic,
            chatSummary: lead.chatSummary,
            status: lead.status,
            note: lead.note,
            assignedUnitCode: lead.unit?.code ?? null,
            createdAt: lead.createdAt.toISOString(),
          }}
          units={UNIT_LIST.map((u) => ({ code: u.code, name: u.name }))}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: LeadDetailPanel — client**

Ghi `src/components/dashboard/lead-detail-panel.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface LeadInput {
  id: string;
  fullName: string;
  phone: string;
  address: string | null;
  interestTopic: string;
  chatSummary: string;
  status: string;
  note: string | null;
  assignedUnitCode: string | null;
  createdAt: string;
}

const STATUSES = [
  { code: "MOI", label: "Mới" },
  { code: "DA_LIEN_HE", label: "Đã liên hệ" },
  { code: "THANH_CONG", label: "Thành công" },
  { code: "TU_CHOI", label: "Từ chối" },
];

export function LeadDetailPanel({
  lead,
  units,
}: {
  lead: LeadInput;
  units: { code: string; name: string }[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState(lead.status);
  const [note, setNote] = useState(lead.note ?? "");
  const [unitCode, setUnitCode] = useState(lead.assignedUnitCode ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          note: note.trim() || null,
          assignedUnitCode: unitCode || null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Đã cập nhật");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white border rounded-xl p-4 space-y-3">
      <div>
        <div className="font-semibold text-lg text-slate-900">{lead.fullName}</div>
        <a href={`tel:${lead.phone}`} className="text-[color:var(--color-evn-blue)] font-mono">
          {lead.phone}
        </a>
        {lead.address && <div className="text-sm text-slate-600 mt-1">{lead.address}</div>}
      </div>

      <div className="text-sm">
        <div className="font-medium text-slate-700 mb-1">Tóm tắt cuộc trò chuyện</div>
        <div className="bg-slate-50 rounded p-2 text-slate-700 whitespace-pre-wrap">
          {lead.chatSummary || "(Chưa có tóm tắt)"}
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-600">Trạng thái</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full mt-1 h-10 rounded-lg border border-slate-300 px-3 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s.code} value={s.code}>{s.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs text-slate-600">Đơn vị phụ trách</label>
        <select
          value={unitCode}
          onChange={(e) => setUnitCode(e.target.value)}
          className="w-full mt-1 h-10 rounded-lg border border-slate-300 px-3 text-sm"
        >
          <option value="">— Không gán —</option>
          {units.map((u) => (
            <option key={u.code} value={u.code}>{u.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs text-slate-600">Ghi chú nhân viên</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          placeholder="Đã gọi, khách hẹn tuần sau..."
          className="w-full mt-1 rounded-lg border border-slate-300 p-2 text-sm resize-none"
        />
      </div>

      <Button variant="primary" onClick={save} disabled={busy} className="w-full">
        {busy ? "Đang lưu..." : "Lưu thay đổi"}
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/leads/ src/components/dashboard/lead-detail-panel.tsx
git commit -m "feat(dashboard): lead detail page with chat history + status/note update"
```

---

## Task 10: Clerk webhook sync user → DB

**Files:**
- Create: `src/app/api/webhooks/clerk/route.ts`
- Modify: `middleware.ts` (bỏ webhook khỏi protected)

- [ ] **Step 1: Webhook route**

Ghi `src/app/api/webhooks/clerk/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "CLERK_WEBHOOK_SECRET not set" }, { status: 500 });

  const payload = await req.text();
  const headers = {
    "svix-id": req.headers.get("svix-id") ?? "",
    "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
    "svix-signature": req.headers.get("svix-signature") ?? "",
  };

  const wh = new Webhook(secret);
  let event: { type: string; data: Record<string, unknown> };
  try {
    event = wh.verify(payload, headers) as { type: string; data: Record<string, unknown> };
  } catch (err) {
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }

  if (event.type === "user.created" || event.type === "user.updated") {
    const user = event.data as {
      id: string;
      email_addresses: { email_address: string; id: string }[];
      first_name?: string;
      last_name?: string;
      public_metadata?: { role?: string; unitCode?: string };
    };
    const email = user.email_addresses[0]?.email_address;
    if (!email) return NextResponse.json({ ok: true });

    const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || email;
    const role = user.public_metadata?.role === "admin" ? "admin" : "user";
    const unitCode = user.public_metadata?.unitCode ?? "KHN";

    const unit = await prisma.unit.findUnique({ where: { code: unitCode } });
    if (!unit) return NextResponse.json({ error: "unit not found" }, { status: 400 });

    await prisma.user.upsert({
      where: { clerkId: user.id },
      update: { email, fullName, role, unitId: unit.id },
      create: { clerkId: user.id, email, fullName, role, unitId: unit.id },
    });
  } else if (event.type === "user.deleted") {
    const id = String(event.data.id ?? "");
    if (id) await prisma.user.deleteMany({ where: { clerkId: id } });
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Cho webhook đi qua middleware**

Middleware M1 đã bỏ qua `/api/*` — kiểm tra lại `middleware.ts`. Nếu vẫn chặn thì thêm vào `createRouteMatcher` để bỏ qua rõ ràng — không cần sửa vì `createRouteMatcher(["/dashboard(.*)"])` chỉ protect dashboard.

- [ ] **Step 3: User setup webhook trên Clerk**

Hướng dẫn:
1. Vào Clerk dashboard → Webhooks → Add endpoint.
2. URL: `https://<your-domain>.vercel.app/api/webhooks/clerk`
3. Events: `user.created`, `user.updated`, `user.deleted`
4. Copy Signing Secret → paste vào `CLERK_WEBHOOK_SECRET` (Vercel prod + local `.env`).

Setup vai trò admin: Clerk dashboard → Users → chọn user → Public metadata → `{ "role": "admin", "unitCode": "DBP" }`.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/webhooks/clerk/
git commit -m "feat(auth): clerk webhook sync users to DB"
```

---

## Task 11: Test end-to-end + deploy

- [ ] **Step 1: Test local**

```bash
npm run dev
```

1. `/chat` → hỏi "Nhà tôi lắp ĐMTMN được không?" → chatbot yêu cầu form → form hiện → điền + submit → chatbot trả lời có ước tính.
2. Bấm 👎 câu trả lời → modal lý do → chọn "Không đủ chi tiết" → toast "Đã ghi nhận".
3. Bấm 👍 câu khác → toast "Cảm ơn".
4. Chat thêm 1-2 câu → đóng tab → mở lại → modal rating hiện → chọn 4 sao + comment → gửi.
5. Hỏi "Nhân viên tư vấn trực tiếp giúp tôi" → chatbot trigger `suggest_lead` → modal xin SĐT hiện → điền → success.
6. Đăng nhập dashboard → `/dashboard/leads` → thấy lead mới với status "Mới".
7. Vào detail → đổi status thành "Đã liên hệ", ghi chú "Đã gọi lúc 15h", chọn đơn vị Điện Biên Phủ → Lưu.
8. Xem lại lịch sử chat trong panel bên trái + rating của khách.

- [ ] **Step 2: Deploy**

```bash
git push origin main
```

Trong build log Vercel: `[apply-migrations] APPLY 20260819103000_add_feedback_lead` phải chạy.

- [ ] **Step 3: Setup Clerk webhook production (Task 10 Step 3)**

- [ ] **Step 4: Smoke test production**

Lặp lại 8 bước test local ở Step 1 nhưng trên domain Vercel.

- [ ] **Step 5: Tag milestone**

```bash
git tag -a m3-ux-lead -m "Milestone 3: UX + Lead capture deployed"
git push --tags
```

---

## Task 12: Update README M3

**Files:** `README.md`

- [ ] **Step 1: Sửa README**

Update section "Milestone hiện tại":

```markdown
## Milestone 3 (hiện tại)
✅ Feedback 👍/👎 mỗi câu trả lời + modal lý do
✅ Rating 5 sao cuối phiên chat
✅ Form ĐMTMN inline (chatbot tự phát hiện thiếu dữ kiện)
✅ Lead capture modal — thu SĐT khách quan tâm
✅ Dashboard /leads xử lý lead (status, note, gán đơn vị)
✅ Clerk webhook sync user vào DB
```

Thêm ENV:
```markdown
| `CLERK_WEBHOOK_SECRET` | Clerk Webhooks tab → endpoint signing secret |
```

Thêm cách phân quyền admin:
```markdown
## Phân quyền

Vào Clerk Dashboard → Users → chọn user → Public metadata:
```json
{ "role": "admin", "unitCode": "DBP" }
```
Webhook sẽ đồng bộ role + đơn vị vào bảng `User`.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: update README for M3 UX + lead capture"
git push
```

---

## Definition of Done — Milestone 3

- [ ] `git tag m3-ux-lead` tồn tại.
- [ ] Khách hàng có thể: bấm 👍/👎, đánh giá 5 sao cuối phiên, điền form ĐMTMN, để lại SĐT.
- [ ] Nhân viên đăng nhập thấy `/dashboard/leads` với lead mới, có filter theo status.
- [ ] Detail lead hiển thị full chat + tóm tắt AI + có thể đổi status/note/assigned.
- [ ] Clerk webhook chạy: tạo user trong Clerk → thấy record trong bảng `User`.
- [ ] Phân quyền admin qua Clerk `publicMetadata` hoạt động.

## Backlog phát sinh (M4)

- Analytics feedback theo ngày (M4 dashboard)
- Notification email khi có lead mới
- Auto assign lead theo địa chỉ (địa lý → đơn vị gần nhất)
- Export lead ra Excel
