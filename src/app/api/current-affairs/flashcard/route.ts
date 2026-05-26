import { z } from "zod";
import { fail, ok } from "@/lib/api/response";
import { ProductDataError, requireProductUser } from "@/lib/product/db";

const flashcardSchema = z.object({
  title: z.string().min(3).max(300),
  prelimsHook: z.string().min(3).max(700),
  mainsAngle: z.string().max(900).optional().nullable(),
  staticLink: z.string().max(160).optional().nullable(),
});

export async function POST(request: Request) {
  const parsed = flashcardSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail("Invalid current affairs flashcard.", 400, parsed.error.flatten());

  try {
    const { supabase, user } = await requireProductUser();
    const input = parsed.data;
    const { data, error } = await supabase
      .from("flashcard_queue")
      .insert({
        user_id: user.id,
        topic_key: input.staticLink || "current_affairs",
        question: `Current affairs hook: ${input.title}`,
        answer: [input.prelimsHook, input.mainsAngle ? `Mains use: ${input.mainsAngle}` : ""].filter(Boolean).join("\n\n"),
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
    if (error instanceof ProductDataError && error.status === 401) return ok({ guest: true });
    if (error instanceof ProductDataError) return fail(error.message, error.status);
    return fail("Could not add current affairs flashcard.", 400);
  }
}
