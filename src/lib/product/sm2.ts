import type { Flashcard } from "@/types";

export function reviewFlashcard(card: Flashcard, quality: number) {
  const safeQuality = Math.min(5, Math.max(0, quality));
  let repetitions = card.repetitions;
  let intervalDays = card.intervalDays;
  let easeFactor = card.easeFactor;

  if (safeQuality >= 3) {
    if (repetitions === 0) intervalDays = 1;
    else if (repetitions === 1) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * easeFactor);

    repetitions += 1;
    easeFactor = easeFactor + (0.1 - (5 - safeQuality) * (0.08 + (5 - safeQuality) * 0.02));
    easeFactor = Math.max(1.3, Number(easeFactor.toFixed(2)));
  } else {
    repetitions = 0;
    intervalDays = 1;
  }

  const nextReviewAt = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000).toISOString();
  return { ...card, repetitions, intervalDays, easeFactor, nextReviewAt, lastQuality: safeQuality };
}
