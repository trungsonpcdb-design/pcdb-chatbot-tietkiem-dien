#!/usr/bin/env node
/**
 * Chèn nhanh 1 UnansweredQuery mẫu để test UI /dashboard/unanswered
 * Chạy: node scripts/seed-unanswered-demo.mjs
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/index.js";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const url = process.env.DATABASE_URL || "file:./dev.db";
const isRemote = url.startsWith("libsql://") || url.startsWith("https://");
const adapter = new PrismaLibSql({
  url,
  authToken: isRemote ? process.env.TURSO_AUTH_TOKEN : undefined,
});
const prisma = new PrismaClient({ adapter });

const SAMPLES = [
  {
    sessionId: "test-session-manual-1",
    question: "Giá điện sinh hoạt tại Điện Biên bao nhiêu tiền một số?",
    reason: "NO_DOCUMENT_MATCH",
  },
  {
    sessionId: "test-session-manual-2",
    question: "Điện lực Mường Nhé số điện thoại và địa chỉ liên hệ?",
    reason: "NO_DOCUMENT_MATCH",
  },
  {
    sessionId: "test-session-manual-3",
    question: "Có chương trình khuyến mại giảm giá điện cho hộ nghèo không?",
    reason: "LOW_CONFIDENCE",
  },
];

for (const s of SAMPLES) {
  const row = await prisma.unansweredQuery.create({ data: s });
  console.log(`[seed] ✓ ${row.id} — ${row.question.slice(0, 60)}...`);
}
console.log(`\n[seed] xong. Đã tạo ${SAMPLES.length} câu hỏi mẫu.`);
process.exit(0);
