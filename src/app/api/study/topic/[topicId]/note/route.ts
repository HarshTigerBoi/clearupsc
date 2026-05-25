import { z } from "zod";
import { fail, ok } from "@/lib/api/response";
import { ProductDataError, requireProductUser } from "@/lib/product/db";

const noteSchema = z.object({
  title: z.string().min(2).max(120),
  content: z.string().min(1).max(5000),
});

export async function POST(request: Request, { params }: { params: { topicId: string } }) {
  try {
    const { supabase, user } = await requireProductUser();
    const input = noteSchema.parse(await request.json());
    const { data, error } = await supabase
      .from("user_notes")
      .insert({
        user_id: user.id,
        topic_key: params.topicId,
        title: input.title,
        content: input.content,
        tags: [params.topicId],
        is_pinned: false,
      })
      .select("id")
      .single();
    if (error) throw error;
    return ok({ id: data.id }, 201);
  } catch (error) {
    if (error instanceof ProductDataError) return fail(error.message, error.status);
    return fail("Could not add note.", 400);
  }
}
