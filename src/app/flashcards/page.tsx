"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import ProductShell from "@/components/product/ProductShell";
import { Button } from "@/components/ui/button";
import type { Flashcard } from "@/types";

const qualityLabels = [
  [0, "Forgot"],
  [3, "Hard"],
  [4, "Good"],
  [5, "Easy"],
] as const;

export default function FlashcardsPage() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);

  const cardsQuery = useQuery({
    queryKey: ["flashcards", "due"],
    queryFn: async () => {
      const response = await fetch("/api/flashcards/due");
      const data = (await response.json()) as { due: Flashcard[] };
      return data.due;
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, quality }: { id: string; quality: number }) => {
      const response = await fetch(`/api/flashcards/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quality }),
      });
      return response.json() as Promise<{ card: Flashcard & { lastQuality: number } }>;
    },
  });

  const cards = cardsQuery.data ?? [];
  const card = cards[index];

  const review = useCallback(async (quality: number) => {
    if (!card) return;
    await reviewMutation.mutateAsync({ id: card.id, quality });
    setDone((current) => current + 1);
    setIndex((current) => current + 1);
    setFlipped(false);
  }, [card, reviewMutation]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!card) return;
      if (event.key === " ") {
        event.preventDefault();
        setFlipped((current) => !current);
      }
      if (flipped && ["0", "3", "4", "5"].includes(event.key)) {
        event.preventDefault();
        review(Number(event.key));
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [card, flipped, review]);

  return (
    <ProductShell>
      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Spaced repetition"
          title="Revise before your brain drops the file."
          description="SM-2 recall ratings schedule each topic at the right forgetting point. Rate honestly; the queue adapts."
        />
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {cardsQuery.isError ? <p className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">Could not load flashcards.</p> : null}
          {card ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">{card.topicTitle}</span>
                <span className="text-sm font-bold text-slate-500">{done} of {cards.length} reviewed</span>
              </div>
              <button
                className="mt-5 min-h-72 w-full rounded-2xl bg-[#1a2744] p-6 text-left text-white transition hover:bg-[#24385f]"
                onClick={() => setFlipped((current) => !current)}
              >
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-orange-300">{flipped ? "Answer" : "Question"}</p>
                <p className="mt-5 text-2xl font-black leading-10">{flipped ? card.answer : card.question}</p>
                <p className="mt-8 text-sm text-slate-300">Tap card to {flipped ? "see question" : "flip"}.</p>
              </button>
              {flipped ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-4">
                  {qualityLabels.map(([score, label]) => (
                    <Button key={score} variant={score === 0 ? "outline" : "default"} onClick={() => review(score)}>
                      {score} · {label}
                    </Button>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <div className="rounded-2xl bg-green-50 p-6 text-center">
              <p className="text-2xl font-black text-green-800">Queue clear.</p>
              <p className="mt-2 text-sm text-green-700">You reviewed {done} cards today. Streak credit earned.</p>
            </div>
          )}
        </div>
      </section>
    </ProductShell>
  );
}
