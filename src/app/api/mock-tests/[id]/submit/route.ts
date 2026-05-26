import { z } from "zod";
import { fail, ok } from "@/lib/api/response";
import { awardUserXp } from "@/lib/gamification/xp";
import { buildMockRepairPlan, finishMockAttempt, getQuestionPool, ProductDataError, requireProductUser } from "@/lib/product/db";

const submitSchema = z.object({
  answers: z.record(z.string(), z.enum(["A", "B", "C", "D"]).optional()),
  attemptId: z.string().optional(),
  timeTakenMinutes: z.number().int().min(0).optional(),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const parsed = submitSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail("Invalid mock submission", 400, parsed.error.flatten());
  try {
    const { supabase, user } = await requireProductUser();
    const result = await finishMockAttempt(user.id, params.id, parsed.data.answers, parsed.data.timeTakenMinutes, parsed.data.attemptId);
    return ok({ result, xp: await awardUserXp(supabase, user.id, "mock_completed") });
  } catch (error) {
    if (error instanceof ProductDataError && error.status === 401) {
      return ok({ result: await scoreGuestMock(params.id, parsed.data.answers) });
    }
    if (error instanceof ProductDataError) return fail(error.message, error.status);
    return fail("Could not submit mock test.", 500);
  }
}

async function scoreGuestMock(testId: string, answers: Record<string, "A" | "B" | "C" | "D" | undefined>) {
  const questions = await getQuestionPool(testId);
  let correct = 0;
  let wrong = 0;
  const subjectMap = new Map<string, { correct: number; total: number }>();

  for (const question of questions) {
    const current = subjectMap.get(question.subject) ?? { correct: 0, total: 0 };
    current.total += 1;
    const selected = answers[question.id];
    if (selected && selected === question.correct) {
      correct += 1;
      current.correct += 1;
    } else if (selected) {
      wrong += 1;
    }
    subjectMap.set(question.subject, current);
  }

  const subjectBreakdown = Array.from(subjectMap.entries()).map(([subject, value]) => ({ subject, ...value }));
  const repairPlan = await buildMockRepairPlan(null, subjectBreakdown);
  return {
    score: Number((correct * 2 - wrong * 0.67).toFixed(2)),
    correct,
    wrong,
    unattempted: questions.length - correct - wrong,
    totalQuestions: questions.length,
    subjectBreakdown,
    weakAreas: subjectBreakdown.filter((item) => item.correct / item.total < 0.5).map((item) => item.subject),
    repairPlan,
    guest: true,
  };
}
