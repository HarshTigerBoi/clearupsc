import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { FeatureCards } from "@/components/landing/FeatureCards";
import { Hero } from "@/components/landing/Hero";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/server";
import { answerRubric, blueprintProblems, pricingPlans, trustMetrics } from "@/data/blueprint";

async function getWaitlistCount() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return 0;
    const supabase = await createClient();
    const { count } = await supabase.from("waitlist").select("*", { count: "exact", head: true });
    return count ?? 0;
  } catch {
    return 0;
  }
}

export default async function LandingPage() {
  const waitlistCount = await getWaitlistCount();
  const totalScore = answerRubric.reduce((sum, item) => sum + item.score, 0);

  return (
    <>
      <Hero />

      <section className="bg-white py-14">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
          {trustMetrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
                <Icon className="text-[#f97316]" size={22} />
                <p className="mt-4 text-3xl font-black text-[#1a2744]">{metric.value}</p>
                <p className="mt-1 text-sm text-[#64748b]">{metric.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-[#f8fafc] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#f97316]">The real bottleneck</p>
          <h2 className="mt-3 text-3xl font-extrabold text-[#1a2744]">Why most aspirants fail despite studying hard</h2>
          <div className="mt-8 grid gap-5 lg:grid-cols-5">
            {blueprintProblems.map((item) => (
              <div key={item.title} className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
                <h3 className="font-bold text-[#1a2744]">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-red-700">{item.current}</p>
                <p className="mt-3 text-sm leading-6 text-green-700">{item.solution}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#f97316]">The product</p>
            <h2 className="mt-3 text-3xl font-extrabold text-[#1a2744]">One preparation system, not ten disconnected tabs</h2>
            <p className="mt-3 text-sm leading-6 text-[#64748b]">
              The blueprint is simple: choose the right optional, track the whole syllabus, practise source-labeled questions, evaluate answers, revise before forgetting, follow a daily plan, and prepare for the interview from day one.
            </p>
          </div>
          <div className="mt-8">
            <FeatureCards />
          </div>
        </div>
      </section>

      <section className="bg-[#f8fafc] py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#f97316]">Answer evaluation</p>
            <h2 className="mt-3 text-3xl font-extrabold text-[#1a2744]">See feedback like an evaluator, not a motivational quote.</h2>
            <p className="mt-4 text-sm leading-6 text-[#64748b]">
              The AI evaluation module scores content accuracy, structure, clarity, depth and presentation. It unlocks after login when the Pro plan and Claude key are configured.
            </p>
            <Link href="/answer-writing/practice" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-lg bg-[#f97316] px-6 text-sm font-bold text-white hover:bg-[#ea580c]">
              Try answer writing
            </Link>
          </div>
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="font-bold text-[#1a2744]">Sample Mains score</p>
              <p className="text-3xl font-black text-[#1a2744]">{totalScore}/100</p>
            </div>
            <div className="mt-5 space-y-4">
              {answerRubric.map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex justify-between text-sm font-semibold text-slate-700">
                    <span>{item.label}</span>
                    <span>
                      {item.score}/{item.max}
                    </span>
                  </div>
                  <Progress value={(item.score / item.max) * 100} />
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-xl bg-green-50 p-4 text-sm leading-6 text-green-800">
              Strength: clear intro-body-conclusion flow. Improve: add one constitutional article, one current affairs example, and a sharper conclusion.
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#f97316]">Pricing path</p>
          <h2 className="mt-3 text-3xl font-extrabold text-[#1a2744]">Free hook now. Paid engine later.</h2>
          <div className="mt-8 grid gap-5 lg:grid-cols-4">
            {pricingPlans.map((plan) => {
              const Icon = plan.icon;
              return (
                <div key={plan.name} className={`rounded-xl border p-5 shadow-sm ${plan.highlighted ? "border-[#f97316] bg-orange-50" : "border-[#e2e8f0] bg-white"}`}>
                  <Icon className="text-[#f97316]" size={24} />
                  <h3 className="mt-4 text-xl font-black text-[#1a2744]">{plan.name}</h3>
                  <p className="mt-1 text-3xl font-black text-[#1a2744]">{plan.price}</p>
                  <p className="mt-2 text-sm leading-6 text-[#64748b]">{plan.description}</p>
                  <ul className="mt-5 space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-2 text-sm text-slate-700">
                        <CheckCircle2 className="mt-0.5 shrink-0 text-green-600" size={16} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#1a2744] py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-orange-300">Early community</p>
          <h2 className="mt-3 text-3xl font-extrabold text-white">
            {waitlistCount > 0 ? `Join ${waitlistCount} aspirants already preparing smarter` : "Be the first to join ClearUPSC"}
          </h2>
          <p className="mt-3 text-slate-300">Start with the free optional selector, then build your personalised preparation workspace.</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/optional-selector" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#f97316] px-6 text-sm font-bold text-white hover:bg-[#ea580c]">
              Find Your Optional
            </Link>
            <Link href="/dashboard" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/60 px-6 text-sm font-bold text-white hover:bg-white/10">
              Open Dashboard Demo
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
