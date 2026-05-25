import Link from "next/link";

export function SeoArticle({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm font-black uppercase tracking-[0.25em] text-[#f97316]">{eyebrow}</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight text-[#1a2744] sm:text-5xl">{title}</h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">{description}</p>
      <div className="prose prose-slate mt-8 max-w-none prose-headings:text-[#1a2744] prose-a:text-[#f97316]">{children}</div>
      <div className="mt-10 rounded-3xl bg-[#1a2744] p-6 text-white">
        <h2 className="text-2xl font-black">Prepare inside ClearUPSC</h2>
        <p className="mt-2 text-white/75">Track syllabus, practise MCQs, write answers, review flashcards and build a daily UPSC system.</p>
        <Link href="/practice" className="mt-5 inline-flex min-h-11 items-center rounded-full bg-[#f97316] px-5 text-sm font-black text-white">Try free practice</Link>
      </div>
    </section>
  );
}
