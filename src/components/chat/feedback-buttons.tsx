"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const REASONS = [
  { code: "SAI_THONG_TIN", label: "Sai thông tin" },
  { code: "KHONG_DU_CHI_TIET", label: "Không đủ chi tiết" },
  { code: "KHONG_LIEN_QUAN", label: "Không đúng chủ đề" },
  { code: "KHAC", label: "Khác" },
];

export function FeedbackButtons({ messageId }: { messageId: string }) {
  const [state, setState] = useState<"none" | "up" | "down">("none");
  const [reasonOpen, setReasonOpen] = useState(false);

  async function sendUp() {
    setState("up");
    try {
      await fetch("/api/chat/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, rating: "UP" }),
      });
      toast.success("Cảm ơn phản hồi của bạn!");
    } catch {
      toast.error("Gửi feedback thất bại");
    }
  }

  function openDown() {
    setState("down");
    setReasonOpen(true);
  }

  async function sendDown(reasonCode: string) {
    try {
      await fetch("/api/chat/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, rating: "DOWN", reason: reasonCode }),
      });
      toast.success("Đã ghi nhận. Chúng tôi sẽ cải thiện.");
      setReasonOpen(false);
    } catch {
      toast.error("Gửi feedback thất bại");
    }
  }

  return (
    <div className="mt-1 flex gap-1">
      <button
        onClick={sendUp}
        disabled={state !== "none"}
        aria-label="Hữu ích"
        className={cn(
          "p-1.5 rounded hover:bg-slate-100 transition",
          state === "up" && "text-green-600 bg-green-50"
        )}
      >
        <ThumbsUp className="w-3.5 h-3.5" />
      </button>
      <Dialog open={reasonOpen} onOpenChange={setReasonOpen}>
        <DialogTrigger asChild>
          <button
            onClick={openDown}
            disabled={state === "up"}
            aria-label="Không hữu ích"
            className={cn(
              "p-1.5 rounded hover:bg-slate-100 transition",
              state === "down" && "text-red-600 bg-red-50"
            )}
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lý do bạn không hài lòng?</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {REASONS.map((r) => (
              <Button key={r.code} variant="outline" onClick={() => sendDown(r.code)}>
                {r.label}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
