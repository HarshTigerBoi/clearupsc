import type { StudyPlanTask, Topic, TopicProgressRecord, UserProfile } from "@/types";

export type PersonalizationProfile =
  | Partial<UserProfile>
  | {
      educational_background?: string | null;
      daily_hours_available?: number | null;
      target_exam_year?: number | string | null;
      weak_subjects?: unknown;
      strong_subjects?: unknown;
      optional_subject?: string | null;
      prelims_cleared_before?: boolean | null;
    }
  | null
  | undefined;

type TopicLike = Pick<Topic, "key" | "title" | "subject"> & {
  parent?: string;
  upscWeightage?: number;
  examStage?: Topic["examStage"];
};

type PlanTaskSeed = Pick<StudyPlanTask, "taskType" | "durationMinutes"> & {
  topicKey: string;
};

const SUBJECT_PRIORITY = [
  "gs2_polity",
  "gs1_history",
  "gs3_economy",
  "gs1_geography",
  "gs3_environment",
  "gs2_governance",
  "gs3_science",
  "gs4_ethics",
  "gs2_ir",
  "csat",
  "essay",
];

const WEAK_SUBJECT_PREFIXES: Record<string, string[]> = {
  GS1: ["gs1_history", "gs1_geography", "gs1_society"],
  GS2: ["gs2_polity", "gs2_governance", "gs2_social", "gs2_ir"],
  GS3: ["gs3_economy", "gs3_environment", "gs3_science", "gs3_agriculture", "gs3_security"],
  GS4: ["gs4_ethics", "gs4_case"],
  CSAT: ["csat"],
  Economy: ["gs3_economy"],
  Polity: ["gs2_polity"],
  Governance: ["gs2_governance"],
  History: ["gs1_history"],
  Geography: ["gs1_geography"],
  Environment: ["gs3_environment"],
  Ethics: ["gs4_ethics"],
};

const FOUNDATION_SEQUENCE = [
  "preamble",
  "fundamental_rights",
  "dpsp",
  "fundamental_duties",
  "indus",
  "vedic",
  "buddhism",
  "jainism",
  "maurya",
  "physical",
  "climate",
  "drainage",
  "gdp",
  "inflation",
  "fiscal",
  "environment",
  "biodiversity",
  "ethics",
  "values",
];

function normaliseArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function getProfileValue(profile: PersonalizationProfile, camelKey: keyof UserProfile, snakeKey: string) {
  if (!profile) return undefined;
  if (camelKey in profile) return (profile as Partial<UserProfile>)[camelKey];
  return (profile as Record<string, unknown>)[snakeKey];
}

export function normalisePersonalizationProfile(profile: PersonalizationProfile) {
  const level = String(getProfileValue(profile, "educationalBackground", "educational_background") ?? "Beginner");
  const dailyHours = Number(getProfileValue(profile, "dailyHoursAvailable", "daily_hours_available") ?? 4);
  const targetExamYear = Number(getProfileValue(profile, "targetExamYear", "target_exam_year") ?? 2026);
  const weakSubjects = normaliseArray(getProfileValue(profile, "weakSubjects", "weak_subjects"));
  const strongSubjects = normaliseArray(getProfileValue(profile, "strongSubjects", "strong_subjects"));
  const optionalSubject = getProfileValue(profile, "optionalSubject", "optional_subject");
  return {
    level,
    dailyHoursAvailable: Number.isFinite(dailyHours) ? dailyHours : 4,
    targetExamYear: Number.isFinite(targetExamYear) ? targetExamYear : 2026,
    weakSubjects,
    strongSubjects,
    optionalSubject: typeof optionalSubject === "string" ? optionalSubject : null,
  };
}

function subjectPriorityIndex(topic: TopicLike) {
  const key = topic.key.toLowerCase();
  const index = SUBJECT_PRIORITY.findIndex((prefix) => key.startsWith(prefix));
  if (index >= 0) return index;
  const subjectIndex = ["GS2", "GS1", "GS3", "GS4", "CSAT", "Essay"].indexOf(topic.subject);
  return subjectIndex >= 0 ? SUBJECT_PRIORITY.length + subjectIndex : SUBJECT_PRIORITY.length + 10;
}

function foundationIndex(topic: TopicLike) {
  const key = topic.key.toLowerCase();
  const title = topic.title.toLowerCase();
  const index = FOUNDATION_SEQUENCE.findIndex((token) => key.includes(token) || title.includes(token.replaceAll("_", " ")));
  return index >= 0 ? index : FOUNDATION_SEQUENCE.length + subjectPriorityIndex(topic);
}

function weakPrefixes(weakSubjects: string[]) {
  return weakSubjects.flatMap((subject) => {
    const direct = WEAK_SUBJECT_PREFIXES[subject];
    if (direct) return direct;
    const lower = subject.toLowerCase();
    return Object.entries(WEAK_SUBJECT_PREFIXES)
      .filter(([key]) => key.toLowerCase().includes(lower) || lower.includes(key.toLowerCase()))
      .flatMap(([, prefixes]) => prefixes);
  });
}

function isWeakTopic(topic: TopicLike, prefixes: string[]) {
  const key = topic.key.toLowerCase();
  return prefixes.some((prefix) => key.startsWith(prefix.toLowerCase()));
}

function isBasicTopic(topic: TopicLike) {
  const key = topic.key.toLowerCase();
  const title = topic.title.toLowerCase();
  return (
    key.includes("intro") ||
    key.includes("basic") ||
    key.includes("definition") ||
    key.includes("concept") ||
    title.includes("introduction") ||
    title.includes("basics") ||
    title.includes("definition")
  );
}

function progressRepairScore(topic: TopicLike, progressByTopic: Map<string, TopicProgressRecord>) {
  const progress = progressByTopic.get(topic.key);
  if (!progress) return 0;
  const mistakes = Number(progress.mistakes_count ?? 0);
  const lowScore = progress.last_score === undefined || progress.last_score === null ? 0 : Math.max(0, 100 - progress.last_score);
  const needsRevision = progress.status === "needs_revision" ? 40 : 0;
  return mistakes * 15 + lowScore + needsRevision;
}

function topicScore(topic: TopicLike, profile: ReturnType<typeof normalisePersonalizationProfile>, progressByTopic: Map<string, TopicProgressRecord>) {
  const level = profile.level.toLowerCase();
  const weak = isWeakTopic(topic, weakPrefixes(profile.weakSubjects));
  const weight = Number(topic.upscWeightage ?? 1);
  let score = 0;

  score += (SUBJECT_PRIORITY.length - subjectPriorityIndex(topic)) * 100;
  score += weight * 25;
  if (weak) score += 650;
  if (profile.targetExamYear <= 2026 && weight >= 4) score += 220;
  if (profile.dailyHoursAvailable <= 2 && weight < 4) score -= 450;

  if (level.includes("beginner")) {
    score += (FOUNDATION_SEQUENCE.length - foundationIndex(topic)) * 45;
  } else if (level.includes("intermediate")) {
    if (isBasicTopic(topic) || weight <= 2) score -= 260;
  } else if (level.includes("advanced")) {
    score += progressRepairScore(topic, progressByTopic) * 8;
    if (isBasicTopic(topic)) score -= 320;
  }

  return score;
}

export function generatePersonalizedTopicSequence({
  profile,
  topics,
  progress = [],
}: {
  profile?: PersonalizationProfile;
  topics: TopicLike[];
  progress?: TopicProgressRecord[];
}): { sequence: string[]; nextTopicKey: string | null; reason: string } {
  const normalized = normalisePersonalizationProfile(profile);
  const progressByTopic = new Map(progress.map((item) => [item.topic_key, item]));
  const started = new Set(progress.filter((item) => item.status !== "not_started").map((item) => item.topic_key));
  const weak = weakPrefixes(normalized.weakSubjects);
  const ordered = [...topics].sort((a, b) => {
    const scoreDiff = topicScore(b, normalized, progressByTopic) - topicScore(a, normalized, progressByTopic);
    if (scoreDiff !== 0) return scoreDiff;
    return a.key.localeCompare(b.key);
  });
  const sequence = ordered.map((topic) => topic.key);
  const nextTopic = ordered.find((topic) => !started.has(topic.key)) ?? ordered[0] ?? null;

  let reason = "Following your personalized UPSC sequence";
  if (nextTopic && isWeakTopic(nextTopic, weak)) reason = `Prioritising ${normalized.weakSubjects[0]} because you marked it weak`;
  else if (normalized.dailyHoursAvailable <= 2) reason = "Prioritising high-yield topics for your 2-hour schedule";
  else if (normalized.level.toLowerCase().includes("advanced")) reason = "Repairing gaps before adding more basic coverage";
  else if (normalized.targetExamYear <= 2026) reason = "Prioritising high-yield topics for UPSC 2026 urgency";
  else if (normalized.level.toLowerCase().includes("beginner")) reason = "Building your foundation in topper-recommended order";

  return { sequence, nextTopicKey: nextTopic?.key ?? null, reason };
}

export function buildPersonalizedWeekPlan({
  profile,
  topics,
  progress = [],
}: {
  profile?: PersonalizationProfile;
  topics: TopicLike[];
  progress?: TopicProgressRecord[];
}): PlanTaskSeed[][] {
  const normalized = normalisePersonalizationProfile(profile);
  const { sequence } = generatePersonalizedTopicSequence({ profile, topics, progress });
  const hours = Math.max(2, Math.min(10, normalized.dailyHoursAvailable));
  const topicsPerDay = hours <= 2 ? 1 : hours <= 4 ? 2 : 3;
  const mainMinutes = hours <= 2 ? 75 : hours <= 4 ? 60 : 55;

  return Array.from({ length: 7 }).map((_, day) => {
    const start = day * topicsPerDay;
    const topicKeys = sequence.slice(start, start + topicsPerDay);
    const tasks: PlanTaskSeed[] = topicKeys.map((topicKey, index) => ({
      topicKey,
      taskType: index === 0 ? "read" : "revise",
      durationMinutes: mainMinutes,
    }));

    if (hours >= 4) tasks.push({ topicKey: "current_affairs", taskType: "current_affairs", durationMinutes: 30 });
    if (hours >= 6) tasks.push({ topicKey: topicKeys[0] ?? sequence[0] ?? "gs2_polity_judiciary", taskType: "practice", durationMinutes: 30 });
    if (hours >= 8 && !normalized.level.toLowerCase().includes("beginner")) {
      tasks.push({ topicKey: topicKeys[0] ?? sequence[0] ?? "gs2_polity_judiciary", taskType: "answer_writing", durationMinutes: 25 });
    }

    return tasks;
  });
}
