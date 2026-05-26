"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ProductShell from "@/components/product/ProductShell";
import { BADGE_BY_ID } from "@/lib/gamification/badges";

interface Mistake {
  id: string;
  questionId: string;
  topicKey: string | null;
  question: string;
  selectedOption: string;
  selectedText: string;
  correctOption: string;
  correctText: string;
  explanation: string;
  source: string;
  attemptedAt: string;
}

export default function MistakeJournalPage() {
  const [guestMistakes, setGuestMistakes] = useState<Mistake[]>([]);

  useEffect(() => {
    try {
      const rows = JSON.parse(window.localStorage.getItem("clearupsc_guest_mistakes") || "[]");
      setGuestMistakes(Array.isArray(rows) ? rows : []);
    } catch {
      setGuestMistakes([]);
    }
  }, []);

  const mistakesQuery = useQuery({
    queryKey: ["mistakes"],
    queryFn: async () => {
      const response = await fetch("/api/mistakes");
      if (!response.ok) throw new Error("Mistakes unavailable");
      return (await response.json()) as { mistakes: Mistake[]; guest?: boolean };
    },
  });

  const mistakes = useMemo(() => {
    const cloud = mistakesQuery.data?.mistakes ?? [];
    const ids = new Set(cloud.map((item) => item.id));
    return [...cloud, ...guestMistakes.filter((item) => !ids.has(item.id))];
  }, [guestMistakes, mistakesQuery.data?.mistakes]);

  async function clearMistake(mistake: Mistake) {
    if (mistake.id.startsWith("guest-")) {
      const next = guestMistakes.filter((item) => item.id !== mistake.id);
      setGuestMistakes(next);
      window.localStorage.setItem("clearupsc_guest_mistakes", JSON.stringify(next));
      const resolved = Number(window.localStorage.getItem("clearupsc_guest_resolved_mistakes") ?? 0) + 1;
      window.localStorage.setItem("clearupsc_guest_resolved_mistakes", String(resolved));
      if (resolved >= 50) {
        const earned = new Set(JSON.parse(window.localStorage.getItem("clearupsc_guest_badges") || "[]"));
        if (!earned.has("mistake_crusher")) {
          earned.add("mistake_crusher");
          window.localStorage.setItem("clearupsc_guest_badges", JSON.stringify([...earned]));
          const badge = BADGE_BY_ID.get("mistake_crusher");
          if (badge) window.dispatchEvent(new CustomEvent("clearupsc:badge-unlock", { detail: badge }));
        }
      }
      return;
    }
    await fetch(`/api/mistakes?id=${encodeURIComponent(mistake.id)}`, { method: "DELETE" }).catch(() => {});
    await mistakesQuery.refetch();
  }

  return (
    <ProductShell>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-3xl bg-[#0a0a0a] p-5 text-white shadow-sm sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#f97316]">Repair loop</p>
          <h1 className="mt-3 text-3xl font-black sm:text-5xl">Mistake Journal</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300">Every wrong answer becomes a repair card. Clear this list when you can explain the concept without looking.</p>
        </section>

        {mistakesQuery.isLoading ? <div className="mt-6 rounded-3xl bg-white p-6 font-bold text-slate-600">Loading mistakes...</div> : null}
        {mistakesQuery.isError ? <div className="mt-6 rounded-3xl bg-red-50 p-6 font-bold text-red-700">Could not load mistake journal.</div> : null}

        {!mistakes.length && !mistakesQuery.isLoading ? (
          <div className="mt-6 rounded-3xl border border-green-200 bg-green-50 p-6 text-center">
            <p className="text-2xl font-black text-green-800">No mistakes waiting.</p>
            <p className="mt-2 text-sm font-bold text-green-700">Do a mixed practice session or mock test to start building a repair trail.</p>
            <Link href="/practice/mixed" className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-green-700 px-5 text-sm font-black text-white">
              Start Mixed Practice
            </Link>
          </div>
        ) : null}

        <div className="mt-6 space-y-5">
          {mistakes.map((mistake) => (
            <article key={mistake.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">Incorrect</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{mistake.source}</span>
              </div>
              <h2 className="mt-4 text-lg font-black leading-7 text-[#1a2744]">{mistake.question}</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-red-700">You answered</p>
                  <p className="mt-2 text-sm font-bold leading-6 text-red-900">{mistake.selectedOption}. {mistake.selectedText || "Selected option"}</p>
                </div>
                <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-green-700">Correct answer</p>
                  <p className="mt-2 text-sm font-bold leading-6 text-green-900">{mistake.correctOption}. {mistake.correctText || "Correct option"}</p>
                </div>
              </div>
              <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-700">{mistake.explanation}</p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                {mistake.topicKey ? (
                  <Link href={`/study/${mistake.topicKey}`} className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#1a2744] px-5 text-sm font-black text-white">
                    Review Topic
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => clearMistake(mistake)}
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#f97316] px-5 text-sm font-black text-white"
                >
                  Got it now
                </button>
              </div>
            </article>
          ))}
        </div>
      </main>
    </ProductShell>
  );
}
