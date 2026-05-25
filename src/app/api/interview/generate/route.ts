import { z } from "zod";
import { generateInterviewQuestions } from "@/lib/ai/interview";
import { fail, ok } from "@/lib/api/response";
import { ProductDataError, requireProductUser, saveDaf } from "@/lib/product/db";

const dafSchema = z.object({
  name: z.string().default(""),
  dateOfBirth: z.string().default(""),
  hometown: z.string().default(""),
  graduationSubject: z.string().default(""),
  collegeName: z.string().default(""),
  stateOfDomicile: z.string().default(""),
  hobbies: z.array(z.string()).default([]),
  workExperience: z.string().default(""),
  optionalSubject: z.string().default(""),
  servicePreference: z.array(z.string()).default([]),
  achievements: z.string().default(""),
  educationDetails: z.string().default(""),
  familyBackground: z.string().default(""),
  nativeLanguage: z.string().default(""),
  visitedPlaces: z.string().default(""),
  extracurriculars: z.string().default(""),
});

export async function POST(request: Request) {
  const parsed = dafSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail("Invalid DAF", 400, parsed.error.flatten());
  try {
    const { user } = await requireProductUser();
    await saveDaf(user.id, parsed.data);
    return ok({ questions: await generateInterviewQuestions(parsed.data), aiMode: process.env.ANTHROPIC_API_KEY ? "anthropic" : "local-daf" });
  } catch (error) {
    if (error instanceof ProductDataError) return fail(error.message, error.status);
    return fail("Could not generate interview.", 500);
  }
}
