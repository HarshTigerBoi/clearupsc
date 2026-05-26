import type { SupabaseClient } from "@supabase/supabase-js";
import { getEligibleBadges, emptyBadgeMetrics, type Badge, type BadgeMetrics } from "@/lib/gamification/badges";

export const XP_ACTIONS = {
  topic_completed: 100,
  prove_it_perfect: 50,
  prove_it_solid: 25,
  flashcard_correct: 10,
  mixed_practice_complete: 30,
  daily_challenge: 20,
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
  const points = getXpForAction(action);
  try {
    window.localStorage.setItem("clearupsc_guest_xp", String(next));
    const events = JSON.parse(window.localStorage.getItem("clearupsc_guest_xp_events") || "[]");
    window.localStorage.setItem(
      "clearupsc_guest_xp_events",
      JSON.stringify([{ action, xp: points, created_at: new Date().toISOString() }, ...(Array.isArray(events) ? events : [])].slice(0, 100)),
    );
    window.dispatchEvent(new CustomEvent("clearupsc:xp-earned", { detail: { points, action } }));
    for (const badge of checkGuestBadges(next)) {
      window.dispatchEvent(new CustomEvent("clearupsc:badge-unlock", { detail: badge }));
    }
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
    const data = (await response.json()) as { xp?: { totalXp: number; levelName: string; progressPercent: number; remainingXp: number; badges?: Badge[] } };
    for (const badge of data.xp?.badges ?? []) {
      window.dispatchEvent(new CustomEvent("clearupsc:badge-unlock", { detail: badge }));
    }
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

  const finalXp = error ? Number(current.data?.total_xp ?? 0) : totalXp;
  const badges = error ? [] : await checkAndAwardBadges(supabase, userId, finalXp);
  return { ...getXpLevel(finalXp), points, synced: !error, badges };
}

function checkGuestBadges(totalXp: number) {
  const metrics = emptyBadgeMetrics(totalXp);
  try {
    const progress = JSON.parse(window.localStorage.getItem("clearupsc_guest_topic_progress") || "{}");
    const progressRows = Object.values(progress) as Array<{ status?: string; last_score?: number | null; updated_at?: string }>;
    metrics.completedTopics = progressRows.filter((row) => row.status === "completed" || row.status === "done").length;
    metrics.perfectProveIts = progressRows.filter((row) => Number(row.last_score ?? 0) >= 100).length;
    const streak = JSON.parse(window.localStorage.getItem("clearupsc_guest_streak") || "{}");
    metrics.currentStreak = Number(streak.currentStreak ?? 0);
    metrics.resolvedMistakes = Number(window.localStorage.getItem("clearupsc_guest_resolved_mistakes") ?? 0);
    const existing = new Set(JSON.parse(window.localStorage.getItem("clearupsc_guest_badges") || "[]"));
    const newlyEarned = getEligibleBadges(metrics).filter((badge) => !existing.has(badge.id));
    if (newlyEarned.length) {
      window.localStorage.setItem("clearupsc_guest_badges", JSON.stringify([...existing, ...newlyEarned.map((badge) => badge.id)]));
    }
    return newlyEarned;
  } catch {
    return [];
  }
}

async function checkAndAwardBadges(supabase: SupabaseClient, userId: string, totalXp: number) {
  const metrics = await collectBadgeMetrics(supabase, userId, totalXp);
  const eligible = getEligibleBadges(metrics);
  if (!eligible.length) return [];

  const writer = await badgeWriterClient(supabase);
  const { data: existingRows } = await writer.from("user_badges").select("badge_id").eq("user_id", userId);
  const existing = new Set((existingRows ?? []).map((row) => String(row.badge_id)));
  const newBadges = eligible.filter((badge) => !existing.has(badge.id));
  if (!newBadges.length) return [];

  const { error } = await writer.from("user_badges").insert(newBadges.map((badge) => ({ user_id: userId, badge_id: badge.id })));
  return error ? [] : newBadges;
}

async function badgeWriterClient(fallback: SupabaseClient) {
  try {
    const mod = await import("@/lib/supabase/admin");
    return mod.createAdminClient() ?? fallback;
  } catch {
    return fallback;
  }
}

async function collectBadgeMetrics(supabase: SupabaseClient, userId: string, totalXp: number): Promise<BadgeMetrics> {
  const metrics = emptyBadgeMetrics(totalXp);
  const [
    progressResult,
    topicsResult,
    streakResult,
    mcqResult,
    mockResult,
    answersResult,
  ] = await Promise.all([
    supabase.from("topic_progress").select("topic_key,status,last_score,last_studied_at").eq("user_id", userId),
    supabase.from("topics").select("key,title,subject"),
    supabase.from("user_streaks").select("current_streak").eq("user_id", userId).maybeSingle(),
    supabase.from("mcq_attempts").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("mock_test_attempts").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "evaluated"),
    supabase.from("answer_submissions").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);

  const progressRows = progressResult.data ?? [];
  const topicRows = topicsResult.data ?? [];
  const completed = new Set(
    progressRows
      .filter((row) => row.status === "completed" || row.status === "done")
      .map((row) => String(row.topic_key)),
  );

  metrics.completedTopics = completed.size;
  metrics.currentStreak = Number(streakResult.data?.current_streak ?? 0);
  metrics.mcqAttempts = mcqResult.count ?? 0;
  metrics.mockAttempts = mockResult.count ?? 0;
  metrics.answerSubmissions = answersResult.count ?? 0;
  metrics.perfectProveIts = progressRows.filter((row) => Number(row.last_score ?? 0) >= 100).length;

  for (const row of progressRows) {
    if (!row.last_studied_at) continue;
    const hour = hourInIndia(String(row.last_studied_at));
    if (hour >= 22) metrics.nightStudyCount += 1;
    if (hour < 7) metrics.earlyStudyCount += 1;
  }

  for (const topic of topicRows) {
    const key = String(topic.key ?? "").toLowerCase();
    const title = String(topic.title ?? "").toLowerCase();
    const subject = String(topic.subject ?? "").toLowerCase();
    const isDone = completed.has(String(topic.key));
    if (subject === "gs2" && (key.includes("polity") || title.includes("polity") || title.includes("constitution"))) {
      metrics.polityTotal += 1;
      if (isDone) metrics.polityCompleted += 1;
    }
    if (subject === "gs1" && (key.includes("history") || title.includes("history") || title.includes("freedom"))) {
      metrics.historyTotal += 1;
      if (isDone) metrics.historyCompleted += 1;
    }
    if (subject === "gs3" && (key.includes("economy") || title.includes("economy") || title.includes("inflation") || title.includes("banking"))) {
      metrics.economyTotal += 1;
      if (isDone) metrics.economyCompleted += 1;
    }
  }

  return metrics;
}

function hourInIndia(value: string) {
  const text = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", hour: "2-digit", hour12: false }).format(new Date(value));
  const hour = Number(text.replace(/\D/g, ""));
  return Number.isFinite(hour) ? hour % 24 : 12;
}
