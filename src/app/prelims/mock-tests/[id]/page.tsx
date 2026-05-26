"use client";

import Link from "next/link";
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
  const [repairSaving, setRepairSaving] = useState(false);
  const [repairMessage, setRepairMessage] = useState("");

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

  async function addRepairPlanToStudyPlan() {
    const topicKeys = result?.repairPlan?.subjects.flatMap((subject) => subject.topics.map((topic) => topic.key)) ?? [];
    if (!topicKeys.length) return;
    setRepairSaving(true);
    setRepairMessage("");
    try {
      const response = await fetch(`/api/mock-tests/${params.id}/repair-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicKeys }),
      });
      const data = (await response.json()) as { inserted?: number; guest?: boolean; error?: string };
      if (data.error) {
        setRepairMessage(data.error);
      } else if (data.guest) {
        window.localStorage.setItem("clearupsc_guest_mock_repair_plan", JSON.stringify({ topicKeys, savedAt: new Date().toISOString() }));
        setRepairMessage("Saved on this device. Sign in when you want cloud sync.");
      } else {
        setRepairMessage(`${data.inserted ?? topicKeys.length} repair tasks added for the next 3 days.`);
      }
    } catch {
      setRepairMessage("Could not add this repair plan right now.");
    } finally {
      setRepairSaving(false);
    }
  }

  return (
    <ProductShell>
      <section className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#f97316] sm:text-sm sm:tracking-[0.18em]">Active mock</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-bold text-slate-500">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
              <Clock className="h-4 w-4" /> {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
            </span>
            <span>{Object.keys(answers).length} of {questions.length} attempted</span>
            <button onClick={() => setPaused((value) => !value)} className="min-h-11 rounded-full bg-slate-100 px-4 text-xs font-black text-[#1a2744]">
              {paused ? "Resume" : "Pause"}
            </button>
          </div>

          {error ? <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p> : null}

          {result ? (
            <div className="mt-5">
              <h1 className="text-3xl font-black text-[#1a2744] sm:text-4xl">{result.score} marks</h1>
              <p className="mt-2 text-sm text-slate-500">{result.correct} correct · {result.wrong} wrong · {result.unattempted} unattempted</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {result.subjectBreakdown.map((item) => (
                  <div key={item.subject} className="min-w-0 rounded-2xl bg-slate-50 p-4">
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
              {result.repairPlan?.subjects.length ? (
                <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-orange-700">Your Repair Plan</p>
                      <h2 className="mt-2 text-2xl font-black text-[#1a2744]">Fix This Week</h2>
                      <p className="mt-1 text-sm leading-6 text-slate-700">These topics target the three weakest subjects from this mock and feed your plan automatically.</p>
                    </div>
                    <Button onClick={addRepairPlanToStudyPlan} disabled={repairSaving} className="min-h-12 w-full bg-[#f97316] text-white hover:bg-[#ea580c] sm:w-auto">
                      {repairSaving ? "Adding..." : "Add to My Plan"}
                    </Button>
                  </div>
                  {repairMessage ? <p className="mt-3 rounded-xl bg-white p-3 text-sm font-bold text-[#1a2744]">{repairMessage}</p> : null}
                  <div className="mt-4 space-y-4">
                    {result.repairPlan.subjects.map((subject) => (
                      <div key={subject.subject} className="rounded-2xl bg-white p-4">
                        <p className="font-black text-[#1a2744]">
                          {subject.subject} <span className="text-sm font-bold text-slate-500">- scored {subject.correct}/{subject.total} ({subject.scorePercent}%)</span>
                        </p>
                        <div className="mt-3 grid gap-2">
                          {subject.topics.map((topic) => (
                            <Link key={topic.key} href={topic.href} className="block min-h-12 rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold leading-6 text-[#1a2744] hover:border-[#f97316] hover:bg-orange-50">
                              {topic.title}
                              <span className="block text-xs font-semibold text-slate-500">{topic.reason}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : loading ? (
            <div className="mt-8 flex items-center gap-3 text-sm font-bold text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading secure mock attempt...
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              {questions.map((question, index) => (
                <div key={question.id} className="rounded-2xl bg-slate-50 p-4 sm:p-5">
                  <p className="break-words text-base font-black leading-7 text-[#1a2744]">{index + 1}. {question.question}</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {question.options.map((option) => (
                      <button
                        key={option.label}
                        onClick={() => setAnswers({ ...answers, [question.id]: option.label })}
                        className={`min-h-14 w-full rounded-xl border p-4 text-left text-sm leading-6 sm:text-base ${answers[question.id] === option.label ? "border-[#f97316] bg-orange-50 font-black" : "border-slate-200 bg-white"}`}
                      >
                        {option.label}. {option.text}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <Button onClick={submit} disabled={!questions.length} className="min-h-12 w-full sm:w-auto">Submit mock</Button>
            </div>
          )}
        </div>
      </section>
    </ProductShell>
  );
}
