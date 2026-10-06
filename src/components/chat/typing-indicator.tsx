export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1" aria-label="Đang soạn trả lời">
      <span
        className="typing-dot w-2 h-2 rounded-full bg-slate-400"
        style={{ animationDelay: "0ms" }}
      />
      <span
        className="typing-dot w-2 h-2 rounded-full bg-slate-400"
        style={{ animationDelay: "150ms" }}
      />
      <span
        className="typing-dot w-2 h-2 rounded-full bg-slate-400"
        style={{ animationDelay: "300ms" }}
      />
    </div>
  );
}
