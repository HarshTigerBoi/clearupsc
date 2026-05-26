import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { pricingPlans } from "@/data/blueprint";

export default function PricingPage() {
  return (
    <div className="dark-page bg-[#0a0a0a]">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Pricing"
          title="Start free. Upgrade only when the engine proves useful."
          description="Free tools stay open. Starter, Pro and Premium unlock deeper practice, planning, evaluation and interview preparation."
        />
        <div className="mt-6 grid gap-5 lg:grid-cols-4">
          {pricingPlans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div key={plan.name} className={`rounded-xl border p-5 shadow-sm ${plan.highlighted ? "border-[#f97316] bg-orange-50" : "border-[#e2e8f0] bg-white"}`}>
                <Icon className="text-[#f97316]" size={24} />
                <h2 className="mt-4 text-xl font-black text-[#1a2744]">{plan.name}</h2>
                <p className="mt-1 text-3xl font-black text-[#1a2744]">{plan.price}</p>
                <p className="mt-2 text-sm leading-6 text-[#64748b]">{plan.description}</p>
                <ul className="mt-5 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2 text-sm leading-6 text-slate-700">
                      <CheckCircle2 className="mt-0.5 shrink-0 text-green-600" size={16} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href={plan.name === "Free" ? "/optional-selector" : "/billing"} className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#1a2744] px-4 text-sm font-bold text-white">
                  {plan.name === "Free" ? "Start free" : "Manage in billing"}
                </Link>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
