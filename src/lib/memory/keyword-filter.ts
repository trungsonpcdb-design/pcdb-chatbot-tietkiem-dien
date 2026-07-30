const MEMORY_KEYWORDS = [
  "nhớ giúp",
  "ghi nhớ giúp",
  "ghi nhớ",
  "lưu lại giúp",
  "lưu giúp",
  "quên giúp",
  "quên hết",
  "quên tất cả",
  "xóa thông tin đã lưu",
  "xóa hết thông tin",
  "xem thông tin đã lưu",
  "thông tin đã lưu",
  "đang nhớ gì",
  "bạn nhớ gì",
];

export function isMemoryCommandCandidate(message: string): boolean {
  const lower = message.toLowerCase();
  return MEMORY_KEYWORDS.some((kw) => lower.includes(kw));
}
