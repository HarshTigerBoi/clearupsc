"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmailCapture } from "./EmailCapture";
import type { OptionalResult } from "@/types";

const medals = ["1", "2", "3"];

export function ResultsScreen({
  results,
  starting,
  startError,
  onStartPreparing,
  onRestart,
}: {
  results: OptionalResult[];
  starting: boolean;
  startError: string;
  onStartPreparing: () => void;
  onRestart: () => void;
}) {
  const topOptional = results[0]?.subject ?? "your top optional";

  return (
    <div className="mx-auto max-w-4xl">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#f97316]">Result</p>
      <h1 className="mt-3 text-3xl font-extrabold text-[#1a2744]">Your Top Optional Subjects</h1>
      <div className="mt-8 grid gap-4">
        {results.slice(0, 3).map((result, index) => (
          <div key={result.subject} className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-orange-100 text-sm font-black text-[#f97316]">{medals[index]}</span>
                  <h2 className="text-2xl font-extrabold text-[#1a2744]">{result.subject}</h2>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#64748b]">{result.reasoning}</p>
              </div>
              <Badge className={result.gsOverlap === "High" ? "bg-green-100 text-green-700" : result.gsOverlap === "Medium" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}>
                {result.gsOverlap} GS overlap
              </Badge>
            </div>
            <div className="mt-5">
              <div className="mb-2 flex justify-between text-sm font-semibold text-[#1a2744]">
                <span>Compatibility</span>
                <span>{result.score}%</span>
              </div>
              <Progress value={result.score} />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-700">Average score range: {result.avgScoreRange}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-2xl border border-orange-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-[#f97316]">Start Preparing with {topOptional}</p>
        <button
          type="button"
          disabled={starting}
          onClick={onStartPreparing}
          className="mt-4 flex min-h-14 w-full items-center justify-center rounded-xl bg-[#f97316] px-5 text-lg font-black text-white shadow-sm transition hover:bg-[#ea580c] disabled:opacity-60"
        >
          {starting ? "Saving..." : "Start My UPSC Journey →"}
        </button>
        <Link href="/dashboard" className="mt-4 block text-center text-sm font-black text-[#1a2744] hover:text-[#f97316]">
          Skip to Dashboard
        </Link>
        {startError ? <p className="mt-3 text-center text-sm font-semibold text-red-600">{startError}</p> : null}
      </div>
      <EmailCapture results={results} />
      <button className="mt-5 text-sm font-bold text-[#f97316]" onClick={onRestart}>Retake selector</button>
    </div>
  );
}
