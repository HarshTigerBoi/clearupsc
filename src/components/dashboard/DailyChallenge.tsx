"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Flame, Trophy, XCircle } from "lucide-react";
import { addGuestXp } from "@/lib/gamification/xp";
import type { PYQQuestion } from "@/types";

type ChallengeResponse = {
  date: string;
  question: PYQQuestion;
  answered?: boolean;
  selectedOption?: string | null;
  isCorrect?: boolean | null;
  streak?: number;
};

function todayKey() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

function readGuestDaily(date: string, questionId: string) {
  try {
    const raw = window.localStorage.getItem("clearupsc_guest_daily_challenge");
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.date === date && parsed?.questionId === questionId ? parsed : null;
  } catch {
    return null;
  }
}

function updateGuestStreak(date: string) {
  try {
    const raw = window.localStorage.getItem("clearupsc_guest_streak");
    const current = raw ? JSON.parse(raw) : {};
    if (current.lastDate === date) return Number(current.currentStreak ?? 1);

    const yesterday = new Date(`${date}T00:00:00+05:30`);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayText = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(yesterday);
    const next = current.lastDate === yesterdayText ? Number(current.currentStreak ?? 0) + 1 : 1;
    window.localStorage.setItem("clearupsc_guest_streak", JSON.stringify({ currentStreak: next, lastDate: date, freezesRemaining: current.freezesRemaining ?? 2 }));
    return next;
  } catch {
    return 1;
  }
}

export default function DailyChallenge() {
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<{ correct: boolean; correctOption: string; explanation: string; streak: number } | null>(null);

  const query = useQuery({
    queryKey: ["daily-challenge"],
    queryFn: async () => {
      const response = await fetch("/api/daily-challenge");
      if (!response.ok) throw new Error("Daily challenge unavailable");
      return (await response.json()) as ChallengeResponse;
    },
  });

  const guestAttempt = useMemo(() => {
    if (typeof window === "undefined" || !query.data?.question) return null;
    return readGuestDaily(query.data.date, query.data.question.id);
  }, [query.data]);

  const question = query.data?.question;
  const alreadyAnswered = Boolean(query.data?.answered || guestAttempt || result);
  const chosen = result ? selected : query.data?.selectedOption ?? guestAttempt?.selectedOption ?? selected;
  const wasCorrect = result?.correct ?? query.data?.isCorrect ?? guestAttempt?.correct ?? null;
  const streak = result?.streak ?? query.data?.streak ?? guestAttempt?.streak ?? 0;

  async function answer(label: string) {
    if (!question || alreadyAnswered) return;
    setSelected(label);

    const guestCorrect = question.correct === label;
    try {
      const response = await fetch("/api/daily-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id, selectedOption: label }),
      });
      const data = await response.json();
      if (response.ok && !data.guest) {
        setResult({ correct: data.correct, correctOption: data.correctOption, explanation: data.explanation, streak: data.streak ?? streak });
        return;
      }
    } catch {
      // Guests and offline browser sessions still get the local habit loop.
    }

    const nextStreak = updateGuestStreak(query.data?.date ?? todayKey());
    addGuestXp("daily_challenge");
    try {
      window.localStorage.setItem(
        "clearupsc_guest_daily_challenge",
        JSON.stringify({ date: query.data?.date ?? todayKey(), questionId: question.id, selectedOption: label, correct: guestCorrect, streak: nextStreak }),
      );
    } catch {
      // localStorage is motivational, not blocking.
    }
    setResult({ correct: guestCorrect, correctOption: question.correct, explanation: question.explanation, streak: nextStreak });
  }

  if (query.isLoading) {
    return <section className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-5 text-sm font-bold text-orange-800">Loading today&apos;s challenge...</section>;
  }

  if (!question) return null;

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-orange-200 bg-[#111111] p-5 text-white shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#f97316]/15 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-[#fb923c]">
          <Trophy className="h-4 w-4" /> Today&apos;s Challenge
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-black text-white">
          <Flame className="h-4 w-4 text-[#f97316]" /> {streak} day streak
        </span>
      </div>

      <p className="mt-5 text-lg font-black leading-7 text-white">{question.question}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {question.options.map((option) => {
          const isChosen = chosen === option.label;
          const isCorrectOption = question.correct === option.label;
          const stateClass = alreadyAnswered
            ? isCorrectOption
              ? "border-green-500 bg-green-500/15 text-green-100"
              : isChosen
                ? "border-red-500 bg-red-500/15 text-red-100"
                : "border-white/10 bg-white/5 text-zinc-300"
            : "border-white/10 bg-white/5 text-zinc-100 hover:border-[#f97316] hover:bg-[#f97316]/10";
          return (
            <button
              key={option.label}
              type="button"
              onClick={() => answer(option.label)}
              disabled={alreadyAnswered}
              className={`min-h-14 rounded-xl border px-4 py-3 text-left text-sm font-bold transition ${stateClass}`}
            >
              {option.label}. {option.text}
            </button>
          );
        })}
      </div>

      {alreadyAnswered ? (
        <div className={`mt-4 rounded-2xl border p-4 text-sm leading-6 ${wasCorrect ? "border-green-500/40 bg-green-500/10 text-green-100" : "border-red-500/40 bg-red-500/10 text-red-100"}`}>
          <p className="flex items-center gap-2 font-black">
            {wasCorrect ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            {wasCorrect ? "Correct. +20 XP" : `Not quite. Correct answer: ${question.correct}`}
          </p>
          <p className="mt-2 text-zinc-200">{result?.explanation ?? question.explanation}</p>
        </div>
      ) : null}
    </section>
  );
}

