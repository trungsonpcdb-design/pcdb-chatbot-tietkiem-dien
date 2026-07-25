import { getOpenAI, CHAT_MODEL } from "@/lib/openai";

export interface HistoryTurn {
  role: "user" | "assistant";
  content: string;
}

export async function rewriteQuery(
  currentQuestion: string,
  history: HistoryTurn[]
): Promise<string> {
  if (history.length === 0) return currentQuestion;

  const openai = getOpenAI();
  const recent = history.slice(-4);

  const res = await openai.chat.completions.create({
    model: CHAT_MODEL,
    temperature: 0,
    max_tokens: 120,
    messages: [
      {
        role: "system",
        content:
          "Nhiệm vụ: viết lại câu hỏi mới nhất của người dùng thành một câu HOÀN CHỈNH, ĐỘC LẬP (không phụ thuộc ngữ cảnh trước) để tra cứu tài liệu. CHỈ trả về câu hỏi đã viết lại, không giải thích, không thêm gì khác.",
      },
      ...recent.map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: `Viết lại thành câu hỏi độc lập: "${currentQuestion}"` },
    ],
  });

  const rewritten = res.choices[0]?.message?.content?.trim() ?? currentQuestion;
  return rewritten.replace(/^["']|["']$/g, "");
}
