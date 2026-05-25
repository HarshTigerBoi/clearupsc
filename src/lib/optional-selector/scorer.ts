import type { OptionalResult, UserAnswers } from "@/types";
import { COMPATIBILITY_MATRIX, OPTIONAL_META } from "./matrix";

export function scoreOptionals(answers: UserAnswers): OptionalResult[] {
  const results: OptionalResult[] = [];

  for (const [subject, questionScores] of Object.entries(COMPATIBILITY_MATRIX)) {
    let totalScore = 0;
    let maxPossible = 0;

    for (const [questionKey, answerScores] of Object.entries(questionScores)) {
      const userAnswer = answers[questionKey as keyof UserAnswers];
      const score = userAnswer ? answerScores[userAnswer] ?? 0 : 0;
      const maxForQuestion = Math.max(...Object.values(answerScores));
      totalScore += score;
      maxPossible += maxForQuestion;
    }

    const normalisedScore = Math.round((totalScore / maxPossible) * 100);
    const meta = OPTIONAL_META[subject];

    results.push({
      subject,
      score: normalisedScore,
      gsOverlap: meta.gsOverlap,
      avgScoreRange: meta.avgScoreRange,
      reasoning: meta.reasoning,
    });
  }

  return results.sort((a, b) => b.score - a.score);
}
