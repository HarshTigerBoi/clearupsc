"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Brain, CheckCircle2, Flame, PenLine, Repeat, Target } from "lucide-react";
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/layout/PageHeader";
import ProductShell from "@/components/product/ProductShell";
import type { UserStats } from "@/types";

const quickActions = [
  { href: "/planner", label: "Open today's plan", helper: "Study without deciding again", icon: Target },
  { href: "/answer-writing/practice", label: "Write one answer", helper: "Rubric feedback when AI is configured", icon: PenLine },
  { href: "/flashcards", label: "Clear due cards", helper: "Protect memory before it leaks", icon: Repeat },
];

export default function DashboardPage() {
  const [guestProgress, setGuestProgress] = useState<Record<string, { status?: string; last_score?: number | null; mistakes_count?: number; updated_at?: string }>>({});

  useEffect(() => {
    try {
      setGuestProgress(JSON.parse(window.localStorage.getItem("clearupsc_guest_topic_progress") || "{}"));
    } catch {
      setGuestProgress({});
    }
  }, []);

  const statsQuery = useQuery({
    queryKey: ["user", "stats"],
    queryFn: async () => {
      const response = await fetch("/api/user/stats");
      if (!response.ok) throw new Error("Stats unavailable");
      return (await response.json()) as UserStats;
    },
  });

  const stats = useMemo(() => mergeGuestStats(statsQuery.data, guestProgress), [guestProgress, statsQuery.data]);
  const analyticsQuery = useQuery({
    queryKey: ["user", "analytics"],
    queryFn: async () => {
      const response = await fetch("/api/user/analytics");
      if (!response.ok) throw new Error("Analytics unavailable");
      return (await response.json()) as {
        preparednessScore: number;
        estimatedPrelimsScore: number;
        paperScores: Array<{ paper: string; score: number }>;
        activity14Days: Array<{ day: string; attempts: number; answers: number }>;
      };
    },
  });

  return (
    <ProductShell>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Dashboard"
          title="Your UPSC rank cockpit"
          description="Today's plan, weak areas, revision pressure and answer-writing momentum in one calm workspace."
        />

        {statsQuery.isError ? <StateBox title="Workspace not ready" body="Connect Supabase and sign in to load your live dashboard." /> : null}
        {!stats ? <StateBox title="Loading dashboard" body="Pulling your plan, progress, cards and recent scores." /> : null}

        {stats ? (
          <>
            <NextActionCard stats={stats} />

            <details className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <summary className="cursor-pointer list-none px-5 py-4 text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                Full Dashboard Details
              </summary>
              <div className="border-t border-slate-100 p-5">
                <div className="grid gap-4 md:grid-cols-4">
                  {[
                    { label: "Syllabus", value: `${stats.syllabusCompletion}%`, helper: "Completion across GS + CSAT", icon: Target },
                    { label: "Streak", value: `${stats.currentStreak} days`, helper: "Consecutive study days", icon: Flame },
                    { label: "Cards due", value: String(stats.cardsDue), helper: "SM-2 recall queue", icon: Brain },
                    { label: "Mock trend", value: stats.mockScoreTrend, helper: "Prelims target: 120+", icon: CheckCircle2 },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <item.icon className="text-[#f97316]" size={22} />
                      <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                      <p className="mt-2 text-3xl font-black text-[#1a2744]">{item.value}</p>
                      <p className="mt-1 text-sm text-slate-500">{item.helper}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#f97316]">Today</p>
                        <h2 className="mt-1 text-2xl font-black text-[#1a2744]">Adaptive daily plan</h2>
                      </div>
                      <Link href="/planner" className="hidden text-sm font-bold text-[#f97316] sm:inline-flex">
                        Open planner
                      </Link>
                    </div>
                    <div className="mt-5 space-y-3">
                      {stats.todayTasks.map((task) => (
                        <div key={task.id} className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                          <div>
                            <p className="font-bold text-slate-900">{task.topicTitle}</p>
                            <p className="mt-1 text-sm text-slate-500">
                              {task.taskType.replace("_", " ")} - {task.durationMinutes} min
                            </p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-black ${task.completed ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                            {task.completed ? "Done" : "Pending"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#f97316]">Weak areas</p>
                      <div className="mt-4 grid gap-2">
                        {stats.weakAreas.length ? (
                          stats.weakAreas.map((area) => (
                            <Link
                              key={area.topicKey}
                              href={`/study/${area.topicKey}`}
                              className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800 hover:border-red-300"
                            >
                              <span>{area.title}</span>
                              <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black text-red-700">
                                {area.lastScore === null ? "Unscored" : `${area.lastScore}%`}
                              </span>
                            </Link>
                          ))
                        ) : (
                          <p className="text-sm text-slate-500">No weak topics flagged yet.</p>
                        )}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#f97316]">Quick actions</p>
                      <div className="mt-4 space-y-3">
                        {quickActions.map((action) => (
                          <Link key={action.href} href={action.href} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 hover:border-[#f97316] hover:bg-orange-50">
                            <action.icon className="text-[#f97316]" size={20} />
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-black text-[#1a2744]">{action.label}</span>
                              <span className="block text-xs text-slate-500">{action.helper}</span>
                            </span>
                            <ArrowRight size={16} />
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#f97316]">Readiness</p>
                    <h2 className="mt-1 text-2xl font-black text-[#1a2744]">{analyticsQuery.data?.preparednessScore ?? 0}% preparedness</h2>
                    <p className="mt-1 text-sm text-slate-500">Estimated Prelims score: {analyticsQuery.data?.estimatedPrelimsScore ?? 0}/200</p>
                    <div className="mt-4 h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsQuery.data?.paperScores ?? []}>
                          <XAxis dataKey="paper" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="score" fill="#f97316" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#f97316]">Activity</p>
                    <h2 className="mt-1 text-2xl font-black text-[#1a2744]">Last 14 days</h2>
                    <div className="mt-4 h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analyticsQuery.data?.activity14Days ?? []}>
                          <XAxis dataKey="day" />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Line dataKey="attempts" stroke="#1a2744" strokeWidth={2} />
                          <Line dataKey="answers" stroke="#f97316" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </details>
          </>
        ) : null}
      </section>
    </ProductShell>
  );
}

function mergeGuestStats(stats: UserStats | undefined, progress: Record<string, { status?: string; last_score?: number | null; mistakes_count?: number; updated_at?: string }>) {
  if (!stats) return stats;
  const entries = Object.entries(progress);
  if (!entries.length) return stats;

  const completed = entries.filter(([, item]) => item.status === "completed" || item.status === "done").length;
  const inProgress = entries
    .filter(([, item]) => item.status === "in_progress")
    .sort((a, b) => new Date(b[1].updated_at ?? 0).getTime() - new Date(a[1].updated_at ?? 0).getTime())[0];
  const weakAreas = entries
    .filter(([, item]) => (item.last_score ?? 100) < 60 || (item.mistakes_count ?? 0) > 2)
    .sort((a, b) => (b[1].mistakes_count ?? 0) - (a[1].mistakes_count ?? 0))
    .slice(0, 5)
    .map(([topicKey, item]) => ({
      topicKey,
      title: topicKey.replace(/^gs\d?_?/, "").replaceAll("_", " "),
      lastScore: item.last_score ?? null,
      mistakesCount: item.mistakes_count ?? 0,
    }));

  return {
    ...stats,
    syllabusCompletion: Math.max(stats.syllabusCompletion, Math.round((completed / 1196) * 100)),
    weakAreas: weakAreas.length ? weakAreas : stats.weakAreas,
    nextAction: inProgress
      ? {
          title: "Continue Where You Left Off",
          subtitle: "This progress is saved in this browser. Sign in later only if you want cloud sync.",
          buttonLabel: "Continue Topic",
          href: `/study/${inProgress[0]}`,
          topicTitle: inProgress[0].replace(/^gs\d?_?/, "").replaceAll("_", " "),
          stepLabel: "Resume study",
        }
      : completed > 0
        ? {
            title: "Study Next Topic",
            subtitle: `${completed} topic${completed === 1 ? "" : "s"} completed in guest mode. Keep the momentum going.`,
            buttonLabel: "Open Study",
            href: "/study",
            topicTitle: "Continue Course",
            stepLabel: "Guest progress saved",
          }
        : stats.nextAction,
  } satisfies UserStats;
}

function NextActionCard({ stats }: { stats: UserStats }) {
  const action = stats.nextAction;

  return (
    <section className="mt-6 overflow-hidden rounded-2xl bg-[#0a0a0a] p-6 text-white shadow-sm sm:p-8">
      <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#f97316]">Next Action</p>
          <h2 className="mt-4 text-4xl font-black tracking-normal text-white sm:text-5xl">{action.title}</h2>
          {action.topicTitle ? <p className="mt-3 text-xl font-black text-zinc-100">{action.topicTitle}</p> : null}
          {action.stepLabel ? <p className="mt-1 text-sm font-bold uppercase tracking-[0.16em] text-[#f97316]">{action.stepLabel}</p> : null}
          {typeof action.cardCount === "number" ? <p className="mt-3 text-xl font-black text-zinc-100">{action.cardCount} cards due</p> : null}
          <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-300 sm:text-base">{action.subtitle}</p>
        </div>
        <Link
          href={action.href}
          className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-md bg-[#f97316] px-6 text-sm font-black text-white transition hover:bg-[#ea580c]"
        >
          {action.buttonLabel}
        </Link>
      </div>
    </section>
  );
}

function StateBox({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-sm">
      <p className="font-black text-[#1a2744]">{title}</p>
      <p className="mt-1 text-slate-500">{body}</p>
    </div>
  );
}
