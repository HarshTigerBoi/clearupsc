import { ok } from "@/lib/api/response";

export async function POST() {
  return ok({ received: true, active: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET) });
}
