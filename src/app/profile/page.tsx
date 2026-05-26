import { redirect } from "next/navigation";
import ProductShell from "@/components/product/ProductShell";
import { PageHeader } from "@/components/layout/PageHeader";
import BadgeShowcase from "@/components/gamification/BadgeShowcase";
import { getCurrentPlan, getUserProfile } from "@/lib/product/db";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/?login=true");

  const [profile, plan] = await Promise.all([getUserProfile(user.id), getCurrentPlan(user.id)]);

  const rows = [
    ["Email", user.email ?? "Not available"],
    ["Plan", plan.toUpperCase()],
    ["Attempt", profile?.attempt_number ? `${profile.attempt_number}${profile.attempt_number === 1 ? "st" : profile.attempt_number === 2 ? "nd" : "rd+"} attempt` : "Not set"],
    ["Daily availability", profile?.daily_hours_available ? `${profile.daily_hours_available} hours` : "Not set"],
    ["Optional", profile?.optional_subject ?? "Not set"],
    ["Target year", profile?.target_exam_year ? String(profile.target_exam_year) : "Not set"],
    ["Weak areas", profile?.weak_subjects?.length ? profile.weak_subjects.join(", ") : "None selected"],
    ["Strong areas", profile?.strong_subjects?.length ? profile.strong_subjects.join(", ") : "None selected"],
  ];

  return (
    <ProductShell>
      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader eyebrow="Profile" title="Your preparation profile" description="This profile drives optional recommendation, daily planning and weak-area prioritisation." />
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <dl className="grid gap-4 sm:grid-cols-2">
            {rows.map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-slate-50 p-4">
                <dt className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</dt>
                <dd className="mt-1 text-lg font-black text-[#1a2744]">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <BadgeShowcase />
      </section>
    </ProductShell>
  );
}
