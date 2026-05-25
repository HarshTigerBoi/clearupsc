"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import ProductShell from "@/components/product/ProductShell";

interface RevisionRow { id: string; topic_key: string; due_date: string; interval_days: number }

export default function RevisionPage() {
  const client = useQueryClient();
  const [localRevisions, setLocalRevisions] = useState<RevisionRow[]>([]);
  useEffect(() => {
    const saved = window.localStorage.getItem("clearupsc_local_revisions");
    if (saved) setLocalRevisions(JSON.parse(saved));
  }, []);
  const query = useQuery({
    queryKey: ["revision"],
    queryFn: async () => {
      const response = await fetch("/api/revision");
      if (!response.ok) throw new Error("Revision unavailable");
      return (await response.json()) as { revisions: RevisionRow[] };
    },
  });
  const review = useMutation({
    mutationFn: async ({ topicKey, quality }: { topicKey: string; quality: number }) => {
      const response = await fetch("/api/revision", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topicKey, quality }) });
      if (!response.ok) throw new Error("Could not update revision");
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ["revision"] }),
    onError: (_error, input) => {
      const due = new Date(Date.now() + (input.quality < 3 ? 1 : input.quality === 3 ? 3 : input.quality === 4 ? 14 : 30) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const next = [{ id: `local-${input.topicKey}`, topic_key: input.topicKey, due_date: due, interval_days: input.quality < 3 ? 1 : input.quality === 3 ? 3 : input.quality === 4 ? 14 : 30 }, ...localRevisions.filter((item) => item.topic_key !== input.topicKey)];
      setLocalRevisions(next);
      window.localStorage.setItem("clearupsc_local_revisions", JSON.stringify(next));
    },
  });
  const revisions = query.data?.revisions?.length ? query.data.revisions : localRevisions;
  const days = Array.from({ length: 30 }).map((_, index) => {
    const date = new Date(Date.now() + index * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const count = revisions.filter((item) => item.due_date === date).length;
    return { date, count };
  });

  return (
    <ProductShell>
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader eyebrow="Revision" title="Review before forgetting starts." description="A calendar view for topics and cards that need recall today." />
        <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-black text-[#1a2744]"><CalendarDays className="h-5 w-5 text-[#f97316]" /> Next 30 days</h2>
            <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-10">
              {days.map((day) => <div key={day.date} className={`min-h-14 rounded-2xl p-2 text-xs font-bold ${day.count ? "bg-orange-100 text-orange-800" : "bg-slate-100 text-slate-500"}`}>{day.date.slice(8)}<br />{day.count ? `${day.count} due` : ""}</div>)}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-[#1a2744]">Due now</h2>
            <div className="mt-4 space-y-3">
              {revisions.length ? revisions.map((item) => (
                <div key={item.id} className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-black capitalize text-slate-900">{item.topic_key.replaceAll("_", " ")}</p>
                  <p className="text-sm text-slate-500">Due {item.due_date} · current interval {item.interval_days} days</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[0, 3, 4, 5].map((quality) => <button key={quality} onClick={() => review.mutate({ topicKey: item.topic_key, quality })} className="min-h-11 rounded-full bg-white px-4 text-sm font-black text-[#1a2744] ring-1 ring-slate-200">Quality {quality}</button>)}
                  </div>
                </div>
              )) : <p className="text-sm text-slate-500">No revisions due yet. Complete topics and flashcards to build the calendar.</p>}
            </div>
            <p className="mt-4 text-xs text-slate-500">If the revision table is not migrated yet, reviews are saved locally in this browser.</p>
          </div>
        </div>
      </section>
    </ProductShell>
  );
}
