"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PYQQuestion } from "@/types";

export function QuestionCard({
  question,
  currentIndex,
  selectedAnswer,
  showResult,
  onAnswer,
  onNext,
}: {
  question: PYQQuestion;
  currentIndex: number;
  selectedAnswer: string | null;
  showResult: boolean;
  onAnswer: (answer: string) => void;
  onNext: () => void;
}) {
  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge className="bg-orange-100 text-[#c2410c]">Q{currentIndex + 1} of 10</Badge>
        <Badge>{question.sourceType === "official_pyq" ? `UPSC ${question.year}` : "Pattern practice"}</Badge>
        <Badge className="bg-[#1a2744] text-white">{question.subject}</Badge>
        <Badge className="bg-slate-100 text-slate-700">{question.sourceLabel ?? "ClearUPSC original"}</Badge>
      </div>

      <h2 className="mt-5 text-xl font-extrabold leading-8 text-[#0f172a] sm:text-2xl">{question.question}</h2>

      <div className="mt-6 grid gap-3">
        {question.options.map((option) => {
          const isSelected = selectedAnswer === option.label;
          const isCorrect = option.label === question.correct;

          return (
            <button
              key={option.label}
              disabled={showResult}
              className={cn(
                "flex min-h-14 gap-3 rounded-xl border p-4 text-left text-sm font-semibold leading-6 transition sm:text-base",
                !showResult && "border-[#e2e8f0] bg-white hover:border-[#f97316] hover:bg-orange-50",
                showResult && isCorrect && "border-green-200 bg-green-50 text-green-800",
                showResult && isSelected && !isCorrect && "border-red-200 bg-red-50 text-red-700",
                showResult && !isSelected && !isCorrect && "border-[#e2e8f0] bg-slate-50 text-slate-500",
              )}
              onClick={() => onAnswer(option.label)}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1a2744] text-sm font-black text-white">
                {option.label}
              </span>
              <span>{option.text}</span>
            </button>
          );
        })}
      </div>

      {showResult ? (
        <div
          className={cn(
            "mt-5 rounded-xl border p-4",
            selectedAnswer === question.correct ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50",
          )}
        >
          <p className={cn("font-bold", selectedAnswer === question.correct ? "text-green-800" : "text-red-700")}>
            {selectedAnswer === question.correct ? "Correct." : `Wrong. Correct answer is ${question.correct}.`}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">{question.explanation}</p>
          <Button className="mt-4 w-full sm:w-auto" onClick={onNext}>
            {currentIndex === 9 ? "See Score" : "Next Question"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
