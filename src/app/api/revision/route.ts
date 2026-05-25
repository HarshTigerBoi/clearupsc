import { z } from "zod";
import { fail, ok } from "@/lib/api/response";
import { ProductDataError, requireProductUser } from "@/lib/product/db";

const reviewSchema = z.object({
  topicKey: z.string().min(2),
  quality: z.number().int().min(0).max(5),
});

export async function GET() {
  try {
    const { supabase, user } = await requireProductUser();
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("revision_schedule")
      .select("id,topic_key,due_date,interval_days,last_quality,reviewed_at")
      .eq("user_id", user.id)
      .lte("due_date", today)
      .order("due_date", { ascending: true })
      .limit(50);
    if (error) throw error;
    return ok({ revisions: data ?? [] });
  } catch (error) {
    if (error instanceof ProductDataError) return fail(error.message, error.status);
    return fail("Could not load revision schedule.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireProductUser();
    const input = reviewSchema.parse(await request.json());
    const interval = nextInterval(input.quality);
    const due = new Date(Date.now() + interval * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("revision_schedule")
      .upsert(
        {
          user_id: user.id,
          topic_key: input.topicKey,
          due_date: due,
          interval_days: interval,
          last_quality: input.quality,
          reviewed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,topic_key" },
      )
      .select("id,due_date,interval_days")
      .single();
    if (error) throw error;
    return ok(data);
  } catch (error) {
    if (error instanceof ProductDataError) return fail(error.message, error.status);
    return fail("Could not update revision.", 400);
  }
}

function nextInterval(quality: number) {
  if (quality < 3) return 1;
  if (quality === 3) return 3;
  if (quality === 4) return 14;
  return 30;
}
