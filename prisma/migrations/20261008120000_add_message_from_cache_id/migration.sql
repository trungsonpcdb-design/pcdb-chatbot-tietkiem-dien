-- SQLite doesn't support ALTER TABLE ADD COLUMN IF NOT EXISTS directly;
-- apply-migrations.mjs tracks what's been applied in _applied_migrations, so this runs exactly once per DB.
-- AlterTable
ALTER TABLE "Message" ADD COLUMN "fromCacheId" TEXT;
