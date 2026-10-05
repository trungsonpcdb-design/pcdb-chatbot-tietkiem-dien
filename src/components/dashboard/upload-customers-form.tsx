"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface UploadResult {
  ok: true;
  total: number;
  individual: number;
  org: number;
  dedupedFromRows: number;
  skipped: number;
}

export function UploadCustomersForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  async function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error("Vui lòng chọn file Excel (.xlsx)");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      toast.error("Chỉ chấp nhận file .xlsx");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File quá lớn (tối đa 50 MB)");
      return;
    }

    const confirmed = confirm(
      "Thao tác này sẽ XOÁ sạch dữ liệu KH ≥500 kWh hiện có và nạp lại từ file này.\n\nTiếp tục?"
    );
    if (!confirmed) return;

    setBusy(true);
    setResult(null);
    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/admin/upload-customers", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Upload thất bại");
      }
      setResult(json);
      toast.success(`Nạp thành công ${json.total.toLocaleString("vi-VN")} khách hàng`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handle} className="rounded-lg border-2 border-dashed border-slate-300 p-6 bg-white">
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Chọn file Excel (.xlsx)
      </label>
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        disabled={busy}
        className="block w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-[color:var(--color-evn-blue)] file:text-white file:font-medium file:cursor-pointer hover:file:bg-blue-700 cursor-pointer"
      />
      <button
        type="submit"
        disabled={busy}
        className="mt-4 bg-[color:var(--color-evn-blue)] text-white px-5 py-2 rounded-md text-sm font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors"
      >
        {busy ? "⏳ Đang xử lý, có thể mất 30-60s..." : "📤 Nạp vào hệ thống"}
      </button>

      {result && (
        <div className="mt-5 p-4 rounded bg-emerald-50 border border-emerald-200 text-sm text-emerald-900">
          <div className="font-semibold mb-1">✅ Nạp thành công</div>
          <div>
            Tổng: <span className="font-semibold">{result.total.toLocaleString("vi-VN")}</span> KH
          </div>
          <div>
            Cá nhân: {result.individual.toLocaleString("vi-VN")} · Tổ chức:{" "}
            {result.org.toLocaleString("vi-VN")}
          </div>
          <div className="text-xs text-emerald-700 mt-1">
            File có {(result.total + result.dedupedFromRows).toLocaleString("vi-VN")} dòng → khử{" "}
            {result.dedupedFromRows.toLocaleString("vi-VN")} dòng trùng mã KH
            {result.skipped > 0 && `, bỏ qua ${result.skipped.toLocaleString("vi-VN")} dòng không hợp lệ`}
            .
          </div>
        </div>
      )}
    </form>
  );
}
