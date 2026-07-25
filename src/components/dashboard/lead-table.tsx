"use client";

import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { LeadStatusBadge } from "./lead-status-badge";

interface LeadRow {
  id: string;
  fullName: string;
  phone: string;
  address: string | null;
  interestTopic: string;
  status: string;
  unitName: string | null;
  createdAt: string;
}

const TOPIC_LABEL: Record<string, string> = {
  TIET_KIEM_SH: "Tiết kiệm SH",
  TIET_KIEM_DN: "Tiết kiệm DN",
  DMTMN_KY_THUAT: "ĐMTMN — Kỹ thuật",
  DMTMN_TAI_CHINH: "ĐMTMN — Tài chính",
  TINH_HOA_DON: "Tính hóa đơn",
  THU_TUC: "Thủ tục",
  KHAC: "Khác",
};

export function LeadTable({ leads }: { leads: LeadRow[] }) {
  if (leads.length === 0) {
    return (
      <div className="bg-white border rounded-xl p-8 text-center text-slate-500">
        Chưa có lead nào.
      </div>
    );
  }
  return (
    <div className="bg-white border rounded-xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="p-3">Khách hàng</th>
            <th className="p-3">SĐT</th>
            <th className="p-3">Chủ đề</th>
            <th className="p-3">Đơn vị</th>
            <th className="p-3">Trạng thái</th>
            <th className="p-3">Thời gian</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr key={l.id} className="border-t hover:bg-slate-50">
              <td className="p-3">
                <Link href={`/dashboard/leads/${l.id}`} className="font-medium text-[color:var(--color-evn-blue)] hover:underline">
                  {l.fullName}
                </Link>
                {l.address && <div className="text-xs text-slate-500">{l.address}</div>}
              </td>
              <td className="p-3 font-mono text-xs">{l.phone}</td>
              <td className="p-3">{TOPIC_LABEL[l.interestTopic] ?? l.interestTopic}</td>
              <td className="p-3 text-slate-600">{l.unitName ?? "—"}</td>
              <td className="p-3"><LeadStatusBadge status={l.status} /></td>
              <td className="p-3 text-slate-500 text-xs">{formatDate(l.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
