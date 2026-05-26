import { z } from "zod";
import { fail, ok } from "@/lib/api/response";
import { addMockRepairTopicsToPlan, ProductDataError, requireProductUser } from "@/lib/product/db";

const repairPlanSchema = z.object({
  topicKeys: z.array(z.string().min(1)).min(1).max(15),
});

export async function POST(request: Request) {
  const parsed = repairPlanSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail("Invalid repair plan payload", 400, parsed.error.flatten());

  try {
    const { user } = await requireProductUser();
    return ok(await addMockRepairTopicsToPlan(user.id, parsed.data.topicKeys));
  } catch (error) {
    if (error instanceof ProductDataError && error.status === 401) {
      return ok({ inserted: 0, guest: true });
    }
    if (error instanceof ProductDataError) return fail(error.message, error.status);
    return fail("Could not add repair plan to your study plan.", 500);
  }
}
