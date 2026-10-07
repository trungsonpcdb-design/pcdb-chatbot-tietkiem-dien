import { prisma } from "@/lib/prisma";
import { decodeVector, encodeVector } from "./embedder";
import { isMemoryCommandCandidate } from "@/lib/memory/keyword-filter";

export const CACHE_SIMILARITY_THRESHOLD = 0.95;

export interface CacheHit {
  id: string;
  question: string;
  answer: string;
  citations: string | null;
  topicTag: string | null;
  mode: "MVP" | "RAG";
  sourceMessageId: string;
  score: number;
}

function cosine(a: Float32Array, b: Float32Array): number {
  let dot = 0, normA = 0, normB = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function searchCache(
  embedding: Float32Array,
  threshold: number = CACHE_SIMILARITY_THRESHOLD
): Promise<CacheHit | null> {
  const rows = await prisma.semanticCache.findMany({
    select: {
      id: true,
      question: true,
      questionEmbedding: true,
      answer: true,
      citations: true,
      topicTag: true,
      mode: true,
      sourceMessageId: true,
    },
  });
  if (rows.length === 0) return null;

  let best: CacheHit | null = null;
  for (const r of rows) {
    const vec = decodeVector(r.questionEmbedding);
    const score = cosine(embedding, vec);
    if (score < threshold) continue;
    if (!best || score > best.score) {
      best = {
        id: r.id,
        question: r.question,
        answer: r.answer,
        citations: r.citations,
        topicTag: r.topicTag,
        mode: r.mode as "MVP" | "RAG",
        sourceMessageId: r.sourceMessageId,
        score,
      };
    }
  }
  return best;
}

export async function saveCache(input: {
  question: string;
  embedding: Float32Array;
  answer: string;
  citations: string | null;
  topicTag: string | null;
  mode: "MVP" | "RAG";
  sourceMessageId: string;
}): Promise<void> {
  await prisma.semanticCache.create({
    data: {
      question: input.question,
      questionEmbedding: encodeVector(input.embedding),
      answer: input.answer,
      citations: input.citations,
      topicTag: input.topicTag,
      mode: input.mode,
      sourceMessageId: input.sourceMessageId,
    },
  });
}

export async function invalidateByMessage(messageId: string): Promise<void> {
  await prisma.semanticCache.deleteMany({ where: { sourceMessageId: messageId } });
}

export async function bumpHit(id: string): Promise<void> {
  await prisma.semanticCache.update({
    where: { id },
    data: { hitCount: { increment: 1 }, lastHitAt: new Date() },
  });
}

export function shouldSkipCache(input: {
  message: string;
  formData?: unknown;
}): boolean {
  if (input.formData) return true;
  if (isMemoryCommandCandidate(input.message)) return true;
  return false;
}
