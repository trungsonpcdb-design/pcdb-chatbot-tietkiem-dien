"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<{
    0: { transcript: string };
    isFinal: boolean;
    length: number;
  }>;
}

function getCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export interface UseSpeechRecognitionResult {
  supported: boolean;
  listening: boolean;
  transcript: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export function useSpeechRecognition(): UseSpeechRecognitionResult {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionInstance | null>(null);
  const finalRef = useRef<string>("");

  useEffect(() => {
    setSupported(getCtor() !== null);
  }, []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) {
      setError("Trình duyệt không hỗ trợ nhập bằng giọng nói.");
      return;
    }
    if (recRef.current) {
      try {
        recRef.current.abort();
      } catch {}
    }
    setError(null);
    finalRef.current = "";
    setTranscript("");

    const rec = new Ctor();
    rec.lang = "vi-VN";
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    rec.onresult = (ev) => {
      let interim = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const res = ev.results[i];
        const text = res[0].transcript;
        if (res.isFinal) {
          finalRef.current += text;
        } else {
          interim += text;
        }
      }
      setTranscript((finalRef.current + interim).trim());
    };
    rec.onerror = (ev) => {
      const map: Record<string, string> = {
        "not-allowed": "Bạn cần cấp quyền micro cho trình duyệt.",
        "service-not-allowed": "Bạn cần cấp quyền micro cho trình duyệt.",
        "no-speech": "Không nhận diện được giọng nói, vui lòng thử lại.",
        "audio-capture": "Không tìm thấy micro trên thiết bị.",
        network: "Lỗi mạng khi nhận diện giọng nói.",
      };
      setError(map[ev.error] ?? "Không thể nhận diện giọng nói.");
      setListening(false);
    };
    rec.onend = () => {
      setListening(false);
    };

    try {
      rec.start();
      recRef.current = rec;
      setListening(true);
    } catch {
      setError("Không thể bật micro.");
      setListening(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (recRef.current) {
      try {
        recRef.current.stop();
      } catch {}
    }
  }, []);

  const reset = useCallback(() => {
    finalRef.current = "";
    setTranscript("");
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      if (recRef.current) {
        try {
          recRef.current.abort();
        } catch {}
      }
    };
  }, []);

  return { supported, listening, transcript, error, start, stop, reset };
}
