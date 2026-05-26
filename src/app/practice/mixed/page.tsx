"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCcw, Target } from "lucide-react";
import ProductShell from "@/components/product/ProductShell";
import { awardClientXp } from "@/lib/gamification/xp";
import type { PYQQuestion } from "@/types";

type AnswerKey = "A" | "B" | "C" | "D";

const groups = ["GS1", "GS2", "GS3", "GS4", "CSAT"] as const;

function paperForSubject(subject: PYQQuestion["subject"], topicKey?: string | null) {
  const value = `${subject} ${topicKey ?? ""}`.toLowerCase();
  if (value.includes("csat")) return "CSAT";
  if (["gs4", "ethics"].some((item) => value.includes(item))) return "GS4";
  if (["gs3", "economy", "environment", "science", "security"].some((item) => value.includes(item))) return "GS3";
  if (["gs2", "polity", "governance"].some((item) => value.includes(item))) return "GS2";
  return "GS1";
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function saveGuestMistake(question: PYQQuestion, selectedOption: AnswerKey) {
  try {
    const current = JSON.parse(window.localStorage.getItem("clearupsc_guest_mistakes") || "[]");
    const selected = question.options.find((option) => option.label === selectedOption);
    const correct = question.options.find((option) => option.label === question.correct);
    const item = {
      id: `guest-mistake-${Date.now()}-${question.id}`,
      questionId: question.id,
      topicKey: question.topicKey,
      question: question.question,
      selectedOption,
      selectedText: selected?.text ?? "",
      correctOption: question.correct,
      correctText: correct?.text ?? "",
      explanation: question.explanation,
      source: question.sourceLabel ?? "ClearUPSC practice",
      attemptedAt: new Date().toISOString(),
    };
    window.localStorage.setItem("clearupsc_guest_mistakes", JSON.stringify([item, ...(Array.isArray(current) ? current : [])].slice(0, 100)));

    const flashcards = JSON.parse(window.localStorage.getItem("clearupsc_guest_flashcards") || "[]");
    window.localStorage.setItem(
      "clearupsc_guest_flashcards",
      JSON.stringify([
        {
          id: `guest-mistake-card-${Date.now()}`,
          topic_key: question.topicKey,
          question: `Why was this wrong? ${question.question}`,
          answer: question.explanation,
          source: "mixed_practice_mistake",
          created_at: new Date().toISOString(),
        },
        ...(Array.isArray(flashcards) ? flashcards : []),
      ]),
    );
  } catch {
    // Guest mistake capture is best-effort.
  }
}

export default function MixedPracticePage() {
  const [session, setSession] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerKey>>({});
  const [reported, setReported] = useState<Record<string, boolean>>({});
  const xpAwardedRef = useRef("");

  const questionsQuery = useQuery({
    queryKey: ["practice", "mixed", "pool"],
    queryFn: async () => {
      const response = await fetch("/api/practice/questions?limit=3000");
      if (!response.ok) throw new Error("Practice questions unavailable");
      return ((await response.json()) as { questions: PYQQuestion[] }).questions;
    },
  });

  const questions = useMemo(() => {
    void session;
    const pool = questionsQuery.data ?? [];
    const byPaper = new Map<string, PYQQuestion[]>();
    for (const question of pool) {
      const paper = paperForSubject(question.subject, question.topicKey);
      byPaper.set(paper, [...(byPaper.get(paper) ?? []), question]);
    }
    return shuffle(
      groups.flatMap((paper) =>
        shuffle(byPaper.get(paper) ?? [])
          .slice(0, 2)
          .map((question) => ({ ...question, subject: paper as PYQQuestion["subject"] })),
      ),
    );
  }, [questionsQuery.data, session]);

  const attempted = questions.filter((question) => answers[question.id]).length;
  const done = questions.length === 10 && attempted === questions.length;
  const correct = questions.filter((question) => answers[question.id] === question.correct).length;
  const subjectScores = groups.map((paper) => {
    const rows = questions.filter((question) => question.subject === paper);
    const score = rows.filter((question) => answers[question.id] === question.correct).length;
    return { subject: paper, correct: score, total: rows.length, percent: rows.length ? Math.round((score / rows.length) * 100) : 0 };
  });
  const weakest = [...subjectScores].filter((item) => item.total > 0).sort((a, b) => a.percent - b.percent)[0];

  if (done && xpAwardedRef.current !== `${session}:${correct}`) {
    xpAwardedRef.current = `${session}:${correct}`;
    void awardClientXp("mixed_practice_complete");
  }

  async function choose(question: PYQQuestion, selectedOption: AnswerKey) {
    if (answers[question.id]) return;
    setAnswers((current) => ({ ...current, [question.id]: selectedOption }));
    if (selectedOption === question.correct || reported[question.id]) return;
    setReported((current) => ({ ...current, [question.id]: true }));
    saveGuestMistake(question, selectedOption);
    await fetch("/api/mistakes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionId: question.id,
        selectedOption,
        correctOption: question.correct,
        isCorrect: false,
        topicKey: question.topicKey,
        question: question.question,
        explanation: question.explanation,
      }),
    }).catch(() => {});
  }

  return (
    <ProductShell>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-3xl bg-[#0a0a0a] p-5 text-white shadow-sm sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#f97316]">Interleaving</p>
          <h1 className="mt-3 text-3xl font-black sm:text-5xl">Mixed Practice</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300">10 questions, 5 papers, instant repair. This is closer to how UPSC actually tests your brain.</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-black">
            <span className="rounded-full bg-white/10 px-3 py-1">{attempted}/10 attempted</span>
            <span className="rounded-full bg-white/10 px-3 py-1">{correct} correct</span>
          </div>
        </section>

        {questionsQuery.isLoading ? <div className="mt-6 rounded-3xl bg-white p-6 font-bold text-slate-600">Loading mixed practice...</div> : null}
        {questionsQuery.isError ? <div className="mt-6 rounded-3xl bg-red-50 p-6 font-bold text-red-700">Could not load mixed practice.</div> : null}

        {done ? (
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-start gap-3">
              <Target className="mt-1 h-7 w-7 text-[#f97316]" />
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-[#f97316]">End screen</p>
                <h2 className="mt-2 text-3xl font-black text-[#1a2744]">{correct}/10 correct</h2>
                <p className="mt-2 text-sm font-bold text-slate-500">Weakest subject: {weakest?.subject ?? "None yet"}</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-5">
              {subjectScores.map((item) => (
                <div key={item.subject} className={`rounded-2xl p-4 ${item.subject === weakest?.subject ? "bg-red-50 text-red-800" : "bg-slate-50 text-slate-700"}`}>
                  <p className="font-black">{item.subject}</p>
                  <p className="mt-1 text-sm font-bold">{item.correct}/{item.total}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setAnswers({});
                  setReported({});
                  setSession((value) => value + 1);
                }}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#1a2744] px-5 text-sm font-black text-white"
              >
                <RefreshCcw className="h-4 w-4" /> Practice Again
              </button>
              <Link href={`/study?search=${encodeURIComponent(weakest?.subject ?? "GS")}`} className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#f97316] px-5 text-sm font-black text-white">
                Study Weakest →
              </Link>
            </div>
          </section>
        ) : null}

        <div className="mt-6 space-y-5">
          {questions.map((question, index) => {
            const selected = answers[question.id];
            return (
              <article key={question.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">Question {index + 1}</span>
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-800">{question.subject}</span>
                  {question.topicKey ? <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-black text-indigo-700">{question.topicKey.replaceAll("_", " ")}</span> : null}
                </div>
                <h2 className="mt-4 text-lg font-black leading-7 text-[#1a2744]">{question.question}</h2>
                <div className="mt-4 grid gap-2">
                  {question.options.map((option) => {
                    const showCorrect = selected && option.label === question.correct;
                    const showWrong = selected === option.label && option.label !== question.correct;
                    return (
                      <button
                        key={`${question.id}-${option.label}`}
                        type="button"
                        disabled={Boolean(selected)}
                        onClick={() => choose(question, option.label)}
                        className={`min-h-14 w-full rounded-2xl border px-4 py-3 text-left text-sm font-bold leading-6 transition ${
                          showCorrect
                            ? "animate-correct-pulse border-green-300 bg-green-50 text-green-800"
                            : showWrong
                              ? "animate-wrong-shake border-red-300 bg-red-50 text-red-800"
                              : selected === option.label
                                ? "border-[#f97316] bg-orange-50 text-orange-800"
                                : "border-slate-200 bg-slate-50 text-slate-700 hover:border-[#f97316]"
                        }`}
                      >
                        {option.label}. {option.text}
                      </button>
                    );
                  })}
                </div>
                {selected ? (
                  <div className={`mt-4 rounded-2xl p-4 text-sm font-bold leading-6 ${selected === question.correct ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                    {selected === question.correct ? "Correct." : `Not quite. Correct answer: ${question.correct}.`} {question.explanation}
                    {question.topicKey ? <Link href={`/study/${question.topicKey}`} className="ml-2 underline">Review topic</Link> : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </main>
    </ProductShell>
  );
}
