"use client";

import {
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
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
  const [text, setText] = useState("");
  const baseBeforeListenRef = useRef<string>("");
  const shouldAutoSubmitRef = useRef(false);
  const { supported, listening, transcript, error, start, stop, reset } =
    useSpeechRecognition();

  useEffect(() => {
    if (!listening) return;
    const base = baseBeforeListenRef.current;
    setText(base ? `${base} ${transcript}`.trim() : transcript);
  }, [transcript, listening]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const submitText = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed || disabled) return;
      onSend(trimmed);
      setText("");
      reset();
      baseBeforeListenRef.current = "";
    },
    [disabled, onSend, reset]
  );

  useEffect(() => {
    if (listening) return;
    if (!shouldAutoSubmitRef.current) return;
    shouldAutoSubmitRef.current = false;
    if (error) return;
    const spoken = transcript.trim();
    if (!spoken) return;
    const base = baseBeforeListenRef.current;
    const finalText = base ? `${base} ${spoken}`.trim() : spoken;
    submitText(finalText);
  }, [listening, error, transcript, submitText]);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (listening) stop();
      submitText(text);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (listening) stop();
    submitText(text);
  }

  function toggleMic() {
    if (listening) {
      stop();
      return;
    }
    shouldAutoSubmitRef.current = true;
    baseBeforeListenRef.current = text.trim();
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
        rows={1}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={
          listening
            ? "Đang nghe... Nói xong sẽ tự gửi"
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
