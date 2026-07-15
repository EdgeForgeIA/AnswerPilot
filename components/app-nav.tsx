"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookMarked, FileSpreadsheet, LayoutDashboard, Settings, PenTool } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/questionnaires", label: "Questionnaires", icon: FileSpreadsheet },
  { href: "/library", label: "Answer library", icon: BookMarked },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppNav({ orgName, planName }: { orgName: string; planName: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-line bg-surface md:min-h-screen md:w-60 md:border-b-0 md:border-r">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-on-accent">
          <PenTool className="h-4 w-4" aria-hidden />
        </span>
        <span className="text-[15px] font-semibold tracking-tight text-ink">VeriQuill</span>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:pb-0">
        {LINKS.map((link) => {
          const active = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-accent-soft text-accent"
                  : "text-ink-soft hover:bg-line/50 hover:text-ink"
              )}
            >
              <link.icon className="h-4 w-4" aria-hidden />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto hidden border-t border-line px-5 py-4 md:block">
        <p className="truncate text-sm font-medium text-ink">{orgName}</p>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="stamp text-accent bg-accent-soft">{planName}</span>
          <form action="/auth/signout" method="post">
            <button className="text-xs font-medium text-ink-faint hover:text-ink" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
