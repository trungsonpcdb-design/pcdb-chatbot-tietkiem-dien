import Image from "next/image";
import Link from "next/link";

export function EvnHeader() {
  return (
    <header className="bg-[color:var(--color-evn-blue)] text-white shadow-md">
      <div className="max-w-4xl mx-auto flex items-center gap-3 px-4 py-3">
        <Image
          src="/evn-placeholder-logo.svg"
          alt="EVN Điện Biên"
          width={36}
          height={36}
          priority
        />
        <div>
          <div className="text-sm font-semibold leading-tight">
            EVN Điện Biên
          </div>
          <div className="text-xs opacity-90 leading-tight">
            Trợ lý AI — Tiết kiệm điện & Điện mặt trời mái nhà
          </div>
        </div>
        <div className="ml-auto">
          <Link
            href="/dashboard"
            className="text-xs bg-white/10 hover:bg-white/20 rounded-full px-3 py-1.5 transition"
          >
            Nhân viên đăng nhập
          </Link>
        </div>
      </div>
    </header>
  );
}
