"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Brain, CheckCircle2, Flame, PenLine, Repeat, Target } from "lucide-react";
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import DailyChallenge from "@/components/dashboard/DailyChallenge";
import StreakCounter from "@/components/dashboard/StreakCounter";
import { PageHeader } from "@/components/layout/PageHeader";
import XPBar from "@/components/gamification/XPBar";
import ProductShell from "@/components/product/ProductShell";
import { readGuestXp } from "@/lib/gamification/xp";
import { generatePersonalizedTopicSequence, type PersonalizationProfile } from "@/lib/study/personalized-plan";
import type { Topic, TopicProgressRecord, TopicStatus, UserStats } from "@/types";

const quickActions = [
  { href: "/planner", label: "Open today's plan", helper: "Study without deciding again", icon: Target },
  { href: "/answer-writing/practice", label: "Write one answer", helper: "Rubric feedback when AI is configured", icon: PenLine },
  { href: "/flashcards", label: "Clear due cards", helper: "Protect memory before it leaks", icon: Repeat },
];

type GuestTopicProgress = Record<
  string,
  {
    status?: string;
    last_score?: number | null;
    mistakes_count?: number;
    updated_at?: string;
    next_review_at?: string | null;
    ease_factor?: number;
    review_interval_days?: number;
    review_count?: number;
  }
>;

export default function DashboardPage() {
  const [guestProgress, setGuestProgress] = useState<GuestTopicProgress>({});
  const [guestProfile, setGuestProfile] = useState<PersonalizationProfile>(null);

  useEffect(() => {
    try {
      setGuestProgress(JSON.parse(window.localStorage.getItem("clearupsc_guest_topic_progress") || "{}"));
      setGuestProfile(JSON.parse(window.localStorage.getItem("clearupsc_guest_onboarding") || "null"));
    } catch {
      setGuestProgress({});
      setGuestProfile(null);
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

  const topicsQuery = useQuery({
    queryKey: ["study", "topics"],
    queryFn: async () => {
      const response = await fetch("/api/study/topics");
      if (!response.ok) throw new Error("Topics unavailable");
      return ((await response.json()) as { topics: Topic[] }).topics;
    },
  });

  const stats = useMemo(
    () => mergeGuestStats(statsQuery.data, guestProgress, guestProfile, topicsQuery.data ?? []),
    [guestProfile, guestProgress, statsQuery.data, topicsQuery.data],
  );
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
            <DailyChallenge />
            <StreakCounter fallbackStreak={stats.currentStreak} />
            <NextActionCard stats={stats} />
            <XPBar totalXp={stats.totalXp ?? 0} />
            <Link
              href="/dashboard/analytics"
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-md px-1 text-sm font-black text-[#f97316] transition hover:text-[#ea580c]"
            >
              View Full Analytics <ArrowRight size={16} />
            </Link>

            <details className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <summary className="cursor-pointer list-none px-5 py-4 text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                Full Dashboard Details
              </summary>
              <div className="border-t border-slate-100 p-4 sm:p-5">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                  {[
                    { label: "Syllabus", value: `${stats.syllabusCompletion}%`, helper: "Completion across GS + CSAT", icon: Target },
                    { label: "Streak", value: `${stats.currentStreak} days`, helper: "Consecutive study days", icon: Flame },
                    { label: "Cards due", value: String(stats.cardsDue), helper: "SM-2 recall queue", icon: Brain },
                    { label: "Mock trend", value: stats.mockScoreTrend, helper: "Prelims target: 120+", icon: CheckCircle2 },
                  ].map((item) => (
                    <div key={item.label} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                      <item.icon className="text-[#f97316]" size={22} />
                      <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 sm:text-xs sm:tracking-[0.18em]">{item.label}</p>
                      <p className="mt-2 break-words text-2xl font-black text-[#1a2744] sm:text-3xl">{item.value}</p>
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

function mergeGuestStats(
  stats: UserStats | undefined,
  progress: GuestTopicProgress,
  profile: PersonalizationProfile,
  topics: Topic[],
) {
  if (!stats) return stats;
  const entries = Object.entries(progress);
  const progressRecords: TopicProgressRecord[] = entries.map(([topicKey, item]) => ({
    topic_key: topicKey,
    status: normaliseGuestStatus(item.status),
    last_score: item.last_score ?? undefined,
    mistakes_count: item.mistakes_count ?? 0,
    last_studied_at: item.updated_at ?? null,
    next_review_at: item.next_review_at ?? null,
    ease_factor: item.ease_factor,
    review_interval_days: item.review_interval_days,
    review_count: item.review_count,
  }));
  const personalized = topics.length ? generatePersonalizedTopicSequence({ profile, topics, progress: progressRecords }) : null;
  const personalizedTopic = personalized?.nextTopicKey ? topics.find((topic) => topic.key === personalized.nextTopicKey) : null;

  const guestXp = readGuestXp();
  if (!entries.length && !personalizedTopic) return guestXp ? { ...stats, totalXp: Math.max(stats.totalXp ?? 0, guestXp) } : stats;

  const completed = entries.filter(([, item]) => item.status === "completed" || item.status === "done").length;
  const studied = entries.filter(([, item]) => normaliseGuestStatus(item.status) !== "not_started").length;
  const today = new Date().toISOString().slice(0, 10);
  const dueTopics = entries
    .filter(([, item]) => item.next_review_at && item.next_review_at.slice(0, 10) <= today && normaliseGuestStatus(item.status) !== "not_started")
    .sort((a, b) => String(a[1].next_review_at).localeCompare(String(b[1].next_review_at)));
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
    totalXp: Math.max(stats.totalXp ?? 0, guestXp),
    nextAction: inProgress
      ? {
          title: "Continue Where You Left Off",
          subtitle: "This progress is saved in this browser. Sign in later only if you want cloud sync.",
          buttonLabel: "Continue Topic",
          href: `/study/${inProgress[0]}`,
          topicTitle: inProgress[0].replace(/^gs\d?_?/, "").replaceAll("_", " "),
          stepLabel: "Resume study",
        }
        : dueTopics.length > 0 && studied >= 3
          ? {
              title: "Revise Before You Forget",
              subtitle: `${dueTopics.length} topic${dueTopics.length === 1 ? "" : "s"} are due today by your SM-2 revision schedule. Guest progress is saved in this browser.`,
              buttonLabel: "Start Revision",
              href: "/flashcards?due=topics",
              cardCount: dueTopics.length,
            }
        : personalizedTopic
        ? {
            title: completed > 0 ? "Study Next Topic" : "Start Your First Topic",
            subtitle: `${personalized?.reason ?? "Following your personalized UPSC sequence"}. Guest progress is saved in this browser.`,
            buttonLabel: completed > 0 ? "Open Next Topic" : "Start Studying",
            href: `/study/${personalizedTopic.key}`,
            topicTitle: personalizedTopic.title,
            stepLabel: "Step 1: Get It",
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

function normaliseGuestStatus(value: string | undefined): TopicStatus {
  if (value === "done" || value === "completed" || value === "in_progress" || value === "needs_revision" || value === "not_started") return value;
  return "not_started";
}

function NextActionCard({ stats }: { stats: UserStats }) {
  const action = stats.nextAction;

  return (
    <section className="mt-6 w-full overflow-hidden rounded-2xl bg-[#0a0a0a] p-5 text-white shadow-sm sm:p-8">
      <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#f97316]">Next Action</p>
          <h2 className="mt-4 break-words text-3xl font-black tracking-normal text-white sm:text-5xl">{action.title}</h2>
          {action.topicTitle ? <p className="mt-3 text-xl font-black text-zinc-100">{action.topicTitle}</p> : null}
          {action.stepLabel ? <p className="mt-1 text-sm font-bold uppercase tracking-[0.16em] text-[#f97316]">{action.stepLabel}</p> : null}
          {typeof action.cardCount === "number" ? <p className="mt-3 text-xl font-black text-zinc-100">{action.cardCount} topics due</p> : null}
          <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-300 sm:text-base">{action.subtitle}</p>
        </div>
        <Link
          href={action.href}
          className="inline-flex min-h-12 w-full shrink-0 items-center justify-center rounded-md bg-[#f97316] px-6 text-sm font-black text-white transition hover:bg-[#ea580c] sm:w-auto"
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
