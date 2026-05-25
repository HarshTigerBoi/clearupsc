import { fail, ok } from "@/lib/api/response";
import { getDueFlashcards, ProductDataError, requireProductUser } from "@/lib/product/db";

export async function GET() {
  try {
    const { user } = await requireProductUser();
    const due = await getDueFlashcards(user.id);
    return ok({ due, count: due.length });
  } catch (error) {
    if (error instanceof ProductDataError && error.status === 401) {
      const due = guestFlashcards();
      return ok({ due, count: due.length, guest: true });
    }
    if (error instanceof ProductDataError) return fail(error.message, error.status);
    return fail("Could not load flashcards.", 500);
  }
}

function guestFlashcards() {
  const now = new Date().toISOString();
  return [
    { id: "guest-card-1", topicKey: "gs2_polity_constitution", topicTitle: "Constitution & Polity", question: "What is the basic structure doctrine?", answer: "Parliament can amend the Constitution, but cannot destroy its essential features such as democracy, rule of law, judicial review and federalism.", nextReviewAt: now, intervalDays: 0, easeFactor: 2.5, repetitions: 0 },
    { id: "guest-card-2", topicKey: "gs3_economy_inflation", topicTitle: "Inflation", question: "What is India's inflation target?", answer: "CPI inflation target is 4 percent with a tolerance band of plus/minus 2 percent, decided through the flexible inflation targeting framework.", nextReviewAt: now, intervalDays: 0, easeFactor: 2.5, repetitions: 0 },
    { id: "guest-card-3", topicKey: "gs1_history_modern", topicTitle: "Modern India", question: "Why was the Non-Cooperation Movement withdrawn?", answer: "Gandhi withdrew it after the Chauri Chaura violence in 1922 because he believed mass struggle required strict non-violence.", nextReviewAt: now, intervalDays: 0, easeFactor: 2.5, repetitions: 0 },
  ];
}
