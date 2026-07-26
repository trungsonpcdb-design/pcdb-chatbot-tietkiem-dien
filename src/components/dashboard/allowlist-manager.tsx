"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Item {
  id: string;
  identifier: string;
}

export function AllowlistManager() {
  const [items, setItems] = useState<Item[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/allowlist");
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setItems(data.items ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const identifier = input.trim();
    if (!identifier) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/allowlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "add failed");
      setInput("");
      toast.success("Đã thêm vào allowlist");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string, identifier: string) {
    if (!confirm(`Xoá "${identifier}" khỏi allowlist?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/allowlist/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "delete failed");
      toast.success("Đã xoá");
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
        Danh sách email được phép đăng ký (Clerk allowlist)
      </h2>
      <p className="text-xs text-slate-500 mb-3">
        Chỉ email/domain trong danh sách này mới đăng ký được (khi Clerk bật chế độ
        Restricted). Ví dụ: <code>nguyenvana@evn.com.vn</code> hoặc{" "}
        <code>*@pcdienbien.com.vn</code>.
      </p>

      <form onSubmit={add} className="flex gap-2 mb-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={busy}
          placeholder="email@evn.com.vn hoặc *@evn.com.vn"
          className="flex-1 h-9 rounded border border-slate-300 px-3 text-sm"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="h-9 px-4 rounded bg-[color:var(--color-evn-blue)] text-white text-sm hover:opacity-90 disabled:opacity-50"
        >
          Thêm
        </button>
      </form>

      {loading ? (
        <div className="text-sm text-slate-500">Đang tải…</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-slate-500 italic">Chưa có email nào trong allowlist.</div>
      ) : (
        <ul className="divide-y border rounded">
          {items.map((it) => (
            <li key={it.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="font-mono">{it.identifier}</span>
              <button
                onClick={() => remove(it.id, it.identifier)}
                disabled={busy}
                className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
              >
                Xoá
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
