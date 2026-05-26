import { fail, ok } from "@/lib/api/response";
import { ProductDataError, requireProductUser } from "@/lib/product/db";
import { getUserAnalytics } from "@/lib/product/analytics";

export async function GET() {
  try {
    const { user } = await requireProductUser();
    return ok(await getUserAnalytics(user.id));
  } catch (error) {
    if (error instanceof ProductDataError && error.status === 401) return ok(guestAnalytics());
    if (error instanceof ProductDataError) return fail(error.message, error.status);
    return fail("Could not load analytics.", 500);
  }
}

function guestAnalytics() {
  const activity14Days = Array.from({ length: 14 }).map((_, index) => {
    const date = new Date(Date.now() - (13 - index) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return { day: date.slice(5), date, topicsStudied: 0, tasks: 0, attempts: 0, answers: 0 };
  });

  return {
    overallProgress: {
      completedTopics: 0,
      studiedTopics: 0,
      totalTopics: 1196,
      remainingTopics: 1196,
      percentComplete: 0,
    },
    subjectMastery: ["GS1", "GS2", "GS3", "GS4", "CSAT", "Essay"].map((subject) => ({
      subject,
      percent: 0,
      completed: 0,
      total: 0,
      band: "red",
    })),
    estimatedPrelims: {
      averageScore: 0,
      estimatedScore: 0,
      band: "red",
      label: "At Risk - focus on MCQ practice",
    },
    activity14Days,
    revisionDebt: {
      count: 0,
      topics: [],
      flashcardsDueSoon: 0,
    },
    mockTrajectory: {
      scores: [],
      trend: "none",
      label: "Take your first mock to see trajectory",
    },
    weakTopics: ["Federalism", "Inflation", "Modern India"],
    strongTopics: [],
    neglectedTopics: ["Start by marking topics in the syllabus tracker"],
    preparednessScore: 0,
    estimatedPrelimsScore: 0,
    streakRisk: "medium",
    paperScores: ["GS1", "GS2", "GS3", "GS4", "CSAT", "Essay"].map((paper) => ({ paper, score: 0 })),
    guest: true,
  };
}
