import { fail, ok } from "@/lib/api/response";
import { getDashboardStats, ProductDataError, requireProductUser } from "@/lib/product/db";

export async function GET() {
  try {
    const { user } = await requireProductUser();
    return ok(await getDashboardStats(user.id));
  } catch (error) {
    if (error instanceof ProductDataError && error.status === 401) return ok(guestStats());
    if (error instanceof ProductDataError) return fail(error.message, error.status);
    return fail("Could not load user stats.", 500);
  }
}

function guestStats() {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  return {
    plan: "free",
    nextAction: {
      title: "Start Your First Topic",
      subtitle: "Begin with Judiciary because it gives you the fastest entry into GS2 Polity, rights, courts and current affairs.",
      buttonLabel: "Start Judiciary",
      href: "/study/gs2_polity_judiciary",
      topicTitle: "Judiciary",
      stepLabel: "Step 1: Get It",
    },
    syllabusCompletion: 0,
    currentStreak: 0,
    cardsDue: 3,
    mockScoreTrend: "Start your first mock",
    weakAreas: ["Constitution & Polity", "Indian Economy", "Environment"],
    todayTasks: [
      { id: "guest-plan-1", topicKey: "gs3_economy", topicTitle: "Indian Economy - Overview", taskType: "read", durationMinutes: 45, completed: false, date: today },
      { id: "guest-plan-2", topicKey: "practice", topicTitle: "10-question UPSC sprint", taskType: "practice", durationMinutes: 20, completed: false, date: today },
    ],
    recentScores: [],
    guest: true,
  };
}
