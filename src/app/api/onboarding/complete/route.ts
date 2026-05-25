import { z } from "zod";
import { fail, ok } from "@/lib/api/response";
import { completeOnboarding, ProductDataError, requireProductUser } from "@/lib/product/db";

const onboardingSchema = z.object({
  attemptNumber: z.number().int().min(1).max(6),
  educationalBackground: z.string().min(2),
  dailyHoursAvailable: z.number().int().min(1).max(14),
  optionalSubject: z.string().nullable(),
  targetExamYear: z.number().int().min(2026).max(2035),
  weakSubjects: z.array(z.string()).default([]),
  strongSubjects: z.array(z.string()).default([]),
  prelimsClearedBefore: z.boolean().default(false),
});

export async function POST(request: Request) {
  const parsed = onboardingSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail("Invalid onboarding profile", 400, parsed.error.flatten());
  try {
    const { user } = await requireProductUser();
    const plan = await completeOnboarding(user.id, parsed.data);
    return ok({ profile: { ...parsed.data, onboardingComplete: true }, firstSevenDaysSeeded: true, firstDay: plan.tasks });
  } catch (error) {
    if (error instanceof ProductDataError) return fail(error.message, error.status);
    return fail("Could not complete onboarding.", 500);
  }
}
