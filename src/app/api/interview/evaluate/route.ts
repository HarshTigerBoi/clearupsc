import { z } from "zod";
import { fail, ok } from "@/lib/api/response";
import { ProductDataError, requireProductUser, storeInterviewSession } from "@/lib/product/db";
import type { InterviewQuestion } from "@/types";

const evaluateSchema = z.object({
  answers: z.array(z.object({ question: z.string(), answer: z.string() })).min(1),
  questions: z.array(z.object({ id: z.string(), question: z.string(), category: z.string(), whyAsked: z.string() })).default([]),
});

export async function POST(request: Request) {
  const parsed = evaluateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail("Invalid interview answers", 400, parsed.error.flatten());
  try {
    const { user } = await requireProductUser();
    const answered = parsed.data.answers.filter((item) => item.answer.trim().length > 20).length;
    const report = {
      overallScore: Math.min(85, 45 + answered * 5),
      confidenceScore: Math.min(90, 50 + answered * 4),
      strongestAnswers: parsed.data.answers.slice(0, 2).map((item) => item.question),
      improvements: ["Answer with one clear example", "Keep answers under 90 seconds", "Connect personal background to public service"],
      overallFeedback: "Your answers show usable raw material. The next step is sharper structure: direct answer, example, balanced conclusion.",
    };
    await storeInterviewSession(user.id, parsed.data.questions as InterviewQuestion[], parsed.data.answers, report);
    return ok({ report });
  } catch (error) {
    if (error instanceof ProductDataError) return fail(error.message, error.status);
    return fail("Could not evaluate interview.", 500);
  }
}
