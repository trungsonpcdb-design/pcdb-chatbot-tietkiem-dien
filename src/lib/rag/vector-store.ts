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
      return {
        chunkId: c.id,
        documentId: c.documentId,
        documentTitle: c.document.title,
        documentEffectiveFrom: c.document.effectiveFrom,
        content: c.content,
        pageNumber: c.pageNumber,
        heading: c.heading,
        score: cosine(queryVec, vec),
      };
    });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}
