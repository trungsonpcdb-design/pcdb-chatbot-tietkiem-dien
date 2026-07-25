import OpenAI from "openai";

let cached: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (cached) return cached;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is required");
  cached = new OpenAI({ apiKey });
  return cached;
}

export const CHAT_MODEL = "gpt-4o-mini";
export const MAX_OUTPUT_TOKENS = 800;
