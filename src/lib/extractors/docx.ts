import mammoth from "mammoth";

export interface DocxExtractResult {
  fullText: string;
}

export async function extractDocx(buffer: Buffer): Promise<DocxExtractResult> {
  const result = await mammoth.extractRawText({ buffer });
  return { fullText: result.value };
}
