"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function RenameDocDialog({
  docId,
  currentTitle,
  trigger,
}: {
  docId: string;
  currentTitle: string;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(currentTitle);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit() {
    const t = title.trim();
    if (!t) {
      toast.error("Tiêu đề không được để trống");
      return;
    }
    if (t === currentTitle) {
      setOpen(false);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Đã đổi tiêu đề");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="outline">Đổi tiêu đề</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đổi tiêu đề tài liệu</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-600">
          Tiêu đề này hiển thị cho chatbot khi trích nguồn, hãy đặt rõ số hiệu và ngày văn bản hiện hành để tránh nhầm với văn bản đã hết hiệu lực.
        </p>
        <textarea
          className="w-full min-h-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ví dụ: Nghị định 58/2025/NĐ-CP (hợp nhất tại VBHN 52/VBHN-BCT ngày 30/6/2026) — phát triển điện năng lượng tái tạo, ĐMTMN tự sản tự tiêu"
        />
        <Button onClick={submit} disabled={busy} variant="primary">
          {busy ? "Đang lưu..." : "Lưu"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
