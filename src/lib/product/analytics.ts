import { createClient } from "@/lib/supabase/server";
import { getSyllabusProgress, getTodayPlan } from "@/lib/product/db";
import type { Topic, TopicProgressRecord } from "@/types";

const TOTAL_COURSE_TOPICS = 1196;
const SUBJECTS = ["GS1", "GS2", "GS3", "GS4", "CSAT", "Essay"] as const;

type MasteryBand = "green" | "orange" | "red";
type MockTrend = "improving" | "declining" | "stable" | "none";

export interface UserAnalytics {
  overallProgress: {
    completedTopics: number;
    studiedTopics: number;
    totalTopics: number;
    remainingTopics: number;
    percentComplete: number;
  };
  subjectMastery: Array<{
    subject: (typeof SUBJECTS)[number];
    percent: number;
    completed: number;
    total: number;
    band: MasteryBand;
  }>;
  estimatedPrelims: {
    averageScore: number;
    estimatedScore: number;
    band: MasteryBand;
    label: string;
  };
  activity14Days: Array<{
    day: string;
    date: string;
    topicsStudied: number;
    tasks: number;
    answers: number;
    attempts: number;
  }>;
  revisionDebt: {
    count: number;
    topics: Array<{ topicKey: string; title: string; dueDate: string }>;
    flashcardsDueSoon: number;
  };
  mockTrajectory: {
    scores: Array<{ date: string; score: number }>;
    trend: MockTrend;
    label: string;
  };
  weakTopics: string[];
  strongTopics: string[];
  neglectedTopics: string[];
  preparednessScore: number;
  estimatedPrelimsScore: number;
  streakRisk: "low" | "medium" | "high";
  paperScores: Array<{ paper: string; score: number }>;
}

export async function getUserAnalytics(userId: string): Promise<UserAnalytics> {
  const supabase = await createClient();
  const [{ topics, progress }, plan] = await Promise.all([getSyllabusProgress(userId), getTodayPlan(userId)]);
  const topicByKey = new Map(topics.map((topic) => [topic.key, topic]));

  const [{ data: attempts }, { data: answers }, { data: mocks }, { count: flashcardsDueSoon }] = await Promise.all([
    supabase
      .from("mcq_attempts")
      .select("question_id,is_correct,attempted_at")
      .eq("user_id", userId)
      .order("attempted_at", { ascending: false })
      .limit(300),
    supabase
      .from("answer_submissions")
      .select("id,submitted_at,answer_evaluations(total_score)")
      .eq("user_id", userId)
      .order("submitted_at", { ascending: false })
      .limit(100),
    supabase
      .from("mock_test_attempts")
      .select("total_score,submitted_at")
      .eq("user_id", userId)
      .eq("status", "evaluated")
      .order("submitted_at", { ascending: false })
      .limit(5),
    supabase
      .from("flashcard_queue")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .lte("next_review_at", daysFromNow(3).toISOString()),
  ]);

  const totalTopics = Math.max(topics.length, TOTAL_COURSE_TOPICS);
  const completedTopics = progress.filter(isCompleted).length;
  const studiedTopics = progress.filter((item) => item.status !== "not_started").length;
  const overallProgress = {
    completedTopics,
    studiedTopics,
    totalTopics,
    remainingTopics: Math.max(0, totalTopics - completedTopics),
    percentComplete: percent(completedTopics, totalTopics),
  };

  const subjectMastery = SUBJECTS.map((subject) => {
    const subjectTopics = topics.filter((topic) => topic.subject === subject);
    const subjectKeys = new Set(subjectTopics.map((topic) => topic.key));
    const completed = progress.filter((item) => subjectKeys.has(item.topic_key) && isCompleted(item)).length;
    const score = percent(completed, subjectTopics.length);
    return {
      subject,
      percent: score,
      completed,
      total: subjectTopics.length,
      band: masteryBand(score),
    };
  });

  const averageTopicScore = average(progress.map((item) => item.last_score).filter((score): score is number => typeof score === "number"));
  const estimatedScore = Math.round((averageTopicScore / 100) * 200 * 0.7);
  const estimatedPrelims = {
    averageScore: Math.round(averageTopicScore),
    estimatedScore,
    band: prelimsBand(estimatedScore),
    label: prelimsLabel(estimatedScore),
  };

  const revisionTopics = buildRevisionDebt(progress, topicByKey);
  const mockTrajectory = buildMockTrajectory(mocks ?? []);
  const needsRevision = progress.filter((item) => item.status === "needs_revision" || (item.last_score ?? 100) < 60 || (item.mistakes_count ?? 0) > 2);
  const staleCutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
  const neglectedTopics = progress
    .filter((item) => item.last_studied_at && new Date(item.last_studied_at).getTime() < staleCutoff)
    .slice(0, 8)
    .map((item) => topicByKey.get(item.topic_key)?.title ?? item.topic_key);
  const weakTopics = needsRevision.slice(0, 8).map((item) => topicByKey.get(item.topic_key)?.title ?? item.topic_key);
  const strongTopics = progress
    .filter((item) => (item.confidence_score ?? 0) >= 85 || (item.last_score ?? 0) >= 85)
    .slice(0, 8)
    .map((item) => topicByKey.get(item.topic_key)?.title ?? item.topic_key);

  const mcqCorrect = (attempts ?? []).filter((item) => item.is_correct).length;
  const mcqAttempted = attempts?.length ?? 0;
  const accuracy = mcqAttempted ? mcqCorrect / mcqAttempted : averageTopicScore / 100;
  const syllabusScore = totalTopics ? completedTopics / totalTopics : 0;
  const answerScore = averageAnswerScore(answers);
  const preparednessScore = Math.round(Math.min(100, syllabusScore * 45 + accuracy * 40 + (answerScore / 100) * 15));

  return {
    overallProgress,
    subjectMastery,
    estimatedPrelims,
    activity14Days: buildActivity14Days(progress, attempts ?? [], answers ?? []),
    revisionDebt: {
      count: revisionTopics.length,
      topics: revisionTopics.slice(0, 5),
      flashcardsDueSoon: flashcardsDueSoon ?? 0,
    },
    mockTrajectory,
    weakTopics,
    strongTopics,
    neglectedTopics,
    preparednessScore,
    estimatedPrelimsScore: estimatedScore,
    streakRisk: plan.tasks.some((task) => !task.completed) ? "medium" : "low",
    paperScores: subjectMastery.map((item) => ({ paper: item.subject, score: item.percent })),
  };
}

function isCompleted(item: TopicProgressRecord) {
  return item.status === "completed" || item.status === "done";
}

function percent(done: number, total: number) {
  if (!total) return 0;
  return Math.round((done / total) * 100);
}

function average(scores: number[]) {
  if (!scores.length) return 0;
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function masteryBand(score: number): MasteryBand {
  if (score > 70) return "green";
  if (score >= 40) return "orange";
  return "red";
}

function prelimsBand(score: number): MasteryBand {
  if (score > 140) return "green";
  if (score >= 100) return "orange";
  return "red";
}

function prelimsLabel(score: number) {
  if (score > 140) return "Prelims Clearing Zone";
  if (score >= 100) return "Borderline - needs improvement";
  return "At Risk - focus on MCQ practice";
}

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function buildRevisionDebt(progress: TopicProgressRecord[], topicByKey: Map<string, Topic>) {
  const cutoff = daysFromNow(3).toISOString().slice(0, 10);
  return progress
    .filter((item) => item.status !== "not_started" && item.next_review_at && item.next_review_at.slice(0, 10) <= cutoff)
    .sort((a, b) => String(a.next_review_at).localeCompare(String(b.next_review_at)))
    .map((item) => ({
      topicKey: item.topic_key,
      title: topicByKey.get(item.topic_key)?.title ?? item.topic_key.replaceAll("_", " "),
      dueDate: String(item.next_review_at).slice(0, 10),
    }));
}

function buildMockTrajectory(rows: Array<{ total_score?: unknown; submitted_at?: unknown }>) {
  const scores = [...rows]
    .reverse()
    .map((row) => ({
      date: String(row.submitted_at ?? "").slice(5, 10) || "Mock",
      score: Math.round(Number(row.total_score ?? 0)),
    }))
    .filter((row) => Number.isFinite(row.score));

  if (!scores.length) {
    return { scores: [], trend: "none" as const, label: "Take your first mock to see trajectory" };
  }

  const first = scores[0]?.score ?? 0;
  const last = scores[scores.length - 1]?.score ?? 0;
  const delta = last - first;
  const trend: MockTrend = Math.abs(delta) < 5 ? "stable" : delta > 0 ? "improving" : "declining";
  const label = trend === "improving" ? "Improving" : trend === "declining" ? "Declining" : "Stable";
  return { scores, trend, label };
}

function averageAnswerScore(rows: unknown[] | null | undefined) {
  const scores = (rows ?? [])
    .map((row) => {
      const candidate = row as { answer_evaluations?: Array<{ total_score?: number }> };
      return Number(candidate.answer_evaluations?.[0]?.total_score ?? 0);
    })
    .filter((score) => score > 0);
  return average(scores);
}

function buildActivity14Days(
  progress: TopicProgressRecord[],
  attempts: Array<{ attempted_at?: string }>,
  answers: Array<{ submitted_at?: string }>,
) {
  return Array.from({ length: 14 }).map((_, index) => {
    const date = new Date(Date.now() - (13 - index) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return {
      day: date.slice(5),
      date,
      topicsStudied: progress.filter((item) => String(item.last_studied_at ?? "").startsWith(date)).length,
      tasks: 0,
      answers: answers.filter((answer) => String(answer.submitted_at ?? "").startsWith(date)).length,
      attempts: attempts.filter((attempt) => String(attempt.attempted_at ?? "").startsWith(date)).length,
    };
  });
}
