import { z } from "zod";
import { fail, ok } from "@/lib/api/response";
import { awardUserXp } from "@/lib/gamification/xp";
import { getDueFlashcards, persistFlashcardReview, ProductDataError, requireProductUser } from "@/lib/product/db";
import { reviewFlashcard } from "@/lib/product/sm2";

const reviewSchema = z.object({ quality: z.number().int().min(0).max(5) });

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const parsed = reviewSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail("Invalid review quality", 400, parsed.error.flatten());
  try {
    const { supabase, user } = await requireProductUser();
    const card = (await getDueFlashcards(user.id)).find((item) => item.id === params.id);
    if (!card) return fail("Flashcard not found", 404);
    const reviewed = await persistFlashcardReview(user.id, reviewFlashcard(card, parsed.data.quality));
    const xp = parsed.data.quality >= 4 ? await awardUserXp(supabase, user.id, "flashcard_correct") : null;
    return ok({ card: reviewed, xp });
  } catch (error) {
    if (error instanceof ProductDataError && error.status === 401) {
      return ok({ card: { id: params.id, lastQuality: parsed.data.quality, guest: true } });
    }
    if (error instanceof ProductDataError) return fail(error.message, error.status);
    return fail("Could not review flashcard.", 500);
  }
}
