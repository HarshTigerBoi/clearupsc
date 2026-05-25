"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import ProductShell from "@/components/product/ProductShell";
import type { CurrentAffair } from "@/types";

export default function CurrentAffairsPage() {
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [message, setMessage] = useState("");
  const affairsQuery = useQuery({
    queryKey: ["current-affairs", "latest"],
    queryFn: async () => {
      const response = await fetch("/api/current-affairs/latest");
      if (!response.ok) throw new Error("Current affairs unavailable");
      const data = (await response.json()) as { items: CurrentAffair[] };
      return data.items;
    },
  });
  const items = useMemo(() => {
    return (affairsQuery.data ?? []).filter((item) => {
      const text = `${item.title} ${item.summary} ${item.tags.join(" ")}`.toLowerCase();
      const categoryMatch = category === "All" || item.tags.includes(category);
      return categoryMatch && text.includes(search.toLowerCase());
    });
  }, [affairsQuery.data, category, search]);
  const categories = useMemo(() => ["All", ...Array.from(new Set((affairsQuery.data ?? []).flatMap((item) => item.tags))).slice(0, 8)], [affairsQuery.data]);
  const addNote = useMutation({
    mutationFn: async (item: CurrentAffair) => {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: item.title, content: `${item.summary}\n\nUPSC angle: ${item.upscAngle}`, tags: item.tags }),
      });
      if (!response.ok) throw new Error("Notes table may need schema migration.");
    },
    onSuccess: () => setMessage("Added to notes."),
    onError: () => setMessage("Apply the latest Supabase schema to enable saved notes."),
  });
  const quiz = useMemo(() => {
    return items.slice(0, 5).map((item, index) => {
      const correct = item.tags[0] ?? "GS2";
      const options = Array.from(new Set([correct, "GS1", "GS2", "GS3", "Environment"])).slice(0, 4);
      return { id: `${item.title}-${index}`, prompt: `Most relevant UPSC tag for: ${item.title}`, correct, options };
    });
  }, [items]);

  return (
    <ProductShell>
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Current affairs"
          title="Daily news converted into UPSC hooks."
          description="Digest format: summary, UPSC angle, prelims hook and mains linkage. Read less noise, retain more usable points."
        />
        {affairsQuery.isError ? <StateBox title="No current affairs loaded" body="Current affairs could not be loaded right now. Try again after signing in." /> : null}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search current affairs..." className="min-h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-[#f97316]" />
          <div className="mt-3 flex flex-wrap gap-2">
            {categories.map((item) => (
              <button key={item} onClick={() => setCategory(item)} className={`min-h-10 rounded-full px-3 text-xs font-black ${category === item ? "bg-[#1a2744] text-white" : "bg-slate-100 text-slate-600"}`}>
                {item}
              </button>
            ))}
          </div>
          {message ? <p className="mt-3 text-sm font-bold text-[#f97316]">{message}</p> : null}
          <Link href="/current-affairs/quiz" className="mt-3 inline-flex min-h-11 items-center rounded-full bg-[#f97316] px-4 text-sm font-black text-white">
            Start recall quiz
          </Link>
        </div>
        <div className="mt-6 space-y-4">
          {items.map((item) => (
            <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#1a2744] px-3 py-1 text-xs font-bold text-white">{item.date}</span>
                {item.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">{tag}</span>
                ))}
              </div>
              <h2 className="mt-4 text-2xl font-black text-[#1a2744]">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-700">{item.summary}</p>
              <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-bold text-[#1a2744]">UPSC angle</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">{item.upscAngle}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => addNote.mutate(item)} className="min-h-11 rounded-full bg-[#1a2744] px-4 text-sm font-black text-white">Add to Notes</button>
                <a href="/flashcards" className="inline-flex min-h-11 items-center rounded-full bg-orange-100 px-4 text-sm font-black text-orange-700">Add Flashcard</a>
              </div>
            </article>
          ))}
        </div>
        {quiz.length ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-black text-[#1a2744]">Daily 5-minute recall quiz</h2>
            <div className="mt-4 space-y-4">
              {quiz.map((question, index) => (
                <div key={question.id} className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-bold text-[#1a2744]">{index + 1}. {question.prompt}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {question.options.map((option) => {
                      const picked = selected[question.id];
                      const isCorrect = picked && option === question.correct;
                      const isWrong = picked === option && option !== question.correct;
                      return (
                        <button
                          key={option}
                          onClick={() => setSelected({ ...selected, [question.id]: option })}
                          className={`rounded-full px-3 py-1 text-sm font-bold ${isCorrect ? "bg-green-100 text-green-700" : isWrong ? "bg-red-100 text-red-700" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </ProductShell>
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
