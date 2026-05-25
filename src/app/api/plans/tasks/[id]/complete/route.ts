import { z } from "zod";
import { fail, ok } from "@/lib/api/response";
import { completeTask, ProductDataError, requireProductUser } from "@/lib/product/db";

const completeSchema = z.object({ completed: z.boolean().default(true) });

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const parsed = completeSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail("Invalid task completion payload", 400, parsed.error.flatten());
  try {
    const { user } = await requireProductUser();
    return ok(await completeTask(user.id, params.id, parsed.data.completed));
  } catch (error) {
    if (error instanceof ProductDataError && error.status === 401) {
      return ok({ id: params.id, completed: parsed.data.completed, guest: true });
    }
    if (error instanceof ProductDataError) return fail(error.message, error.status);
    return fail("Could not complete task.", 500);
  }
}
