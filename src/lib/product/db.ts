import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { SYLLABUS } from "@/data/syllabus";
import { PYQS } from "@/data/pyqs";
import type {
  AnswerEvaluation,
  DafEntry,
  Flashcard,
  InterviewQuestion,
  MockResult,
  PYQQuestion,
  StudyPlanTask,
  TopicProgressRecord,
  UserStats,
  UserProfile,
} from "@/types";

export class ProductDataError extends Error {
  constructor(
    message: string,
    public status = 500,
  ) {
    super(message);
  }
}

export async function requireProductUser() {
  if (!hasSupabaseConfig()) throw new ProductDataError("Supabase is not configured.", 503);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new ProductDataError("Authentication required.", 401);
  return { supabase, user };
}

export async function getCurrentPlan(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("plan,status,current_period_end")
    .eq("user_id", userId)
    .in("status", ["active", "trial"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data?.plan as UserStats["plan"] | undefined) ?? "free";
}

export async function getTopicsFromDb() {
  const supabase = await createClient();
  const rows: Array<{ key: unknown; subject: unknown; parent_key: unknown; title: unknown; exam_stage: unknown; upsc_weightage: unknown }> = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("topics")
      .select("key,subject,parent_key,title,exam_stage,upsc_weightage")
      .order("subject", { ascending: true })
      .order("key", { ascending: true })
      .range(from, from + 999);
    if (error) return SYLLABUS;
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }

  if (!rows.length) return SYLLABUS;

  return rows.map((topic) => ({
    key: String(topic.key),
    title: String(topic.title),
    subject: String(topic.subject) as (typeof SYLLABUS)[number]["subject"],
    parent: topic.parent_key ? String(topic.parent_key) : undefined,
    examStage: topic.exam_stage as (typeof SYLLABUS)[number]["examStage"],
    upscWeightage: Number(topic.upsc_weightage ?? 1),
  }));
}

export async function ensureTodayPlan(userId: string) {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: existing } = await supabase
    .from("study_plans")
    .select("id,total_hours,completed")
    .eq("user_id", userId)
    .eq("date", today)
    .maybeSingle();

  if (existing?.id) return existing.id as string;

  const { data: plan, error: planError } = await supabase
    .from("study_plans")
    .insert({ user_id: userId, date: today, total_hours: 4 })
    .select("id")
    .single();
  if (planError || !plan) throw new ProductDataError("Could not create today's study plan.");

  const seedTasks = [
    { topic_key: "gs1_history_modern_india", task_type: "revise", duration_minutes: 45 },
    { topic_key: "gs3_economy_inflation", task_type: "read", duration_minutes: 60 },
    { topic_key: "gs2_polity_federalism", task_type: "answer_writing", duration_minutes: 25 },
    { topic_key: "current_affairs", task_type: "current_affairs", duration_minutes: 30 },
  ];

  const { error: taskError } = await supabase.from("study_plan_tasks").insert(
    seedTasks.map((task) => ({
      plan_id: plan.id,
      ...task,
    })),
  );
  if (taskError) throw new ProductDataError("Could not seed today's tasks.");

  return plan.id as string;
}

export async function getTodayPlan(userId: string) {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const planId = await ensureTodayPlan(userId);
  const topics = await getTopicsFromDb();
  await redistributeOverdueTasks(userId, planId);

  const { data, error } = await supabase
    .from("study_plan_tasks")
    .select("id,topic_key,task_type,duration_minutes,completed")
    .eq("plan_id", planId)
    .order("duration_minutes", { ascending: false });
  if (error) throw new ProductDataError("Could not load today's plan.");

  const tasks: StudyPlanTask[] = (data ?? []).map((task) => {
    const topicKey = String(task.topic_key ?? "");
    const topic = topics.find((item) => item.key === topicKey);
    return {
      id: String(task.id),
      topicKey,
      topicTitle: topic?.title ?? (topicKey === "current_affairs" ? "Current affairs recall" : topicKey.replaceAll("_", " ")),
      taskType: task.task_type as StudyPlanTask["taskType"],
      durationMinutes: Number(task.duration_minutes ?? 0),
      completed: Boolean(task.completed),
      date: today,
    };
  });

  const totalMinutes = tasks.reduce((sum, task) => sum + task.durationMinutes, 0);
  const completedMinutes = tasks.filter((task) => task.completed).reduce((sum, task) => sum + task.durationMinutes, 0);
  const overdueCount = await getOverdueTaskCount(userId);

  return { date: today, totalMinutes, completedMinutes, recoveryMode: overdueCount > 5, tasks };
}

async function redistributeOverdueTasks(userId: string, todayPlanId: string) {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data: overdue } = await supabase
    .from("study_plan_tasks")
    .select("topic_key,task_type,duration_minutes,study_plans!inner(user_id,date)")
    .eq("study_plans.user_id", userId)
    .lt("study_plans.date", today)
    .eq("completed", false)
    .limit(5);

  if (!overdue?.length) return;

  const { data: todayTasks } = await supabase
    .from("study_plan_tasks")
    .select("topic_key,task_type")
    .eq("plan_id", todayPlanId);
  const existing = new Set((todayTasks ?? []).map((task) => `${task.topic_key}:${task.task_type}`));
  const carryForward = overdue
    .filter((task) => !existing.has(`${task.topic_key}:${task.task_type}`))
    .map((task) => ({
      plan_id: todayPlanId,
      topic_key: task.topic_key,
      task_type: task.task_type,
      duration_minutes: Math.min(45, Number(task.duration_minutes ?? 30)),
    }));

  if (carryForward.length) await supabase.from("study_plan_tasks").insert(carryForward);
}

async function getOverdueTaskCount(userId: string) {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { count } = await supabase
    .from("study_plan_tasks")
    .select("id,study_plans!inner(user_id,date)", { count: "exact", head: true })
    .eq("study_plans.user_id", userId)
    .lt("study_plans.date", today)
    .eq("completed", false);
  return count ?? 0;
}

export async function completeTask(userId: string, taskId: string, completed: boolean) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("study_plan_tasks")
    .update({ completed, completed_at: completed ? new Date().toISOString() : null })
    .eq("id", taskId)
    .select("id,study_plans!inner(user_id)")
    .single();
  if (error || !data) throw new ProductDataError("Task not found.", 404);
  const plan = data.study_plans as { user_id?: string } | Array<{ user_id?: string }> | null;
  const owner = Array.isArray(plan) ? plan[0]?.user_id : plan?.user_id;
  if (owner !== userId) throw new ProductDataError("Task not found.", 404);
  return getTodayPlan(userId);
}

export async function getSyllabusProgress(userId: string) {
  const supabase = await createClient();
  const topics = await getTopicsFromDb();
  const { data, error } = await supabase.from("topic_progress").select("topic_key,status,confidence_score,last_studied_at").eq("user_id", userId);
  if (error) throw new ProductDataError("Could not load syllabus progress.");
  return {
    topics,
    progress: (data ?? []).map((row) => ({
      topic_key: String(row.topic_key),
      status: row.status as TopicProgressRecord["status"],
      confidence_score: Number(row.confidence_score ?? 0),
      last_studied_at: row.last_studied_at ? String(row.last_studied_at) : null,
    })),
  };
}

export async function updateTopicProgress(userId: string, topicKey: string, status: TopicProgressRecord["status"]) {
  const supabase = await createClient();
  const topics = await getTopicsFromDb();
  const topic = topics.find((item) => item.key === topicKey);
  if (!topic) throw new ProductDataError("Topic not found.", 404);
  const { data, error } = await supabase
    .from("topic_progress")
    .upsert(
      {
        user_id: userId,
        topic_key: topicKey,
        status,
        confidence_score: status === "completed" || status === "done" ? 80 : status === "needs_revision" ? 35 : 50,
        last_studied_at: status === "not_started" ? null : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,topic_key" },
    )
    .select("topic_key,status,confidence_score,last_studied_at")
    .single();
  if (error || !data) throw new ProductDataError("Could not update topic progress.");
  return data;
}

export async function getDueFlashcards(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("flashcard_queue")
    .select("id,topic_key,question,answer,next_review_at,interval_days,ease_factor,repetitions")
    .eq("user_id", userId)
    .lte("next_review_at", new Date().toISOString())
    .order("next_review_at", { ascending: true })
    .limit(30);
  if (error) throw new ProductDataError("Could not load flashcards.");

  if ((data ?? []).length === 0) {
    await seedStarterFlashcards(userId);
    return getDueFlashcards(userId);
  }

  return (data ?? []).map((card): Flashcard => {
    const topicKey = String(card.topic_key ?? "");
    const topic = SYLLABUS.find((item) => item.key === topicKey);
    return {
      id: String(card.id),
      topicKey,
      topicTitle: topic?.title ?? topicKey.replaceAll("_", " "),
      question: String(card.question),
      answer: String(card.answer),
      nextReviewAt: String(card.next_review_at),
      intervalDays: Number(card.interval_days ?? 1),
      easeFactor: Number(card.ease_factor ?? 2.5),
      repetitions: Number(card.repetitions ?? 0),
    };
  });
}

async function seedStarterFlashcards(userId: string) {
  const supabase = await createClient();
  await supabase.from("flashcard_queue").insert([
    {
      user_id: userId,
      topic_key: "gs2_polity_constitution",
      question: "What is the basic structure doctrine?",
      answer: "Parliament can amend the Constitution, but cannot destroy essential features such as rule of law, judicial review, secularism and federalism.",
    },
    {
      user_id: userId,
      topic_key: "gs3_economy_inflation",
      question: "Why does inflation hurt poor households more?",
      answer: "Poor households spend a larger share of income on essentials, so price rises reduce real purchasing power faster.",
    },
    {
      user_id: userId,
      topic_key: "gs3_environment_ecology",
      question: "What is an ecotone?",
      answer: "A transition zone between two ecosystems, often rich in species because organisms from both sides overlap.",
    },
  ]);
}

export async function persistFlashcardReview(userId: string, card: Flashcard & { lastQuality?: number }) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("flashcard_queue")
    .update({
      next_review_at: card.nextReviewAt,
      interval_days: card.intervalDays,
      ease_factor: card.easeFactor,
      repetitions: card.repetitions,
      last_quality: card.lastQuality ?? null,
    })
    .eq("id", card.id)
    .eq("user_id", userId)
    .select("id")
    .single();
  if (error || !data) throw new ProductDataError("Flashcard not found.", 404);
  return card;
}

export async function storeAnswerEvaluation(userId: string, input: { questionText: string; answerText: string; wordCount: number; timeTakenSeconds: number }, evaluation: AnswerEvaluation) {
  const supabase = await createClient();
  const { data: submission, error: submissionError } = await supabase
    .from("answer_submissions")
    .insert({
      user_id: userId,
      question_text: input.questionText,
      answer_text: input.answerText,
      word_count: input.wordCount,
      time_taken_seconds: input.timeTakenSeconds,
    })
    .select("id,submitted_at")
    .single();
  if (submissionError || !submission) throw new ProductDataError("Could not save answer submission.");

  const { error: evaluationError } = await supabase.from("answer_evaluations").insert({
    submission_id: submission.id,
    content_score: evaluation.content_score,
    structure_score: evaluation.structure_score,
    clarity_score: evaluation.clarity_score,
    depth_score: evaluation.depth_score,
    presentation_score: evaluation.presentation_score,
    total_score: evaluation.total_score,
    ai_feedback: evaluation.overall_feedback,
    strengths: evaluation.strengths,
    improvements: evaluation.improvements,
    model_answer_hint: evaluation.model_answer_hint,
  });
  if (evaluationError) throw new ProductDataError("Could not save answer evaluation.");

  return { id: String(submission.id), submittedAt: String(submission.submitted_at) };
}

export async function storeAnswerSubmissionOnly(userId: string, input: { questionText: string; answerText: string; wordCount: number; timeTakenSeconds: number }) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("answer_submissions")
    .insert({
      user_id: userId,
      question_text: input.questionText,
      answer_text: input.answerText,
      word_count: input.wordCount,
      time_taken_seconds: input.timeTakenSeconds,
    })
    .select("id,submitted_at")
    .single();
  if (error || !data) throw new ProductDataError("Could not save answer submission.");
  return { id: String(data.id), submittedAt: String(data.submitted_at) };
}

export async function getAnswerHistory(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("answer_submissions")
    .select("id,question_text,word_count,time_taken_seconds,submitted_at,answer_evaluations(total_score)")
    .eq("user_id", userId)
    .order("submitted_at", { ascending: false })
    .limit(20);
  if (error) throw new ProductDataError("Could not load answer history.");
  return (data ?? []).map((row) => {
    const evaluations = row.answer_evaluations as Array<{ total_score?: number }> | null;
    return {
      id: String(row.id),
      questionText: String(row.question_text),
      wordCount: Number(row.word_count ?? 0),
      timeTakenSeconds: Number(row.time_taken_seconds ?? 0),
      submittedAt: String(row.submitted_at),
      score: Number(evaluations?.[0]?.total_score ?? 0),
    };
  });
}

export async function getMockTestsFromDb() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("mock_tests").select("id,title,test_type,duration_minutes,total_marks").eq("is_active", true);
  if (error) throw new ProductDataError("Could not load mock tests.");
  if ((data ?? []).length === 0) return [];
  return data ?? [];
}

export async function startMockAttempt(userId: string, testId: string) {
  const supabase = await createClient();
  const questions = await getQuestionPool(testId);
  const { data, error } = await supabase
    .from("mock_test_attempts")
    .insert({ user_id: userId, test_id: testId, status: "in_progress" })
    .select("id,started_at")
    .single();
  if (error || !data) throw new ProductDataError("Could not start mock test.");
  return {
    attemptId: String(data.id),
    testId,
    startedAt: String(data.started_at),
    questions: questions.map(({ correct, explanation, ...question }) => question),
  };
}

export async function getQuestionPool(testId: string): Promise<PYQQuestion[]> {
  const supabase = await createClient();
  const { data: test } = await supabase.from("mock_tests").select("test_type,duration_minutes").eq("id", testId).maybeSingle();
  const limit = test?.test_type === "prelims_full" ? 100 : Number(test?.duration_minutes ?? 20) >= 120 ? 80 : 30;
  const { data } = await supabase
    .from("questions")
    .select("id,question_text,year,tags,model_answer,question_options(option_label,option_text,is_correct)")
    .eq("question_type", "mcq")
    .limit(limit);
  const dbQuestions = (data ?? []).map((row): PYQQuestion | null => {
    const optionsRaw = row.question_options as Array<{ option_label?: string; option_text?: string; is_correct?: boolean }> | null;
    if (!optionsRaw || optionsRaw.length < 4) return null;
    const correct = optionsRaw.find((option) => option.is_correct)?.option_label;
    const labels = ["A", "B", "C", "D"] as const;
    if (!labels.includes(correct as (typeof labels)[number])) return null;
    return {
      id: String(row.id),
      subject: inferSubject(row.tags),
      year: Number(row.year ?? 2024),
      question: String(row.question_text),
      options: optionsRaw
        .sort((a, b) => String(a.option_label).localeCompare(String(b.option_label)))
        .map((option) => ({ label: option.option_label as "A" | "B" | "C" | "D", text: String(option.option_text) })),
      correct: correct as "A" | "B" | "C" | "D",
      explanation: String(row.model_answer ?? "Read the statement carefully, connect it with syllabus demand, and remove options that are absolute or conceptually disconnected."),
    };
  }).filter((item): item is PYQQuestion => Boolean(item));

  if (dbQuestions.length >= Math.min(limit, 10)) return dbQuestions.slice(0, limit);
  return testId.includes("2") ? PYQS.filter((question) => ["Economy", "Polity"].includes(question.subject)).slice(0, 10) : PYQS.slice(0, 10);
}

function inferSubject(tags: unknown): PYQQuestion["subject"] {
  const joined = Array.isArray(tags) ? tags.join(" ").toLowerCase() : "";
  if (joined.includes("polity")) return "Polity";
  if (joined.includes("geography")) return "Geography";
  if (joined.includes("economy")) return "Economy";
  if (joined.includes("environment")) return "Environment";
  if (joined.includes("science")) return "Science";
  return "History";
}

export async function finishMockAttempt(userId: string, testId: string, answers: Record<string, "A" | "B" | "C" | "D" | undefined>, timeTakenMinutes = 0, attemptId?: string): Promise<MockResult> {
  const supabase = await createClient();
  const questions = await getQuestionPool(testId);
  let correct = 0;
  let wrong = 0;
  const subjectMap = new Map<string, { correct: number; total: number }>();

  for (const question of questions) {
    const current = subjectMap.get(question.subject) ?? { correct: 0, total: 0 };
    current.total += 1;
    const selected = answers[question.id];
    if (selected && selected === question.correct) {
      correct += 1;
      current.correct += 1;
    } else if (selected) {
      wrong += 1;
      await autoFlagWeakTopic(userId, question.subject);
    }
    subjectMap.set(question.subject, current);
  }

  const unattempted = questions.length - correct - wrong;
  const score = Number((correct * 2 - wrong * 0.67).toFixed(2));
  const attemptPayload = {
    submitted_at: new Date().toISOString(),
    total_score: score,
    time_taken_minutes: timeTakenMinutes,
    status: "evaluated",
  };
  if (attemptId) {
    await supabase.from("mock_test_attempts").update(attemptPayload).eq("id", attemptId).eq("user_id", userId);
  } else {
    await supabase.from("mock_test_attempts").insert({ user_id: userId, test_id: testId, ...attemptPayload });
  }

  const subjectBreakdown = Array.from(subjectMap.entries()).map(([subject, value]) => ({ subject, ...value }));
  return {
    score,
    correct,
    wrong,
    unattempted,
    totalQuestions: questions.length,
    subjectBreakdown,
    weakAreas: subjectBreakdown.filter((item) => item.correct / item.total < 0.5).map((item) => item.subject),
  };
}

async function autoFlagWeakTopic(userId: string, subject: string) {
  const topic = SYLLABUS.find((item) => item.title.toLowerCase().includes(subject.toLowerCase())) ?? SYLLABUS.find((item) => item.subject === "GS3");
  if (topic) await updateTopicProgress(userId, topic.key, "needs_revision");
}

export async function getDashboardStats(userId: string): Promise<UserStats> {
  const supabase = await createClient();
  const [{ progress }, plan, flashcards, history, planName] = await Promise.all([
    getSyllabusProgress(userId),
    getTodayPlan(userId),
    getDueFlashcards(userId),
    getAnswerHistory(userId),
    getCurrentPlan(userId),
  ]);

  const topics = await getTopicsFromDb();
  const completed = progress.filter((item) => item.status === "completed" || item.status === "done").length;
  const needsRevision = progress.filter((item) => item.status === "needs_revision").map((item) => {
    const topic = topics.find((candidate) => candidate.key === item.topic_key);
    return topic?.title ?? item.topic_key;
  });

  const { data: streak } = await supabase.from("user_streaks").select("current_streak").eq("user_id", userId).maybeSingle();

  return {
    plan: planName,
    syllabusCompletion: Math.round((completed / topics.length) * 100),
    currentStreak: Number(streak?.current_streak ?? 0),
    cardsDue: flashcards.length,
    mockScoreTrend: "No trend yet",
    weakAreas: needsRevision.slice(0, 4),
    todayTasks: plan.tasks,
    recentScores: history.map((item) => item.score).filter((score) => score > 0).slice(0, 4),
  };
}

export async function completeOnboarding(userId: string, profile: UserProfile) {
  const supabase = await createClient();
  const { error } = await supabase.from("user_profiles").upsert(
    {
      user_id: userId,
      attempt_number: profile.attemptNumber,
      educational_background: profile.educationalBackground,
      optional_subject: profile.optionalSubject,
      daily_hours_available: profile.dailyHoursAvailable,
      target_exam_year: profile.targetExamYear,
      prelims_cleared_before: profile.prelimsClearedBefore,
      weak_subjects: profile.weakSubjects,
      strong_subjects: profile.strongSubjects,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw new ProductDataError("Could not save onboarding profile.");

  for (let day = 0; day < 7; day += 1) {
    const date = new Date(Date.now() + day * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const { data: plan } = await supabase
      .from("study_plans")
      .upsert({ user_id: userId, date, total_hours: Math.min(10, profile.dailyHoursAvailable) }, { onConflict: "user_id,date" })
      .select("id")
      .single();
    if (plan?.id) {
      await supabase.from("study_plan_tasks").insert([
        { plan_id: plan.id, topic_key: day % 2 === 0 ? "gs2_polity_constitution" : "gs3_economy_inclusive_growth", task_type: "read", duration_minutes: 60 },
        { plan_id: plan.id, topic_key: profile.weakSubjects[0] ? inferWeakTopicKey(profile.weakSubjects[0]) : "gs1_history_modern", task_type: "revise", duration_minutes: 45 },
        { plan_id: plan.id, topic_key: "current_affairs", task_type: "current_affairs", duration_minutes: 30 },
      ]);
    }
  }

  await seedStarterFlashcards(userId);
  return getTodayPlan(userId);
}

function inferWeakTopicKey(subject: string) {
  const lower = subject.toLowerCase();
  if (lower.includes("economy")) return "gs3_economy";
  if (lower.includes("polity")) return "gs2_polity";
  if (lower.includes("environment")) return "gs3_environment";
  if (lower.includes("ethics")) return "gs4_ethics";
  if (lower.includes("csat")) return "csat_reasoning";
  return "gs1_history_modern";
}

export async function getCurrentAffairsFromDb() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("current_affairs")
    .select("date,title,summary,tags,upsc_relevance")
    .order("date", { ascending: false })
    .limit(14);
  if (error) throw new ProductDataError("Could not load current affairs.");
  return (data ?? []).map((item) => ({
    date: String(item.date),
    title: String(item.title),
    tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
    summary: String(item.summary),
    upscAngle: String(item.upsc_relevance ?? ""),
  }));
}

export async function getUserProfile(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("attempt_number,educational_background,optional_subject,daily_hours_available,target_exam_year,prelims_cleared_before,weak_subjects,strong_subjects,onboarding_complete")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new ProductDataError("Could not load profile.");
  return data;
}

export async function saveDaf(userId: string, daf: DafEntry) {
  const supabase = await createClient();
  const { error } = await supabase.from("daf_entries").upsert(
    {
      user_id: userId,
      graduation_subject: daf.graduationSubject,
      college_name: daf.collegeName,
      state_of_domicile: daf.stateOfDomicile,
      hobbies: daf.hobbies,
      work_experience: daf.workExperience,
      optional_subject: daf.optionalSubject,
      service_preference: daf.servicePreference,
      achievements: daf.achievements,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw new ProductDataError("Could not save DAF.");
}

export async function storeInterviewSession(userId: string, questions: InterviewQuestion[], answers: Array<{ question: string; answer: string }>, report: unknown) {
  const supabase = await createClient();
  const { error } = await supabase.from("mock_interview_sessions").insert({
    user_id: userId,
    session_type: "ai",
    questions_asked: { questions, answers },
    overall_feedback: typeof report === "object" && report ? JSON.stringify(report) : String(report ?? ""),
    confidence_score: typeof report === "object" && report && "confidenceScore" in report ? Number(report.confidenceScore) : null,
    completed_at: new Date().toISOString(),
  });
  if (error) throw new ProductDataError("Could not save interview session.");
}
