"use client";

import Link from "next/link";

interface ArsenalProps {
  topicKey: string;
  topicTitle: string;
  practiceQuestionCount: number;
  traps: string[];
  mainsAngles: string[];
  connectedTopics: string[];
}

function frameworkSteps(topicTitle: string, mainsAngles: string[]) {
  const direct = mainsAngles.filter(Boolean).slice(0, 5);
  if (direct.length >= 3) return direct;
  return [
    `Define ${topicTitle} in one crisp line.`,
    "Anchor the answer in the relevant constitutional, institutional or factual base.",
    "Add one India-specific example, case, scheme, report or data point.",
    "Explain the current challenge or exam-relevant debate.",
    "Close with a balanced way forward.",
  ];
}

export default function Arsenal({ topicKey, topicTitle, practiceQuestionCount, traps, mainsAngles, connectedTopics }: ArsenalProps) {
  const steps = frameworkSteps(topicTitle, mainsAngles);
  const trapItems = traps.length ? traps.slice(0, 6) : ["Watch for extreme words, mismatched institutions, and partially true statements."];
  const related = connectedTopics.filter(Boolean).slice(0, 6);

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-orange-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-700">Exam warrior layer</p>
            <h3 className="mt-2 text-2xl font-black text-[#1a2744]">What UPSC can actually test</h3>
          </div>
          <span className="inline-flex min-h-11 items-center justify-center rounded-full bg-orange-100 px-4 text-sm font-black text-orange-800">
            Asked {practiceQuestionCount} times in practice bank
          </span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <h4 className="text-lg font-black text-red-900">Common Traps</h4>
          <div className="mt-4 grid gap-3">
            {trapItems.map((trap, index) => (
              <div key={`${trap}-${index}`} className="rounded-2xl border border-red-200 bg-white p-4 text-sm font-bold leading-6 text-red-900">
                {trap}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 className="text-lg font-black text-[#1a2744]">Mains Framework</h4>
          <ol className="mt-4 space-y-3">
            {steps.map((step, index) => (
              <li key={`${step}-${index}`} className="flex gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-700">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#1a2744] text-xs text-white">{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h4 className="text-lg font-black text-[#1a2744]">Connected Topics</h4>
        <p className="mt-1 text-sm font-bold text-slate-500">Use these branches to connect this topic in Mains answers.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(related.length ? related : ["Meaning", "Institutions", "Current affairs"]).map((branch) => (
            <Link
              key={`${topicKey}-${branch}`}
              href={`/study?search=${encodeURIComponent(branch)}`}
              className="min-h-11 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-black text-[#1a2744] transition hover:border-[#f97316] hover:text-[#f97316]"
            >
              {branch}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
