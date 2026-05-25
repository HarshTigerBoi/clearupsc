import { fail, ok } from "@/lib/api/response";
import { getMockTestsFromDb, ProductDataError } from "@/lib/product/db";

export async function GET() {
  try {
    const tests = await getMockTestsFromDb();
    return ok({ tests });
  } catch (error) {
    if (error instanceof ProductDataError) return fail(error.message, error.status);
    return fail("Could not load mock tests.", 500);
  }
}
