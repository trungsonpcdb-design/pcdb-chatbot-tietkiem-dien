import { PDFParse } from "pdf-parse";

export interface PdfPage {
  pageNumber: number;
  text: string;
}

export interface PdfExtractResult {
  pages: PdfPage[];
  totalPages: number;
  fullText: string;
}

export async function extractPdf(buffer: Buffer): Promise<PdfExtractResult> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const pages: PdfPage[] = result.pages.map((p) => ({
      pageNumber: p.num,
      text: p.text.trim(),
    }));
    return {
      pages,
      totalPages: pages.length,
      fullText: result.text,
    };
  } finally {
    await parser.destroy();
  }
}
