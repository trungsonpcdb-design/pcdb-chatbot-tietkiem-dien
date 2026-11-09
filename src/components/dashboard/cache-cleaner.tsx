"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

export function CacheCleaner() {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/cache/clear");
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const data = await res.json();
      setCount(data.count ?? 0);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setLoadError(msg);
      toast.error(`Không đọc được cache: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function clearAll() {
    if (
      !confirm(
        `Xoá TOÀN BỘ ${count ?? "?"} câu trả lời đã cache của chatbot?\n\nThao tác này không thể hoàn tác, nhưng chatbot sẽ tự cache lại khi có khách hỏi. Dùng sau khi cập nhật biểu giá / văn bản để khách không còn nhận câu trả lời cũ.`,
      )
    )
      return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/cache/clear", { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const data = await res.json();
      toast.success(`Đã xoá ${data.deleted} câu khỏi SemanticCache`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const statusLabel = loading
    ? "đang đọc…"
    : loadError
      ? "LỖI khi đọc"
      : `${(count ?? 0).toLocaleString("vi-VN")} câu`;

  return (
    <div className="bg-white border rounded-xl p-4">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">
        SemanticCache (câu trả lời đã cache của chatbot)
      </h2>
      <p className="text-xs text-slate-500 mb-3">
        Chatbot lưu lại các câu trả lời cho câu hỏi tương tự để trả lời nhanh hơn
        và tiết kiệm chi phí. Khi cập nhật biểu giá / văn bản (vd: đổi QĐ 1279 →
        QĐ 2892) thì nên xoá cache để khách không còn nhận lại câu trả lời cũ.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-slate-700">
          Hiện có <strong>{statusLabel}</strong> trong cache.
        </span>
        <button
          onClick={clearAll}
          disabled={busy || loading}
          className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? "Đang xoá…" : "Xoá toàn bộ cache"}
        </button>
        <button
          onClick={load}
          disabled={busy || loading}
          className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200 disabled:opacity-50"
        >
          Tải lại
        </button>
      </div>
      {loadError && (
        <p className="text-xs text-red-600 mt-2 break-all">
          Chi tiết lỗi: {loadError}
        </p>
      )}
    </div>
  );
}
