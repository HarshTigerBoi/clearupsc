import { z } from "zod";
import { fail, ok } from "@/lib/api/response";
import { awardUserXp, XP_ACTIONS } from "@/lib/gamification/xp";
import { ProductDataError, requireProductUser } from "@/lib/product/db";

const xpSchema = z.object({
  action: z.enum(Object.keys(XP_ACTIONS) as [keyof typeof XP_ACTIONS, ...(keyof typeof XP_ACTIONS)[]]),
});

export async function POST(request: Request) {
  const parsed = xpSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail("Invalid XP action.", 400, parsed.error.flatten());
  try {
    const { supabase, user } = await requireProductUser();
    return ok({ xp: await awardUserXp(supabase, user.id, parsed.data.action) });
  } catch (error) {
    if (error instanceof ProductDataError && error.status === 401) return ok({ guest: true });
    if (error instanceof ProductDataError) return fail(error.message, error.status);
    return fail("Could not award XP.", 500);
  }
}
