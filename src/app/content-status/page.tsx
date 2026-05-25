import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { createClient } from "@/lib/supabase/server";

type StatusMetric = {
  label: string;
  value: number | string;
  note: string;
};

const qualityStatuses = ["fallback", "wiki_seeded", "ncert_enriched", "human_review_needed", "publish_ready"] as const;

export default async function ContentStatusPage() {
  const metrics = await getContentMetrics();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] bg-[#1a2744] p-6 text-white shadow-sm sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-300">Content Source Status</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">No fake PYQ labels. No fake course claims.</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-200 sm:text-base">
            ClearUPSC is being built as a source-grounded UPSC course. Official UPSC questions are separated from ClearUPSC original pattern practice, and notes are marked by review depth.
          </p>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metrics.top.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-[#1a2744]">Question Bank Truth</h2>
            <div className="mt-5 space-y-3">
              {metrics.questionSources.map((source) => (
                <div key={source.label} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4">
                  <div>
                    <p className="font-black text-slate-800">{source.label}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{source.note}</p>
                  </div>
                  <span className="rounded-full bg-[#1a2744] px-3 py-1 text-sm font-black text-white">{source.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-[#1a2744]">Notes Quality</h2>
            <div className="mt-5 space-y-3">
              {metrics.quality.map((source) => (
                <div key={source.label} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4">
                  <div>
                    <p className="font-black capitalize text-slate-800">{source.label.replaceAll("_", " ")}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{source.note}</p>
                  </div>
                  <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-black text-indigo-700">{source.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-[#1a2744]">What Counts As Real</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <TruthCard title="UPSC Official" body="Only questions imported from UPSC question-paper PDFs. They are scored only when an official answer key has been mapped." />
            <TruthCard title="ClearUPSC Original" body="Fresh UPSC-pattern practice created for coverage and feedback. Useful for drilling, but not marketed as official PYQ." />
            <TruthCard title="Source-Grounded Notes" body="Original explanations using NCERT links, Wikipedia attribution, and government references. Long textbook text is not copied." />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/practice" className="inline-flex min-h-11 items-center rounded-full bg-[#1a2744] px-5 text-sm font-black text-white">
              Open Practice
            </Link>
            <Link href="/study" className="inline-flex min-h-11 items-center rounded-full border border-slate-200 px-5 text-sm font-black text-[#1a2744]">
              Open Study
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

function MetricCard({ metric }: { metric: StatusMetric }) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-black text-slate-500">{metric.label}</p>
      <p className="mt-2 text-4xl font-black text-[#1a2744]">{metric.value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{metric.note}</p>
    </div>
  );
}

function TruthCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-3xl bg-slate-50 p-5">
      <h3 className="font-black text-[#1a2744]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}

async function getContentMetrics() {
  try {
    const supabase = await createClient();
    const [
      topics,
      questions,
      officialPyqs,
      answerVerifiedPyqs,
      patternPyqs,
      ...qualityCounts
    ] = await Promise.all([
      countRows(supabase, "topics"),
      countRows(supabase, "questions"),
      countRows(supabase, "pyq_questions", (query) => query.ilike("source", "%Official%")),
      countRows(supabase, "pyq_questions", (query) => query.ilike("source", "%Official%").not("correct_option", "is", null)),
      countRows(supabase, "pyq_questions", (query) => query.not("source", "ilike", "%Official%")),
      ...qualityStatuses.map((status) => countRows(supabase, "topics", (query) => query.eq("content_quality", status))),
    ]);

    return {
      top: [
        { label: "Syllabus topics", value: topics, note: "Total topics currently in Supabase." },
        { label: "Practice MCQs", value: questions, note: "Mostly ClearUPSC original UPSC-pattern questions." },
        { label: "Official questions", value: officialPyqs, note: "Imported from UPSC official question-paper PDFs." },
        { label: "Verified answer keys", value: answerVerifiedPyqs, note: "Official questions with mapped official answer key." },
      ],
      questionSources: [
        { label: "UPSC official question-paper imports", value: officialPyqs, note: "Review-only unless answer key is verified." },
        { label: "Official questions with verified answers", value: answerVerifiedPyqs, note: "Safe to score as PYQ practice." },
        { label: "Pattern questions in PYQ table", value: patternPyqs, note: "Must stay labeled as based on UPSC pattern." },
        { label: "ClearUPSC original practice", value: questions, note: "Coverage-building questions, not official PYQs." },
      ],
      quality: qualityStatuses.map((status, index) => ({
        label: status,
        value: qualityCounts[index],
        note: qualityNote(status),
      })),
    };
  } catch {
    return {
      top: [
        { label: "Syllabus topics", value: "Unavailable", note: "Could not read Supabase counts." },
        { label: "Practice MCQs", value: "Unavailable", note: "Could not read Supabase counts." },
        { label: "Official questions", value: "Unavailable", note: "Could not read Supabase counts." },
        { label: "Verified answer keys", value: "Unavailable", note: "Could not read Supabase counts." },
      ],
      questionSources: [],
      quality: [],
    };
  }
}

async function countRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: string,
  refine?: (query: any) => any,
) {
  let query: any = supabase.from(table).select("*", { count: "exact", head: true });
  if (refine) query = refine(query);
  const { count } = await query;
  return count ?? 0;
}

function qualityNote(status: (typeof qualityStatuses)[number]) {
  const notes = {
    fallback: "Basic generated fallback, not ready as final course content.",
    wiki_seeded: "Wikipedia-backed seed layer with attribution.",
    ncert_enriched: "NCERT-linked original notes and explainers.",
    human_review_needed: "Useful but still needs a UPSC content review.",
    publish_ready: "Deep reviewed notes close to the target course standard.",
  };
  return notes[status];
}
