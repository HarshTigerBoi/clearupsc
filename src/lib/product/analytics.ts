import { createClient } from "@/lib/supabase/server";
import { getSyllabusProgress, getTodayPlan } from "@/lib/product/db";

export interface UserAnalytics {
  weakTopics: string[];
  strongTopics: string[];
  neglectedTopics: string[];
  preparednessScore: number;
  estimatedPrelimsScore: number;
  streakRisk: "low" | "medium" | "high";
  paperScores: Array<{ paper: string; score: number }>;
  activity14Days: Array<{ day: string; tasks: number; answers: number; attempts: number }>;
}

export async function getUserAnalytics(userId: string): Promise<UserAnalytics> {
  const supabase = await createClient();
  const [{ topics, progress }, plan] = await Promise.all([getSyllabusProgress(userId), getTodayPlan(userId)]);
  const topicByKey = new Map(topics.map((topic) => [topic.key, topic]));

  const { data: attempts } = await supabase
    .from("mcq_attempts")
    .select("question_id,is_correct,attempted_at")
    .eq("user_id", userId)
    .order("attempted_at", { ascending: false })
    .limit(300);

  const { data: answers } = await supabase
    .from("answer_submissions")
    .select("id,submitted_at,answer_evaluations(total_score)")
    .eq("user_id", userId)
    .order("submitted_at", { ascending: false })
    .limit(100);

  const completed = progress.filter((item) => item.status === "completed" || item.status === "done").length;
  const needsRevision = progress.filter((item) => item.status === "needs_revision");
  const staleCutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;

  const neglectedTopics = progress
    .filter((item) => item.last_studied_at && new Date(item.last_studied_at).getTime() < staleCutoff)
    .slice(0, 8)
    .map((item) => topicByKey.get(item.topic_key)?.title ?? item.topic_key);

  const weakTopics = needsRevision.slice(0, 8).map((item) => topicByKey.get(item.topic_key)?.title ?? item.topic_key);
  const strongTopics = progress
    .filter((item) => (item.confidence_score ?? 0) >= 85)
    .slice(0, 8)
    .map((item) => topicByKey.get(item.topic_key)?.title ?? item.topic_key);

  const correct = (attempts ?? []).filter((item) => item.is_correct).length;
  const attempted = attempts?.length ?? 0;
  const accuracy = attempted ? correct / attempted : 0;
  const syllabusScore = topics.length ? completed / topics.length : 0;
  const answerScore = averageScore(answers);
  const preparednessScore = Math.round(Math.min(100, syllabusScore * 45 + accuracy * 40 + (answerScore / 100) * 15));

  return {
    weakTopics,
    strongTopics,
    neglectedTopics,
    preparednessScore,
    estimatedPrelimsScore: Math.round(200 * (attempted ? accuracy : 0.45)),
    streakRisk: plan.tasks.some((task) => !task.completed) ? "medium" : "low",
    paperScores: ["GS1", "GS2", "GS3", "GS4", "CSAT", "Essay"].map((paper) => ({
      paper,
      score: scorePaper(progress, topics, paper),
    })),
    activity14Days: buildActivity14Days(attempts ?? [], answers ?? []),
  };
}

function averageScore(rows: unknown[] | null | undefined) {
  const scores = (rows ?? [])
    .map((row) => {
      const candidate = row as { answer_evaluations?: Array<{ total_score?: number }> };
      return Number(candidate.answer_evaluations?.[0]?.total_score ?? 0);
    })
    .filter((score) => score > 0);
  if (!scores.length) return 0;
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function scorePaper(progress: Array<{ topic_key: string; status: string }>, topics: Array<{ key: string; subject: string }>, paper: string) {
  const paperTopics = topics.filter((topic) => topic.subject === paper);
  if (!paperTopics.length) return 0;
  const progressMap = new Map(progress.map((item) => [item.topic_key, item.status]));
  const done = paperTopics.filter((topic) => ["completed", "done"].includes(progressMap.get(topic.key) ?? "")).length;
  return Math.round((done / paperTopics.length) * 100);
}

function buildActivity14Days(attempts: Array<{ attempted_at?: string }>, answers: Array<{ submitted_at?: string }>) {
  return Array.from({ length: 14 }).map((_, index) => {
    const date = new Date(Date.now() - (13 - index) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return {
      day: date.slice(5),
      tasks: 0,
      answers: answers.filter((answer) => String(answer.submitted_at ?? "").startsWith(date)).length,
      attempts: attempts.filter((attempt) => String(attempt.attempted_at ?? "").startsWith(date)).length,
    };
  });
}
