#!/usr/bin/env node
/**
 * Seed danh sách khách hàng ≥500 kWh/tháng vào bảng HighConsumptionCustomer.
 * Đọc file JSONL do `scripts/export-customers-500kwh.py` tạo ra.
 *
 * Chạy:
 *   1) python scripts/export-customers-500kwh.py          (tạo .customers-500kwh.jsonl)
 *   2) node scripts/seed-customers-500kwh.mjs             (seed local SQLite)
 *   3) DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=...
 *      node scripts/seed-customers-500kwh.mjs             (seed Turso production)
 */
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
try {
  require("dotenv").config();
} catch {}

const JSONL = fileURLToPath(new URL("./.customers-500kwh.jsonl", import.meta.url));

if (!existsSync(JSONL)) {
  console.error(`Không tìm thấy ${JSONL}. Chạy trước: python scripts/export-customers-500kwh.py`);
  process.exit(1);
}

const url = process.env.DATABASE_URL ?? "file:./dev.db";
const isRemote = url.startsWith("libsql://") || url.startsWith("https://");
const adapter = new PrismaLibSql({
  url,
  authToken: isRemote ? process.env.TURSO_AUTH_TOKEN : undefined,
});
const prisma = new PrismaClient({ adapter });

const BATCH = 500;

async function main() {
  const raw = readFileSync(JSONL, "utf-8");
  const lines = raw.split("\n").filter((l) => l.trim().length > 0);
  console.log(`[seed-customers] đọc ${lines.length} dòng từ JSONL`);

  const parsed = lines.map((l) => JSON.parse(l));

  // Dedupe theo customerCode — giữ bản kWh cao nhất
  const byCode = new Map();
  for (const r of parsed) {
    const prev = byCode.get(r.customerCode);
    if (!prev || r.consumptionKwh > prev.consumptionKwh) {
      byCode.set(r.customerCode, r);
    }
  }
  const unique = Array.from(byCode.values());
  if (unique.length < parsed.length) {
    console.log(`[seed-customers] dedupe: ${parsed.length} → ${unique.length} (gộp ${parsed.length - unique.length} dòng trùng)`);
  }

  console.log(`[seed-customers] xoá dữ liệu cũ...`);
  await prisma.highConsumptionCustomer.deleteMany({});

  console.log(`[seed-customers] insert theo lô ${BATCH}...`);
  for (let i = 0; i < unique.length; i += BATCH) {
    const chunk = unique.slice(i, i + BATCH);
    await prisma.highConsumptionCustomer.createMany({ data: chunk });
    process.stdout.write(`  ${Math.min(i + BATCH, unique.length)}/${unique.length}\r`);
  }
  console.log();

  const total = await prisma.highConsumptionCustomer.count();
  const indiv = await prisma.highConsumptionCustomer.count({ where: { customerType: "INDIVIDUAL" } });
  const org = await prisma.highConsumptionCustomer.count({ where: { customerType: "ORG" } });
  console.log(`[seed-customers] xong — tổng ${total} (cá nhân ${indiv}, tổ chức ${org})`);
}

main()
  .catch((e) => {
    console.error("[seed-customers] FAILED", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
