"use client";

import { useEffect, useMemo, useState } from "react";
import { QuestionCard } from "@/components/practice/QuestionCard";
import { ScoreScreen } from "@/components/practice/ScoreScreen";
import { SubjectFilter } from "@/components/practice/SubjectFilter";
import { ProgressBar } from "@/components/tracker/ProgressBar";
import { Button } from "@/components/ui/button";
import { PYQS } from "@/data/pyqs";
import type { PYQQuestion } from "@/types";

function shuffleQuestions(items: PYQQuestion[]) {
  return [...items].sort(() => Math.random() - 0.5).slice(0, 10);
}

export default function PracticePage() {
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [questions, setQuestions] = useState<PYQQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [quizComplete, setQuizComplete] = useState(false);
  const [questionPool, setQuestionPool] = useState<PYQQuestion[]>(PYQS);

  const availableCount = useMemo(() => {
    return selectedSubject === "All"
      ? questionPool.length
      : questionPool.filter((item) => item.subject === selectedSubject).length;
  }, [questionPool, selectedSubject]);

  function startRun(subject = selectedSubject) {
    const pool = subject === "All" ? questionPool : questionPool.filter((item) => item.subject === subject);
    setQuestions(shuffleQuestions(pool));
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setAnswers({});
    setQuizComplete(false);
  }

  useEffect(() => {
    startRun(selectedSubject);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionPool, selectedSubject]);

  useEffect(() => {
    let cancelled = false;

    async function loadQuestions() {
      try {
        const response = await fetch("/api/practice/questions");
        if (!response.ok) return;
        const payload = (await response.json()) as { questions?: PYQQuestion[] };
        if (!cancelled && payload.questions?.length) setQuestionPool(payload.questions);
      } catch {
        // The bundled pattern set remains available if Supabase is unreachable.
      }
    }

    loadQuestions();
    return () => {
      cancelled = true;
    };
  }, []);

  function selectAnswer(answer: string) {
    if (showResult) return;
    const question = questions[currentIndex];
    setSelectedAnswer(answer);
    setShowResult(true);
    setAnswers((current) => ({ ...current, [question.id]: answer }));
    if (answer === question.correct) setScore((current) => current + 1);
  }

  function nextQuestion() {
    if (currentIndex === 9) {
      setQuizComplete(true);
      return;
    }
    setCurrentIndex((current) => current + 1);
    setSelectedAnswer(null);
    setShowResult(false);
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="bg-[#f8fafc]">
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-xl bg-[#1a2744] p-6 text-white sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-orange-300">UPSC-pattern Practice</p>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">10-question sprint. Honest source labels.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
            Pick a subject, answer UPSC-style MCQs, and read the explanation immediately. Official UPSC questions are shown only when imported from UPSC papers; the rest are clearly marked as ClearUPSC pattern practice.
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-[#1a2744]">Choose subject</p>
              <p className="mt-1 text-sm text-[#64748b]">{availableCount} questions available in this pool</p>
            </div>
            <Button variant="outline" onClick={() => startRun()}>
              Restart Run
            </Button>
          </div>
          <div className="mt-4">
            <SubjectFilter selectedSubject={selectedSubject} onSelect={setSelectedSubject} />
          </div>
        </div>

        {quizComplete ? (
          <div className="mt-6">
            <ScoreScreen
              score={score}
              questions={questions}
              answers={answers}
              onRetry={() => startRun()}
              onChangeSubject={() => {
                setSelectedSubject("All");
                startRun("All");
              }}
            />
          </div>
        ) : currentQuestion ? (
          <div className="mt-6">
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between text-sm font-bold text-[#1a2744]">
                <span>Run progress</span>
                <span>{Math.round(((currentIndex + (showResult ? 1 : 0)) / 10) * 100)}%</span>
              </div>
              <ProgressBar value={((currentIndex + (showResult ? 1 : 0)) / 10) * 100} />
            </div>
            <QuestionCard
              question={currentQuestion}
              currentIndex={currentIndex}
              selectedAnswer={selectedAnswer}
              showResult={showResult}
              onAnswer={selectAnswer}
              onNext={nextQuestion}
            />
          </div>
        ) : (
          <p className="mt-6 rounded-xl border border-[#e2e8f0] bg-white p-6 text-[#64748b]">Loading questions...</p>
        )}
      </section>
    </div>
  );
}
