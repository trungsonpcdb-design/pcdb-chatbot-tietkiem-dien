import type { RetrievedChunk } from "./vector-store";
import { SYSTEM_PROMPT_RAG } from "@/lib/prompts/system-rag";

export interface CitationRef {
  marker: number;
  chunkId: string;
  documentId: string;
  documentTitle: string;
  pageNumber: number | null;
  heading: string | null;
  snippet: string;
}

export interface BuiltPrompt {
  system: string;
  citationMap: CitationRef[];
}

export function buildPromptWithContext(chunks: RetrievedChunk[]): BuiltPrompt {
  const citationMap: CitationRef[] = [];
  const refBlocks: string[] = [];

  chunks.forEach((c, i) => {
    const marker = i + 1;
    citationMap.push({
      marker,
      chunkId: c.chunkId,
      documentId: c.documentId,
      documentTitle: c.documentTitle,
      pageNumber: c.pageNumber,
      heading: c.heading,
      snippet: c.content.slice(0, 300),
    });
    const meta = [
      c.documentTitle,
      c.heading ? `mục "${c.heading}"` : null,
      c.pageNumber ? `trang ${c.pageNumber}` : null,
      c.documentEffectiveFrom
        ? `hiệu lực từ ${c.documentEffectiveFrom.toISOString().slice(0, 10)}`
        : null,
    ]
      .filter(Boolean)
      .join(", ");
    refBlocks.push(`[${marker}] ${c.content}\n    (Nguồn: ${meta})`);
  });

  const uniqueDocIds = new Set(chunks.map((c) => c.documentId));
  const multiDocNote =
    uniqueDocIds.size > 1
      ? `\n\n⚠ LƯU Ý: Có ${uniqueDocIds.size} văn bản khác nhau cùng liên quan đến câu hỏi này. Nếu các văn bản có nội dung mâu thuẫn hoặc chồng chéo về cùng một quy định, hãy ƯU TIÊN văn bản có "Hiệu lực từ" gần nhất và nói rõ cho khách biết có nhiều bản (ví dụ: "Theo bản mới nhất [n], … Bản cũ hơn [m] quy định khác một chút, khách nên xem [n] để có thông tin cập nhật.").`
      : "";

  const context =
    refBlocks.length > 0
      ? `\n\nTÀI LIỆU THAM KHẢO:\n${refBlocks.join("\n\n")}${multiDocNote}\n\n`
      : "\n\n(Không có tài liệu tham khảo phù hợp cho câu hỏi này.)\n\n";

  return {
    system: SYSTEM_PROMPT_RAG + context,
    citationMap,
  };
}
