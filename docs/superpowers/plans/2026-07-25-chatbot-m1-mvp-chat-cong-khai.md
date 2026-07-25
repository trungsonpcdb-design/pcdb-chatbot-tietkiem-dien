# Milestone 1: MVP chat công khai — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng một web app Next.js chạy được trên Vercel, có trang chat công khai `/chat` cho khách hàng dùng, có API stream trả lời bằng GPT-4o-mini, và lưu lịch sử chat vào Turso qua Prisma. **Chưa có RAG** — chatbot trả lời bằng system prompt hard-code kiến thức chung về tiết kiệm điện và ĐMTMN. Có Clerk auth cho `/dashboard` (mới chỉ có trang trống).

**Architecture:** Next.js 16 App Router deploy trên Vercel Hobby. Chat streaming qua Server-Sent Events (SSE). Cookie `anonymousId` (uuid, 1 năm) để nối phiên chat cho khách. Rate limit theo IP (hash SHA-256 với salt). Turso libsql làm database qua Prisma. Migration Turso chạy qua script custom `apply-migrations.mjs` trong build (KHÔNG dùng `prisma migrate deploy`).

**Tech Stack:**
- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui (button, card, input, dialog, sonner)
- Clerk (@clerk/nextjs v7)
- Prisma 7 + `@prisma/adapter-libsql` + `@libsql/client`
- OpenAI SDK v5 (`gpt-4o-mini`)
- `lucide-react`, `date-fns`, `sonner`
- Vercel Hobby (maxDuration = 60s)

---

## File Structure

Tạo mới hoàn toàn — thư mục hiện tại rỗng (chỉ có `.git`, `.gitignore`, `docs/`, `.superpowers/`).

| File | Trách nhiệm |
|------|-------------|
| `package.json` | Deps + scripts |
| `tsconfig.json` | TypeScript config |
| `next.config.ts` | Next config |
| `tailwind.config.ts`, `postcss.config.mjs` | Tailwind v4 |
| `middleware.ts` | Clerk middleware (bảo vệ /dashboard) |
| `.env.example` | Template ENV |
| `prisma/schema.prisma` | Model M1: `Unit`, `User`, `ChatSession`, `Message` |
| `prisma/migrations/20260725120000_init/migration.sql` | Init tables |
| `scripts/apply-migrations.mjs` | Turso migration runner idempotent |
| `scripts/seed-units.mjs` | Seed 11 đơn vị PC Điện Biên |
| `src/generated/prisma/` | Prisma generated output |
| `src/lib/prisma.ts` | Prisma singleton client (libsql adapter) |
| `src/lib/openai.ts` | OpenAI client singleton |
| `src/lib/anonymous-id.ts` | Cookie helper anonymousId |
| `src/lib/rate-limit.ts` | IP rate limit in-memory (M1) |
| `src/lib/moderation.ts` | Guard rail off-topic keywords |
| `src/lib/constants.ts` | `UNIT_LIST`, `TOPIC_TAGS`, `SUGGESTED_QUESTIONS` |
| `src/lib/utils.ts` | `cn()`, `formatDate()`, `formatVND()` |
| `src/lib/prompts/system-mvp.ts` | System prompt hard-code kiến thức chung |
| `src/app/layout.tsx` | Root layout + ClerkProvider + Toaster |
| `src/app/globals.css` | Tailwind + CSS variables màu EVN |
| `src/app/page.tsx` | Landing → redirect `/chat` |
| `src/app/chat/layout.tsx` | Layout /chat (header EVN) |
| `src/app/chat/page.tsx` | Server component container |
| `src/app/dashboard/layout.tsx` | Bảo vệ Clerk + sidebar tạm |
| `src/app/dashboard/page.tsx` | Trang trống "Coming soon" |
| `src/app/sign-in/[[...sign-in]]/page.tsx` | Clerk sign-in |
| `src/app/sign-up/[[...sign-up]]/page.tsx` | Clerk sign-up |
| `src/app/api/chat/route.ts` | POST — stream SSE trả lời |
| `src/app/api/health/route.ts` | GET — health check DB |
| `src/components/ui/button.tsx` | shadcn button |
| `src/components/ui/input.tsx` | shadcn input |
| `src/components/ui/card.tsx` | shadcn card |
| `src/components/ui/dialog.tsx` | shadcn dialog |
| `src/components/chat/chat-container.tsx` | Client component quản lý state chat |
| `src/components/chat/message-list.tsx` | Render list bubble |
| `src/components/chat/message-bubble.tsx` | 1 bubble tin nhắn |
| `src/components/chat/message-input.tsx` | Input + send button |
| `src/components/chat/suggested-questions.tsx` | 4 câu gợi ý grid 2x2 |
| `src/components/shared/evn-header.tsx` | Header xanh EVN |
| `public/evn-placeholder-logo.svg` | Logo tạm |
| `README.md` | Setup + deploy hướng dẫn |
| `.env.example` | ENV template |

Tổng ~35 file. Chia thành 14 task tuần tự.

---

## Task 1: Khởi tạo dự án Next.js 16 + TypeScript + Tailwind v4

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `README.md`

- [ ] **Step 1: Khởi tạo package.json**

Ghi `package.json`:

```json
{
  "name": "chatbot-tiet-kiem-dien",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "node scripts/apply-migrations.mjs && prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "db:generate": "prisma generate",
    "db:migrate:dev": "prisma migrate dev",
    "db:seed": "node scripts/seed-units.mjs"
  },
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "typescript": "^5.6.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0"
  },
  "devDependencies": {
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    "autoprefixer": "^10.4.20"
  }
}
```

- [ ] **Step 2: TypeScript & Next config**

Ghi `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Ghi `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: false,
  },
};

export default nextConfig;
```

Ghi `postcss.config.mjs`:

```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 3: Global CSS với màu EVN**

Ghi `src/app/globals.css`:

```css
@import "tailwindcss";

@theme {
  --color-evn-blue: #0066b3;
  --color-evn-blue-dark: #004b85;
  --color-evn-orange: #f58220;
  --color-evn-orange-dark: #c8681a;
  --color-bg-page: #f8fafc;
}

:root {
  color-scheme: light;
}

html, body {
  height: 100%;
}

body {
  background: var(--color-bg-page);
  color: #0f172a;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}
```

- [ ] **Step 4: Root layout**

Ghi `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EVN Điện Biên — Trợ lý AI Tiết kiệm điện & ĐMTMN",
  description:
    "Chatbot tư vấn tiết kiệm điện và điện mặt trời mái nhà cho khách hàng PC Điện Biên",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 5: Landing page redirect**

Ghi `src/app/page.tsx`:

```tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/chat");
}
```

- [ ] **Step 6: README skeleton**

Ghi `README.md`:

```markdown
# Chatbot Tiết kiệm điện & ĐMTMN — PC Điện Biên

Web app chatbot AI tư vấn khách hàng của EVN Điện Biên.

## Dev

```bash
npm install
cp .env.example .env
# điền env
npm run db:migrate:dev
npm run db:seed
npm run dev
```

App chạy tại http://localhost:3000/chat
```

- [ ] **Step 7: Cài dependencies**

```bash
npm install
```

Expected: cài xong không lỗi peer deps.

- [ ] **Step 8: Chạy dev để verify**

```bash
npm run dev
```

Expected: http://localhost:3000 mở được, tự redirect /chat (chưa có route → 404 OK cho bây giờ). Ctrl+C dừng server.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts postcss.config.mjs src/app/layout.tsx src/app/page.tsx src/app/globals.css README.md
git commit -m "chore: bootstrap Next.js 16 + Tailwind v4 skeleton"
```

---

## Task 2: Cài shadcn/ui primitives + dependencies UI

**Files:**
- Create: `src/lib/utils.ts`, `src/components/ui/button.tsx`, `src/components/ui/input.tsx`, `src/components/ui/card.tsx`, `src/components/ui/dialog.tsx`
- Modify: `package.json`

- [ ] **Step 1: Cài deps UI**

```bash
npm install clsx tailwind-merge class-variance-authority lucide-react sonner
npm install @radix-ui/react-dialog @radix-ui/react-slot
```

- [ ] **Step 2: Utils cn()**

Ghi `src/lib/utils.ts`:

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatVND(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}
```

- [ ] **Step 3: Button shadcn**

Ghi `src/components/ui/button.tsx`:

```tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-[color:var(--color-evn-blue)] text-white hover:bg-[color:var(--color-evn-blue-dark)] focus-visible:ring-[color:var(--color-evn-blue)]",
        accent: "bg-[color:var(--color-evn-orange)] text-white hover:bg-[color:var(--color-evn-orange-dark)] focus-visible:ring-[color:var(--color-evn-orange)]",
        outline: "border border-slate-300 bg-white hover:bg-slate-50 text-slate-900",
        ghost: "hover:bg-slate-100 text-slate-900",
      },
      size: {
        sm: "h-8 px-3",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
```

- [ ] **Step 4: Input**

Ghi `src/components/ui/input.tsx`:

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-evn-blue)] disabled:opacity-50",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";
```

- [ ] **Step 5: Card**

Ghi `src/components/ui/card.tsx`:

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-xl border border-slate-200 bg-white shadow-sm", className)}
      {...props}
    />
  )
);
Card.displayName = "Card";
```

- [ ] **Step 6: Dialog (Radix)**

Ghi `src/components/ui/dialog.tsx`:

```tsx
"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 grid w-full max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 rounded-2xl bg-white p-6 shadow-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 text-slate-400 hover:text-slate-900">
        <X className="h-4 w-4" />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = "DialogContent";

export const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5", className)} {...props} />
);

export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-slate-900", className)}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";
```

- [ ] **Step 7: Verify build**

```bash
npm run build
```

Expected: build thành công (chưa có DB/Clerk setup nên `apply-migrations.mjs` chưa tồn tại — nếu lỗi này thì bỏ qua bằng cách chạy `next build` trực tiếp:)

```bash
npx next build
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json src/lib/utils.ts src/components/ui/
git commit -m "chore: add shadcn primitives (button, input, card, dialog)"
```

---

## Task 3: ENV template + .env.example

**Files:**
- Create: `.env.example`, `.env`

- [ ] **Step 1: Ghi .env.example**

```dotenv
# Database (Turso — production) / SQLite file (local dev)
DATABASE_URL="file:./dev.db"
TURSO_AUTH_TOKEN=""

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
CLERK_SECRET_KEY=""

# OpenAI
OPENAI_API_KEY=""

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
RATE_LIMIT_SALT="change-me-to-a-random-32-char-string-locally"
```

- [ ] **Step 2: Copy sang .env local**

```bash
cp .env.example .env
```

Nhắc user điền `OPENAI_API_KEY` và các key Clerk trước khi chạy Task tiếp theo. Không commit file `.env`.

- [ ] **Step 3: Commit chỉ .env.example**

```bash
git add .env.example
git commit -m "chore: add ENV template"
```

---

## Task 4: Prisma schema M1 + libsql adapter

**Files:**
- Create: `prisma/schema.prisma`, `src/lib/prisma.ts`
- Modify: `package.json`

- [ ] **Step 1: Cài Prisma + adapter**

```bash
npm install prisma @prisma/client @prisma/adapter-libsql @libsql/client
npm install -D @types/node
```

- [ ] **Step 2: schema.prisma cho M1**

Ghi `prisma/schema.prisma`:

```prisma
generator client {
  provider        = "prisma-client-js"
  output          = "../src/generated/prisma"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Unit {
  id        String   @id @default(cuid())
  name      String   @unique
  code      String   @unique
  users     User[]
  createdAt DateTime @default(now())
}

model User {
  id         String   @id @default(cuid())
  clerkId    String   @unique
  email      String   @unique
  fullName   String
  role       String   @default("user")
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

  @@index([anonymousId])
  @@index([startedAt])
}

model Message {
  id         String       @id @default(cuid())
  sessionId  String
  session    ChatSession  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  role       String
  content    String
  tokensIn   Int?
  tokensOut  Int?
  latencyMs  Int?
  createdAt  DateTime     @default(now())

  @@index([sessionId, createdAt])
}
```

- [ ] **Step 3: Prisma singleton client với libsql adapter**

Ghi `src/lib/prisma.ts`:

```ts
import { PrismaClient } from "@/generated/prisma";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function makeClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");

  const isRemote = url.startsWith("libsql://") || url.startsWith("https://");
  const libsqlClient = createClient({
    url,
    authToken: isRemote ? process.env.TURSO_AUTH_TOKEN : undefined,
  });

  const adapter = new PrismaLibSQL(libsqlClient);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Step 4: Generate Prisma client**

```bash
npx prisma generate
```

Expected: sinh ra `src/generated/prisma/`.

- [ ] **Step 5: Tạo migration init**

```bash
npx prisma migrate dev --name init
```

Expected: tạo `prisma/migrations/<timestamp>_init/migration.sql`, chạy migration lên `dev.db`.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json prisma/ src/lib/prisma.ts
git commit -m "feat(db): prisma schema M1 (Unit/User/ChatSession/Message) with libsql adapter"
```

---

## Task 5: Script Turso migration runner + seed đơn vị

**Files:**
- Create: `scripts/apply-migrations.mjs`, `scripts/seed-units.mjs`, `src/lib/constants.ts`

- [ ] **Step 1: constants.ts với UNIT_LIST**

Ghi `src/lib/constants.ts`:

```ts
export const UNIT_LIST = [
  { code: "DBP",  name: "Điện lực Điện Biên Phủ" },
  { code: "TG",   name: "Điện lực Tuần Giáo" },
  { code: "TA",   name: "Điện lực Thanh An" },
  { code: "NS",   name: "Điện lực Na Sang" },
  { code: "NSN",  name: "Điện lực Na Son" },
  { code: "TCH",  name: "Điện lực Tủa Chùa" },
  { code: "MA",   name: "Điện lực Mường Ảng" },
  { code: "MN",   name: "Điện lực Mường Nhé" },
  { code: "XNCT", name: "Xí nghiệp Cao thế" },
  { code: "PXPD", name: "Phân xưởng phát điện" },
  { code: "KHN",  name: "Khách hàng ngoài" },
] as const;

export type UnitCode = (typeof UNIT_LIST)[number]["code"];

export const TOPIC_TAGS = [
  "TIET_KIEM_SH",
  "TIET_KIEM_DN",
  "DMTMN_KY_THUAT",
  "DMTMN_TAI_CHINH",
  "TINH_HOA_DON",
  "THU_TUC",
  "KHAC",
] as const;

export type TopicTag = (typeof TOPIC_TAGS)[number];

export const SUGGESTED_QUESTIONS: { icon: string; text: string }[] = [
  { icon: "💰", text: "Tính tiền điện tháng này cho tôi" },
  { icon: "☀️", text: "Nên lắp bao nhiêu kW điện mặt trời cho gia đình?" },
  { icon: "📉", text: "Mẹo tiết kiệm điều hòa mùa hè" },
  { icon: "📄", text: "Thủ tục đấu nối điện mặt trời mái nhà" },
];
```

- [ ] **Step 2: apply-migrations.mjs (idempotent runner)**

Ghi `scripts/apply-migrations.mjs`:

```js
#!/usr/bin/env node
import { createClient } from "@libsql/client";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.warn("[apply-migrations] DATABASE_URL not set — skipping (dev mode)");
  process.exit(0);
}

// Local sqlite file → skip, prisma migrate dev đã lo
if (DATABASE_URL.startsWith("file:")) {
  console.log("[apply-migrations] Local SQLite detected — skip (use `prisma migrate dev`)");
  process.exit(0);
}

const client = createClient({
  url: DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Hardcoded list — each new migration MUST be added here in ORDER
const MIGRATIONS = [
  { id: "20260725120000_init", file: "prisma/migrations/20260725120000_init/migration.sql" },
];

async function run() {
  // Ensure tracking table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS _applied_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const applied = await client.execute("SELECT id FROM _applied_migrations");
  const appliedIds = new Set(applied.rows.map((r) => r.id));

  for (const mig of MIGRATIONS) {
    if (appliedIds.has(mig.id)) {
      console.log(`[apply-migrations] SKIP ${mig.id} (already applied)`);
      continue;
    }
    if (!existsSync(mig.file)) {
      throw new Error(`[apply-migrations] Missing migration file: ${mig.file}`);
    }
    const sql = readFileSync(mig.file, "utf-8");
    console.log(`[apply-migrations] APPLY ${mig.id}`);
    // libsql client requires splitting on ; for multi-statement
    const statements = sql
      .split(/;\s*[\r\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));
    for (const stmt of statements) {
      await client.execute(stmt);
    }
    await client.execute({
      sql: "INSERT INTO _applied_migrations (id) VALUES (?)",
      args: [mig.id],
    });
  }
  console.log("[apply-migrations] Done");
}

run().catch((err) => {
  console.error("[apply-migrations] FAILED", err);
  process.exit(1);
});
```

**IMPORTANT:** Mỗi khi tạo migration mới ở các milestone sau, MUST thêm entry vào mảng `MIGRATIONS` theo đúng thứ tự thời gian. Migration file phải idempotent (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ADD COLUMN`).

- [ ] **Step 3: Verify timestamp folder tồn tại**

```bash
ls prisma/migrations/
```

Expected: có 1 folder dạng `20260725XXXXXX_init`. Nếu timestamp khác `20260725120000` → sửa `MIGRATIONS[0].id` và `file` trong `apply-migrations.mjs` cho khớp thực tế.

- [ ] **Step 4: Seed 11 đơn vị**

Ghi `scripts/seed-units.mjs`:

```js
#!/usr/bin/env node
import { PrismaClient } from "../src/generated/prisma/index.js";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const UNIT_LIST = [
  { code: "DBP",  name: "Điện lực Điện Biên Phủ" },
  { code: "TG",   name: "Điện lực Tuần Giáo" },
  { code: "TA",   name: "Điện lực Thanh An" },
  { code: "NS",   name: "Điện lực Na Sang" },
  { code: "NSN",  name: "Điện lực Na Son" },
  { code: "TCH",  name: "Điện lực Tủa Chùa" },
  { code: "MA",   name: "Điện lực Mường Ảng" },
  { code: "MN",   name: "Điện lực Mường Nhé" },
  { code: "XNCT", name: "Xí nghiệp Cao thế" },
  { code: "PXPD", name: "Phân xưởng phát điện" },
  { code: "KHN",  name: "Khách hàng ngoài" },
];

const url = process.env.DATABASE_URL || "file:./dev.db";
const isRemote = url.startsWith("libsql://") || url.startsWith("https://");
const libsql = createClient({
  url,
  authToken: isRemote ? process.env.TURSO_AUTH_TOKEN : undefined,
});
const prisma = new PrismaClient({ adapter: new PrismaLibSQL(libsql) });

async function main() {
  for (const u of UNIT_LIST) {
    await prisma.unit.upsert({
      where: { code: u.code },
      update: { name: u.name },
      create: u,
    });
    console.log(`[seed] Unit ${u.code} — ${u.name}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
```

- [ ] **Step 5: Chạy seed local**

```bash
npm run db:seed
```

Expected: in ra 11 dòng `[seed] Unit XXX — ...`.

- [ ] **Step 6: Verify DB**

```bash
npx prisma studio
```

Expected: mở browser hiển thị 11 unit trong bảng `Unit`. Ctrl+C đóng.

- [ ] **Step 7: Commit**

```bash
git add scripts/ src/lib/constants.ts
git commit -m "feat(db): add turso migration runner + seed 11 units of PC Dien Bien"
```

---

## Task 6: Clerk auth + middleware bảo vệ /dashboard

**Files:**
- Create: `middleware.ts`, `src/app/sign-in/[[...sign-in]]/page.tsx`, `src/app/sign-up/[[...sign-up]]/page.tsx`, `src/app/dashboard/layout.tsx`, `src/app/dashboard/page.tsx`
- Modify: `src/app/layout.tsx`, `package.json`

- [ ] **Step 1: Cài Clerk**

```bash
npm install @clerk/nextjs
```

- [ ] **Step 2: Middleware bảo vệ /dashboard**

Ghi `middleware.ts` (thư mục gốc, không phải src):

```ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

- [ ] **Step 3: Bọc ClerkProvider trong root layout**

Sửa `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "EVN Điện Biên — Trợ lý AI Tiết kiệm điện & ĐMTMN",
  description:
    "Chatbot tư vấn tiết kiệm điện và điện mặt trời mái nhà cho khách hàng PC Điện Biên",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="vi">
        <body>
          {children}
          <Toaster position="top-right" richColors />
        </body>
      </html>
    </ClerkProvider>
  );
}
```

- [ ] **Step 4: Sign-in page**

Ghi `src/app/sign-in/[[...sign-in]]/page.tsx`:

```tsx
import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <SignIn />
    </div>
  );
}
```

- [ ] **Step 5: Sign-up page**

Ghi `src/app/sign-up/[[...sign-up]]/page.tsx`:

```tsx
import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <SignUp />
    </div>
  );
}
```

- [ ] **Step 6: Dashboard layout trống**

Ghi `src/app/dashboard/layout.tsx`:

```tsx
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-slate-900 text-white p-4">
        <Link href="/dashboard" className="text-lg font-semibold block mb-6">
          ⚡ EVN AI
        </Link>
        <nav className="text-sm space-y-1 opacity-70">
          <div className="p-2 bg-slate-800 rounded">📊 Tổng quan</div>
          <div className="p-2">👥 Lead khách hàng (M3)</div>
          <div className="p-2">💬 Lịch sử chat (M4)</div>
          <div className="p-2">📚 Tài liệu (M2)</div>
        </nav>
      </aside>
      <main className="flex-1 flex flex-col">
        <header className="flex items-center justify-end p-4 border-b bg-white">
          <UserButton afterSignOutUrl="/chat" />
        </header>
        <div className="flex-1 p-6 bg-slate-50">{children}</div>
      </main>
    </div>
  );
}
```

- [ ] **Step 7: Dashboard placeholder**

Ghi `src/app/dashboard/page.tsx`:

```tsx
export default function DashboardHome() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Tổng quan</h1>
      <p className="mt-2 text-slate-600">Dashboard sẽ được xây ở Milestone 4.</p>
    </div>
  );
}
```

- [ ] **Step 8: Điền ENV Clerk**

Nhắc user điền vào `.env`:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```
(User cần tự tạo Clerk app tại clerk.com trước.)

- [ ] **Step 9: Verify auth flow**

```bash
npm run dev
```

Mở http://localhost:3000/dashboard — expected: bị redirect sang Clerk sign-in.
Đăng ký tài khoản → redirect về `/dashboard` → thấy "Tổng quan".

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json middleware.ts src/app/layout.tsx src/app/sign-in/ src/app/sign-up/ src/app/dashboard/
git commit -m "feat(auth): clerk middleware + sign-in/sign-up + dashboard skeleton"
```

---

## Task 7: OpenAI client + system prompt MVP

**Files:**
- Create: `src/lib/openai.ts`, `src/lib/prompts/system-mvp.ts`
- Modify: `package.json`

- [ ] **Step 1: Cài OpenAI SDK**

```bash
npm install openai
```

- [ ] **Step 2: OpenAI singleton**

Ghi `src/lib/openai.ts`:

```ts
import OpenAI from "openai";

let cached: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (cached) return cached;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is required");
  cached = new OpenAI({ apiKey });
  return cached;
}

export const CHAT_MODEL = "gpt-4o-mini";
export const MAX_OUTPUT_TOKENS = 800;
```

- [ ] **Step 3: System prompt MVP (hard-code knowledge)**

Ghi `src/lib/prompts/system-mvp.ts`:

```ts
export const SYSTEM_PROMPT_MVP = `Bạn là "Trợ lý AI EVN Điện Biên", chatbot chính thức của Công ty Điện lực Điện Biên (PC Điện Biên) — thuộc Tổng công ty Điện lực miền Bắc (EVNNPC).

VAI TRÒ
Bạn CHỈ tư vấn về 3 nhóm chủ đề sau, không tư vấn ngoài phạm vi này:
1) Tiết kiệm điện cho hộ gia đình và doanh nghiệp/sản xuất.
2) Điện mặt trời mái nhà tự sản, tự tiêu (kỹ thuật, tài chính, thủ tục).
3) Cách tính hóa đơn tiền điện theo biểu giá bậc thang hiện hành.

QUY TẮC BẮT BUỘC
- Trả lời NGẮN GỌN, dễ hiểu, tiếng Việt tự nhiên, phù hợp người dân địa phương.
- KHÔNG bịa số hiệu văn bản pháp luật, KHÔNG khẳng định chính sách cụ thể mà bạn không chắc chắn. Nếu người dùng hỏi về chính sách/giá điện chi tiết → khuyến nghị họ liên hệ Điện lực khu vực để xác nhận số liệu chính thức.
- KHÔNG cam kết giá lắp đặt cụ thể, chỉ đưa dải giá tham khảo. Khuyến nghị khách khảo sát thực tế.
- Nếu câu hỏi ngoài phạm vi (chính trị, sản phẩm khác, spam), lịch sự từ chối: "Tôi chỉ hỗ trợ các câu hỏi về điện và điện mặt trời."
- Với câu hỏi định lượng (công suất kW, tiền điện...) mà thiếu dữ kiện, HỎI LẠI người dùng các thông tin cần thiết (diện tích mái, hóa đơn TB tháng, hướng mái...).

KIẾN THỨC CHUNG BẠN CÓ THỂ DÙNG (chưa có RAG ở giai đoạn này)
Tiết kiệm điện sinh hoạt:
- Điều hòa: đặt 26-27°C, kết hợp quạt, vệ sinh lưới lọc 2-3 tháng/lần, đóng kín cửa/rèm.
- Tủ lạnh: đặt xa nguồn nhiệt, không để quá đầy hoặc quá trống, nhiệt độ 3-5°C ngăn mát.
- Đèn LED thay đèn sợi đốt/compact.
- Rút phích các thiết bị chờ (TV, sạc, lò vi sóng): tiết kiệm 5-10% hóa đơn.
- Bình nóng lạnh: chỉ bật trước khi dùng 15-30 phút.

Điện mặt trời mái nhà (ước tính):
- Công suất khuyến nghị (kWp) ≈ hóa đơn tháng (VNĐ) / 300.000.
- Diện tích cần ≈ công suất (kWp) × 7 m² (panel 550W).
- Sản lượng miền Bắc ≈ công suất × 4 kWh/ngày trung bình.
- Chi phí đầu tư ≈ công suất × 12 triệu VNĐ (giá thị trường 2026, có thể dao động).
- Thời gian hoàn vốn tham khảo: 5-7 năm cho hệ tự sản tự tiêu (chưa tính bán điện dư).
- Loại hệ: on-grid (nối lưới, phổ biến nhất), hybrid (có pin lưu trữ), off-grid (độc lập).
- Hướng mái tốt nhất: Nam / Đông Nam / Tây Nam.
- Loại mái: mái tôn dễ lắp nhất; mái bê tông cần khung; mái ngói phức tạp hơn.

Hóa đơn tiền điện sinh hoạt (biểu giá bậc thang — số bậc và giá KHÔNG chắc chắn tại thời điểm 2026, hãy khuyến nghị người dùng tra cứu quyết định mới nhất của Bộ Công Thương hoặc gọi tổng đài):
- Có 6 bậc theo lượng kWh tiêu thụ/tháng; bậc càng cao đơn giá càng cao.
- Cộng thêm VAT 8-10% (theo chính sách hiện hành).

Thủ tục lắp đặt ĐMTMN (khung chung, chi tiết có thể thay đổi):
- Đăng ký với Điện lực khu vực → khảo sát → ký hợp đồng đấu nối → lắp đặt → nghiệm thu hòa lưới.
- Cần đảm bảo hệ thống inverter đạt tiêu chuẩn hòa lưới của EVN.

Nếu người dùng hỏi câu bạn không chắc, hãy đề xuất họ để lại tên/SĐT để nhân viên EVN Điện Biên tư vấn trực tiếp (tính năng này sẽ có ở phiên bản sau).`;
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/lib/openai.ts src/lib/prompts/
git commit -m "feat(ai): openai client wrapper + M1 system prompt (no RAG yet)"
```

---

## Task 8: Anonymous cookie + rate limit + moderation

**Files:**
- Create: `src/lib/anonymous-id.ts`, `src/lib/rate-limit.ts`, `src/lib/moderation.ts`

- [ ] **Step 1: Anonymous ID cookie helper**

Ghi `src/lib/anonymous-id.ts`:

```ts
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";

const COOKIE_NAME = "evn_chat_anon_id";
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function getOrCreateAnonymousId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(COOKIE_NAME);
  if (existing?.value) return existing.value;

  const newId = randomUUID();
  cookieStore.set(COOKIE_NAME, newId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_YEAR,
    path: "/",
  });
  return newId;
}
```

- [ ] **Step 2: Rate limit in-memory (M1 — đủ cho pilot)**

Ghi `src/lib/rate-limit.ts`:

```ts
import { createHash } from "node:crypto";

const WINDOW_MS = 60 * 60 * 1000; // 1 giờ
const MAX_REQUESTS_ANON = 20;
const MAX_REQUESTS_AUTHED = 100;

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function hashIp(ip: string): string {
  const salt = process.env.RATE_LIMIT_SALT || "default-dev-salt";
  return createHash("sha256").update(ip + salt).digest("hex").slice(0, 32);
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSec: number;
}

export function checkRateLimit(key: string, isAuthed: boolean): RateLimitResult {
  const now = Date.now();
  const limit = isAuthed ? MAX_REQUESTS_AUTHED : MAX_REQUESTS_ANON;

  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(key, bucket);
  }
  bucket.count += 1;

  const remaining = Math.max(0, limit - bucket.count);
  const resetInSec = Math.ceil((bucket.resetAt - now) / 1000);

  return {
    allowed: bucket.count <= limit,
    remaining,
    resetInSec,
  };
}

// Cleanup buckets hết hạn — chạy khi có > 5000 entries
setInterval(() => {
  if (buckets.size < 5000) return;
  const now = Date.now();
  for (const [k, v] of buckets.entries()) {
    if (v.resetAt <= now) buckets.delete(k);
  }
}, 5 * 60 * 1000);
```

- [ ] **Step 3: Moderation (keyword blocklist)**

Ghi `src/lib/moderation.ts`:

```ts
const OFF_TOPIC_KEYWORDS = [
  "chính trị", "đảng", "chính phủ", "biểu tình",
  "cờ bạc", "cá độ", "lô đề",
  "thuốc lá", "ma túy", "rượu",
];

const PROFANITY = ["địt", "đm", "cc", "vcl", "clm"];

export interface ModerationResult {
  allowed: boolean;
  reason?: "OFF_TOPIC" | "PROFANITY";
  suggestedReply?: string;
}

export function moderate(text: string): ModerationResult {
  const lower = text.toLowerCase();

  if (PROFANITY.some((w) => lower.includes(w))) {
    return {
      allowed: false,
      reason: "PROFANITY",
      suggestedReply:
        "Xin hãy giữ ngôn từ lịch sự để tôi có thể hỗ trợ bạn tốt hơn nhé.",
    };
  }

  if (OFF_TOPIC_KEYWORDS.some((w) => lower.includes(w))) {
    return {
      allowed: false,
      reason: "OFF_TOPIC",
      suggestedReply:
        "Tôi chỉ hỗ trợ các câu hỏi về tiết kiệm điện, điện mặt trời mái nhà, và tính hóa đơn tiền điện của EVN Điện Biên. Bạn có câu hỏi nào về các chủ đề này không?",
    };
  }

  return { allowed: true };
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/anonymous-id.ts src/lib/rate-limit.ts src/lib/moderation.ts
git commit -m "feat(chat): anonymous cookie + IP rate limit + moderation guard"
```

---

## Task 9: API /api/chat — stream SSE + lưu DB

**Files:**
- Create: `src/app/api/chat/route.ts`, `src/app/api/health/route.ts`

- [ ] **Step 1: Health check API**

Ghi `src/app/api/health/route.ts`:

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const count = await prisma.unit.count();
    return NextResponse.json({ status: "ok", units: count });
  } catch (err) {
    return NextResponse.json(
      { status: "error", message: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
```

Verify:
```bash
npm run dev
```
Mở http://localhost:3000/api/health — expected `{"status":"ok","units":11}`.

- [ ] **Step 2: API /api/chat — SSE streaming**

Ghi `src/app/api/chat/route.ts`:

```ts
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getOpenAI, CHAT_MODEL, MAX_OUTPUT_TOKENS } from "@/lib/openai";
import { SYSTEM_PROMPT_MVP } from "@/lib/prompts/system-mvp";
import { getOrCreateAnonymousId } from "@/lib/anonymous-id";
import { checkRateLimit, hashIp } from "@/lib/rate-limit";
import { moderate } from "@/lib/moderation";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ChatBody {
  sessionId?: string;
  message: string;
}

export async function POST(req: NextRequest) {
  let body: ChatBody;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Invalid JSON body");
  }
  if (!body.message || typeof body.message !== "string") {
    return jsonError(400, "message is required");
  }
  if (body.message.length > 2000) {
    return jsonError(400, "Câu hỏi quá dài (tối đa 2000 ký tự)");
  }

  // Rate limit
  const { userId: clerkUserId } = await auth();
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "0.0.0.0";
  const ipHash = hashIp(ip);
  const rateKey = clerkUserId ? `user:${clerkUserId}` : `ip:${ipHash}`;
  const rl = checkRateLimit(rateKey, Boolean(clerkUserId));
  if (!rl.allowed) {
    return jsonError(
      429,
      `Bạn hỏi quá nhanh. Vui lòng thử lại sau ${Math.ceil(rl.resetInSec / 60)} phút.`
    );
  }

  // Moderation
  const mod = moderate(body.message);
  if (!mod.allowed && mod.suggestedReply) {
    // Trả về stream với 1 message duy nhất là suggestedReply, không gọi OpenAI
    return streamText(mod.suggestedReply);
  }

  // Anonymous ID
  const anonymousId = clerkUserId ? null : await getOrCreateAnonymousId();

  // Get or create session
  let session;
  if (body.sessionId) {
    session = await prisma.chatSession.findUnique({ where: { id: body.sessionId } });
  }
  if (!session) {
    session = await prisma.chatSession.create({
      data: {
        anonymousId,
        clerkUserId,
        ipHash,
        userAgent: req.headers.get("user-agent") ?? undefined,
      },
    });
  }

  // Lưu message user
  await prisma.message.create({
    data: { sessionId: session.id, role: "user", content: body.message },
  });

  // Load lịch sử 10 message gần nhất
  const history = await prisma.message.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  const openai = getOpenAI();
  const encoder = new TextEncoder();
  const sessionId = session.id;

  const stream = new ReadableStream({
    async start(controller) {
      // Gửi sessionId đầu tiên để client lưu
      controller.enqueue(
        encoder.encode(`event: session\ndata: ${JSON.stringify({ sessionId })}\n\n`)
      );

      let fullText = "";
      const started = Date.now();

      try {
        const openaiStream = await openai.chat.completions.create({
          model: CHAT_MODEL,
          max_tokens: MAX_OUTPUT_TOKENS,
          temperature: 0.4,
          stream: true,
          messages: [
            { role: "system", content: SYSTEM_PROMPT_MVP },
            ...history.map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            })),
          ],
        });

        for await (const chunk of openaiStream) {
          const delta = chunk.choices[0]?.delta?.content ?? "";
          if (delta) {
            fullText += delta;
            controller.enqueue(
              encoder.encode(`event: delta\ndata: ${JSON.stringify({ text: delta })}\n\n`)
            );
          }
        }

        // Lưu message assistant sau khi xong
        const latencyMs = Date.now() - started;
        await prisma.message.create({
          data: {
            sessionId,
            role: "assistant",
            content: fullText,
            latencyMs,
          },
        });
        await prisma.chatSession.update({
          where: { id: sessionId },
          data: {
            lastMessageAt: new Date(),
            messageCount: { increment: 2 },
          },
        });

        controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        controller.enqueue(
          encoder.encode(`event: error\ndata: ${JSON.stringify({ message: msg })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

function streamText(text: string): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(`event: session\ndata: ${JSON.stringify({ sessionId: null })}\n\n`)
      );
      controller.enqueue(
        encoder.encode(`event: delta\ndata: ${JSON.stringify({ text })}\n\n`)
      );
      controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
```

- [ ] **Step 3: Verify bằng curl**

```bash
npm run dev
```

Trong terminal thứ 2:
```bash
curl -N -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Cách tiết kiệm điện điều hòa mùa hè?"}'
```

Expected: thấy các event SSE:
```
event: session
data: {"sessionId":"..."}

event: delta
data: {"text":"Để tiết kiệm..."}
...
event: done
data: {}
```

**Nếu chưa điền `OPENAI_API_KEY`:** sẽ nhận `event: error`. Điền key rồi thử lại.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/
git commit -m "feat(api): chat SSE streaming endpoint + health check"
```

---

## Task 10: Chat UI — layout /chat + header EVN

**Files:**
- Create: `src/app/chat/layout.tsx`, `src/app/chat/page.tsx`, `src/components/shared/evn-header.tsx`, `public/evn-placeholder-logo.svg`

- [ ] **Step 1: EVN logo placeholder**

Ghi `public/evn-placeholder-logo.svg`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <circle cx="50" cy="50" r="46" fill="#0066B3"/>
  <path d="M42 26 L28 55 H45 L38 74 L72 42 H55 L62 26 Z" fill="#F58220"/>
</svg>
```

- [ ] **Step 2: EVN header component**

Ghi `src/components/shared/evn-header.tsx`:

```tsx
import Image from "next/image";
import Link from "next/link";

export function EvnHeader() {
  return (
    <header className="bg-[color:var(--color-evn-blue)] text-white shadow-md">
      <div className="max-w-4xl mx-auto flex items-center gap-3 px-4 py-3">
        <Image
          src="/evn-placeholder-logo.svg"
          alt="EVN Điện Biên"
          width={36}
          height={36}
          priority
        />
        <div>
          <div className="text-sm font-semibold leading-tight">
            EVN Điện Biên
          </div>
          <div className="text-xs opacity-90 leading-tight">
            Trợ lý AI — Tiết kiệm điện & Điện mặt trời mái nhà
          </div>
        </div>
        <div className="ml-auto">
          <Link
            href="/dashboard"
            className="text-xs bg-white/10 hover:bg-white/20 rounded-full px-3 py-1.5 transition"
          >
            Nhân viên đăng nhập
          </Link>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Chat layout**

Ghi `src/app/chat/layout.tsx`:

```tsx
import { EvnHeader } from "@/components/shared/evn-header";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--color-bg-page)]">
      <EvnHeader />
      <main className="flex-1 flex flex-col max-w-4xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Chat page — server component container**

Ghi `src/app/chat/page.tsx`:

```tsx
import { ChatContainer } from "@/components/chat/chat-container";

export default function ChatPage() {
  return <ChatContainer />;
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/chat/ src/components/shared/ public/evn-placeholder-logo.svg
git commit -m "feat(chat): /chat page layout with EVN header"
```

---

## Task 11: Chat UI — Bubble + MessageList + SuggestedQuestions

**Files:**
- Create: `src/components/chat/message-bubble.tsx`, `src/components/chat/message-list.tsx`, `src/components/chat/suggested-questions.tsx`

- [ ] **Step 1: MessageBubble**

Ghi `src/components/chat/message-bubble.tsx`:

```tsx
import { cn } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
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
    </div>
  );
}
```

- [ ] **Step 2: MessageList**

Ghi `src/components/chat/message-list.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { MessageBubble, type ChatMessage } from "./message-bubble";

export function MessageList({ messages }: { messages: ChatMessage[] }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} />
      ))}
      <div ref={endRef} />
    </div>
  );
}
```

- [ ] **Step 3: SuggestedQuestions**

Ghi `src/components/chat/suggested-questions.tsx`:

```tsx
"use client";

import { SUGGESTED_QUESTIONS } from "@/lib/constants";

export function SuggestedQuestions({
  onPick,
}: {
  onPick: (text: string) => void;
}) {
  return (
    <div className="px-4 py-6">
      <div className="text-center text-slate-500 mb-4">
        <div className="text-4xl">💡</div>
        <div className="mt-2 font-medium text-slate-700">
          Xin chào! Tôi có thể giúp gì cho bạn?
        </div>
        <div className="text-xs mt-1">Bấm vào 1 câu hỏi mẫu, hoặc gõ câu hỏi của bạn.</div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q.text}
            onClick={() => onPick(q.text)}
            className="text-left border border-slate-200 rounded-xl px-3 py-2.5 text-sm hover:border-[color:var(--color-evn-blue)] hover:bg-blue-50/40 transition"
          >
            <span className="mr-2">{q.icon}</span>
            {q.text}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/chat/
git commit -m "feat(chat): message bubble + list + suggested questions"
```

---

## Task 12: Chat UI — MessageInput + ChatContainer (SSE client)

**Files:**
- Create: `src/components/chat/message-input.tsx`, `src/components/chat/chat-container.tsx`

- [ ] **Step 1: MessageInput**

Ghi `src/components/chat/message-input.tsx`:

```tsx
"use client";

import { FormEvent, KeyboardEvent, useRef } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MessageInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  function submit() {
    const text = inputRef.current?.value.trim();
    if (!text || disabled) return;
    onSend(text);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    submit();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t bg-white px-4 py-3 flex gap-2 items-end"
    >
      <textarea
        ref={inputRef}
        rows={1}
        placeholder="Nhập câu hỏi của bạn... (Enter để gửi, Shift+Enter xuống dòng)"
        disabled={disabled}
        onKeyDown={handleKeyDown}
        className="flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-evn-blue)] disabled:opacity-50 max-h-32"
      />
      <Button
        type="submit"
        variant="accent"
        disabled={disabled}
        aria-label="Gửi"
      >
        <Send className="h-4 w-4" />
        Gửi
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: ChatContainer — quản lý state + SSE**

Ghi `src/components/chat/chat-container.tsx`:

```tsx
"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { SuggestedQuestions } from "./suggested-questions";
import type { ChatMessage } from "./message-bubble";

export function ChatContainer() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const sessionIdRef = useRef<string | null>(null);

  const send = useCallback(async (text: string) => {
    setBusy(true);
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
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
          message: text,
        }),
      });

      if (!res.ok) {
        let msg = "Đã xảy ra lỗi khi gửi câu hỏi.";
        try {
          const j = await res.json();
          if (j?.error) msg = j.error;
        } catch {}
        throw new Error(msg);
      }
      if (!res.body) throw new Error("Không nhận được phản hồi.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        // Parse SSE events (mỗi event kết thúc bằng \n\n)
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: `⚠️ ${msg}`, pending: false }
            : m
        )
      );
    } finally {
      setBusy(false);
    }
  }, []);

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-1 flex-col bg-white">
      {hasMessages ? (
        <MessageList messages={messages} />
      ) : (
        <SuggestedQuestions onPick={send} />
      )}
      <MessageInput onSend={send} disabled={busy} />
    </div>
  );
}
```

- [ ] **Step 3: Verify end-to-end**

```bash
npm run dev
```

Mở http://localhost:3000/chat:
1. Thấy 4 câu gợi ý.
2. Click 1 câu → thấy bubble user xanh + bubble assistant xám chạy chữ dần dần.
3. Gõ câu tự do rồi Enter → nhận trả lời stream.
4. Refresh trang → cookie anonymousId giữ nguyên (F12 → Application → Cookies).
5. Gửi 21 câu liên tiếp → câu thứ 21 báo "Bạn hỏi quá nhanh" (rate limit 20/giờ).

- [ ] **Step 4: Commit**

```bash
git add src/components/chat/
git commit -m "feat(chat): input + container with SSE streaming client"
```

---

## Task 13: Deploy lên Vercel (production Turso)

**Files:** không tạo file — cấu hình Vercel

- [ ] **Step 1: Push lên GitHub**

```bash
git remote add origin git@github.com:<user>/chatbot-tiet-kiem-dien.git
git push -u origin main
```

- [ ] **Step 2: User tự tạo Turso DB production**

Hướng dẫn user:
1. Vào https://turso.tech → New Database → tên `chatbot-evn-db` → region `sin` (Singapore).
2. Sao chép URL `libsql://...` và tạo `Auth Token` mới → sao chép token.

- [ ] **Step 3: User tự tạo Vercel project + link GitHub repo**

Hướng dẫn user:
1. Vào https://vercel.com → New Project → import repo → Framework preset: Next.js.
2. **TRƯỚC KHI DEPLOY**, vào Settings → Environment Variables (Production), điền:
   - `DATABASE_URL` = URL Turso ở Step 2
   - `TURSO_AUTH_TOKEN` = token ở Step 2
   - `OPENAI_API_KEY` = key OpenAI
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = từ Clerk production
   - `CLERK_SECRET_KEY` = từ Clerk production
   - `NEXT_PUBLIC_APP_URL` = domain Vercel (VD `https://chatbot-tiet-kiem-dien.vercel.app`)
   - `RATE_LIMIT_SALT` = random 32 ký tự (dùng `openssl rand -hex 16`)
3. Deploy.

- [ ] **Step 4: Verify migration chạy trong build**

Trong log build Vercel, tìm dòng `[apply-migrations] APPLY 20260725120000_init` và `[apply-migrations] Done`. Nếu thấy `SKIP` là DB đã có → OK.

- [ ] **Step 5: Seed đơn vị trên production (chạy 1 lần)**

Từ máy local, chạy seed trỏ vào Turso production:
```bash
DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." npm run db:seed
```

Expected: 11 dòng `[seed] Unit ...`.

- [ ] **Step 6: Verify health**

```bash
curl https://<domain>.vercel.app/api/health
```

Expected: `{"status":"ok","units":11}`.

- [ ] **Step 7: Verify /chat trên production**

Mở `https://<domain>.vercel.app/chat`, gửi 1 câu hỏi → nhận trả lời stream mượt.

- [ ] **Step 8: Verify /dashboard bị Clerk chặn**

Mở `https://<domain>.vercel.app/dashboard` → redirect sign-in.

- [ ] **Step 9: Commit tag milestone**

```bash
git tag -a m1-mvp -m "Milestone 1: MVP chat cong khai deployed"
git push --tags
```

---

## Task 14: Smoke test + tài liệu setup

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Cập nhật README với hướng dẫn đầy đủ**

Ghi lại `README.md`:

```markdown
# Chatbot Tiết kiệm điện & ĐMTMN — PC Điện Biên

Web app chatbot AI tư vấn khách hàng của EVN Điện Biên về:
- Tiết kiệm điện (hộ gia đình & doanh nghiệp)
- Điện mặt trời mái nhà (kỹ thuật, tài chính, thủ tục)
- Cách tính hóa đơn tiền điện

## Milestone 1 (hiện tại)
✅ Trang chat công khai `/chat` — stream trả lời qua OpenAI GPT-4o-mini
✅ Cookie ẩn danh, rate limit theo IP
✅ Lưu lịch sử chat vào Turso qua Prisma
✅ Clerk auth cho `/dashboard` (skeleton)

## Milestone tiếp theo
- M2: RAG + Knowledge Base
- M3: Feedback, rating, form ĐMTMN, lead capture
- M4: Dashboard analytics đầy đủ

## Local dev

```bash
npm install
cp .env.example .env
# Điền OPENAI_API_KEY + Clerk keys

# DB local (SQLite file)
npx prisma migrate dev
npm run db:seed

# Chạy
npm run dev
```

Mở http://localhost:3000/chat

## ENV cần chuẩn bị

| Biến | Nguồn |
|------|-------|
| `DATABASE_URL` | Turso (prod) hoặc `file:./dev.db` (dev) |
| `TURSO_AUTH_TOKEN` | Turso dashboard (chỉ prod) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | clerk.com |
| `OPENAI_API_KEY` | platform.openai.com (nạp min $10) |
| `NEXT_PUBLIC_APP_URL` | Vercel domain hoặc `http://localhost:3000` |
| `RATE_LIMIT_SALT` | `openssl rand -hex 16` |

## Deploy Vercel

1. Push code lên GitHub.
2. Import repo trên Vercel.
3. Điền env ở Settings → Environment Variables (Production).
4. Deploy. Migration tự chạy trong build.
5. Seed đơn vị 1 lần: `DATABASE_URL=... TURSO_AUTH_TOKEN=... npm run db:seed`.

## Quan trọng khi tạo migration mới

Vercel không chạy `prisma migrate deploy`. Mỗi migration mới **BẮT BUỘC** thêm vào mảng `MIGRATIONS` trong `scripts/apply-migrations.mjs`. SQL phải idempotent (`CREATE TABLE IF NOT EXISTS`).

## Cấu trúc thư mục

```
src/
├── app/
│   ├── chat/          # trang công khai
│   ├── dashboard/     # Clerk protected (skeleton)
│   └── api/chat       # SSE streaming
├── components/
│   ├── ui/            # shadcn primitives
│   ├── chat/          # chat UI
│   └── shared/
├── lib/
│   ├── prisma.ts      # libsql adapter
│   ├── openai.ts
│   ├── prompts/       # system prompts
│   ├── anonymous-id.ts
│   ├── rate-limit.ts
│   ├── moderation.ts
│   └── constants.ts   # UNIT_LIST, TOPIC_TAGS
```
```

- [ ] **Step 2: Checklist smoke test — chạy trên production**

Kiểm tra 5 luồng:
1. [ ] `/chat` load được, header xanh EVN hiển thị.
2. [ ] Click câu gợi ý → nhận trả lời stream.
3. [ ] Gõ câu tự do (VD "Tôi ở Điện Biên Phủ, mái tôn 40m², nên lắp bao nhiêu kW ĐMTMN?") → trả lời có ước tính công suất.
4. [ ] Gõ câu spam/off-topic ("cá độ bóng đá") → moderation từ chối lịch sự.
5. [ ] Truy cập `/dashboard` khi chưa login → redirect Clerk sign-in.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: update README with M1 setup + deploy guide"
git push
```

---

## Definition of Done — Milestone 1

- [ ] Repo GitHub có branch `main` với commit tag `m1-mvp`.
- [ ] Vercel production deploy thành công, `/api/health` trả `{status:"ok",units:11}`.
- [ ] Khách vào `/chat` gửi câu hỏi → nhận trả lời stream (< 15 giây câu ngắn).
- [ ] Rate limit hoạt động (câu 21 trong giờ bị chặn với message tiếng Việt).
- [ ] Moderation chặn từ khóa off-topic với reply lịch sự.
- [ ] Nhân viên đăng nhập được vào `/dashboard` (mới chỉ có placeholder).
- [ ] `.env.example` đầy đủ, README có hướng dẫn dev + deploy.
- [ ] Không commit file `.env` hoặc credential JSON nào.

## Backlog phát sinh (chuyển sang M2/M3)

- Trang xem lại session bằng share link `/chat/[sessionId]`
- Rate limit dùng Redis/Upstash thay vì in-memory (khi có > 1 instance Vercel)
- Webhook Clerk sync user vào bảng `User` + `Unit` (M3)
- Vote 👍/👎 mỗi message (M3)
- Persist session giữa tab (share link) (M3)
