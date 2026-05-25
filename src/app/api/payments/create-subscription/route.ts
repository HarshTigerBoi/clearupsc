import { z } from "zod";
import { fail, ok } from "@/lib/api/response";

const schema = z.object({ plan: z.enum(["starter", "pro", "premium"]) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail("Invalid plan", 400, parsed.error.flatten());
  const planIdMap = {
    starter: process.env.RAZORPAY_STARTER_PLAN_ID,
    pro: process.env.RAZORPAY_PRO_PLAN_ID,
    premium: process.env.RAZORPAY_PREMIUM_PLAN_ID,
  };
  const enabled = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && planIdMap[parsed.data.plan]);
  if (enabled) {
    const credentials = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: {
        authorization: `Basic ${credentials}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        plan_id: planIdMap[parsed.data.plan],
        total_count: 120,
        quantity: 1,
        customer_notify: 1,
        notes: { product: "ClearUPSC", plan: parsed.data.plan },
      }),
    });
    if (!response.ok) return fail("Razorpay subscription creation failed.", 502);
    const subscription = (await response.json()) as { id: string; status: string };
    return ok({ checkoutEnabled: true, plan: parsed.data.plan, subscriptionId: subscription.id, status: subscription.status, keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? process.env.RAZORPAY_KEY_ID });
  }
  return ok({
    checkoutEnabled: false,
    plan: parsed.data.plan,
    message: "Razorpay keys or plan IDs are not configured, so checkout is safely disabled.",
  });
}
