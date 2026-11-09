// Xoá toàn bộ SemanticCache — chạy sau khi đổi biểu giá / scripted-facts
// để các câu trả lời đã cache không còn trả về số liệu cũ.
//
// Dùng: node scripts/clear-semantic-cache.mjs
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";
import "dotenv/config";

const url = process.env.DATABASE_URL ?? "file:./dev.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

const libsql = createClient({ url, authToken });
const adapter = new PrismaLibSQL(libsql);
const prisma = new PrismaClient({ adapter });

try {
  const before = await prisma.semanticCache.count();
  const result = await prisma.semanticCache.deleteMany({});
  console.log(`[clear-semantic-cache] Trước: ${before} row — Đã xoá: ${result.count} row.`);
} finally {
  await prisma.$disconnect();
}
