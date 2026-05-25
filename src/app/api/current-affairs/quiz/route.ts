import { fail, ok } from "@/lib/api/response";
import { getCurrentAffairsFromDb } from "@/lib/product/db";

export async function GET() {
  try {
    const items = await getCurrentAffairsFromDb();
    const questions = items.slice(0, 10).map((item, index) => {
      const tag = item.tags[0] ?? "UPSC";
      return {
        id: `ca-${index}`,
        question: `Which area of the UPSC syllabus is most directly linked with: ${item.title}?`,
        options: [tag, "Ancient History", "Art and Culture", "CSAT Numeracy"],
        correctIndex: 0,
        explanation: item.upscAngle || item.summary,
      };
    });
    return ok({ questions });
  } catch {
    return fail("Could not create current affairs quiz.", 500);
  }
}
