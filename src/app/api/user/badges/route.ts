import { fail, ok } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";
import { ProductDataError, requireProductUser } from "@/lib/product/db";

export async function GET() {
  try {
    const { user } = await requireProductUser();
    const supabase = await createClient();
    const { data, error } = await supabase.from("user_badges").select("badge_id,earned_at").eq("user_id", user.id).order("earned_at", { ascending: false });
    if (error) return fail("Could not load badges.", 500);
    return ok({ badges: data ?? [] });
  } catch (error) {
    if (error instanceof ProductDataError) return fail(error.message, error.status);
    return fail("Could not load badges.", 500);
  }
}
