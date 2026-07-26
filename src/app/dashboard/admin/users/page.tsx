import { prisma } from "@/lib/prisma";
import { UserTable } from "@/components/dashboard/user-table";
import { AllowlistManager } from "@/components/dashboard/allowlist-manager";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { unit: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 mb-1">Quản lý nhân viên</h1>
        <p className="text-sm text-slate-500">
          Đổi vai trò và đơn vị cho nhân viên. Chỉ admin xem được trang này.
        </p>
      </div>
      <AllowlistManager />
      <UserTable
        users={users.map((u) => ({
          id: u.id,
          email: u.email,
          fullName: u.fullName,
          role: u.role,
          status: u.status,
          unitCode: u.unit.code,
          unitName: u.unit.name,
          createdAt: u.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
