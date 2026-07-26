import Image from "next/image";
import Link from "next/link";

export function EvnHeader() {
  return (
    <header className="relative isolate border-b-2 border-[color:var(--color-evn-blue)] shadow-sm overflow-hidden bg-white aspect-[4/1] max-h-[240px]">
      <Image
        src="/header-v3.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center pointer-events-none"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-white/70 via-white/20 to-transparent pointer-events-none" />
      <Image
        src="/logo_tknl_chuan-01.png"
        alt="Tiết kiệm điện thành thói quen"
        width={255}
        height={330}
        className="absolute bottom-2 left-3 h-16 sm:h-24 w-auto z-10 pointer-events-none drop-shadow-[0_2px_4px_rgba(255,255,255,0.7)]"
      />
      <div className="relative max-w-4xl mx-auto flex items-start gap-4 px-4 py-3">
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
        <div className="flex-1 min-w-0">
          <div className="text-sm sm:text-base font-bold italic text-[#c8102e] leading-tight drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
            Thắp sáng niềm tin
          </div>
          <div className="mt-1 leading-snug font-bold text-[#0b2f7a] [text-shadow:_0_1px_0_#fff,_0_0_6px_rgba(255,255,255,0.95),_0_0_10px_rgba(255,255,255,0.7)]">
            <div className="text-sm sm:text-lg">
              Trợ lý AI của Công ty Điện lực Điện Biên
            </div>
            <div className="text-sm sm:text-base mt-0.5">
              Tư vấn sử dụng điện tiết kiệm và điện mặt trời mái nhà
            </div>
          </div>
        </div>
        <div className="ml-auto shrink-0">
          <Link
            href="/dashboard"
            className="text-xs bg-[color:var(--color-evn-blue)] text-white hover:opacity-90 rounded-full px-3 py-1.5 transition shadow-md"
          >
            Nhân viên đăng nhập
          </Link>
        </div>
      </div>
    </header>
  );
}
