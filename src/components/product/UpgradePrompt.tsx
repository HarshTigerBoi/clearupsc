import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import type { FeatureKey } from "@/lib/product/plans";
import { requiredPlanFor } from "@/lib/product/plans";

export function UpgradePrompt({ feature, title }: { feature: FeatureKey; title?: string }) {
  const plan = requiredPlanFor(feature);
  return (
    <div className="rounded-3xl border border-orange-200 bg-orange-50 p-5 text-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-white p-2 text-[#f97316]">
          <LockKeyhole className="h-5 w-5" />
        </div>
        <div>
          <p className="font-black text-[#1a2744]">{title ?? "Upgrade needed"}</p>
          <p className="mt-1 text-slate-600">This feature is part of the {plan.toUpperCase()} plan. You can still explore the preview and upgrade when payments are active.</p>
          <Link href="/pricing" className="mt-3 inline-flex min-h-11 items-center rounded-full bg-[#f97316] px-4 text-sm font-black text-white">
            View plans
          </Link>
        </div>
      </div>
    </div>
  );
}
