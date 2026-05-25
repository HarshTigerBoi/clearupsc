import { z } from "zod";
import { fail, ok } from "@/lib/api/response";
import { ProductDataError, requireProductUser, updateTopicProgress } from "@/lib/product/db";

const statusSchema = z.object({
  status: z.enum(["not_started", "in_progress", "completed", "needs_revision", "done"]),
});

export async function PATCH(request: Request, { params }: { params: { topicId: string } }) {
  const parsed = statusSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail("Invalid syllabus status", 400, parsed.error.flatten());
  try {
    const { user } = await requireProductUser();
    return ok(await updateTopicProgress(user.id, params.topicId, parsed.data.status));
  } catch (error) {
    if (error instanceof ProductDataError && error.status === 401) {
      return ok({
        topic_key: params.topicId,
        status: parsed.data.status,
        confidence_score: parsed.data.status === "completed" || parsed.data.status === "done" ? 80 : 50,
        last_studied_at: new Date().toISOString(),
        guest: true,
      });
    }
    if (error instanceof ProductDataError) return fail(error.message, error.status);
    return fail("Could not update topic.", 500);
  }
}
