"use client";

import { useEffect, useState } from "react";
import { Clock, Loader2 } from "lucide-react";
import ProductShell from "@/components/product/ProductShell";
import { Button } from "@/components/ui/button";
import type { MockResult, PYQQuestion } from "@/types";

type PublicQuestion = Omit<PYQQuestion, "correct" | "explanation">;

export default function ActiveMockPage({ params }: { params: { id: string } }) {
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, "A" | "B" | "C" | "D">>({});
  const [result, setResult] = useState<MockResult | null>(null);
  const [attemptId, setAttemptId] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/mock-tests/${params.id}/start`, { method: "POST" })
      .then((response) => response.json())
      .then((data: { questions?: PublicQuestion[]; attemptId?: string; error?: string }) => {
        if (cancelled) return;
        if (data.error) setError(data.error);
        setQuestions(data.questions ?? []);
        setAttemptId(data.attemptId ?? "");
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not start this mock test.");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  useEffect(() => {
    if (!questions.length || result || paused) return;
    const interval = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [questions.length, result, paused]);

  async function submit() {
    setError("");
    const response = await fetch(`/api/mock-tests/${params.id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers, attemptId, timeTakenMinutes: Math.ceil(seconds / 60) }),
    });
    const data = (await response.json()) as { result?: MockResult; error?: string };
    if (data.error) setError(data.error);
    if (data.result) setResult(data.result);
  }

  return (
    <ProductShell>
      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#f97316]">Active mock</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-bold text-slate-500">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
              <Clock className="h-4 w-4" /> {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
            </span>
            <span>{Object.keys(answers).length} of {questions.length} attempted</span>
            <button onClick={() => setPaused((value) => !value)} className="min-h-9 rounded-full bg-slate-100 px-3 text-xs font-black text-[#1a2744]">
              {paused ? "Resume" : "Pause"}
            </button>
          </div>

          {error ? <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p> : null}

          {result ? (
            <div className="mt-5">
              <h1 className="text-4xl font-black text-[#1a2744]">{result.score} marks</h1>
              <p className="mt-2 text-sm text-slate-500">{result.correct} correct · {result.wrong} wrong · {result.unattempted} unattempted</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {result.subjectBreakdown.map((item) => (
                  <div key={item.subject} className="rounded-2xl bg-slate-50 p-4">
                    <p className="font-black text-[#1a2744]">{item.subject}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.correct}/{item.total} correct</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {result.weakAreas.map((area) => <span key={area} className="rounded-full bg-red-50 px-3 py-1 text-sm font-bold text-red-700">{area}</span>)}
              </div>
              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <p className="font-black text-[#1a2744]">Review method</p>
                <p className="mt-1 text-sm text-slate-600">Re-attempt wrong subjects first, then open the related syllabus topic and add one flashcard for every repeated fact you missed.</p>
              </div>
            </div>
          ) : loading ? (
            <div className="mt-8 flex items-center gap-3 text-sm font-bold text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading secure mock attempt...
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              {questions.map((question, index) => (
                <div key={question.id} className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-black text-[#1a2744]">{index + 1}. {question.question}</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {question.options.map((option) => (
                      <button
                        key={option.label}
                        onClick={() => setAnswers({ ...answers, [question.id]: option.label })}
                        className={`rounded-xl border p-3 text-left text-sm ${answers[question.id] === option.label ? "border-[#f97316] bg-orange-50 font-black" : "border-slate-200 bg-white"}`}
                      >
                        {option.label}. {option.text}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <Button onClick={submit} disabled={!questions.length}>Submit mock</Button>
            </div>
          )}
        </div>
      </section>
    </ProductShell>
  );
}
