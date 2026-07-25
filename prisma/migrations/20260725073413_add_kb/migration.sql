-- AlterTable
ALTER TABLE "Message" ADD COLUMN "citations" TEXT;
ALTER TABLE "Message" ADD COLUMN "topicTag" TEXT;

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "blobUrl" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "publishedAt" DATETIME,
    "effectiveFrom" DATETIME,
    "effectiveTo" DATETIME,
    "supersededById" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "uploadedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'INDEXED',
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Document_supersededById_fkey" FOREIGN KEY ("supersededById") REFERENCES "Document" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DocumentChunk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "pageNumber" INTEGER,
    "heading" TEXT,
    "embedding" BLOB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DocumentChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UnansweredQuery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Document_isActive_category_idx" ON "Document"("isActive", "category");

-- CreateIndex
CREATE INDEX "DocumentChunk_documentId_chunkIndex_idx" ON "DocumentChunk"("documentId", "chunkIndex");

-- CreateIndex
CREATE INDEX "UnansweredQuery_reviewed_createdAt_idx" ON "UnansweredQuery"("reviewed", "createdAt");
