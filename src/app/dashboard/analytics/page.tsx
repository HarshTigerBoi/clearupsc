"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BarChart3, CircleGauge, Clock3, LineChart as LineChartIcon, RefreshCw, Target, type LucideIcon } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ProductShell from "@/components/product/ProductShell";

type Band = "green" | "orange" | "red";

interface AnalyticsResponse {
  overallProgress: {
    completedTopics: number;
    studiedTopics: number;
    totalTopics: number;
    remainingTopics: number;
    percentComplete: number;
  };
  subjectMastery: Array<{
    subject: string;
    percent: number;
    completed: number;
    total: number;
    band: Band;
  }>;
  estimatedPrelims: {
    averageScore: number;
    estimatedScore: number;
    band: Band;
    label: string;
  };
  activity14Days: Array<{
    day: string;
    date: string;
    topicsStudied: number;
  }>;
  revisionDebt: {
    count: number;
    topics: Array<{ topicKey: string; title: string; dueDate: string }>;
  };
  mockTrajectory: {
    scores: Array<{ date: string; score: number }>;
    trend: "improving" | "declining" | "stable" | "none";
    label: string;
  };
}

export default function AnalyticsDashboardPage() {
  const analyticsQuery = useQuery({
    queryKey: ["user", "analytics", "full"],
    queryFn: async () => {
      const response = await fetch("/api/user/analytics");
      if (!response.ok) throw new Error("Analytics unavailable");
      return (await response.json()) as AnalyticsResponse;
    },
  });

  const analytics = analyticsQuery.data;

  return (
    <ProductShell>
      <main className="min-h-screen bg-[#0a0a0a] px-4 py-6 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#f97316]">Analytics</p>
              <h1 className="mt-3 text-3xl font-black tracking-normal text-white sm:text-5xl">Your UPSC progress cockpit</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
                See completion, mastery, revision pressure, mock trajectory and the score signal that matters most.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-zinc-700 px-4 text-sm font-black text-zinc-200 transition hover:border-[#f97316] hover:text-[#f97316]"
            >
              Back to Dashboard
            </Link>
          </div>

          {analyticsQuery.isLoading ? <StateCard title="Loading analytics" body="Reading progress, mocks, flashcards and revision debt." /> : null}
          {analyticsQuery.isError ? <StateCard title="Analytics unavailable" body="Try refreshing once your Supabase session is ready." /> : null}

          {analytics ? (
            <div className="mt-8 grid gap-5">
              <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                <Card title="Overall Progress" eyebrow="Section 1" icon={CircleGauge}>
                  <div className="flex flex-col items-center justify-center gap-5 sm:flex-row">
                    <ProgressRing value={analytics.overallProgress.percentComplete} />
                    <div className="text-center sm:text-left">
                      <p className="text-4xl font-black text-white">{analytics.overallProgress.percentComplete}% Complete</p>
                      <p className="mt-3 text-sm text-zinc-400">
                        {analytics.overallProgress.studiedTopics} topics studied | {analytics.overallProgress.remainingTopics} remaining
                      </p>
                      <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
                        {analytics.overallProgress.completedTopics}/{analytics.overallProgress.totalTopics} completed
                      </p>
                    </div>
                  </div>
                </Card>

                <Card title="Subject Mastery" eyebrow="Section 2" icon={BarChart3}>
                  <div className="space-y-4">
                    {analytics.subjectMastery.map((item) => (
                      <div key={item.subject}>
                        <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                          <span className="font-black text-zinc-100">{item.subject}</span>
                          <span className="font-bold text-zinc-400">
                            {item.percent}% mastered · {item.completed}/{item.total || 0}
                          </span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
                          <div className={`h-full rounded-full ${barColor(item.band)}`} style={{ width: `${Math.max(2, item.percent)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </section>

              <section className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
                <Card title="Estimated Prelims Score" eyebrow="Section 3" icon={Target}>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
                    <p className="text-5xl font-black text-white">{analytics.estimatedPrelims.estimatedScore} / 200</p>
                    <p className="mt-2 text-sm font-bold uppercase tracking-[0.16em] text-zinc-500">estimated</p>
                    <p className={`mt-5 inline-flex rounded-full px-3 py-1 text-xs font-black ${bandPill(analytics.estimatedPrelims.band)}`}>
                      {analytics.estimatedPrelims.label}
                    </p>
                    <p className="mt-4 text-sm leading-6 text-zinc-400">
                      Based on average MCQ score of {analytics.estimatedPrelims.averageScore}% with a conservative 70% confidence factor.
                    </p>
                  </div>
                </Card>

                <Card title="14-Day Activity" eyebrow="Section 4" icon={Clock3}>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.activity14Days}>
                        <CartesianGrid stroke="#27272a" vertical={false} />
                        <XAxis dataKey="day" stroke="#a1a1aa" tickLine={false} axisLine={false} fontSize={12} />
                        <YAxis allowDecimals={false} stroke="#a1a1aa" tickLine={false} axisLine={false} fontSize={12} />
                        <Tooltip
                          cursor={{ fill: "rgba(249, 115, 22, 0.08)" }}
                          contentStyle={{ background: "#111", border: "1px solid #3f3f46", borderRadius: 8, color: "#fff" }}
                        />
                        <Bar dataKey="topicsStudied" name="Topics studied" fill="#f97316" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </section>

              <section className="grid gap-5 lg:grid-cols-2">
                <Card title="Revision Debt" eyebrow="Section 5" icon={RefreshCw}>
                  <div className="flex flex-col gap-4">
                    <div>
                      <p className="text-4xl font-black text-white">{analytics.revisionDebt.count}</p>
                      <p className="mt-2 text-sm text-zinc-400">topics due for revision in the next 3 days</p>
                    </div>
                    <div className="space-y-2">
                      {analytics.revisionDebt.topics.length ? (
                        analytics.revisionDebt.topics.map((topic) => (
                          <Link
                            key={topic.topicKey}
                            href={`/study/${topic.topicKey}`}
                            className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm transition hover:border-[#f97316]"
                          >
                            <span className="font-bold text-zinc-100">{topic.title}</span>
                            <span className="shrink-0 text-xs font-black text-[#f97316]">{topic.dueDate}</span>
                          </Link>
                        ))
                      ) : (
                        <p className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-400">No revision debt due soon.</p>
                      )}
                    </div>
                    <Link
                      href="/flashcards"
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#f97316] px-5 text-sm font-black text-white transition hover:bg-[#ea580c]"
                    >
                      Start Revision <ArrowRight size={16} />
                    </Link>
                  </div>
                </Card>

                <Card title="Mock Test Trajectory" eyebrow="Section 6" icon={LineChartIcon}>
                  {analytics.mockTrajectory.scores.length ? (
                    <>
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <p className="text-sm text-zinc-400">Last 5 mock scores</p>
                        <span className={`rounded-full px-3 py-1 text-xs font-black ${trendPill(analytics.mockTrajectory.trend)}`}>
                          {analytics.mockTrajectory.label}
                        </span>
                      </div>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={analytics.mockTrajectory.scores}>
                            <CartesianGrid stroke="#27272a" vertical={false} />
                            <XAxis dataKey="date" stroke="#a1a1aa" tickLine={false} axisLine={false} fontSize={12} />
                            <YAxis stroke="#a1a1aa" tickLine={false} axisLine={false} fontSize={12} />
                            <Tooltip contentStyle={{ background: "#111", border: "1px solid #3f3f46", borderRadius: 8, color: "#fff" }} />
                            <Line type="monotone" dataKey="score" stroke="#f97316" strokeWidth={3} dot={{ r: 4, fill: "#f97316" }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 text-sm text-zinc-400">
                      Take your first mock to see trajectory.
                    </div>
                  )}
                </Card>
              </section>
            </div>
          ) : null}
        </div>
      </main>
    </ProductShell>
  );
}

function ProgressRing({ value }: { value: number }) {
  const radius = 74;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, value)) / 100) * circumference;

  return (
    <div className="relative h-48 w-48 shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 180 180" aria-hidden="true">
        <circle cx="90" cy="90" r={radius} fill="none" stroke="#27272a" strokeWidth="14" />
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="#f97316"
          strokeLinecap="round"
          strokeWidth="14"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black text-white">{value}%</span>
        <span className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Complete</span>
      </div>
    </div>
  );
}

function Card({
  eyebrow,
  title,
  icon: Icon,
  children,
}: {
  eyebrow: string;
  title: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-[#111] p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#f97316]">{eyebrow}</p>
          <h2 className="mt-2 text-xl font-black text-white sm:text-2xl">{title}</h2>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-[#f97316]">
          <Icon size={22} />
        </div>
      </div>
      {children}
    </section>
  );
}

function StateCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-8 rounded-2xl border border-zinc-800 bg-[#111] p-5 text-sm">
      <p className="font-black text-white">{title}</p>
      <p className="mt-1 text-zinc-400">{body}</p>
    </div>
  );
}

function barColor(band: Band) {
  if (band === "green") return "bg-emerald-500";
  if (band === "orange") return "bg-[#f97316]";
  return "bg-red-500";
}

function bandPill(band: Band) {
  if (band === "green") return "bg-emerald-500/15 text-emerald-300";
  if (band === "orange") return "bg-orange-500/15 text-orange-300";
  return "bg-red-500/15 text-red-300";
}

function trendPill(trend: AnalyticsResponse["mockTrajectory"]["trend"]) {
  if (trend === "improving") return "bg-emerald-500/15 text-emerald-300";
  if (trend === "declining") return "bg-red-500/15 text-red-300";
  return "bg-orange-500/15 text-orange-300";
}
