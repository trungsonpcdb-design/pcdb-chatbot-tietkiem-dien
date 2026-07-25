const TRIGGER_KEYWORDS = [
  "khảo sát", "báo giá", "tư vấn trực tiếp", "gọi lại",
  "để lại số", "liên hệ", "nhân viên",
];

export function shouldSuggestLead(userMessage: string, assistantReply: string): boolean {
  const combined = (userMessage + " " + assistantReply).toLowerCase();
  return TRIGGER_KEYWORDS.some((k) => combined.includes(k));
}
