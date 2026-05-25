import { z } from "zod";
import { fail, ok } from "@/lib/api/response";
import { ProductDataError, requireProductUser } from "@/lib/product/db";

const essaySchema = z.object({
  topic: z.string().min(4),
  content: z.string().min(20),
  wordCount: z.number().int().nonnegative(),
  timeSpentMinutes: z.number().int().nonnegative(),
  selfScore: z.number().int().min(1).max(10).optional(),
  rubric: z.record(z.string(), z.number()).optional(),
});

export async function GET() {
  try {
    const { supabase, user } = await requireProductUser();
    const { data, error } = await supabase
      .from("essay_submissions")
      .select("id,topic,word_count,time_spent_minutes,self_score,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    return ok({ essays: data ?? [] });
  } catch (error) {
    if (error instanceof ProductDataError) return fail(error.message, error.status);
    return fail("Could not load essays.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireProductUser();
    const input = essaySchema.parse(await request.json());
    const { data, error } = await supabase
      .from("essay_submissions")
      .insert({
        user_id: user.id,
        topic: input.topic,
        content: input.content,
        word_count: input.wordCount,
        time_spent_minutes: input.timeSpentMinutes,
        self_score: input.selfScore ?? null,
        rubric: input.rubric ?? null,
      })
      .select("id")
      .single();
    if (error) throw error;
    return ok({ id: data.id }, 201);
  } catch (error) {
    if (error instanceof ProductDataError) return fail(error.message, error.status);
    return fail("Could not save essay.", 400);
  }
}
