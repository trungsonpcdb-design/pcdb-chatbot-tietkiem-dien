#!/usr/bin/env node
import { createClient } from "@libsql/client";
import { readFileSync, existsSync } from "node:fs";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.warn("[apply-migrations] DATABASE_URL not set — skipping (dev mode)");
  process.exit(0);
}

if (DATABASE_URL.startsWith("file:")) {
  console.log("[apply-migrations] Local SQLite detected — skip (use `prisma migrate dev`)");
  process.exit(0);
}

const client = createClient({
  url: DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Hardcoded list — each new migration MUST be added here in ORDER of creation timestamp.
// SQL should be idempotent (use CREATE TABLE IF NOT EXISTS where possible).
const MIGRATIONS = [
  { id: "20260725071946_init", file: "prisma/migrations/20260725071946_init/migration.sql" },
  { id: "20260725073413_add_kb", file: "prisma/migrations/20260725073413_add_kb/migration.sql" },
  { id: "20260725074622_add_feedback_lead", file: "prisma/migrations/20260725074622_add_feedback_lead/migration.sql" },
];

async function run() {
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
    const statements = sql
      .split(/;\s*[\r\n]/)
      .map((s) =>
        s
          .split(/\r?\n/)
          .filter((line) => !line.trim().startsWith("--"))
          .join("\n")
          .trim()
      )
      .filter((s) => s.length > 0);
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
