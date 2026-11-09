"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

export function CacheCleaner() {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cache/clear");
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setCount(data.count ?? 0);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
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
        `Xoá TOÀN BỘ ${count ?? "?"} câu trả lời đã cache? Thao tác này không thể hoàn tác — nhưng chatbot sẽ tự cache lại khi có khách hỏi.`,
      )
    )
      return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/cache/clear", { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      toast.success(`Đã xoá ${data.deleted} câu khỏi SemanticCache`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white border rounded-xl p-4">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">
        SemanticCache (câu trả lời đã cache của chatbot)
      </h2>
      <p className="text-xs text-slate-500 mb-3">
        Chatbot lưu lại các câu trả lời cho câu hỏi tương tự để trả lời nhanh hơn
        và tiết kiệm chi phí. Khi cập nhật biểu giá/văn bản (vd: đổi QĐ 1279 → QĐ
        2892), nên xoá cache để khách không còn nhận lại câu trả lời cũ.
      </p>
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-700">
          Hiện có{" "}
          <strong>{loading ? "…" : (count ?? 0).toLocaleString("vi-VN")}</strong>{" "}
          câu trong cache.
        </span>
        <button
          onClick={clearAll}
          disabled={busy || loading || (count ?? 0) === 0}
          className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? "Đang xoá…" : "Xoá toàn bộ cache"}
        </button>
      </div>
    </div>
  );
}
