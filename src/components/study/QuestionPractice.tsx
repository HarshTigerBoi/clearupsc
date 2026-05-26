"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Target, Trophy } from "lucide-react";
import { addGuestXp } from "@/lib/gamification/xp";
import { calculateNextReview, qualityFromScore } from "@/lib/study/spaced-repetition";

interface QuizQuestion {
  id: string;
  source: string;
  year: number | null;
  question: string;
  options: Array<{ label: string; text: string }>;
  correct: string | null;
  explanation: string;
  reviewOnly: boolean;
  trapType?: string | null;
  relatedStudyUrl?: string | null;
}

interface ProgressShape {
  status: string;
  confidence_score: number;
  last_studied_at: string | null;
  next_review_at?: string | null;
  ease_factor?: number;
  review_interval_days?: number;
  review_count?: number;
}

function saveGuestProgress(topicId: string, patch: Record<string, unknown>) {
  try {
    const current = JSON.parse(window.localStorage.getItem("clearupsc_guest_topic_progress") || "{}");
    current[topicId] = {
      ...(current[topicId] ?? {}),
      ...patch,
      updated_at: new Date().toISOString(),
    };
    window.localStorage.setItem("clearupsc_guest_topic_progress", JSON.stringify(current));
  } catch {
    // Guest progress should never block practice.
  }
}

function readGuestProgress(topicId: string) {
  try {
    const current = JSON.parse(window.localStorage.getItem("clearupsc_guest_topic_progress") || "{}");
    return (current[topicId] ?? {}) as {
      next_review_at?: string | null;
      ease_factor?: number;
      review_interval_days?: number;
      review_count?: number;
    };
  } catch {
    return {};
  }
}

function saveGuestCollection(key: string, item: Record<string, unknown>) {
  try {
    const current = JSON.parse(window.localStorage.getItem(key) || "[]");
    window.localStorage.setItem(key, JSON.stringify([{ id: `guest-${Date.now()}`, created_at: new Date().toISOString(), ...item }, ...current]));
  } catch {
    // Keep guest actions non-blocking.
  }
}

export default function QuestionPractice({ topicId, questions, progress }: { topicId: string; questions: QuizQuestion[]; progress: ProgressShape | null }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const reportedScoreRef = useRef("");
  const reportedMistakesRef = useRef<Record<string, boolean>>({});
  const answerable = questions.filter((question) => !question.reviewOnly && question.correct);
  const attempted = answerable.filter((question) => answers[question.id]).length;
  const scoredAnswers = answerable
    .filter((question) => answers[question.id])
    .map((question) => ({ id: question.id, isCorrect: answers[question.id] === question.correct }));
  const correct = scoredAnswers.filter((answer) => answer.isCorrect).length;
  const mistakes = scoredAnswers.filter((answer) => !answer.isCorrect).length;
  const done = answerable.length > 0 && attempted === answerable.length;
  const score = answerable.length ? Math.round((correct / answerable.length) * 100) : 0;
  const chartData = [{ name: "Confidence", score }];

  useEffect(() => {
    if (!done) return;
    const signature = `${topicId}:${correct}:${mistakes}:${score}`;
    if (reportedScoreRef.current === signature) return;
    reportedScoreRef.current = signature;
    const guestProgress = readGuestProgress(topicId);
    const quality = qualityFromScore(score);
    const currentInterval = Number(progress?.review_interval_days ?? guestProgress.review_interval_days ?? 0);
    const easeFactor = Number(progress?.ease_factor ?? guestProgress.ease_factor ?? 2.5);
    const reviewCount = Number(progress?.review_count ?? guestProgress.review_count ?? 0);
    const review = calculateNextReview(quality, currentInterval, easeFactor);
    if (score >= 100) addGuestXp("prove_it_perfect");
    else if (score >= 60) addGuestXp("prove_it_solid");
    saveGuestProgress(topicId, {
      status: "in_progress",
      correct_count: correct,
      mistakes_count: mistakes,
      last_score: score,
      next_review_at: review.nextReviewAt,
      ease_factor: review.easeFactor,
      review_interval_days: review.interval,
      review_count: reviewCount + 1,
    });
    fetch(`/api/syllabus/${topicId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "in_progress",
        correct_count: correct,
        mistakes_count: mistakes,
        last_score: score,
        next_review_at: review.nextReviewAt,
        ease_factor: review.easeFactor,
        review_interval_days: review.interval,
        review_count: reviewCount + 1,
      }),
    }).catch(() => {
      reportedScoreRef.current = "";
    });
  }, [correct, done, mistakes, progress?.ease_factor, progress?.review_count, progress?.review_interval_days, score, topicId]);

  async function chooseAnswer(question: QuizQuestion, selectedOption: string) {
    if (answers[question.id]) return;
    setAnswers((current) => ({ ...current, [question.id]: selectedOption }));
    if (question.reviewOnly || !question.correct || selectedOption === question.correct || reportedMistakesRef.current[question.id]) return;
    reportedMistakesRef.current[question.id] = true;
    const selected = question.options.find((option) => option.label === selectedOption);
    const correctOption = question.options.find((option) => option.label === question.correct);
    saveGuestCollection("clearupsc_guest_mistakes", {
      questionId: question.id,
      topicKey: topicId,
      question: question.question,
      selectedOption,
      selectedText: selected?.text ?? "",
      correctOption: question.correct,
      correctText: correctOption?.text ?? "",
      explanation: question.explanation,
      source: question.source,
      attemptedAt: new Date().toISOString(),
    });
    saveGuestCollection("clearupsc_guest_flashcards", {
      topic_key: topicId,
      question: `Why was this wrong? ${question.question}`,
      answer: question.explanation,
      source: "prove_it_mistake",
    });
    await fetch("/api/mistakes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionId: question.id,
        selectedOption,
        correctOption: question.correct,
        isCorrect: false,
        topicKey: topicId,
        question: question.question,
        explanation: question.explanation,
      }),
    }).catch(() => {});
  }

  if (!questions.length) {
    return <div className="rounded-3xl bg-white p-6 text-sm text-slate-600 shadow-sm">Questions are being mapped for this topic.</div>;
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3 text-sm font-black text-[#1a2744]">
          <span>{correct} of {answerable.length} answered correctly</span>
          <span>{score}%</span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all" style={{ width: `${score}%` }} />
        </div>
      </div>

      {questions.map((question, index) => {
        const selected = answers[question.id];
        const isCorrect = selected && question.correct ? selected === question.correct : false;
        return (
          <div key={question.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">Question {index + 1}</span>
              {question.year && String(question.source).toLowerCase().includes("official") ? (
                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">UPSC official {question.year}</span>
              ) : null}
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-black text-indigo-700">{question.source}</span>
              {question.trapType ? <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">{question.trapType}</span> : null}
            </div>
            <h3 className="mt-4 text-lg font-black leading-7 text-[#1a2744]">{question.question}</h3>
            <div className="mt-4 grid gap-2">
              {question.options.map((option) => {
                const showCorrect = selected && question.correct === option.label;
                const showWrong = selected === option.label && question.correct !== option.label && !question.reviewOnly;
                return (
                  <button
                    key={`${question.id}-${option.label}`}
                    onClick={() => chooseAnswer(question, option.label)}
                    className={`min-h-14 w-full rounded-2xl border px-4 py-3 text-left text-sm font-bold leading-6 transition sm:text-base ${
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
              <div className={`mt-4 rounded-2xl p-4 text-sm leading-6 ${question.reviewOnly ? "bg-amber-50 text-amber-800" : isCorrect ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                <strong>{question.reviewOnly ? "Review-only official question." : isCorrect ? "Correct." : `Not quite. Correct answer: ${question.correct}.`}</strong> {question.explanation}
                {question.relatedStudyUrl ? (
                  <Link href={question.relatedStudyUrl} className="ml-2 font-black underline">
                    Review topic
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}

      {done ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            {score >= 80 ? <Trophy className="h-7 w-7 text-green-600" /> : <Target className="h-7 w-7 text-orange-600" />}
            <div>
              <h3 className="text-xl font-black text-[#1a2744]">Topic Confidence Score</h3>
              <p className="text-sm font-bold text-slate-500">{score >= 80 ? "You're ready to move to the next topic" : "Revise Step 4 once more"}</p>
            </div>
          </div>
          <div className="mt-5 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Bar dataKey="score" fill={score >= 80 ? "#16a34a" : "#f97316"} radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}
    </div>
  );
}
