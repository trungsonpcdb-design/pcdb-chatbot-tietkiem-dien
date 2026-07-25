"use client";

import { FormEvent, KeyboardEvent, useRef } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MessageInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  function submit() {
    const text = inputRef.current?.value.trim();
    if (!text || disabled) return;
    onSend(text);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    submit();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t bg-white px-4 py-3 flex gap-2 items-end"
    >
      <textarea
        ref={inputRef}
        rows={1}
        placeholder="Nhập câu hỏi của bạn... (Enter để gửi, Shift+Enter xuống dòng)"
        disabled={disabled}
        onKeyDown={handleKeyDown}
        className="flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-evn-blue)] disabled:opacity-50 max-h-32"
      />
      <Button
        type="submit"
        variant="accent"
        disabled={disabled}
        aria-label="Gửi"
      >
        <Send className="h-4 w-4" />
        Gửi
      </Button>
    </form>
  );
}
