"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BookOpenCheck, CheckCircle2, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import ProductShell from "@/components/product/ProductShell";
import type { Topic } from "@/types";

export default function StudyHomePage() {
  const [search, setSearch] = useState("");
  const [paper, setPaper] = useState("All");
  const query = useQuery({
    queryKey: ["study-topics"],
    queryFn: async () => {
      const response = await fetch("/api/study/topics");
      if (!response.ok) throw new Error("Topics unavailable");
      return (await response.json()) as { topics: Topic[] };
    },
  });
  const papers = useMemo(() => ["All", ...Array.from(new Set((query.data?.topics ?? []).map((topic) => topic.subject)))], [query.data]);
  const topics = useMemo(() => {
    return (query.data?.topics ?? []).filter((topic) => {
      const text = `${topic.title} ${topic.key} ${topic.subject}`.toLowerCase();
      return (paper === "All" || topic.subject === paper) && text.includes(search.toLowerCase());
    });
  }, [query.data, paper, search]);

  return (
    <ProductShell>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader eyebrow="Study Course" title="The full UPSC course map." description="Open any topic, read ClearUPSC notes, use Wikipedia/NCERT references, practise MCQs and update your syllabus status." />
        <div className="mt-6 rounded-3xl border border-orange-100 bg-orange-50 p-5">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-orange-700">Today&apos;s study loop</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {["Read ClearUPSC notes", "Read linked NCERT", "Attempt 10 MCQs", "Add flashcards for misses", "Current affairs recall", "Write one answer", "Review due cards", "Mark syllabus progress"].map((step) => (
              <div key={step} className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-bold text-orange-950">
                <CheckCircle2 className="h-4 w-4 text-[#f97316]" />
                {step}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4">
            <Search className="h-5 w-5 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search polity, inflation, ethics, geography..." className="min-h-12 flex-1 bg-transparent outline-none" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {papers.map((item) => (
              <button key={item} onClick={() => setPaper(item)} className={`min-h-10 rounded-full px-3 text-xs font-black ${paper === item ? "bg-[#1a2744] text-white" : "bg-slate-100 text-slate-600"}`}>
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {topics.slice(0, 120).map((topic) => (
            <Link key={topic.key} href={`/study/${topic.key}`} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:border-[#f97316]">
              <BookOpenCheck className="h-5 w-5 text-[#f97316]" />
              <h2 className="mt-3 font-black text-[#1a2744]">{topic.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{topic.subject} | {topic.examStage ?? "both"} | weight {topic.upscWeightage ?? 1}</p>
            </Link>
          ))}
        </div>
        {topics.length > 120 ? <p className="mt-4 text-sm text-slate-500">Showing first 120 matches. Search or filter to narrow the full topic bank.</p> : null}
      </section>
    </ProductShell>
  );
}
