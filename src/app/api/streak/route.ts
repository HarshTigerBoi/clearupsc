import { fail, ok } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";

function todayInIndia() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

function addDays(dateText: string, days: number) {
  const date = new Date(`${dateText}T00:00:00+05:30`);
  date.setDate(date.getDate() + days);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(date);
}

function missedYesterday(lastActiveDate: string | null | undefined) {
  if (!lastActiveDate) return false;
  const today = todayInIndia();
  return addDays(lastActiveDate, 1) < today;
}

async function getUserState(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: streak } = await supabase
    .from("user_streaks")
    .select("current_streak,longest_streak,last_active_date")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("streak_freezes_remaining")
    .eq("user_id", userId)
    .maybeSingle();

  return {
    currentStreak: Number(streak?.current_streak ?? 0),
    longestStreak: Number(streak?.longest_streak ?? 0),
    lastActiveDate: streak?.last_active_date ?? null,
    freezesRemaining: Number(profile?.streak_freezes_remaining ?? 2),
    missedYesterday: missedYesterday(streak?.last_active_date),
  };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return ok({ guest: true, currentStreak: 0, longestStreak: 0, freezesRemaining: 2, missedYesterday: false });
    return ok(await getUserState(supabase, user.id));
  } catch {
    return fail("Could not load streak.", 500);
  }
}

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return ok({ guest: true });

    const state = await getUserState(supabase, user.id);
    if (!state.missedYesterday || state.freezesRemaining <= 0) return ok(state);

    const today = todayInIndia();
    await supabase.from("user_profiles").update({ streak_freezes_remaining: state.freezesRemaining - 1, updated_at: new Date().toISOString() }).eq("user_id", user.id);
    await supabase.from("user_streaks").upsert(
      {
        user_id: user.id,
        current_streak: Math.max(1, state.currentStreak),
        longest_streak: Math.max(state.longestStreak, state.currentStreak),
        last_active_date: today,
      },
      { onConflict: "user_id" },
    );

    return ok(await getUserState(supabase, user.id));
  } catch {
    return fail("Could not use streak freeze.", 500);
  }
}

