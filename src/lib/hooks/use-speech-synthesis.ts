"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseSpeechSynthesisResult {
  supported: boolean;
  hasVietnameseVoice: boolean;
  speaking: boolean;
  speak: (text: string) => boolean;
  cancel: () => void;
}

function pickVietnameseVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  return (
    voices.find((v) => v.lang?.toLowerCase() === "vi-vn") ??
    voices.find((v) => v.lang?.toLowerCase().startsWith("vi")) ??
    null
  );
}

export function useSpeechSynthesis(): UseSpeechSynthesisResult {
  const [supported, setSupported] = useState(false);
  const [hasVietnameseVoice, setHasVietnameseVoice] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    setSupported(true);
    const refresh = () => {
      const v = pickVietnameseVoice();
      voiceRef.current = v;
      setHasVietnameseVoice(v !== null);
    };
    refresh();
    window.speechSynthesis.addEventListener("voiceschanged", refresh);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", refresh);
    };
  }, []);

  const speak = useCallback((text: string): boolean => {
    if (typeof window === "undefined" || !window.speechSynthesis) return false;
    if (!voiceRef.current) return false;
    const cleaned = text.replace(/[*_`#>~\[\]]/g, "").trim();
    if (!cleaned) return false;
    try {
      window.speechSynthesis.cancel();
    } catch {}
    const u = new SpeechSynthesisUtterance(cleaned);
    u.voice = voiceRef.current;
    u.lang = voiceRef.current.lang || "vi-VN";
    u.rate = 1;
    u.pitch = 1;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
    return true;
  }, []);

  const cancel = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
    } catch {}
    setSpeaking(false);
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }
    };
  }, []);

  return { supported, hasVietnameseVoice, speaking, speak, cancel };
}
