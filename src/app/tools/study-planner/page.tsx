"use client";

import { useMemo, useState } from "react";

export default function StudyPlannerToolPage() {
  const [hours, setHours] = useState(6);
  const [level, setLevel] = useState("Beginner");
  const [weak, setWeak] = useState("Polity");
  const weeks = useMemo(() => Array.from({ length: 12 }).map((_, index) => ({
    week: index + 1,
    focus: index % 3 === 0 ? weak : index % 3 === 1 ? "Current affairs + MCQs" : "Revision + answer writing",
    hours: hours * 6,
  })), [hours, weak]);
  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm font-black uppercase tracking-[0.25em] text-[#f97316]">Free Tool</p>
      <h1 className="mt-3 text-4xl font-black text-[#1a2744]">UPSC study schedule generator</h1>
      <div className="mt-8 grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-3">
        <label className="text-sm font-bold text-slate-600">Hours/day<input type="number" min={2} max={12} value={hours} onChange={(event) => setHours(Number(event.target.value))} className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 px-3" /></label>
        <label className="text-sm font-bold text-slate-600">Level<select value={level} onChange={(event) => setLevel(event.target.value)} className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 px-3"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>
        <label className="text-sm font-bold text-slate-600">Weak subject<input value={weak} onChange={(event) => setWeak(event.target.value)} className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 px-3" /></label>
      </div>
      <div className="mt-6 grid gap-3">
        {weeks.map((week) => <div key={week.week} className="rounded-2xl bg-slate-50 p-4"><p className="font-black text-[#1a2744]">Week {week.week}: {week.focus}</p><p className="text-sm text-slate-500">{week.hours} study hours for a {level.toLowerCase()} plan.</p></div>)}
      </div>
    </section>
  );
}
