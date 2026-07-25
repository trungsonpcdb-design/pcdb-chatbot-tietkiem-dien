import { estimateTokens } from "@/lib/tokenizer";

export interface Chunk {
  content: string;
  chunkIndex: number;
  pageNumber?: number;
  heading?: string;
}

const TARGET_TOKENS = 600;
const MAX_TOKENS = 800;

const HEADING_REGEX = /^(?:(?:Điều|Chương|Mục|Phần)\s+[IVXLCDM\d]+[.:]?|\d+\.\s+[A-ZĐÁÀẢÃẠẤẦẨẪẬĂẮẰẲẴẶÉÈẺẼẸẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤỨỪỬỮỰÝỲỶỸỴ])/;

export interface ChunkOptions {
  pages?: { pageNumber: number; text: string }[];
  fullText?: string;
}

export function chunkDocument(opts: ChunkOptions): Chunk[] {
  const chunks: Chunk[] = [];
  let idx = 0;

  const sources = opts.pages
    ? opts.pages.map((p) => ({ text: p.text, pageNumber: p.pageNumber as number | undefined }))
    : [{ text: opts.fullText ?? "", pageNumber: undefined as number | undefined }];

  for (const src of sources) {
    if (!src.text.trim()) continue;

    const paragraphs = src.text.split(/\n{2,}|\r{2,}/).map((p) => p.trim()).filter(Boolean);
    let currentContent: string[] = [];
    let currentTokens = 0;
    let currentHeading: string | undefined;

    const flush = () => {
      if (currentContent.length === 0) return;
      chunks.push({
        content: currentContent.join("\n\n"),
        chunkIndex: idx++,
        pageNumber: src.pageNumber,
        heading: currentHeading,
      });
    };

    for (const para of paragraphs) {
      const firstLine = para.split("\n")[0]?.trim() ?? "";
      if (HEADING_REGEX.test(firstLine) && firstLine.length < 200) {
        flush();
        currentContent = [];
        currentTokens = 0;
        currentHeading = firstLine;
      }

      const paraTokens = estimateTokens(para);

      if (currentTokens + paraTokens > MAX_TOKENS && currentContent.length > 0) {
        flush();
        const last = currentContent[currentContent.length - 1];
        currentContent = [last];
        currentTokens = estimateTokens(last);
      }

      currentContent.push(para);
      currentTokens += paraTokens;

      if (currentTokens >= TARGET_TOKENS) {
        flush();
        const last = currentContent[currentContent.length - 1];
        currentContent = [last];
        currentTokens = estimateTokens(last);
      }
    }

    flush();
  }

  return chunks.filter((c) => c.content.trim().length > 30);
}
