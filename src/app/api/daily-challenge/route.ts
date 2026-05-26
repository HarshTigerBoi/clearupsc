import { z } from "zod";
import { fail, ok } from "@/lib/api/response";
import { awardUserXp } from "@/lib/gamification/xp";
import { createClient } from "@/lib/supabase/server";
import type { PYQOption, PYQQuestion } from "@/types";

type DbQuestion = {
  id: string;
  question_text: string;
  year: number | null;
  tags: string[] | null;
  topic_key: string | null;
  explanation: string | null;
  source_label: string | null;
  trap_type: string | null;
  question_options: Array<{
    option_label: string;
    option_text: string;
    is_correct: boolean;
  }>;
};

const submitSchema = z.object({
  questionId: z.string().min(1),
  selectedOption: z.enum(["A", "B", "C", "D"]),
});

function todayInIndia() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

function dayOfYear(dateText: string) {
  const date = new Date(`${dateText}T00:00:00Z`);
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
  return Math.floor((date.getTime() - start.getTime()) / 86_400_000);
}

function toQuestion(row: DbQuestion): PYQQuestion {
  const options = [...(row.question_options ?? [])].sort((a, b) => a.option_label.localeCompare(b.option_label));
  const correct = options.find((option) => option.is_correct)?.option_label ?? "A";
  const subject = row.tags?.find((tag) => ["GS1", "GS2", "GS3", "GS4", "CSAT", "Essay"].includes(tag)) ?? "GS2";

  return {
    id: row.id,
    subject: subject as PYQQuestion["subject"],
    year: row.year ?? 2026,
    question: row.question_text,
    options: options.map(
      (option): PYQOption => ({
        label: option.option_label as PYQOption["label"],
        text: option.option_text,
      }),
    ),
    correct: correct as PYQQuestion["correct"],
    explanation: row.explanation ?? "Use elimination, identify the exact concept being tested, and avoid absolute statements unless the source clearly supports them.",
    sourceLabel: row.source_label ?? "ClearUPSC Daily Challenge",
    sourceType: row.source_label?.toLowerCase().includes("official") ? "official_pyq" : "clearupsc_original",
    topicKey: row.topic_key,
    trapType: row.trap_type ?? "Daily concept trap",
  };
}

async function getTodaysQuestion(supabase: Awaited<ReturnType<typeof createClient>>) {
  const date = todayInIndia();
  const { count, error: countError } = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("question_type", "mcq");
  if (countError || !count) throw new Error("Question bank unavailable");

  const index = dayOfYear(date) % count;
  const { data, error } = await supabase
    .from("questions")
    .select("id, question_text, year, tags, topic_key, explanation, source_label, trap_type, question_options(option_label, option_text, is_correct)")
    .eq("question_type", "mcq")
    .order("id", { ascending: true })
    .range(index, index)
    .single();
  if (error || !data) throw new Error("Daily challenge unavailable");

  await supabase.from("daily_challenges").upsert({ date, question_id: data.id }, { onConflict: "date" });
  return { date, question: toQuestion(data as DbQuestion) };
}

async function getLoggedInDailyState(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, questionId: string) {
  const date = todayInIndia();
  const start = `${date}T00:00:00+05:30`;
  const end = `${date}T23:59:59+05:30`;
  const { data: attempt } = await supabase
    .from("mcq_attempts")
    .select("selected_option,is_correct")
    .eq("user_id", userId)
    .eq("question_id", questionId)
    .gte("attempted_at", start)
    .lte("attempted_at", end)
    .order("attempted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: streak } = await supabase
    .from("user_streaks")
    .select("current_streak,last_active_date")
    .eq("user_id", userId)
    .maybeSingle();

  return {
    answered: Boolean(attempt),
    selectedOption: attempt?.selected_option ?? null,
    isCorrect: attempt?.is_correct ?? null,
    streak: Number(streak?.current_streak ?? 0),
    lastActiveDate: streak?.last_active_date ?? null,
  };
}

async function updateStreak(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const today = todayInIndia();
  const yesterday = new Date(`${today}T00:00:00+05:30`);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayText = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(yesterday);

  const { data: current } = await supabase
    .from("user_streaks")
    .select("current_streak,longest_streak,last_active_date,total_study_days")
    .eq("user_id", userId)
    .maybeSingle();

  if (current?.last_active_date === today) return Number(current.current_streak ?? 1);

  const nextStreak = current?.last_active_date === yesterdayText ? Number(current.current_streak ?? 0) + 1 : 1;
  const longest = Math.max(nextStreak, Number(current?.longest_streak ?? 0));
  await supabase.from("user_streaks").upsert(
    {
      user_id: userId,
      current_streak: nextStreak,
      longest_streak: longest,
      last_active_date: today,
      total_study_days: Number(current?.total_study_days ?? 0) + 1,
    },
    { onConflict: "user_id" },
  );
  return nextStreak;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const challenge = await getTodaysQuestion(supabase);
    const state = user ? await getLoggedInDailyState(supabase, user.id, challenge.question.id) : { answered: false, streak: 0 };
    return ok({ ...challenge, ...state });
  } catch {
    return fail("Could not load today's challenge.", 500);
  }
}

export async function POST(request: Request) {
  const parsed = submitSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail("Invalid daily challenge answer.", 400, parsed.error.flatten());

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const challenge = await getTodaysQuestion(supabase);
    if (challenge.question.id !== parsed.data.questionId) return fail("This is not today's challenge question.", 400);

    const isCorrect = challenge.question.correct === parsed.data.selectedOption;
    let xp = null;
    let streak = 0;

    if (user) {
      const state = await getLoggedInDailyState(supabase, user.id, challenge.question.id);
      if (!state.answered) {
        await supabase.from("mcq_attempts").insert({
          user_id: user.id,
          question_id: challenge.question.id,
          selected_option: parsed.data.selectedOption,
          is_correct: isCorrect,
          time_taken_seconds: null,
        });
        xp = await awardUserXp(supabase, user.id, "daily_challenge");
        streak = await updateStreak(supabase, user.id);
      } else {
        streak = state.streak;
      }
    }

    return ok({ correct: isCorrect, correctOption: challenge.question.correct, explanation: challenge.question.explanation, xp, streak });
  } catch {
    return fail("Could not submit daily challenge.", 500);
  }
}

