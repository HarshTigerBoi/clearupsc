export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;

export interface ReviewSchedule {
  interval: number;
  easeFactor: number;
  nextReviewAt: string;
}

function clampQuality(quality: number): ReviewQuality {
  return Math.max(0, Math.min(5, Math.round(quality))) as ReviewQuality;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function qualityFromScore(score: number): ReviewQuality {
  if (score >= 100) return 5;
  if (score >= 80) return 4;
  if (score >= 60) return 3;
  if (score >= 40) return 2;
  if (score >= 20) return 1;
  return 0;
}

export function calculateNextReview(
  qualityInput: ReviewQuality,
  currentInterval: number,
  easeFactorInput: number,
  fromDate = new Date(),
): ReviewSchedule {
  const quality = clampQuality(qualityInput);
  const safeInterval = Math.max(0, Math.round(currentInterval || 0));
  const safeEaseFactor = Math.max(1.3, Number.isFinite(easeFactorInput) ? easeFactorInput : 2.5);
  const qualityGap = 5 - quality;

  let interval: number;
  let easeFactor = safeEaseFactor + 0.1 - qualityGap * (0.08 + qualityGap * 0.02);

  if (quality <= 2) {
    interval = 1;
    easeFactor = safeEaseFactor - 0.2;
  } else if (safeInterval === 0) {
    interval = 1;
  } else if (safeInterval === 1) {
    interval = 6;
  } else {
    interval = Math.round(safeInterval * safeEaseFactor);
  }

  const finalEaseFactor = Math.max(1.3, Number(easeFactor.toFixed(2)));

  return {
    interval,
    easeFactor: finalEaseFactor,
    nextReviewAt: addDays(fromDate, interval).toISOString().slice(0, 10),
  };
}
