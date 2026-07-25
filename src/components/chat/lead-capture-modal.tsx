"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UNIT_LIST } from "@/lib/constants";

const PHONE_REGEX = /^(0|\+84)(\d{9,10})$/;

export function LeadCaptureModal({
  open,
  onOpenChange,
  sessionId,
  interestTopic,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sessionId: string | null;
  interestTopic: string;
}) {
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!sessionId) return;
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const fullName = String(fd.get("fullName") ?? "").trim();
    const phone = String(fd.get("phone") ?? "").trim().replace(/\s/g, "");
    const address = String(fd.get("address") ?? "").trim();
    const unit = String(fd.get("unit") ?? "").trim();

    if (!fullName || !phone) {
      toast.error("Vui lòng nhập họ tên và số điện thoại");
      setBusy(false);
      return;
    }
    if (!PHONE_REGEX.test(phone)) {
      toast.error("Số điện thoại không hợp lệ (VD: 0912345678)");
      setBusy(false);
      return;
    }

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          fullName,
          phone,
          address: address || undefined,
          assignedUnit: unit || undefined,
          interestTopic,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gửi thất bại");
      toast.success("Đã gửi. Nhân viên EVN sẽ liên hệ sớm nhất!");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nhận tư vấn trực tiếp từ EVN Điện Biên</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Input name="fullName" required placeholder="Họ tên *" />
          <Input name="phone" required placeholder="Số điện thoại * (VD: 0912345678)" />
          <Input name="address" placeholder="Địa chỉ (khu vực bạn ở)" />
          <select name="unit" className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm">
            <option value="">— Chọn Điện lực khu vực (tuỳ chọn) —</option>
            {UNIT_LIST.filter((u) => u.code !== "KHN" && u.code !== "XNCT" && u.code !== "PXPD").map((u) => (
              <option key={u.code} value={u.code}>{u.name}</option>
            ))}
          </select>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Đóng</Button>
            <Button type="submit" variant="primary" disabled={busy}>
              {busy ? "Đang gửi..." : "Gửi thông tin"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
