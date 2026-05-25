import { z } from "zod";
import { fail, ok } from "@/lib/api/response";
import { ProductDataError, requireProductUser } from "@/lib/product/db";

const flashcardSchema = z.object({
  question: z.string().min(3).max(400),
  answer: z.string().min(3).max(1200),
});

export async function POST(request: Request, { params }: { params: { topicId: string } }) {
  try {
    const { supabase, user } = await requireProductUser();
    const input = flashcardSchema.parse(await request.json());
    const { data, error } = await supabase
      .from("flashcard_queue")
      .insert({
        user_id: user.id,
        topic_key: params.topicId,
        question: input.question,
        answer: input.answer,
        next_review_at: new Date().toISOString(),
        interval_days: 1,
        ease_factor: 2.5,
        repetitions: 0,
      })
      .select("id")
      .single();
    if (error) throw error;
    return ok({ id: data.id }, 201);
  } catch (error) {
    if (error instanceof ProductDataError) return fail(error.message, error.status);
    return fail("Could not add flashcard.", 400);
  }
}
