"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  ["Home", "/"],
  ["Optional Selector", "/optional-selector"],
  ["Dashboard", "/dashboard"],
  ["Planner", "/planner"],
  ["Answer Writing", "/answer-writing/practice"],
  ["Flashcards", "/flashcards"],
  ["Current Affairs", "/current-affairs"],
  ["NCERT Library", "/study/ncert"],
  ["Eligibility", "/tools/eligibility"],
  ["Study Planner", "/tools/study-planner"],
  ["Pricing", "/pricing"],
  ["Privacy", "/privacy"],
  ["Terms", "/terms"],
];

export default function Footer() {
  const pathname = usePathname();

  if (pathname === "/" || pathname === "/onboarding") return null;

  return (
    <footer className="bg-[#1a2744] text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1fr_2fr] lg:px-8">
        <div>
          <h2 className="text-xl font-extrabold">ClearUPSC</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-300">
            Clarity. Strategy. Rank. Built for the one aspirant who needs a system, not another pile of PDFs.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:justify-end">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="text-sm text-slate-200 hover:text-white">
              {label}
            </Link>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-slate-300">
        © 2026 ClearUPSC | Made with focus in India
      </div>
    </footer>
  );
}
