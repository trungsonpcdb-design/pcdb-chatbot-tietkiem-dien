"use client";

import Link from "next/link";
import { cn, formatDate } from "@/lib/utils";

interface DocRow {
  id: string;
  title: string;
  category: string;
  sourceType: string;
  chunkCount: number;
  isActive: boolean;
  effectiveFrom: string | null;
  supersededByTitle: string | null;
  createdAt: string;
}

const CAT_LABEL: Record<string, string> = {
  PHAP_LY: "Pháp lý",
  GIA_DIEN: "Giá điện",
  KY_THUAT: "Kỹ thuật",
  TIET_KIEM: "Tiết kiệm",
};

export function DocumentListTable({ documents }: { documents: DocRow[] }) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500 border rounded-xl bg-white">
        Chưa có tài liệu nào. Bấm &quot;Upload tài liệu mới&quot; để bắt đầu.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-600 text-left">
          <tr>
            <th className="p-3">Tiêu đề</th>
            <th className="p-3">Loại</th>
            <th className="p-3">Chunk</th>
            <th className="p-3">Hiệu lực từ</th>
            <th className="p-3">Trạng thái</th>
            <th className="p-3">Upload</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((d) => (
            <tr key={d.id} className="border-t hover:bg-slate-50">
              <td className="p-3">
                <Link href={`/dashboard/documents/${d.id}`} className="font-medium text-[color:var(--color-evn-blue)] hover:underline">
                  {d.title}
                </Link>
                <div className="text-xs text-slate-500 mt-0.5">
                  {CAT_LABEL[d.category] ?? d.category} · {d.sourceType}
                </div>
              </td>
              <td className="p-3">{d.sourceType}</td>
              <td className="p-3">{d.chunkCount}</td>
              <td className="p-3 text-slate-600">
                {d.effectiveFrom ? formatDate(d.effectiveFrom).slice(0, 10) : "—"}
              </td>
              <td className="p-3">
                {d.isActive ? (
                  <span className="inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                    Còn hiệu lực
                  </span>
                ) : (
                  <span className={cn(
                    "inline-block px-2 py-0.5 rounded-full text-xs font-medium",
                    d.supersededByTitle ? "bg-orange-100 text-orange-700" : "bg-slate-200 text-slate-600"
                  )}>
                    {d.supersededByTitle ? `Thay bằng: ${d.supersededByTitle.slice(0, 30)}${d.supersededByTitle.length > 30 ? "…" : ""}` : "Ngừng dùng"}
                  </span>
                )}
              </td>
              <td className="p-3 text-slate-500">{formatDate(d.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
