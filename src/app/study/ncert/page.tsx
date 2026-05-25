"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Eye, LibraryBig, Search, X } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import ProductShell from "@/components/product/ProductShell";
import { NCERT_LIBRARY, ncertClasses, ncertGsPapers, ncertSubjects } from "@/lib/study/ncert";

export default function NcertLibraryPage() {
  const [classLevel, setClassLevel] = useState("All");
  const [subject, setSubject] = useState("All");
  const [paper, setPaper] = useState("All");
  const [search, setSearch] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const chapters = useMemo(() => {
    return NCERT_LIBRARY.filter((chapter) => {
      const text = `${chapter.classLevel} ${chapter.subject} ${chapter.gsPaper} ${chapter.book} ${chapter.chapter} ${chapter.topicKeys.join(" ")}`.toLowerCase();
      return (
        (classLevel === "All" || chapter.classLevel === classLevel) &&
        (subject === "All" || chapter.subject === subject) &&
        (paper === "All" || chapter.gsPaper === paper) &&
        text.includes(search.toLowerCase())
      );
    });
  }, [classLevel, paper, search, subject]);

  return (
    <ProductShell>
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="NCERT Library"
          title="Foundation books mapped to UPSC topics."
          description="Read the core NCERT chapters, then jump into the linked ClearUPSC topic for notes, practice and revision."
        />

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4">
            <Search className="h-5 w-5 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search book, chapter, topic or subject..."
              className="min-h-12 flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <FilterSelect label="Class" value={classLevel} onChange={setClassLevel} values={ncertClasses()} />
            <FilterSelect label="Subject" value={subject} onChange={setSubject} values={ncertSubjects()} />
            <FilterSelect label="Paper" value={paper} onChange={setPaper} values={ncertGsPapers()} />
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {chapters.map((chapter) => (
            <article key={`${chapter.book}-${chapter.chapter}`} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#1a2744] px-3 py-1 text-xs font-black text-white">{chapter.classLevel}</span>
                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">{chapter.subject}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{chapter.gsPaper}</span>
              </div>
              <h2 className="mt-4 text-xl font-black text-[#1a2744]">{chapter.chapter}</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">{chapter.book}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {chapter.topicKeys.map((topic) => (
                  <Link key={topic} href={`/study/${topic}`} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 hover:bg-orange-100 hover:text-orange-700">
                    {topic.replaceAll("_", " ")}
                  </Link>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <button onClick={() => setPreviewUrl(chapter.url)} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#1a2744] px-4 text-sm font-black text-white">
                  Preview in app <Eye className="h-4 w-4" />
                </button>
                <a href={chapter.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#f97316] px-4 text-sm font-black text-white">
                  Open official source <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </article>
          ))}
        </div>

        {!chapters.length ? (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            No NCERT chapter matched this filter. Clear the filters and search by the wider subject name.
          </div>
        ) : null}

        {previewUrl ? (
          <div className="fixed inset-0 z-50 bg-slate-950/70 p-3 backdrop-blur sm:p-6">
            <div className="mx-auto flex h-full max-w-6xl flex-col rounded-3xl bg-white shadow-2xl">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4">
                <div className="flex items-center gap-2 font-black text-[#1a2744]">
                  <LibraryBig className="h-5 w-5 text-[#f97316]" />
                  NCERT preview
                </div>
                <button onClick={() => setPreviewUrl(null)} className="grid min-h-11 min-w-11 place-items-center rounded-full bg-slate-100 text-slate-700">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <iframe src={previewUrl} title="NCERT PDF preview" className="min-h-0 flex-1 rounded-b-3xl" />
            </div>
          </div>
        ) : null}
      </section>
    </ProductShell>
  );
}

function FilterSelect({ label, value, values, onChange }: { label: string; value: string; values: string[]; onChange: (value: string) => void }) {
  return (
    <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold normal-case tracking-normal text-[#1a2744] outline-none">
        <option value="All">All</option>
        {values.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </label>
  );
}
