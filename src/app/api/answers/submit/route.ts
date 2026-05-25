import { z } from "zod";
import { evaluateAnswer } from "@/lib/ai/answer-eval";
import { fail, ok } from "@/lib/api/response";
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
    const { user } = await requireProductUser();
    const evaluation = await evaluateAnswer(parsed.data);
    const saved = await storeAnswerEvaluation(user.id, parsed.data, evaluation);
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
      persisted: true,
      aiMode: process.env.ANTHROPIC_API_KEY ? "anthropic" : "local-rubric",
    });
  } catch (error) {
    if (error instanceof ProductDataError && error.status === 401) {
      const evaluation = await evaluateAnswer(parsed.data);
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
        aiMode: process.env.ANTHROPIC_API_KEY ? "anthropic" : "local-rubric",
      });
    }
    if (error instanceof ProductDataError) return fail(error.message, error.status);
    return fail("Could not evaluate answer.", 500);
  }
}
