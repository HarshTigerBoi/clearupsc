import { fail, ok } from "@/lib/api/response";
import { getTopicsFromDb } from "@/lib/product/db";

export async function GET() {
  try {
    const topics = await getTopicsFromDb();
    return ok({ topics });
  } catch {
    return fail("Could not load study topics.", 500);
  }
}
