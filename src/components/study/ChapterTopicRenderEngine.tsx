"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpenCheck, CheckCircle2, FileQuestion, RotateCcw, ShieldCheck, XCircle } from "lucide-react";
import type { ChapterTopic, ConceptDecode, UPSCPatternMCQ } from "@/lib/types/ncert-types";

export default function ChapterTopicRenderEngine({ chapter }: { chapter: ChapterTopic }) {
  const hasDecodedContent = chapter.concepts.length > 0;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Link href="/study" className="inline-flex items-center gap-2 text-sm font-black text-slate-600 hover:text-[#1a2744]">
            <ArrowLeft className="h-4 w-4" /> Back to Study
          </Link>
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-green-700">
                  <ShieldCheck className="h-4 w-4" /> NCERT Source Chapter
                </span>
                <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-600">
                  {chapter.subject}
                </span>
              </div>
              <h1 className="mt-4 max-w-4xl text-3xl font-black tracking-tight text-[#1a2744] sm:text-5xl">{chapter.title}</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                Source: {chapter.source.book}, Chapter {chapter.source.chapter}: {chapter.source.chapter_title}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <Metric label="Concepts" value={chapter.concepts.length} />
                <Metric label="MCQs" value={chapter.mcqs.length} />
                <Metric label="PYQs" value={chapter.pyq_count} />
                <Metric label="Weight" value={`${chapter.upsc_weightage}/5`} />
              </div>
              <a href={chapter.source.pdf_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-[#1a2744] px-4 text-sm font-black text-white">
                Open Official Source
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
        <div className="min-w-0 space-y-8">
          {hasDecodedContent ? <ConceptMapper concepts={chapter.concepts} /> : <PendingDecode chapter={chapter} />}
          <QuizEngine mcqs={chapter.mcqs} />
        </div>
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <ChapterRecallSummary chapter={chapter} />
          <RelatedChapters chapters={chapter.related_chapters} />
        </aside>
      </div>
    </main>
  );
}

function ConceptMapper({ concepts }: { concepts: ConceptDecode[] }) {
  return (
    <section className="space-y-6">
      {concepts.map((concept, index) => (
        <article key={`${concept.concept_name}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Concept {index + 1}</p>
              <h2 className="mt-2 text-2xl font-black text-[#1a2744]">{concept.concept_name}</h2>
            </div>
            <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{concept.ncert_page}</span>
          </div>

          <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">Layer 1: The Analogy</p>
            <h3 className="mt-2 text-lg font-black text-amber-950">Simple source-backed explanation</h3>
            <div className="mt-3 space-y-3 text-base leading-8 text-amber-950">
              {paragraphs(concept.simple_explanation).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </section>

          <section className="mt-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Layer 2: Textbook Core</p>
            <div className="mt-3 space-y-4 text-base leading-8 text-slate-700">
              {paragraphs(concept.textbook_content).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </section>

          <section className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <PyqTrace connections={concept.pyq_connections} />
            <RecallFlipCard concept={concept} />
          </section>
        </article>
      ))}
    </section>
  );
}

function PyqTrace({ connections }: { connections: ConceptDecode["pyq_connections"] }) {
  return (
    <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">Layer 3: PYQ Trace</p>
      <h3 className="mt-2 text-lg font-black text-green-950">Exam Relevance</h3>
      <div className="mt-3 space-y-3">
        {connections.length ? connections.map((connection, index) => (
          <div key={`${connection.year}-${connection.question_summary}-${index}`} className="rounded-xl bg-white p-3 text-sm leading-6 text-green-950">
            <p className="font-black">{connection.year ? `${connection.year} | ${connection.paper}` : connection.paper}</p>
            <p className="mt-1">{connection.question_summary}</p>
            <p className="mt-2 text-xs font-bold text-green-700">{connection.ncert_line_that_answers}</p>
          </div>
        )) : (
          <p className="rounded-xl bg-white p-3 text-sm font-bold leading-6 text-green-950">No verified PYQ trace has been attached yet.</p>
        )}
      </div>
    </div>
  );
}

function RecallFlipCard({ concept }: { concept: ConceptDecode }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setFlipped((value) => !value)}
      className="min-h-[220px] rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-left shadow-sm transition hover:border-indigo-400"
      aria-pressed={flipped}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Layer 4: Recall Card</p>
        <RotateCcw className="h-4 w-4 text-indigo-700" />
      </div>
      {!flipped ? (
        <div className="mt-5">
          <p className="text-sm font-bold text-indigo-700">Term</p>
          <h3 className="mt-2 text-2xl font-black text-indigo-950">{concept.recall_card.term}</h3>
          <p className="mt-5 text-xs font-black uppercase tracking-[0.14em] text-indigo-700">Tap to reveal</p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          <p className="text-base font-black leading-7 text-indigo-950">{concept.recall_card.definition}</p>
          <p className="text-sm leading-6 text-indigo-900"><span className="font-black">Key fact:</span> {concept.recall_card.key_fact}</p>
          <p className="text-sm leading-6 text-indigo-900"><span className="font-black">Trap:</span> {concept.recall_card.upsc_trap}</p>
        </div>
      )}
    </button>
  );
}

function QuizEngine({ mcqs }: { mcqs: UPSCPatternMCQ[] }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const score = useMemo(() => mcqs.reduce((sum, mcq, index) => sum + (answers[index] === mcq.correct_answer ? 1 : 0), 0), [answers, mcqs]);

  if (!mcqs.length) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">MCQ Engine</p>
        <h2 className="mt-2 text-2xl font-black text-[#1a2744]">Prove It</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">No source-traced MCQs are attached to this chapter JSON yet.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">MCQ Engine</p>
          <h2 className="mt-2 text-2xl font-black text-[#1a2744]">Prove It</h2>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-700">Score {score}/{mcqs.length}</span>
      </div>
      <div className="mt-6 space-y-5">
        {mcqs.map((mcq, questionIndex) => {
          const selected = answers[questionIndex];
          const answered = Number.isInteger(selected);
          const correct = selected === mcq.correct_answer;
          return (
            <article key={`${mcq.question_text}-${questionIndex}`} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#1a2744] px-3 py-1 text-xs font-black text-white">Q{questionIndex + 1}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.1em] text-slate-600">{mcq.pattern.replaceAll("_", " ")}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">Difficulty {mcq.difficulty_level}/5</span>
              </div>
              <h3 className="mt-4 text-base font-black leading-7 text-slate-950">{mcq.question_text}</h3>
              <div className="mt-4 grid gap-2">
                {mcq.options.map((option, optionIndex) => {
                  const isSelected = selected === optionIndex;
                  const isCorrect = mcq.correct_answer === optionIndex;
                  const tone = !answered
                    ? "border-slate-200 bg-white text-slate-700"
                    : isCorrect
                      ? "border-green-500 bg-green-50 text-green-950"
                      : isSelected
                        ? "border-red-400 bg-red-50 text-red-950"
                        : "border-slate-200 bg-white text-slate-500";
                  return (
                    <button
                      type="button"
                      key={`${option}-${optionIndex}`}
                      onClick={() => setAnswers((current) => ({ ...current, [questionIndex]: optionIndex }))}
                      className={`min-h-12 rounded-xl border px-4 py-3 text-left text-sm font-bold leading-6 ${tone}`}
                    >
                      <span className="mr-2 font-black">{String.fromCharCode(65 + optionIndex)}.</span>{option}
                    </button>
                  );
                })}
              </div>
              {answered ? (
                <div className={`mt-4 rounded-2xl border p-4 ${correct ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                  <p className={`flex items-center gap-2 text-sm font-black ${correct ? "text-green-800" : "text-red-800"}`}>
                    {correct ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    {correct ? "Correct" : "Incorrect"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700"><span className="font-black">Trap:</span> {mcq.trap_explanation}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700"><span className="font-black">Approach:</span> {mcq.approach_technique}</p>
                  <p className="mt-2 text-xs font-bold text-slate-500">{mcq.source_trace}</p>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function PendingDecode({ chapter }: { chapter: ChapterTopic }) {
  return (
    <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 shadow-sm">
      <BookOpenCheck className="h-8 w-8 text-slate-400" />
      <h2 className="mt-4 text-2xl font-black text-[#1a2744]">Source decode pending</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
        This route is ready to render the strict ChapterTopic JSON, but this chapter does not yet have source-decoded concepts in local chapter JSON.
      </p>
      <p className="mt-3 text-sm font-bold text-slate-700">
        Expected source: {chapter.source.book}, Chapter {chapter.source.chapter}: {chapter.source.chapter_title}
      </p>
    </section>
  );
}

function ChapterRecallSummary({ chapter }: { chapter: ChapterTopic }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Quick Index</p>
      <div className="mt-4 space-y-3">
        {chapter.concise_notes.slice(0, 8).map((note) => (
          <div key={`${note.term}-${note.definition}`} className="rounded-xl bg-slate-50 p-3">
            <p className="text-sm font-black text-[#1a2744]">{note.term}</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">{note.definition}</p>
          </div>
        ))}
        {!chapter.concise_notes.length ? <p className="text-sm leading-6 text-slate-600">Recall cards will appear here once concepts are decoded.</p> : null}
      </div>
    </section>
  );
}

function RelatedChapters({ chapters }: { chapters: string[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Related Chapters</p>
      <div className="mt-4 space-y-2">
        {chapters.length ? chapters.map((key) => (
          <Link key={key} href={`/study/${key}`} className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm font-bold text-[#1a2744] hover:bg-slate-100">
            <FileQuestion className="h-4 w-4" /> {key.replaceAll("_", " ")}
          </Link>
        )) : <p className="text-sm leading-6 text-slate-600">No related chapter links attached.</p>}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-white p-3">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-black text-[#1a2744]">{value}</p>
    </div>
  );
}

function paragraphs(text: string) {
  return String(text).split(/\n+/).map((item) => item.trim()).filter(Boolean);
}
