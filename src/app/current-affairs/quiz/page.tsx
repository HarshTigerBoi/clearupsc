"use client";

import { useEffect, useState } from "react";
import ProductShell from "@/components/product/ProductShell";
import { PageHeader } from "@/components/layout/PageHeader";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export default function CurrentAffairsQuizPage() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  useEffect(() => {
    fetch("/api/current-affairs/quiz")
      .then((response) => response.json())
      .then((data: { questions?: QuizQuestion[] }) => setQuestions(data.questions ?? []))
      .catch(() => setQuestions([]));
  }, []);
  const score = questions.filter((question) => answers[question.id] === question.correctIndex).length;

  return (
    <ProductShell>
      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader eyebrow="Current Affairs Quiz" title="Recall the last seven days." description="Turn daily current affairs into active recall instead of passive reading." />
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-black text-[#1a2744]">Score: {score}/{questions.length}</p>
          <div className="mt-5 space-y-5">
            {questions.map((question, index) => (
              <div key={question.id} className="rounded-2xl bg-slate-50 p-4">
                <p className="font-black text-[#1a2744]">{index + 1}. {question.question}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {question.options.map((option, optionIndex) => {
                    const picked = answers[question.id];
                    const correct = picked !== undefined && optionIndex === question.correctIndex;
                    const wrong = picked === optionIndex && !correct;
                    return (
                      <button key={option} onClick={() => setAnswers({ ...answers, [question.id]: optionIndex })} className={`min-h-11 rounded-xl border p-3 text-left text-sm font-bold ${correct ? "border-green-300 bg-green-50 text-green-700" : wrong ? "border-red-300 bg-red-50 text-red-700" : "border-slate-200 bg-white text-slate-700"}`}>
                        {option}
                      </button>
                    );
                  })}
                </div>
                {answers[question.id] !== undefined ? <p className="mt-3 text-sm text-slate-600">{question.explanation}</p> : null}
              </div>
            ))}
          </div>
        </div>
      </section>
    </ProductShell>
  );
}
