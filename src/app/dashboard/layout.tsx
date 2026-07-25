import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { requireDbUser } from "@/lib/auth";
import { SidebarNav, type NavItem } from "@/components/dashboard/sidebar-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireDbUser();
  const isAdmin = user.role === "admin";

  const items: NavItem[] = [
    { href: "/dashboard", label: "Tổng quan", icon: "📊", exact: true },
    { href: "/dashboard/sessions", label: "Lịch sử chat", icon: "💬" },
    { href: "/dashboard/leads", label: "Lead khách hàng", icon: "👥" },
    { href: "/dashboard/documents", label: "Tài liệu (KB)", icon: "📚" },
    { href: "/dashboard/unanswered", label: "Câu hỏi chưa trả lời", icon: "❓" },
    { href: "/dashboard/stats", label: "Thống kê chi tiết", icon: "📈" },
  ];

  if (isAdmin) {
    items.push({ href: "/dashboard/admin/users", label: "Quản lý nhân viên", icon: "🛡️" });
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-slate-900 text-white p-4 flex flex-col">
        <Link href="/dashboard" className="text-lg font-semibold block mb-6">
          ⚡ EVN AI
        </Link>
        <SidebarNav items={items} />
        <div className="mt-auto pt-4 border-t border-slate-800 text-xs text-slate-400">
          <div className="truncate">{user.fullName}</div>
          <div className="truncate opacity-70">{user.email}</div>
          {isAdmin && (
            <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
              admin
            </span>
          )}
        </div>
      </aside>
      <main className="flex-1 flex flex-col">
        <header className="flex items-center justify-end p-4 border-b bg-white">
          <UserButton />
        </header>
        <div className="flex-1 p-6 bg-slate-50">{children}</div>
      </main>
    </div>
  );
}
