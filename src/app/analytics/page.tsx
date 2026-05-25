"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, CartesianGrid, Line, LineChart, Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { PageHeader } from "@/components/layout/PageHeader";
import ProductShell from "@/components/product/ProductShell";
import { LoadingSkeleton } from "@/components/ui/state";

interface AnalyticsPayload {
  preparednessScore: number;
  estimatedPrelimsScore: number;
  weakTopics: string[];
  strongTopics: string[];
  neglectedTopics: string[];
  paperScores: Array<{ paper: string; score: number }>;
  activity14Days: Array<{ day: string; attempts: number; answers: number }>;
}

export default function AnalyticsPage() {
  const query = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const response = await fetch("/api/user/analytics");
      if (!response.ok) throw new Error("Analytics unavailable");
      return (await response.json()) as AnalyticsPayload;
    },
  });

  return (
    <ProductShell>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader eyebrow="Analytics" title="Know your weak areas before the exam does." description="Readiness, activity and topic risk signals from your practice, revision and answer-writing data." />
        {query.isLoading ? <LoadingSkeleton rows={5} /> : null}
        {query.data ? (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Stat label="Preparedness" value={`${query.data.preparednessScore}%`} />
              <Stat label="Estimated Prelims" value={`${query.data.estimatedPrelimsScore}/200`} />
              <Stat label="Neglected topics" value={String(query.data.neglectedTopics.length)} />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <ChartCard title="GS readiness radar">
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={query.data.paperScores}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="paper" />
                    <Radar dataKey="score" stroke="#f97316" fill="#f97316" fillOpacity={0.25} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard title="Last 14 days activity">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={query.data.activity14Days}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="attempts" stroke="#1a2744" strokeWidth={2} />
                    <Line type="monotone" dataKey="answers" stroke="#f97316" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
            <ChartCard title="Subject completion">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={query.data.paperScores}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="paper" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="score" fill="#f97316" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <div className="grid gap-4 md:grid-cols-3">
              <List title="Weak topics" items={query.data.weakTopics} />
              <List title="Strong topics" items={query.data.strongTopics} />
              <List title="Neglected topics" items={query.data.neglectedTopics} />
            </div>
          </div>
        ) : null}
      </section>
    </ProductShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{label}</p><p className="mt-2 text-4xl font-black text-[#1a2744]">{value}</p></div>;
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-black text-[#1a2744]">{title}</h2><div className="mt-4">{children}</div></div>;
}

function List({ title, items }: { title: string; items: string[] }) {
  return <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-black text-[#1a2744]">{title}</h2><div className="mt-3 flex flex-wrap gap-2">{items.length ? items.map((item) => <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{item}</span>) : <p className="text-sm text-slate-500">No signal yet.</p>}</div></div>;
}
