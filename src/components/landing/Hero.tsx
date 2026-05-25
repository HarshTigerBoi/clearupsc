import Link from "next/link";
import { ArrowRight, Brain, CalendarCheck, FilePenLine, Repeat } from "lucide-react";

const previewCards = [
  { icon: CalendarCheck, label: "Today", value: "5 tasks", helper: "Auto-planned" },
  { icon: FilePenLine, label: "Answer", value: "79/100", helper: "Rubric score" },
  { icon: Repeat, label: "Revision", value: "24 due", helper: "Before forgetting" },
  { icon: Brain, label: "Weak area", value: "Economy", helper: "Flagged from MCQs" },
];

export function Hero() {
  return (
    <section className="bg-[#1a2744]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-300">Clarity. Strategy. Rank.</p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            The UPSC operating system for serious aspirants.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            ClearUPSC combines optional selection, syllabus tracking, source-labeled practice, answer evaluation, spaced revision, daily planning and interview drills into one calm preparation system.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/optional-selector" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#f97316] px-6 text-sm font-bold text-white hover:bg-[#ea580c]">
              Start Free <ArrowRight className="ml-2" size={18} />
            </Link>
            <Link href="/dashboard" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/60 px-6 text-sm font-bold text-white hover:bg-white/10">
              View Product Demo
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur">
          <div className="rounded-xl bg-[#0f172a] p-4 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-orange-300">Rank cockpit</p>
                <h2 className="mt-1 text-xl font-black">Aspirant dashboard</h2>
              </div>
              <div className="rounded-full bg-green-500/15 px-3 py-1 text-xs font-bold text-green-300">14-day streak</div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {previewCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                    <Icon className="text-orange-300" size={20} />
                    <p className="mt-4 text-xs uppercase tracking-[0.14em] text-slate-400">{card.label}</p>
                    <p className="mt-1 text-2xl font-black">{card.value}</p>
                    <p className="mt-1 text-xs text-slate-400">{card.helper}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 rounded-xl bg-[#f97316] p-4 text-white">
              <p className="text-sm font-bold">Recovery Mode</p>
              <p className="mt-1 text-sm text-orange-50">You are 3 tasks behind. Compress low-weightage topics and protect mock-test Sunday.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
