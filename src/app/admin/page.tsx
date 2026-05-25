import ProductShell from "@/components/product/ProductShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { createAdminClient } from "@/lib/supabase/admin";

async function countTable(table: string) {
  const supabase = createAdminClient();
  if (!supabase) return 0;
  const { count } = await supabase.from(table).select("*", { count: "exact", head: true });
  return count ?? 0;
}

export default async function AdminPage() {
  const [profiles, subscriptions, answers, mocks, waitlist, topics, questions] = await Promise.all([
    countTable("user_profiles"),
    countTable("subscriptions"),
    countTable("answer_submissions"),
    countTable("mock_test_attempts"),
    countTable("waitlist"),
    countTable("topics"),
    countTable("questions"),
  ]);

  const paidConversion = profiles ? Math.round((subscriptions / profiles) * 100) : 0;

  return (
    <ProductShell>
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader eyebrow="Admin" title="Business metrics" description="Launch dashboard for signups, conversion, answer activity and content depth." />
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            ["Profiles", String(profiles)],
            ["Waitlist", String(waitlist)],
            ["Free -> paid", `${paidConversion}%`],
            ["Answer submissions", String(answers)],
            ["Mock attempts", String(mocks)],
            ["Topics seeded", String(topics)],
            ["MCQs seeded", String(questions)],
            ["Monthly churn", "N/A"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
              <p className="mt-2 text-3xl font-black text-[#1a2744]">{value}</p>
            </div>
          ))}
        </div>
      </section>
    </ProductShell>
  );
}
