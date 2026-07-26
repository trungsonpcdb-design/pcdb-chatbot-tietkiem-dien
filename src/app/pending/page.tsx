import { SignOutButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PendingPage() {
  const clerk = await currentUser();
  if (!clerk) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({ where: { clerkId: clerk.id } });
  if (dbUser?.status === "active") redirect("/dashboard");

  const email = clerk.emailAddresses[0]?.emailAddress ?? "";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-md border border-slate-200 p-8 text-center">
        <div className="flex justify-center mb-4">
          <Image
            src="/logo-pcdienbien.jpg"
            alt="Công ty Điện lực Điện Biên"
            width={200}
            height={174}
            className="h-20 w-auto"
          />
        </div>
        <h1 className="text-xl font-semibold text-slate-900 mb-2">
          Tài khoản đang chờ duyệt
        </h1>
        <p className="text-sm text-slate-600 mb-1">
          Tài khoản <span className="font-medium">{email}</span> đã được ghi nhận.
        </p>
        <p className="text-sm text-slate-600 mb-6">
          Vui lòng liên hệ quản trị viên để được cấp quyền truy cập.
        </p>
        <SignOutButton>
          <button className="w-full h-10 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800 transition">
            Đăng xuất
          </button>
        </SignOutButton>
      </div>
    </div>
  );
}
