import { cn } from "@/lib/utils";

const MAP: Record<string, { label: string; className: string }> = {
  MOI:         { label: "Mới",           className: "bg-blue-100 text-blue-700" },
  DA_LIEN_HE:  { label: "Đã liên hệ",    className: "bg-yellow-100 text-yellow-800" },
  THANH_CONG:  { label: "Thành công",    className: "bg-green-100 text-green-700" },
  TU_CHOI:     { label: "Từ chối",       className: "bg-slate-200 text-slate-700" },
};

export function LeadStatusBadge({ status }: { status: string }) {
  const info = MAP[status] ?? { label: status, className: "bg-slate-100" };
  return (
    <span className={cn("inline-block px-2 py-0.5 rounded-full text-xs font-medium", info.className)}>
      {info.label}
    </span>
  );
}
