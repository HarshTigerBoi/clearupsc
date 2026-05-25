"use client";

import { Button } from "@/components/ui/button";
import type { PYQQuestion } from "@/types";

export function ScoreScreen({
  score,
  questions,
  answers,
  onRetry,
  onChangeSubject,
}: {
  score: number;
  questions: PYQQuestion[];
  answers: Record<string, string>;
  onRetry: () => void;
  onChangeSubject: () => void;
}) {
  const message =
    score >= 8
      ? "Excellent! You're on track."
      : score >= 5
        ? "Good effort. Keep revising."
        : "Keep going - consistency beats talent.";

  const breakdown = questions.reduce<Record<string, { total: number; correct: number }>>((acc, question) => {
    const item = acc[question.subject] ?? { total: 0, correct: 0 };
    item.total += 1;
    if (answers[question.id] === question.correct) item.correct += 1;
    acc[question.subject] = item;
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-3xl rounded-xl border border-[#e2e8f0] bg-white p-6 text-center shadow-sm sm:p-8">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#f97316]">Practice Complete</p>
      <h1 className="mt-4 text-5xl font-black text-[#1a2744]">{score} / 10</h1>
      <p className="mt-4 text-lg font-bold text-slate-800">{message}</p>

      <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
        {Object.entries(breakdown).map(([subject, item]) => (
          <div key={subject} className="rounded-xl bg-[#f8fafc] p-4">
            <p className="font-bold text-[#1a2744]">{subject}</p>
            <p className="mt-1 text-sm text-[#64748b]">
              {item.correct}/{item.total} {item.correct === item.total ? "strong" : "needs revision"}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button onClick={onRetry}>Try Again</Button>
        <Button variant="outline" onClick={onChangeSubject}>Try Another Subject</Button>
      </div>
    </div>
  );
}
