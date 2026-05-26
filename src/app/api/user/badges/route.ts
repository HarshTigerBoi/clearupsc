import { fail, ok } from "@/lib/api/response";
import { BADGES } from "@/lib/gamification/badges";
import { createClient } from "@/lib/supabase/server";
import { ProductDataError, requireProductUser } from "@/lib/product/db";

export async function GET() {
  try {
    const { user } = await requireProductUser();
    const supabase = await createClient();
    const { data, error } = await supabase.from("user_badges").select("badge_id,earned_at").eq("user_id", user.id).order("earned_at", { ascending: false });
    if (error) return fail("Could not load badges.", 500);
    const earned = new Map((data ?? []).map((row) => [String(row.badge_id), row.earned_at ? String(row.earned_at) : null]));
    return ok({
      badges: BADGES.map((badge) => ({ ...badge, earned: earned.has(badge.id), earnedAt: earned.get(badge.id) ?? null })),
      earnedCount: earned.size,
    });
  } catch (error) {
    if (error instanceof ProductDataError && error.status === 401) {
      return ok({ badges: BADGES.map((badge) => ({ ...badge, earned: false, earnedAt: null })), earnedCount: 0, guest: true });
    }
    if (error instanceof ProductDataError) return fail(error.message, error.status);
    return fail("Could not load badges.", 500);
  }
}
