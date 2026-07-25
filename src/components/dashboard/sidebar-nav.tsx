"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type NavItem = {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
};

export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="text-sm space-y-1">
      {items.map((it) => {
        const active = it.exact
          ? pathname === it.href
          : pathname === it.href || pathname.startsWith(it.href + "/");
        return (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              "p-2 rounded block transition-colors",
              active ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
            )}
          >
            <span className="mr-2">{it.icon}</span>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
