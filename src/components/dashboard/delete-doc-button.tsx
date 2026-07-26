"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  docId: string;
  docTitle: string;
  redirectTo?: string;
  trigger?: React.ReactNode;
}

export function DeleteDocButton({ docId, docTitle, redirectTo, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function submit() {
    setBusy(true);
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Xóa thất bại (${res.status})`);
      }
      toast.success("Đã xóa tài liệu");
      setOpen(false);
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        startTransition(() => router.refresh());
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {trigger ? (
        <span onClick={() => setOpen(true)} className="inline-flex">
          {trigger}
        </span>
      ) : (
        <Button variant="outline" onClick={() => setOpen(true)} className="text-red-600 border-red-200 hover:bg-red-50">
          Xóa
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa tài liệu?</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm text-slate-600">
            <p>
              Bạn sắp xóa vĩnh viễn tài liệu:{" "}
              <span className="font-medium text-slate-900">{docTitle}</span>
            </p>
            <p>
              Toàn bộ chunk đã index và file gốc trên storage sẽ bị xóa. Chatbot sẽ không còn trích dẫn tài liệu này nữa.
              Hành động này không thể hoàn tác.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              Hủy
            </Button>
            <Button
              onClick={submit}
              disabled={busy}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {busy ? "Đang xóa..." : "Xóa vĩnh viễn"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
