"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function SupersedeDialog({
  docId,
  others,
}: {
  docId: string;
  others: { id: string; title: string; category: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit() {
    if (!choice) {
      toast.error("Chọn văn bản thay thế");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supersededById: choice }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Đã đánh dấu ngừng dùng");
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
        <Button variant="accent">Đánh dấu hết hiệu lực</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chọn văn bản thay thế</DialogTitle>
        </DialogHeader>
        <select
          className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm"
          value={choice}
          onChange={(e) => setChoice(e.target.value)}
        >
          <option value="">— Chọn văn bản đang có hiệu lực —</option>
          {others.map((o) => (
            <option key={o.id} value={o.id}>
              {o.title} ({o.category})
            </option>
          ))}
        </select>
        <Button onClick={submit} disabled={busy} variant="primary">
          {busy ? "Đang xử lý..." : "Xác nhận"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
