import { fail, ok } from "@/lib/api/response";
import { getQuestionPool, ProductDataError, requireProductUser, startMockAttempt } from "@/lib/product/db";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const { user } = await requireProductUser();
    return ok(await startMockAttempt(user.id, params.id));
  } catch (error) {
    if (error instanceof ProductDataError && error.status === 401) {
      const questions = await getQuestionPool(params.id);
      return ok({
        attemptId: null,
        testId: params.id,
        startedAt: new Date().toISOString(),
        guest: true,
        questions: questions.map(({ correct, explanation, ...question }) => question),
      });
    }
    if (error instanceof ProductDataError) return fail(error.message, error.status);
    return fail("Could not start mock test.", 500);
  }
}
