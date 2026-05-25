"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenCheck, CalendarCheck, Home, Layers3, Repeat, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/study", label: "Study", icon: BookOpenCheck },
  { href: "/planner", label: "Plan", icon: CalendarCheck },
  { href: "/flashcards", label: "Cards", icon: Repeat },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/prelims/mock-tests", label: "Mocks", icon: Layers3 },
];

export default function ProductBottomNav() {
  const pathname = usePathname();
  const isProductRoute = ["/dashboard", "/planner", "/syllabus", "/tracker", "/answer-writing", "/flashcards", "/current-affairs", "/interview", "/profile", "/billing", "/prelims", "/essay", "/csat", "/revision", "/analytics", "/notes"].some((prefix) =>
    pathname.startsWith(prefix),
  );
  if (!isProductRoute) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 py-2 shadow-2xl backdrop-blur md:hidden">
      <div className="grid grid-cols-6 gap-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold text-slate-500",
                active && "bg-saffron-100 text-navy-900",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
