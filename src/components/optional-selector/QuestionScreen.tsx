"use client";

import type { SelectorQuestion } from "@/lib/optional-selector/questions";
import type { UserAnswers } from "@/types";
import { Progress } from "@/components/ui/progress";

export function QuestionScreen({
  question,
  currentStep,
  answers,
  onAnswer,
  onBack,
}: {
  question: SelectorQuestion;
  currentStep: number;
  answers: UserAnswers;
  onAnswer: (value: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <Progress value={((currentStep + 1) / 6) * 100} />
      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#f97316] sm:text-sm sm:tracking-[0.16em]">Question {currentStep + 1} of 6</p>
        {currentStep > 0 ? (
          <button className="min-h-11 px-2 text-sm font-semibold text-[#64748b] hover:text-[#1a2744]" onClick={onBack}>
            Back
          </button>
        ) : null}
      </div>
      <h1 className="mt-4 text-3xl font-extrabold text-[#1a2744]">{question.question}</h1>
      <div className="mt-8 grid gap-4">
        {question.options.map((option) => {
          const selected = answers[question.key] === option.value;
          return (
            <button
              key={option.value}
              className={`min-h-16 w-full rounded-xl border p-5 text-left text-base shadow-sm transition hover:border-[#f97316] hover:bg-orange-50 ${
                selected ? "border-[#f97316] bg-orange-50" : "border-[#e2e8f0] bg-white"
              }`}
              onClick={() => onAnswer(option.value)}
            >
              <span className="block font-bold text-[#1a2744]">{option.label}</span>
              <span className="mt-1 block text-sm leading-6 text-[#64748b]">{option.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
