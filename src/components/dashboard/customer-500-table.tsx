"use client";

export interface Customer500Row {
  id: string;
  dviqlyCode: string;
  customerCode: string;
  customerName: string;
  address: string;
  commune: string | null;
  consumptionKwh: number;
  totalAmount: number;
  phone: string | null;
  customerType: string;
}

function formatVnd(n: number): string {
  return n.toLocaleString("vi-VN");
}

export function Customer500Table({ rows }: { rows: Customer500Row[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
        Không có khách hàng khớp bộ lọc.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 overflow-x-auto bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
          <tr>
            <th className="text-left px-3 py-2 font-semibold">Mã KH</th>
            <th className="text-left px-3 py-2 font-semibold">Tên khách hàng</th>
            <th className="text-left px-3 py-2 font-semibold">Loại</th>
            <th className="text-left px-3 py-2 font-semibold">Xã/Phường</th>
            <th className="text-left px-3 py-2 font-semibold">Địa chỉ</th>
            <th className="text-right px-3 py-2 font-semibold">kWh/tháng</th>
            <th className="text-right px-3 py-2 font-semibold">Tiền (đ)</th>
            <th className="text-left px-3 py-2 font-semibold">SĐT</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
              <td className="px-3 py-2 font-mono text-xs text-slate-500 whitespace-nowrap">
                {r.customerCode}
              </td>
              <td className="px-3 py-2 font-medium text-slate-900">{r.customerName}</td>
              <td className="px-3 py-2 whitespace-nowrap">
                <span
                  className={
                    r.customerType === "ORG"
                      ? "px-1.5 py-0.5 rounded text-xs bg-purple-50 text-purple-700"
                      : "px-1.5 py-0.5 rounded text-xs bg-sky-50 text-sky-700"
                  }
                >
                  {r.customerType === "ORG" ? "Tổ chức" : "Cá nhân"}
                </span>
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-slate-700">{r.commune ?? "—"}</td>
              <td className="px-3 py-2 text-slate-600 max-w-md">
                <span className="line-clamp-2">{r.address}</span>
              </td>
              <td className="px-3 py-2 text-right font-semibold text-slate-900 whitespace-nowrap">
                {formatVnd(r.consumptionKwh)}
              </td>
              <td className="px-3 py-2 text-right text-slate-700 whitespace-nowrap">
                {formatVnd(r.totalAmount)}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                {r.phone ? (
                  <a
                    href={`tel:${r.phone.replace(/\s/g, "")}`}
                    className="text-[color:var(--color-evn-blue)] hover:underline"
                  >
                    {r.phone}
                  </a>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
