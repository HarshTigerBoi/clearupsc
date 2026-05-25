"use client";

import { useMemo, useState } from "react";

const rules = {
  General: { maxAge: 32, attempts: 6 },
  OBC: { maxAge: 35, attempts: 9 },
  "SC/ST": { maxAge: 37, attempts: 999 },
  "PH General": { maxAge: 42, attempts: 9 },
};

export default function EligibilityToolPage() {
  const [dob, setDob] = useState("2000-01-01");
  const [category, setCategory] = useState<keyof typeof rules>("General");
  const [attempts, setAttempts] = useState(0);
  const result = useMemo(() => {
    const age = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    const rule = rules[category];
    const eligible = age >= 21 && age <= rule.maxAge && attempts < rule.attempts;
    return { age, eligible, ageLeft: Math.max(0, rule.maxAge - age), attemptsLeft: rule.attempts === 999 ? "Unlimited" : String(Math.max(0, rule.attempts - attempts)) };
  }, [dob, category, attempts]);
  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm font-black uppercase tracking-[0.25em] text-[#f97316]">Free Tool</p>
      <h1 className="mt-3 text-4xl font-black text-[#1a2744]">UPSC eligibility checker</h1>
      <div className="mt-8 grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-3">
        <label className="text-sm font-bold text-slate-600">Date of birth<input type="date" value={dob} onChange={(event) => setDob(event.target.value)} className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 px-3" /></label>
        <label className="text-sm font-bold text-slate-600">Category<select value={category} onChange={(event) => setCategory(event.target.value as keyof typeof rules)} className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 px-3">{Object.keys(rules).map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="text-sm font-bold text-slate-600">Attempts used<input type="number" value={attempts} onChange={(event) => setAttempts(Number(event.target.value))} className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 px-3" /></label>
      </div>
      <div className={`mt-6 rounded-3xl p-6 ${result.eligible ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
        <p className="text-2xl font-black">{result.eligible ? "Eligible" : "Not eligible based on these inputs"}</p>
        <p className="mt-2">Age: {result.age}. Age limit remaining: {result.ageLeft} years. Attempts remaining: {result.attemptsLeft}.</p>
      </div>
    </section>
  );
}
