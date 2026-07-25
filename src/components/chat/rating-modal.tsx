"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RatingModal({
  open,
  onOpenChange,
  sessionId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sessionId: string | null;
}) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!sessionId || stars === 0) return;
    setBusy(true);
    try {
      await fetch("/api/chat/rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, stars, comment: comment.trim() || undefined }),
      });
      toast.success("Cảm ơn bạn đã đánh giá!");
      onOpenChange(false);
    } catch {
      toast.error("Gửi đánh giá thất bại");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đánh giá cuộc trò chuyện</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center gap-1 py-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setStars(n)}
              aria-label={`${n} sao`}
              className="p-1"
            >
              <Star
                className={cn(
                  "w-8 h-8 transition",
                  n <= stars ? "fill-[color:var(--color-evn-orange)] text-[color:var(--color-evn-orange)]" : "text-slate-300"
                )}
              />
            </button>
          ))}
        </div>
        <textarea
          rows={3}
          placeholder="Góp ý cho chúng tôi (không bắt buộc)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full rounded-lg border border-slate-300 p-2 text-sm resize-none"
        />
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Bỏ qua</Button>
          <Button variant="primary" onClick={submit} disabled={busy || stars === 0}>
            {busy ? "Đang gửi..." : "Gửi đánh giá"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
