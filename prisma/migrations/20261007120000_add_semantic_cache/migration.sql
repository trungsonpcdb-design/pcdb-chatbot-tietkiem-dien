-- CreateTable
CREATE TABLE IF NOT EXISTS "SemanticCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "question" TEXT NOT NULL,
    "questionEmbedding" BLOB NOT NULL,
    "answer" TEXT NOT NULL,
    "citations" TEXT,
    "topicTag" TEXT,
    "mode" TEXT NOT NULL,
    "sourceMessageId" TEXT NOT NULL,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "lastHitAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SemanticCache_sourceMessageId_fkey" FOREIGN KEY ("sourceMessageId") REFERENCES "Message" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "SemanticCache_sourceMessageId_key" ON "SemanticCache"("sourceMessageId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SemanticCache_topicTag_idx" ON "SemanticCache"("topicTag");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SemanticCache_createdAt_idx" ON "SemanticCache"("createdAt");
