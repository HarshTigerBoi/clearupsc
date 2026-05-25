"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/layout/PageHeader";
import ProductShell from "@/components/product/ProductShell";

const passages = [
  {
    title: "Governance and trust",
    body: "A public institution earns legitimacy not merely by delivering services, but by being predictable, transparent and accountable. When citizens know how decisions are made, they are more willing to cooperate with difficult policies.",
    question: "What is the central idea of the passage?",
    answer: "Transparent institutions increase citizen trust and cooperation.",
  },
];

const reasoning = [
  { type: "Syllogism", hint: "Draw circles; never assume beyond given statements." },
  { type: "Series", hint: "Check difference, ratio, alternate terms and prime patterns." },
  { type: "Puzzles", hint: "Make a table first, then place fixed clues before variable clues." },
];

const chartData = [
  { sector: "Agriculture", value: 24 },
  { sector: "Industry", value: 29 },
  { sector: "Services", value: 47 },
];

export default function CsatPage() {
  const [selected, setSelected] = useState("");
  const result = useMemo(() => selected && (selected === passages[0].answer ? "Correct" : "Re-read the main conclusion, not a supporting detail."), [selected]);
  return (
    <ProductShell>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader eyebrow="CSAT" title="Qualifying paper, but not optional." description="Practise comprehension, reasoning and data interpretation with technique-first drills." />
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black text-[#1a2744]">Comprehension</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{passages[0].body}</p>
            <p className="mt-4 font-bold text-slate-900">{passages[0].question}</p>
            {[passages[0].answer, "Institutions work only when citizens agree with policy.", "Service delivery is more important than accountability."].map((option) => (
              <button key={option} onClick={() => setSelected(option)} className="mt-2 block min-h-11 w-full rounded-2xl bg-slate-50 px-3 text-left text-sm font-bold text-slate-700">{option}</button>
            ))}
            {result ? <p className="mt-3 text-sm font-black text-[#f97316]">{result}</p> : null}
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black text-[#1a2744]">Reasoning techniques</h2>
            <div className="mt-4 space-y-3">
              {reasoning.map((item) => <div key={item.type} className="rounded-2xl bg-slate-50 p-4"><p className="font-black text-slate-900">{item.type}</p><p className="mt-1 text-sm text-slate-500">{item.hint}</p></div>)}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black text-[#1a2744]">Data Interpretation</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sector" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#f97316" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-sm text-slate-500">Question: Which sector has the highest share? Use visual comparison before calculation.</p>
          </div>
        </div>
      </section>
    </ProductShell>
  );
}
