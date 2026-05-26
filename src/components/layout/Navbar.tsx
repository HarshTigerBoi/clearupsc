"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, BarChart3, Menu, ScrollText, Shuffle, X, type LucideIcon } from "lucide-react";

const menuItems: Array<{ href: string; label: string; icon?: LucideIcon }> = [
  { href: "/study", label: "Study" },
  { href: "/practice", label: "Practice" },
  { href: "/practice/mixed", label: "Mixed Practice", icon: Shuffle },
  { href: "/practice/mistakes", label: "Mistake Journal", icon: AlertTriangle },
  { href: "/prelims/mock-tests", label: "Mock Tests" },
  { href: "/current-affairs", label: "Current Affairs" },
  { href: "/planner", label: "Planner" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/analytics", label: "My Analytics", icon: BarChart3 },
  { href: "/flashcards", label: "Flashcards" },
  { href: "/answer-writing/practice", label: "Answer Writing" },
  { href: "/essay", label: "Essay Practice", icon: ScrollText },
  { href: "/interview", label: "Interview Prep" },
  { href: "/pricing", label: "Pricing" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0a] text-white">
        <nav className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-lg font-black tracking-normal text-white transition hover:text-[#f97316]" onClick={() => setMenuOpen(false)}>
            ClearUPSC
          </Link>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-white/10 text-white transition hover:border-[#f97316] hover:text-[#f97316]"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <Menu className="h-5 w-5" />
          </button>
        </nav>
      </header>

      {menuOpen ? (
      <div
        className="fixed inset-0 z-[60] bg-[#0a0a0a]/95 text-white transition-opacity duration-300"
      >
        <div
          className="ml-auto flex h-full w-full max-w-xl flex-col bg-[#0a0a0a] px-6 py-5 shadow-2xl transition-transform duration-300"
        >
          <div className="flex min-h-12 items-center justify-between">
            <Link href="/" className="text-lg font-black text-white" onClick={() => setMenuOpen(false)}>
              ClearUPSC
            </Link>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-white/10 text-white transition hover:border-[#f97316] hover:text-[#f97316]"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="mt-12 flex flex-col gap-2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-2 py-3 text-3xl font-black tracking-normal text-zinc-200 transition hover:bg-white/5 hover:text-[#f97316] sm:text-4xl"
                onClick={() => setMenuOpen(false)}
              >
                {item.icon ? <item.icon className="mr-3 inline h-7 w-7 align-[-0.1em] sm:h-8 sm:w-8" aria-hidden="true" /> : null}
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      ) : null}
    </>
  );
}
