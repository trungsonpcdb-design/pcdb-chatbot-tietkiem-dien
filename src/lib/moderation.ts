const OFF_TOPIC_KEYWORDS = [
  "chính trị", "đảng", "chính phủ", "biểu tình",
  "cờ bạc", "cá độ", "lô đề",
  "thuốc lá", "ma túy", "rượu",
];

const PROFANITY = ["địt", "đm", "cc", "vcl", "clm"];

export interface ModerationResult {
  allowed: boolean;
  reason?: "OFF_TOPIC" | "PROFANITY";
  suggestedReply?: string;
}

function containsAsWord(text: string, term: string): boolean {
  if (term.includes(" ")) return text.includes(term);
  const tokens = text.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  return tokens.includes(term);
}

export function moderate(text: string): ModerationResult {
  const lower = text.toLowerCase();

  if (PROFANITY.some((w) => containsAsWord(lower, w))) {
    return {
      allowed: false,
      reason: "PROFANITY",
      suggestedReply:
        "Xin hãy giữ ngôn từ lịch sự để tôi có thể hỗ trợ bạn tốt hơn nhé.",
    };
  }

  if (OFF_TOPIC_KEYWORDS.some((w) => containsAsWord(lower, w))) {
    return {
      allowed: false,
      reason: "OFF_TOPIC",
      suggestedReply:
        "Tôi chỉ hỗ trợ các câu hỏi về tiết kiệm điện, điện mặt trời mái nhà, và tính hóa đơn tiền điện của EVN Điện Biên. Bạn có câu hỏi nào về các chủ đề này không?",
    };
  }

  return { allowed: true };
}
