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
  return {
    weakTopics: ["Federalism", "Inflation", "Modern India"],
    strongTopics: [],
    neglectedTopics: ["Start by marking topics in the syllabus tracker"],
    preparednessScore: 0,
    estimatedPrelimsScore: 0,
    streakRisk: "medium",
    paperScores: ["GS1", "GS2", "GS3", "GS4", "CSAT", "Essay"].map((paper) => ({ paper, score: 0 })),
    activity14Days: Array.from({ length: 14 }).map((_, index) => {
      const date = new Date(Date.now() - (13 - index) * 24 * 60 * 60 * 1000).toISOString().slice(5, 10);
      return { day: date, tasks: 0, attempts: 0, answers: 0 };
    }),
    guest: true,
  };
}
