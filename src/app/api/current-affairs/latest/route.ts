import { fail, ok } from "@/lib/api/response";
import { getCurrentAffairsFromDb, ProductDataError } from "@/lib/product/db";

export async function GET() {
  try {
    return ok({ items: await getCurrentAffairsFromDb() });
  } catch (error) {
    if (error instanceof ProductDataError) return fail(error.message, error.status);
    return fail("Could not load current affairs.", 500);
  }
}
