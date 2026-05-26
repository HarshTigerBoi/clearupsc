import Link from "next/link";
import {
  BookOpenCheck,
  CalendarCheck,
  CreditCard,
  FilePenLine,
  Home,
  LineChart,
  AlertTriangle,
  MessageSquareText,
  NotebookPen,
  Newspaper,
  Repeat,
  LibraryBig,
  ScrollText,
  ShieldCheck,
  Shuffle,
  UserRound,
} from "lucide-react";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/planner", label: "Planner", icon: CalendarCheck },
  { href: "/syllabus", label: "Syllabus", icon: BookOpenCheck },
  { href: "/study", label: "Study Course", icon: LibraryBig },
  { href: "/study/ncert", label: "NCERT Library", icon: LibraryBig },
  { href: "/practice/mixed", label: "Mixed Practice", icon: Shuffle },
  { href: "/practice/mistakes", label: "Mistakes", icon: AlertTriangle },
  { href: "/answer-writing/practice", label: "Answer Writing", icon: FilePenLine },
  { href: "/flashcards", label: "Flashcards", icon: Repeat },
  { href: "/revision", label: "Revision", icon: CalendarCheck },
  { href: "/notes", label: "Notes", icon: NotebookPen },
  { href: "/prelims/mock-tests", label: "Prelims", icon: ShieldCheck },
  { href: "/essay", label: "Essay", icon: ScrollText },
  { href: "/csat", label: "CSAT", icon: BookOpenCheck },
  { href: "/analytics", label: "Analytics", icon: LineChart },
  { href: "/current-affairs", label: "Current Affairs", icon: Newspaper },
  { href: "/interview", label: "Interview", icon: MessageSquareText },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/billing", label: "Billing", icon: CreditCard },
];

export default function ProductRail() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-5 lg:block">
      <div className="sticky top-24 space-y-2">
        <p className="px-3 text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Workspace</p>
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-slate-600 hover:bg-navy-50 hover:text-navy-900">
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
