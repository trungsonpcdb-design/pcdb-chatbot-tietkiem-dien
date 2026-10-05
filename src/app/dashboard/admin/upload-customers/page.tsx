import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UploadCustomersForm } from "@/components/dashboard/upload-customers-form";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function UploadCustomersPage() {
  await requireAdmin();

  const [total, indiv, org] = await Promise.all([
    prisma.highConsumptionCustomer.count(),
    prisma.highConsumptionCustomer.count({ where: { customerType: "INDIVIDUAL" } }),
    prisma.highConsumptionCustomer.count({ where: { customerType: "ORG" } }),
  ]);

  return (
    <div className="max-w-3xl">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-slate-900">
          Nạp danh sách KH ≥ 500 kWh/tháng
        </h1>
        <p className="text-sm text-slate-500">
          Upload file Excel (.xlsx) chứa 2 sheet "Ca nhan" và "CQ To Chuc" — hệ thống sẽ parse,
          khử trùng theo Mã KH (giữ bản kWh cao nhất), xoá dữ liệu cũ và nạp lại toàn bộ.
        </p>
      </div>

      <div className="rounded-lg bg-sky-50 border border-sky-200 p-4 mb-5 text-sm text-sky-900">
        <div className="font-semibold mb-1">Trạng thái hiện tại trong DB:</div>
        <div>
          Tổng: <span className="font-semibold">{total.toLocaleString("vi-VN")}</span> KH ·
          Cá nhân: <span className="font-semibold">{indiv.toLocaleString("vi-VN")}</span> ·
          Tổ chức: <span className="font-semibold">{org.toLocaleString("vi-VN")}</span>
        </div>
        {total > 0 && (
          <Link
            href="/dashboard/customers-500kwh"
            className="inline-block mt-2 text-sm text-[color:var(--color-evn-blue)] hover:underline"
          >
            → Vào trang tra cứu /dashboard/customers-500kwh
          </Link>
        )}
      </div>

      <UploadCustomersForm />

      <div className="mt-6 text-xs text-slate-500 space-y-1 bg-slate-50 border border-slate-200 rounded p-3">
        <div className="font-semibold text-slate-700 mb-1">Cấu trúc file Excel yêu cầu:</div>
        <div>• Sheet 1 tên có chữ "Ca nhan" hoặc "cá nhân" → khách hàng cá nhân.</div>
        <div>• Sheet 2 tên có chữ "CQ To Chuc" / "tổ chức" → khách hàng tổ chức.</div>
        <div>• Cột theo thứ tự: Mã DVIQLY | Mã KH | Tên KH | Địa chỉ | kWh/tháng | Tổng tiền | SĐT.</div>
        <div>• Hàng header có cột "Mã khách hàng" sẽ được tự nhận diện; mọi dòng bên dưới là dữ liệu.</div>
        <div>• Thao tác này sẽ XOÁ sạch dữ liệu cũ trước khi nạp mới — không có undo.</div>
      </div>
    </div>
  );
}
