import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-slate-900 text-white p-4">
        <Link href="/dashboard" className="text-lg font-semibold block mb-6">
          ⚡ EVN AI
        </Link>
        <nav className="text-sm space-y-1 opacity-70">
          <div className="p-2 bg-slate-800 rounded">📊 Tổng quan</div>
          <Link href="/dashboard/leads" className="p-2 hover:bg-slate-800 rounded block">
            👥 Lead khách hàng
          </Link>
          <div className="p-2">💬 Lịch sử chat (M4)</div>
          <Link href="/dashboard/documents" className="p-2 hover:bg-slate-800 rounded block">
            📚 Tài liệu (KB)
          </Link>
          <Link href="/dashboard/unanswered" className="p-2 hover:bg-slate-800 rounded block">
            ❓ Câu hỏi chưa trả lời
          </Link>
        </nav>
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
