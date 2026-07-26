import Image from "next/image";
import Link from "next/link";

export function EvnHeader() {
  return (
    <header className="bg-white border-b-2 border-[color:var(--color-evn-blue)] shadow-sm">
      <div className="max-w-4xl mx-auto flex items-center gap-4 px-4 py-2">
        <Link href="/" className="shrink-0">
          <Image
            src="/logo-pcdienbien.jpg"
            alt="Công ty Điện lực Điện Biên"
            width={200}
            height={174}
            priority
            className="h-16 w-auto"
          />
        </Link>
        <div className="hidden sm:block flex-1 min-w-0">
          <div className="text-sm text-slate-600 leading-tight">
            Trợ lý AI · Tiết kiệm điện & Điện mặt trời mái nhà
          </div>
        </div>
        <div className="ml-auto shrink-0">
          <Link
            href="/dashboard"
            className="text-xs bg-[color:var(--color-evn-blue)] text-white hover:opacity-90 rounded-full px-3 py-1.5 transition"
          >
            Nhân viên đăng nhập
          </Link>
        </div>
      </div>
    </header>
  );
}
