"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef } from "react";
import { Mic, MicOff, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSpeechRecognition } from "@/lib/hooks/use-speech-recognition";
import { cn } from "@/lib/utils";

export function MessageInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const baseBeforeListenRef = useRef<string>("");
  const { supported, listening, transcript, error, start, stop, reset } =
    useSpeechRecognition();

  useEffect(() => {
    if (!listening || !inputRef.current) return;
    const base = baseBeforeListenRef.current;
    const joined = base ? `${base} ${transcript}`.trim() : transcript;
    inputRef.current.value = joined;
  }, [transcript, listening]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  function submit() {
    const text = inputRef.current?.value.trim();
    if (!text || disabled) return;
    if (listening) stop();
    onSend(text);
    if (inputRef.current) inputRef.current.value = "";
    reset();
    baseBeforeListenRef.current = "";
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

  function toggleMic() {
    if (listening) {
      stop();
      return;
    }
    baseBeforeListenRef.current = inputRef.current?.value.trim() ?? "";
    start();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t bg-white px-4 py-3 flex gap-2 items-end"
    >
      {supported && (
        <Button
          type="button"
          variant="outline"
          onClick={toggleMic}
          disabled={disabled}
          aria-label={listening ? "Dừng ghi âm" : "Nhập bằng giọng nói"}
          title={listening ? "Dừng ghi âm" : "Nhập bằng giọng nói"}
          className={cn(
            "px-3",
            listening &&
              "bg-red-50 border-red-300 text-red-600 hover:bg-red-100 animate-pulse"
          )}
        >
          {listening ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>
      )}
      <textarea
        ref={inputRef}
        rows={1}
        placeholder={
          listening
            ? "Đang nghe... Nói xong bấm nút micro để dừng"
            : "Nhập câu hỏi của bạn... (Enter để gửi, Shift+Enter xuống dòng)"
        }
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
