"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CATEGORIES = [
  { value: "PHAP_LY",   label: "Pháp lý & Chính sách" },
  { value: "GIA_DIEN",  label: "Giá điện & Biểu giá" },
  { value: "KY_THUAT",  label: "Kỹ thuật (TCVN, catalog)" },
  { value: "TIET_KIEM", label: "Tiết kiệm điện" },
];

export function DocumentForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      const fd = new FormData(e.currentTarget);
      const res = await fetch("/api/documents", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload thất bại");
      toast.success(`Đã tạo tài liệu (${data.chunkCount} chunks)`);
      router.push("/dashboard/documents");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 bg-white p-6 rounded-xl border">
      <div>
        <label className="text-sm font-medium text-slate-700">Tiêu đề *</label>
        <Input name="title" required placeholder="VD: Nghị định XXX/YYYY về ĐMTMN" className="mt-1" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700">Phân loại *</label>
          <select name="category" required className="mt-1 w-full h-10 rounded-lg border border-slate-300 px-3 text-sm">
            <option value="">— Chọn —</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Ngày hiệu lực</label>
          <Input type="date" name="effectiveFrom" className="mt-1" />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">Ngày ban hành</label>
        <Input type="date" name="publishedAt" className="mt-1" />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">File (PDF/DOCX/TXT) *</label>
        <input type="file" name="file" required accept=".pdf,.docx,.txt"
          className="mt-1 block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-100 file:font-medium hover:file:bg-slate-200"
        />
      </div>
      <Button type="submit" variant="primary" size="lg" disabled={busy}>
        {busy ? "Đang xử lý..." : "Upload & Ingest"}
      </Button>
    </form>
  );
}
