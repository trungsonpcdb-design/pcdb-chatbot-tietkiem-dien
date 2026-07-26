import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { User } from "@/generated/prisma";

export async function getCurrentDbUser(): Promise<User | null> {
  const { userId } = await auth();
  if (!userId) return null;
  return prisma.user.findUnique({ where: { clerkId: userId } });
}

export async function requireDbUser(): Promise<User> {
  let user = await getCurrentDbUser();

  if (!user) {
    const clerk = await currentUser();
    if (!clerk) redirect("/sign-in");

    const email = clerk.emailAddresses[0]?.emailAddress;
    if (!email) throw new Error("Clerk user missing email");
    const defaultUnit = await prisma.unit.findUnique({ where: { code: "KHN" } });
    if (!defaultUnit) throw new Error("Default unit KHN not seeded");

    user = await prisma.user.create({
      data: {
        clerkId: clerk.id,
        email,
        fullName: [clerk.firstName, clerk.lastName].filter(Boolean).join(" ") || email,
        role: "user",
        status: "pending",
        unitId: defaultUnit.id,
      },
    });
  }

  if (user.status !== "active") redirect("/pending");
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireDbUser();
  if (user.role !== "admin") {
    redirect("/dashboard");
  }
  return user;
}
