-- CreateTable
CREATE TABLE IF NOT EXISTS "UserMemoryNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "anonymousId" TEXT,
    "clerkUserId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserMemoryNote_anonymousId_idx" ON "UserMemoryNote"("anonymousId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserMemoryNote_clerkUserId_idx" ON "UserMemoryNote"("clerkUserId");
