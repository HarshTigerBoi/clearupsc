import { fail, ok } from "@/lib/api/response";
import { getTodayPlan, ProductDataError, requireProductUser } from "@/lib/product/db";

export async function GET() {
  try {
    const { user } = await requireProductUser();
    return ok(await getTodayPlan(user.id));
  } catch (error) {
    if (error instanceof ProductDataError && error.status === 401) return ok(guestPlan());
    if (error instanceof ProductDataError) return fail(error.message, error.status);
    return fail("Could not load today's plan.", 500);
  }
}

function guestPlan() {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  const tasks = [
    { id: "guest-plan-1", topicKey: "gs3_economy", topicTitle: "Indian Economy - Overview", taskType: "read", durationMinutes: 45, completed: false, date: today },
    { id: "guest-plan-2", topicKey: "gs2_polity_constitution", topicTitle: "Constitution & Polity", taskType: "revise", durationMinutes: 35, completed: false, date: today },
    { id: "guest-plan-3", topicKey: "current_affairs", topicTitle: "Current affairs recall", taskType: "current_affairs", durationMinutes: 25, completed: false, date: today },
    { id: "guest-plan-4", topicKey: "practice", topicTitle: "10-question UPSC sprint", taskType: "practice", durationMinutes: 20, completed: false, date: today },
  ] as const;
  return { date: today, totalMinutes: 125, completedMinutes: 0, recoveryMode: false, tasks, guest: true };
}
