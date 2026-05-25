import Link from "next/link";
import ProductShell from "@/components/product/ProductShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { pricingPlans } from "@/data/blueprint";

export default function BillingPage() {
  return (
    <ProductShell>
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader eyebrow="Billing" title="Manage your ClearUPSC plan." description="Free, Starter, Pro and Premium gates are in place. Checkout activates when Razorpay credentials are added." />
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {pricingPlans.map((plan) => (
            <div key={plan.name} className={`rounded-2xl border p-5 shadow-sm ${plan.highlighted ? "border-[#f97316] bg-orange-50" : "border-slate-200 bg-white"}`}>
              <p className="text-xl font-black text-[#1a2744]">{plan.name}</p>
              <p className="mt-2 text-3xl font-black text-[#1a2744]">{plan.price}</p>
              <p className="mt-2 text-sm text-slate-500">{plan.description}</p>
              <Link href="/pricing" className="mt-5 inline-flex rounded-full bg-[#1a2744] px-4 py-2 text-sm font-black text-white">View pricing</Link>
            </div>
          ))}
        </div>
      </section>
    </ProductShell>
  );
}
