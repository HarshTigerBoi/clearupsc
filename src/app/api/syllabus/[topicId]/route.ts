import { z } from "zod";
import { fail, ok } from "@/lib/api/response";
import { awardUserXp } from "@/lib/gamification/xp";
import { ProductDataError, requireProductUser, updateTopicProgress } from "@/lib/product/db";

const statusSchema = z.object({
  status: z.enum(["not_started", "in_progress", "completed", "needs_revision", "done"]),
  time_spent_seconds: z.number().int().min(0).optional(),
  correct_count: z.number().int().min(0).optional(),
  mistakes_count: z.number().int().min(0).optional(),
  last_score: z.number().int().min(0).max(100).optional(),
  next_review_at: z.string().optional(),
  ease_factor: z.number().min(1.3).optional(),
  review_interval_days: z.number().int().min(1).optional(),
  review_count: z.number().int().min(0).optional(),
});

export async function PATCH(request: Request, { params }: { params: { topicId: string } }) {
  const parsed = statusSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail("Invalid syllabus status", 400, parsed.error.flatten());
  try {
    const { supabase, user } = await requireProductUser();
    const progress = await updateTopicProgress(user.id, params.topicId, parsed.data.status, {
        timeSpentSeconds: parsed.data.time_spent_seconds,
        correctCount: parsed.data.correct_count,
        mistakesCount: parsed.data.mistakes_count,
        lastScore: parsed.data.last_score,
        nextReviewAt: parsed.data.next_review_at,
        easeFactor: parsed.data.ease_factor,
        reviewIntervalDays: parsed.data.review_interval_days,
        reviewCount: parsed.data.review_count,
      });
    const xp = [];
    if (parsed.data.status === "completed" || parsed.data.status === "done") {
      xp.push(await awardUserXp(supabase, user.id, "topic_completed"));
    }
    if (typeof parsed.data.last_score === "number") {
      if (parsed.data.last_score >= 100) xp.push(await awardUserXp(supabase, user.id, "prove_it_perfect"));
      else if (parsed.data.last_score >= 60) xp.push(await awardUserXp(supabase, user.id, "prove_it_solid"));
    }
    return ok({ ...progress, xp });
  } catch (error) {
    if (error instanceof ProductDataError && error.status === 401) {
      return ok({
        topic_key: params.topicId,
        status: parsed.data.status,
        confidence_score: parsed.data.status === "completed" || parsed.data.status === "done" ? 80 : 50,
        last_studied_at: new Date().toISOString(),
        time_spent_seconds: parsed.data.time_spent_seconds ?? 0,
        correct_count: parsed.data.correct_count ?? 0,
        mistakes_count: parsed.data.mistakes_count ?? 0,
        last_score: parsed.data.last_score ?? null,
        next_review_at: parsed.data.next_review_at ?? null,
        ease_factor: parsed.data.ease_factor ?? 2.5,
        review_interval_days: parsed.data.review_interval_days ?? 1,
        review_count: parsed.data.review_count ?? 0,
        guest: true,
      });
    }
    if (error instanceof ProductDataError) return fail(error.message, error.status);
    return fail("Could not update topic.", 500);
  }
}
