import { ok } from "@/lib/api/response";
import { ProductDataError, getTopicsFromDb, requireProductUser } from "@/lib/product/db";

function indiaDate(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(date);
}

export async function GET() {
  try {
    const { supabase, user } = await requireProductUser();
    const today = indiaDate();
    const yesterday = indiaDate(-1);
    const tomorrow = indiaDate(1);

    const [progressResult, attemptsResult, affairsResult, tomorrowPlanResult] = await Promise.all([
      supabase.from("topic_progress").select("topic_key,status,last_studied_at").eq("user_id", user.id),
      supabase.from("mcq_attempts").select("is_correct,attempted_at").eq("user_id", user.id).order("attempted_at", { ascending: false }).limit(1000),
      supabase.from("current_affairs").select("title,static_link,source_url").order("date", { ascending: false }).limit(1).maybeSingle(),
      supabase
        .from("study_plan_tasks")
        .select("topic_key,study_plans!inner(user_id,date)")
        .eq("study_plans.user_id", user.id)
        .eq("study_plans.date", tomorrow)
        .order("duration_minutes", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const topics = await getTopicsFromDb();
    const topicByKey = new Map(topics.map((topic) => [topic.key, topic]));
    const progress = progressResult.data ?? [];
    const attempts = attemptsResult.data ?? [];
    const attemptsToday = attempts.filter((attempt) => attempt.attempted_at && String(attempt.attempted_at).slice(0, 10) === today);
    const correctToday = attemptsToday.filter((attempt) => attempt.is_correct).length;
    const tomorrowTopic = tomorrowPlanResult.data?.topic_key ? topicByKey.get(String(tomorrowPlanResult.data.topic_key)) : null;

    return ok({
      topicsStudiedYesterday: progress.filter((row) => row.last_studied_at && String(row.last_studied_at).slice(0, 10) === yesterday).length,
      topicsCompletedToday: progress.filter((row) => (row.status === "completed" || row.status === "done") && row.last_studied_at && String(row.last_studied_at).slice(0, 10) === today).length,
      mcqsAttemptedToday: attemptsToday.length,
      mcqAccuracyToday: attemptsToday.length ? Math.round((correctToday / attemptsToday.length) * 100) : 0,
      xpEarnedToday: 0,
      latestCurrentAffair: affairsResult.data
        ? {
            title: String(affairsResult.data.title),
            href: affairsResult.data.static_link ? `/study/${affairsResult.data.static_link}` : affairsResult.data.source_url ? String(affairsResult.data.source_url) : "/current-affairs",
          }
        : null,
      tomorrowFirstTask: tomorrowTopic ? { key: tomorrowTopic.key, title: tomorrowTopic.title } : null,
      guest: false,
    });
  } catch (error) {
    if (error instanceof ProductDataError && error.status === 401) {
      return ok({
        topicsStudiedYesterday: 0,
        topicsCompletedToday: 0,
        mcqsAttemptedToday: 0,
        mcqAccuracyToday: 0,
        xpEarnedToday: 0,
        latestCurrentAffair: null,
        tomorrowFirstTask: null,
        guest: true,
      });
    }
    return ok({ guest: true });
  }
}
