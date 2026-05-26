import { z } from "zod";
import { fail, ok } from "@/lib/api/response";
import { evaluateAnswer } from "@/lib/answer-writing/evaluator";
import { awardUserXp } from "@/lib/gamification/xp";
import { ProductDataError, requireProductUser, storeAnswerEvaluation } from "@/lib/product/db";

const answerSchema = z.object({
  questionText: z.string().min(10),
  answerText: z.string().min(20),
  wordCount: z.number().int().min(1),
  timeTakenSeconds: z.number().int().min(0),
});

export async function POST(request: Request) {
  const parsed = answerSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail("Invalid answer submission", 400, parsed.error.flatten());
  try {
    const { supabase, user } = await requireProductUser();
    const evaluation = evaluateAnswer(parsed.data.answerText, { questionText: parsed.data.questionText });
    const saved = await storeAnswerEvaluation(user.id, parsed.data, evaluation);
    const xp = await awardUserXp(supabase, user.id, "answer_submitted");
    return ok({
      submission: {
        id: saved.id,
        questionText: parsed.data.questionText,
        answerText: parsed.data.answerText,
        wordCount: parsed.data.wordCount,
        timeTakenSeconds: parsed.data.timeTakenSeconds,
        submittedAt: saved.submittedAt,
      },
      evaluation,
      xp,
      persisted: true,
      aiMode: "deterministic-rubric",
    });
  } catch (error) {
    if (error instanceof ProductDataError && error.status === 401) {
      const evaluation = evaluateAnswer(parsed.data.answerText, { questionText: parsed.data.questionText });
      return ok({
        submission: {
          id: `guest-${Date.now()}`,
          questionText: parsed.data.questionText,
          answerText: parsed.data.answerText,
          wordCount: parsed.data.wordCount,
          timeTakenSeconds: parsed.data.timeTakenSeconds,
          submittedAt: new Date().toISOString(),
        },
        evaluation,
        persisted: false,
        guest: true,
        aiMode: "deterministic-rubric",
      });
    }
    if (error instanceof ProductDataError) return fail(error.message, error.status);
    return fail("Could not evaluate answer.", 500);
  }
}
