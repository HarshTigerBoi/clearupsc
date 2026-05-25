import { z } from "zod";
import { fail, ok } from "@/lib/api/response";
import { ProductDataError, requireProductUser } from "@/lib/product/db";

const noteSchema = z.object({
  title: z.string().min(2).max(120),
  content: z.string().min(1),
  topicKey: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isPinned: z.boolean().default(false),
});

export async function GET() {
  try {
    const { supabase, user } = await requireProductUser();
    const { data, error } = await supabase
      .from("user_notes")
      .select("id,title,content,topic_key,tags,is_pinned,updated_at,created_at")
      .eq("user_id", user.id)
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return ok({ notes: data ?? [] });
  } catch (error) {
    if (error instanceof ProductDataError) return fail(error.message, error.status);
    return fail("Could not load notes.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireProductUser();
    const input = noteSchema.parse(await request.json());
    const { data, error } = await supabase
      .from("user_notes")
      .insert({
        user_id: user.id,
        title: input.title,
        content: input.content,
        topic_key: input.topicKey ?? null,
        tags: input.tags,
        is_pinned: input.isPinned,
      })
      .select("id")
      .single();
    if (error) throw error;
    return ok({ id: data.id }, 201);
  } catch (error) {
    if (error instanceof ProductDataError) return fail(error.message, error.status);
    return fail("Could not save note.", 400);
  }
}
