"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import ProductShell from "@/components/product/ProductShell";

const topics = [
  "Democracy is not only a form of government but a way of life.",
  "The test of development is dignity at the last mile.",
  "Technology without ethics creates efficient injustice.",
  "Women-led development is the foundation of inclusive governance.",
  "Climate justice is also economic justice.",
  "The role of civil services in a changing India.",
];

export default function EssayPage() {
  const client = useQueryClient();
  const [topic, setTopic] = useState(topics[0]);
  const [content, setContent] = useState("");
  const [selfScore, setSelfScore] = useState(6);
  const wordCount = useMemo(() => content.trim().split(/\s+/).filter(Boolean).length, [content]);
  const history = useQuery({
    queryKey: ["essays"],
    queryFn: async () => {
      const response = await fetch("/api/essay");
      if (!response.ok) throw new Error("Essay history unavailable");
      return (await response.json()) as { essays: Array<{ id: string; topic: string; word_count: number; self_score: number }> };
    },
  });
  const [localEssays, setLocalEssays] = useState<Array<{ id: string; topic: string; word_count: number; self_score: number }>>([]);
  useEffect(() => {
    const saved = window.localStorage.getItem("clearupsc_local_essays");
    if (saved) setLocalEssays(JSON.parse(saved));
  }, []);
  const save = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/essay", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic, content, wordCount, timeSpentMinutes: 180, selfScore, rubric: { structure: selfScore } }) });
      if (!response.ok) throw new Error("Could not save essay");
    },
    onSuccess: () => {
      setContent("");
      client.invalidateQueries({ queryKey: ["essays"] });
    },
    onError: () => {
      const essay = { id: `local-${Date.now()}`, topic, word_count: wordCount, self_score: selfScore };
      const next = [essay, ...localEssays];
      setLocalEssays(next);
      window.localStorage.setItem("clearupsc_local_essays", JSON.stringify(next));
      setContent("");
    },
  });
  const essays = history.data?.essays?.length ? history.data.essays : localEssays;

  return (
    <ProductShell>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader eyebrow="Essay" title="Train the highest-differentiation paper." description="Pick a topic, write with a 1000-1200 word target, then self-review structure and depth." />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.7fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <select value={topic} onChange={(event) => setTopic(event.target.value)} className="min-h-12 w-full rounded-2xl border border-slate-200 px-4 font-bold">
              {topics.map((item) => <option key={item}>{item}</option>)}
            </select>
            <textarea value={content} onChange={(event) => setContent(event.target.value)} className="mt-4 min-h-[440px] w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-[#f97316]" placeholder="Intro - body - examples - conclusion..." />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-700">{wordCount} words</span>
              <label className="text-sm font-bold text-slate-600">Self score <input type="number" min={1} max={10} value={selfScore} onChange={(event) => setSelfScore(Number(event.target.value))} className="ml-2 w-20 rounded-xl border border-slate-200 px-3 py-2" /></label>
              <button disabled={wordCount < 20 || save.isPending} onClick={() => save.mutate()} className="min-h-12 rounded-full bg-[#f97316] px-5 font-black text-white disabled:opacity-50">Save essay</button>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-[#1a2744]">Essay history</h2>
            <div className="mt-4 space-y-3">
              {essays.map((essay) => <div key={essay.id} className="rounded-2xl bg-slate-50 p-4"><p className="font-black text-slate-900">{essay.topic}</p><p className="text-sm text-slate-500">{essay.word_count} words · self score {essay.self_score}/10</p></div>)}
            </div>
            <p className="mt-4 text-xs text-slate-500">If the essay table is not migrated yet, attempts are saved locally in this browser.</p>
          </div>
        </div>
      </section>
    </ProductShell>
  );
}
