"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OPTIONAL_QUESTIONS } from "@/lib/optional-selector/questions";
import { scoreOptionals } from "@/lib/optional-selector/scorer";
import type { OptionalResult, UserAnswers } from "@/types";
import { QuestionScreen } from "@/components/optional-selector/QuestionScreen";
import { ResultsScreen } from "@/components/optional-selector/ResultsScreen";

export default function OptionalSelectorPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<UserAnswers>({});
  const [results, setResults] = useState<OptionalResult[]>([]);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");

  function answer(value: string) {
    const question = OPTIONAL_QUESTIONS[currentStep];
    const nextAnswers = { ...answers, [question.key]: value };
    setAnswers(nextAnswers);

    if (currentStep === OPTIONAL_QUESTIONS.length - 1) {
      setResults(scoreOptionals(nextAnswers));
      setCurrentStep(6);
      return;
    }

    setCurrentStep((step) => step + 1);
  }

  function restart() {
    setAnswers({});
    setResults([]);
    setStartError("");
    setCurrentStep(0);
  }

  async function startPreparing() {
    const topOptional = results[0]?.subject;
    if (!topOptional) return;

    setStarting(true);
    setStartError("");
    window.localStorage.setItem("clearupsc_guest_optional_subject", topOptional);
    router.push("/onboarding?force=1");
  }

  return (
    <section className="min-h-screen bg-[#f8fafc] px-4 py-12 sm:px-6 lg:px-8">
      {currentStep < 6 ? (
        <QuestionScreen
          question={OPTIONAL_QUESTIONS[currentStep]}
          currentStep={currentStep}
          answers={answers}
          onAnswer={answer}
          onBack={() => setCurrentStep((step) => Math.max(0, step - 1))}
        />
      ) : (
        <ResultsScreen
          results={results}
          starting={starting}
          startError={startError}
          onStartPreparing={startPreparing}
          onRestart={restart}
        />
      )}
    </section>
  );
}
