import type { SupabaseClient } from "@supabase/supabase-js";

export const XP_ACTIONS = {
  topic_completed: 100,
  prove_it_perfect: 50,
  prove_it_solid: 25,
  flashcard_correct: 10,
  mixed_practice_complete: 30,
  daily_streak: 20,
  answer_submitted: 40,
  mock_completed: 150,
} as const;

export type XpAction = keyof typeof XP_ACTIONS;

export interface XpLevel {
  name: string;
  min: number;
  next: number | null;
}

const XP_LEVELS: XpLevel[] = [
  { name: "Foundation Builder", min: 0, next: 500 },
  { name: "Prelims Seeker", min: 500, next: 1500 },
  { name: "GS Scholar", min: 1500, next: 3000 },
  { name: "Mains Ready", min: 3000, next: 6000 },
  { name: "Rank Contender", min: 6000, next: 10000 },
  { name: "Topper Track", min: 10000, next: null },
];

export function getXpForAction(action: XpAction) {
  return XP_ACTIONS[action];
}

export function getXpLevel(totalXp: number) {
  const safeXp = Math.max(0, Math.round(totalXp || 0));
  const level = [...XP_LEVELS].reverse().find((item) => safeXp >= item.min) ?? XP_LEVELS[0];
  const next = level.next;
  const progress = next ? Math.round(((safeXp - level.min) / (next - level.min)) * 100) : 100;
  return {
    totalXp: safeXp,
    levelName: level.name,
    currentLevelMin: level.min,
    nextLevelXp: next,
    progressPercent: Math.max(0, Math.min(100, progress)),
    remainingXp: next ? Math.max(0, next - safeXp) : 0,
  };
}

export function readGuestXp() {
  if (typeof window === "undefined") return 0;
  try {
    return Number(window.localStorage.getItem("clearupsc_guest_xp") ?? 0) || 0;
  } catch {
    return 0;
  }
}

export function addGuestXp(action: XpAction) {
  if (typeof window === "undefined") return getXpLevel(0);
  const next = readGuestXp() + getXpForAction(action);
  try {
    window.localStorage.setItem("clearupsc_guest_xp", String(next));
    const events = JSON.parse(window.localStorage.getItem("clearupsc_guest_xp_events") || "[]");
    window.localStorage.setItem(
      "clearupsc_guest_xp_events",
      JSON.stringify([{ action, xp: getXpForAction(action), created_at: new Date().toISOString() }, ...(Array.isArray(events) ? events : [])].slice(0, 100)),
    );
  } catch {
    // XP is motivational, not blocking; ignore storage failures.
  }
  return getXpLevel(next);
}

export async function awardClientXp(action: XpAction) {
  const guest = addGuestXp(action);
  try {
    const response = await fetch("/api/xp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!response.ok) return guest;
    const data = (await response.json()) as { xp?: { totalXp: number; levelName: string; progressPercent: number; remainingXp: number } };
    return data.xp ?? guest;
  } catch {
    return guest;
  }
}

export async function awardUserXp(supabase: SupabaseClient, userId: string, action: XpAction) {
  const points = getXpForAction(action);
  const current = await supabase.from("user_profiles").select("total_xp").eq("user_id", userId).maybeSingle();
  if (current.error) {
    return { ...getXpLevel(0), points, synced: false };
  }

  const totalXp = Number(current.data?.total_xp ?? 0) + points;
  const { error } = await supabase.from("user_profiles").upsert(
    {
      user_id: userId,
      total_xp: totalXp,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  return { ...getXpLevel(error ? Number(current.data?.total_xp ?? 0) : totalXp), points, synced: !error };
}
