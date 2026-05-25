import { fail, ok } from "@/lib/api/response";
import { getSyllabusProgress, getTopicsFromDb, ProductDataError, requireProductUser } from "@/lib/product/db";

export async function GET() {
  try {
    const { user } = await requireProductUser();
    return ok(await getSyllabusProgress(user.id));
  } catch (error) {
    if (error instanceof ProductDataError && error.status === 401) {
      return ok({ topics: await getTopicsFromDb(), progress: [], guest: true });
    }
    if (error instanceof ProductDataError) return fail(error.message, error.status);
    return fail("Could not load syllabus.", 500);
  }
}
