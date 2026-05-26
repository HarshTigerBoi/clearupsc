"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Moon, Sun } from "lucide-react";
import type { UserStats } from "@/types";

type RitualData = {
  topicsStudiedYesterday: number;
  topicsCompletedToday: number;
  mcqsAttemptedToday: number;
  mcqAccuracyToday: number;
  xpEarnedToday: number;
  latestCurrentAffair: { title: string; href: string } | null;
  tomorrowFirstTask: { key: string; title: string } | null;
  guest?: boolean;
};

export default function DailyRitual({ stats }: { stats: UserStats }) {
  const query = useQuery({
    queryKey: ["user", "ritual"],
    queryFn: async () => {
      const response = await fetch("/api/user/ritual");
      if (!response.ok) throw new Error("Ritual unavailable");
      return (await response.json()) as RitualData;
    },
  });
  const hour = useMemo(() => Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", hour: "2-digit", hour12: false }).format(new Date())) % 24, []);
  const data = useMemo(() => mergeGuestRitual(query.data, stats), [query.data, stats]);

  if (hour >= 12 && hour < 20) return null;
  const focus = stats.nextAction.topicTitle ?? stats.todayTasks[0]?.topicTitle ?? "your next high-yield topic";

  if (hour < 12) {
    return (
      <section className="mt-6 rounded-2xl border border-orange-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#f97316]">
              <Sun className="h-4 w-4" /> Morning Brief
            </p>
            <h2 className="mt-2 text-2xl font-black text-[#1a2744]">Good morning. Day {stats.currentStreak} of your UPSC journey.</h2>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-600">Today&apos;s focus: {focus}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[520px]">
            <Metric label="Yesterday" value={`${data.topicsStudiedYesterday} topics`} />
            <Metric label="Cards due" value={String(stats.cardsDue)} />
            <Metric label="Current affairs" value={data.latestCurrentAffair?.title ?? "Open daily digest"} href={data.latestCurrentAffair?.href ?? "/current-affairs"} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-800 bg-[#0a0a0a] p-5 text-white shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#f97316]">
            <Moon className="h-4 w-4" /> Night Review
          </p>
          <h2 className="mt-2 text-2xl font-black">Today&apos;s summary</h2>
          <p className="mt-2 text-sm font-bold leading-6 text-zinc-300">Tomorrow&apos;s first task: {data.tomorrowFirstTask?.title ?? focus}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-4 lg:min-w-[650px]">
          <Metric dark label="Topics" value={String(data.topicsCompletedToday)} />
          <Metric dark label="MCQs" value={`${data.mcqsAttemptedToday} (${data.mcqAccuracyToday}%)`} />
          <Metric dark label="XP today" value={String(data.xpEarnedToday)} />
          <Metric dark label="Streak" value={`${stats.currentStreak} days`} />
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value, href, dark = false }: { label: string; value: string; href?: string; dark?: boolean }) {
  const body = (
    <span className={`block rounded-2xl p-4 ${dark ? "bg-white/10 text-white" : "bg-slate-50 text-[#1a2744]"}`}>
      <span className={`block text-[11px] font-black uppercase tracking-[0.14em] ${dark ? "text-zinc-400" : "text-slate-500"}`}>{label}</span>
      <span className="mt-2 line-clamp-2 flex items-center gap-2 text-sm font-black">
        {value}
        {href ? <ArrowRight className="h-4 w-4 shrink-0 text-[#f97316]" /> : null}
      </span>
    </span>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

function mergeGuestRitual(data: RitualData | undefined, stats: UserStats): RitualData {
  if (typeof window === "undefined") {
    return data ?? {
      topicsStudiedYesterday: 0,
      topicsCompletedToday: 0,
      mcqsAttemptedToday: 0,
      mcqAccuracyToday: 0,
      xpEarnedToday: 0,
      latestCurrentAffair: null,
      tomorrowFirstTask: null,
    };
  }
  try {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(yesterdayDate);
    const progress = Object.values(JSON.parse(window.localStorage.getItem("clearupsc_guest_topic_progress") || "{}")) as Array<{ status?: string; updated_at?: string }>;
    const events = JSON.parse(window.localStorage.getItem("clearupsc_guest_xp_events") || "[]") as Array<{ xp?: number; created_at?: string }>;
    const todayXp = events
      .filter((event) => event.created_at?.slice(0, 10) === today)
      .reduce((sum, event) => sum + Number(event.xp ?? 0), 0);
    return {
      ...(data ?? {
        topicsStudiedYesterday: 0,
        topicsCompletedToday: 0,
        mcqsAttemptedToday: 0,
        mcqAccuracyToday: 0,
        xpEarnedToday: 0,
        latestCurrentAffair: null,
        tomorrowFirstTask: null,
      }),
      topicsStudiedYesterday: progress.filter((row) => row.updated_at?.slice(0, 10) === yesterday).length || data?.topicsStudiedYesterday || 0,
      topicsCompletedToday: progress.filter((row) => (row.status === "completed" || row.status === "done") && row.updated_at?.slice(0, 10) === today).length || data?.topicsCompletedToday || 0,
      xpEarnedToday: todayXp || data?.xpEarnedToday || 0,
      tomorrowFirstTask: data?.tomorrowFirstTask ?? (stats.nextAction.topicTitle ? { key: stats.nextAction.href, title: stats.nextAction.topicTitle } : null),
    };
  } catch {
    return data ?? {
      topicsStudiedYesterday: 0,
      topicsCompletedToday: 0,
      mcqsAttemptedToday: 0,
      mcqAccuracyToday: 0,
      xpEarnedToday: 0,
      latestCurrentAffair: null,
      tomorrowFirstTask: null,
    };
  }
}
