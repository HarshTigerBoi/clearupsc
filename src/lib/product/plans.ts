import type { PlanName } from "@/types";

const rank: Record<PlanName, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  premium: 3,
};

export type FeatureKey =
  | "optional_selector"
  | "practice_sprint"
  | "syllabus_view"
  | "flashcards_limited"
  | "planner"
  | "flashcards_full"
  | "answer_writing"
  | "mock_tests"
  | "current_affairs"
  | "interview"
  | "unlimited_answer_writing"
  | "priority";

const requiredPlan: Record<FeatureKey, PlanName> = {
  optional_selector: "free",
  practice_sprint: "free",
  syllabus_view: "free",
  flashcards_limited: "free",
  planner: "pro",
  flashcards_full: "pro",
  answer_writing: "pro",
  mock_tests: "pro",
  current_affairs: "pro",
  interview: "premium",
  unlimited_answer_writing: "premium",
  priority: "premium",
};

export function hasPlan(current: PlanName, required: PlanName) {
  return rank[current] >= rank[required];
}

export function canAccess(feature: FeatureKey, plan: PlanName) {
  return hasPlan(plan, requiredPlan[feature]);
}

export function requiredPlanFor(feature: FeatureKey) {
  return requiredPlan[feature];
}

export function upgradeMessage(required: PlanName) {
  return `Upgrade to ${required} to use this feature.`;
}
