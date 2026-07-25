"use client";

import { SUGGESTED_QUESTIONS } from "@/lib/constants";

export function SuggestedQuestions({
  onPick,
}: {
  onPick: (text: string) => void;
}) {
  return (
    <div className="px-4 py-6">
      <div className="text-center text-slate-500 mb-4">
        <div className="text-4xl">💡</div>
        <div className="mt-2 font-medium text-slate-700">
          Xin chào! Tôi có thể giúp gì cho bạn?
        </div>
        <div className="text-xs mt-1">Bấm vào 1 câu hỏi mẫu, hoặc gõ câu hỏi của bạn.</div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q.text}
            onClick={() => onPick(q.text)}
            className="text-left border border-slate-200 rounded-xl px-3 py-2.5 text-sm hover:border-[color:var(--color-evn-blue)] hover:bg-blue-50/40 transition"
          >
            <span className="mr-2">{q.icon}</span>
            {q.text}
          </button>
        ))}
      </div>
    </div>
  );
}
