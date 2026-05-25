import { ok } from "@/lib/api/response";

export async function POST() {
  return ok({ verified: false, message: "Payment verification is unavailable until Razorpay webhook secrets are configured." });
}
