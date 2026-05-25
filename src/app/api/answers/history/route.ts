import { fail, ok } from "@/lib/api/response";
import { getAnswerHistory, ProductDataError, requireProductUser } from "@/lib/product/db";

export async function GET() {
  try {
    const { user } = await requireProductUser();
    return ok({ submissions: await getAnswerHistory(user.id) });
  } catch (error) {
    if (error instanceof ProductDataError) return fail(error.message, error.status);
    return fail("Could not load answer history.", 500);
  }
}
