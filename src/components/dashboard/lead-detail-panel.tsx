"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface LeadInput {
  id: string;
  fullName: string;
  phone: string;
  address: string | null;
  interestTopic: string;
  chatSummary: string;
  status: string;
  note: string | null;
  assignedUnitCode: string | null;
  createdAt: string;
}

const STATUSES = [
  { code: "MOI", label: "Mới" },
  { code: "DA_LIEN_HE", label: "Đã liên hệ" },
  { code: "THANH_CONG", label: "Thành công" },
  { code: "TU_CHOI", label: "Từ chối" },
];

export function LeadDetailPanel({
  lead,
  units,
}: {
  lead: LeadInput;
  units: { code: string; name: string }[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState(lead.status);
  const [note, setNote] = useState(lead.note ?? "");
  const [unitCode, setUnitCode] = useState(lead.assignedUnitCode ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          note: note.trim() || null,
          assignedUnitCode: unitCode || null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Đã cập nhật");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white border rounded-xl p-4 space-y-3">
      <div>
        <div className="font-semibold text-lg text-slate-900">{lead.fullName}</div>
        <a href={`tel:${lead.phone}`} className="text-[color:var(--color-evn-blue)] font-mono">
          {lead.phone}
        </a>
        {lead.address && <div className="text-sm text-slate-600 mt-1">{lead.address}</div>}
      </div>

      <div className="text-sm">
        <div className="font-medium text-slate-700 mb-1">Tóm tắt cuộc trò chuyện</div>
        <div className="bg-slate-50 rounded p-2 text-slate-700 whitespace-pre-wrap">
          {lead.chatSummary || "(Chưa có tóm tắt)"}
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-600">Trạng thái</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full mt-1 h-10 rounded-lg border border-slate-300 px-3 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s.code} value={s.code}>{s.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs text-slate-600">Đơn vị phụ trách</label>
        <select
          value={unitCode}
          onChange={(e) => setUnitCode(e.target.value)}
          className="w-full mt-1 h-10 rounded-lg border border-slate-300 px-3 text-sm"
        >
          <option value="">— Không gán —</option>
          {units.map((u) => (
            <option key={u.code} value={u.code}>{u.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs text-slate-600">Ghi chú nhân viên</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          placeholder="Đã gọi, khách hẹn tuần sau..."
          className="w-full mt-1 rounded-lg border border-slate-300 p-2 text-sm resize-none"
        />
      </div>

      <Button variant="primary" onClick={save} disabled={busy} className="w-full">
        {busy ? "Đang lưu..." : "Lưu thay đổi"}
      </Button>
    </div>
  );
}
