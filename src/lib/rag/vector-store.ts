import { prisma } from "@/lib/prisma";
import { decodeVector } from "./embedder";

export interface RetrievedChunk {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  documentEffectiveFrom: Date | null;
  content: string;
  pageNumber: number | null;
  heading: string | null;
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

const DAY_MS = 1000 * 60 * 60 * 24;

function recencyBoost(effectiveFrom: Date | null): number {
  if (!effectiveFrom) return 0;
  const ageDays = (Date.now() - effectiveFrom.getTime()) / DAY_MS;
  if (ageDays < 365) return 0.03;
  if (ageDays < 365 * 3) return 0.015;
  return 0;
}

const MAX_CHUNKS_PER_DOC = 2;

export async function searchTopK(
  queryVec: Float32Array,
  k: number
): Promise<RetrievedChunk[]> {
  const chunks = await prisma.documentChunk.findMany({
    where: {
      embedding: { not: null },
      document: { isActive: true },
    },
    include: {
      document: {
        select: { id: true, title: true, effectiveFrom: true },
      },
    },
  });

  const scored: RetrievedChunk[] = chunks
    .filter((c): c is typeof c & { embedding: Uint8Array } => c.embedding != null)
    .map((c) => {
      const vec = decodeVector(c.embedding);
      const sim = cosine(queryVec, vec);
      return {
        chunkId: c.id,
        documentId: c.documentId,
        documentTitle: c.document.title,
        documentEffectiveFrom: c.document.effectiveFrom,
        content: c.content,
        pageNumber: c.pageNumber,
        heading: c.heading,
        score: sim + recencyBoost(c.document.effectiveFrom),
      };
    });

  scored.sort((a, b) => b.score - a.score);

  const perDoc = new Map<string, number>();
  const picked: RetrievedChunk[] = [];
  for (const c of scored) {
    if (picked.length >= k) break;
    const n = perDoc.get(c.documentId) ?? 0;
    if (n >= MAX_CHUNKS_PER_DOC) continue;
    perDoc.set(c.documentId, n + 1);
    picked.push(c);
  }
  return picked;
}
