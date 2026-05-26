"use client";

import { useMemo, useState } from "react";

interface ConciseNote {
  term: string;
  definition: string;
}

interface QuickRecallProps {
  topicKey: string;
  conciseNotes: ConciseNote[];
}

type Rating = "got-it" | "fuzzy" | "no-idea";

function saveGuestFlashcard(topicKey: string, note: ConciseNote, rating: Rating) {
  try {
    const current = JSON.parse(window.localStorage.getItem("clearupsc_guest_flashcards") || "[]");
    const exists = Array.isArray(current)
      ? current.some((item) => item?.topic_key === topicKey && item?.question === note.term)
      : false;
    if (exists) return;
    const next = [
      {
        id: `guest-recall-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        topic_key: topicKey,
        question: note.term,
        answer: note.definition,
        source: "quick_recall",
        rating,
        created_at: new Date().toISOString(),
      },
      ...(Array.isArray(current) ? current : []),
    ];
    window.localStorage.setItem("clearupsc_guest_flashcards", JSON.stringify(next));
  } catch {
    // Guest recall should remain usable even when storage is unavailable.
  }
}

async function syncFlashcard(topicKey: string, note: ConciseNote) {
  await fetch(`/api/study/topic/${topicKey}/flashcard`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: note.term, answer: note.definition }),
  });
}

export default function QuickRecall({ topicKey, conciseNotes }: QuickRecallProps) {
  const notes = useMemo(
    () =>
      conciseNotes
        .filter((note) => note.term?.trim() && note.definition?.trim())
        .slice(0, 12),
    [conciseNotes],
  );
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [recalled, setRecalled] = useState(0);
  const [fuzzyTerms, setFuzzyTerms] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const current = notes[index];
  const complete = notes.length > 0 && index >= notes.length;

  const advance = () => {
    setRevealed(false);
    setIndex((value) => value + 1);
  };

  const rate = async (rating: Rating) => {
    if (!current || saving) return;
    if (rating === "got-it") {
      setRecalled((value) => value + 1);
      advance();
      return;
    }

    setSaving(true);
    saveGuestFlashcard(topicKey, current, rating);
    setFuzzyTerms((terms) => (terms.includes(current.term) ? terms : [...terms, current.term]));
    try {
      await syncFlashcard(topicKey, current);
    } catch {
      // The guest copy is already saved locally; cloud sync can happen after sign-in.
    } finally {
      setSaving(false);
      advance();
    }
  };

  if (!notes.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm font-bold text-slate-600 shadow-sm">
        Quick Recall will appear once this topic has concise terms.
      </div>
    );
  }

  if (complete) {
    return (
      <div className="rounded-3xl border border-green-200 bg-white p-5 shadow-sm sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">Recall complete</p>
        <h3 className="mt-2 text-3xl font-black text-[#1a2744]">
          {recalled}/{notes.length} recalled
        </h3>
        <p className="mt-3 text-sm font-bold leading-6 text-slate-600">
          {fuzzyTerms.length
            ? "Your fuzzy terms were added to revision."
            : "Clean round. Nothing new was added to revision."}
        </p>
        {fuzzyTerms.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {fuzzyTerms.map((term) => (
              <span key={term} className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-800">
                {term}
              </span>
            ))}
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setIndex(0);
            setRevealed(false);
            setRecalled(0);
            setFuzzyTerms([]);
          }}
          className="mt-5 min-h-11 rounded-full border border-slate-200 px-5 text-sm font-black text-[#1a2744]"
        >
          Run Recall Again
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
          Term {index + 1} of {notes.length}
        </p>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
          {recalled}/{index} clean so far
        </span>
      </div>

      <h3 className="mt-6 text-2xl font-black leading-tight text-white sm:text-3xl">
        <span className="inline-block rounded-3xl bg-[#0f172a] px-5 py-4">{current.term}</span>
      </h3>

      <div className="mt-5 min-h-32 rounded-3xl border border-slate-200 bg-[#111827] p-5 text-white shadow-inner">
        {revealed ? (
          <p className="text-base font-bold leading-8">{current.definition}</p>
        ) : (
          <div className="grid min-h-24 place-items-center text-center text-sm font-black uppercase tracking-[0.16em] text-slate-400">
            Definition hidden
          </div>
        )}
      </div>

      {!revealed ? (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="mt-5 min-h-12 w-full rounded-full bg-[#f97316] px-5 text-sm font-black text-white shadow-sm transition hover:bg-orange-600"
        >
          Reveal Definition
        </button>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => rate("got-it")}
            disabled={saving}
            className="min-h-12 rounded-2xl bg-green-600 px-4 text-sm font-black text-white transition hover:bg-green-700 disabled:opacity-60"
          >
            Got it ✓
          </button>
          <button
            type="button"
            onClick={() => rate("fuzzy")}
            disabled={saving}
            className="min-h-12 rounded-2xl bg-orange-500 px-4 text-sm font-black text-white transition hover:bg-orange-600 disabled:opacity-60"
          >
            Fuzzy
          </button>
          <button
            type="button"
            onClick={() => rate("no-idea")}
            disabled={saving}
            className="min-h-12 rounded-2xl bg-red-600 px-4 text-sm font-black text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            No idea
          </button>
        </div>
      )}
    </div>
  );
}
