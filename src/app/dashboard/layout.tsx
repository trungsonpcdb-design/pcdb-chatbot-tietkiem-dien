import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
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
        <Link href="/dashboard" className="block mb-2">
          <div className="bg-white rounded-lg p-2 flex items-center justify-center">
            <Image
              src="/logo-pcdienbien.jpg"
              alt="Công ty Điện lực Điện Biên"
              width={200}
              height={174}
              priority
              className="h-20 w-auto"
            />
          </div>
        </Link>
        <div className="text-center text-sm font-bold italic text-red-400 mb-6">
          Thắp sáng niềm tin
        </div>
        <SidebarNav items={items} />
        <div className="mt-auto pt-4 border-t border-slate-800 text-xs">
          <span
            className={`inline-block px-1.5 py-0.5 rounded ${
              isAdmin
                ? "bg-amber-500/20 text-amber-300"
                : "bg-slate-700/40 text-slate-300"
            }`}
          >
            {isAdmin ? "admin" : "user"}
          </span>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0">
        <header className="relative isolate border-b-2 border-[color:var(--color-evn-blue)] shadow-sm overflow-hidden bg-white aspect-[4/1] max-h-[200px]">
          <Image
            src="/header-v3.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-white/10 to-white/40 pointer-events-none" />
          <Image
            src="/logo_tknl_chuan-01.png"
            alt="Tiết kiệm điện thành thói quen"
            width={255}
            height={330}
            className="absolute bottom-2 left-3 h-14 sm:h-20 w-auto z-10 pointer-events-none drop-shadow-[0_2px_4px_rgba(255,255,255,0.7)]"
          />
          <div className="absolute top-3 right-4 z-10">
            <UserButton />
          </div>
        </header>
        <div className="flex-1 p-6 bg-slate-50">{children}</div>
      </main>
    </div>
  );
}
