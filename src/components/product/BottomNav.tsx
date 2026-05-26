"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, Home, Menu, Zap } from "lucide-react";

const items = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/study", label: "Study", icon: BookOpen },
  { href: "/practice/mixed", label: "Practice", icon: Zap },
  { href: "/dashboard/analytics", label: "Progress", icon: BarChart3 },
];

export default function BottomNav() {
  const pathname = usePathname();

  function openMore() {
    window.dispatchEvent(new Event("clearupsc:open-menu"));
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#1f2937] bg-[#111827] px-2 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-2 shadow-2xl md:hidden">
      <div className="grid grid-cols-5 gap-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`) || (item.href === "/study" && pathname.startsWith("/study/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-md text-[11px] font-black transition ${
                active ? "text-[#f97316]" : "text-[#6b7280] hover:text-zinc-200"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={openMore}
          className="flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-md text-[11px] font-black text-[#6b7280] transition hover:text-[#f97316]"
          aria-label="Open more navigation"
        >
          <Menu className="h-5 w-5" />
          More
        </button>
      </div>
    </nav>
  );
}
