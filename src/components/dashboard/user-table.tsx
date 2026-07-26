"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { UNIT_LIST } from "@/lib/constants";

interface UserRow {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  unitCode: string;
  unitName: string;
  createdAt: string;
}

export function UserTable({ users }: { users: UserRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function update(id: string, patch: Record<string, string>) {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Đã cập nhật");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="bg-white border rounded-xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="p-3">Nhân viên</th>
            <th className="p-3">Email</th>
            <th className="p-3">Trạng thái</th>
            <th className="p-3">Vai trò</th>
            <th className="p-3">Đơn vị</th>
            <th className="p-3">Ngày tạo</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t">
              <td className="p-3 font-medium">{u.fullName}</td>
              <td className="p-3 text-slate-600 text-xs">{u.email}</td>
              <td className="p-3">
                {u.status === "active" ? (
                  <button
                    disabled={busy === u.id}
                    onClick={() => update(u.id, { status: "pending" })}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition disabled:opacity-50"
                    title="Bấm để tạm khoá"
                  >
                    ✓ Đã duyệt
                  </button>
                ) : (
                  <button
                    disabled={busy === u.id}
                    onClick={() => update(u.id, { status: "active" })}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-700 hover:bg-amber-200 transition disabled:opacity-50"
                    title="Bấm để cấp quyền"
                  >
                    ⏳ Chờ duyệt
                  </button>
                )}
              </td>
              <td className="p-3">
                <select
                  disabled={busy === u.id}
                  value={u.role}
                  onChange={(e) => update(u.id, { role: e.target.value })}
                  className="h-8 rounded border border-slate-300 px-2 text-xs"
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </td>
              <td className="p-3">
                <select
                  disabled={busy === u.id}
                  value={u.unitCode}
                  onChange={(e) => update(u.id, { unitCode: e.target.value })}
                  className="h-8 rounded border border-slate-300 px-2 text-xs"
                >
                  {UNIT_LIST.map((un) => (
                    <option key={un.code} value={un.code}>
                      {un.name}
                    </option>
                  ))}
                </select>
              </td>
              <td className="p-3 text-xs text-slate-500">{formatDate(u.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
