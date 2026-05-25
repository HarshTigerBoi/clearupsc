"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ChevronRight, ExternalLink, FileText, Target, Trophy } from "lucide-react";
import ProductShell from "@/components/product/ProductShell";
import { LoadingSkeleton } from "@/components/ui/state";

interface StructuredTopicNotes {
  analogy: { heading: string; body: string };
  full_notes: string;
  concise_notes: Array<{ term: string; definition: string }>;
  revision_bullets: string[];
  mindmap: { center: string; branches: string[] };
  cases: Array<{ name: string; note: string }>;
  schemes: Array<{ name: string; note: string }>;
  ncert_coverage: string[];
  prelims_traps: string[];
  mains_angles: string[];
}

interface TopicLink {
  key: string;
  title: string;
}

interface QuizQuestion {
  id: string;
  source: string;
  year: number | null;
  question: string;
  options: Array<{ label: string; text: string }>;
  correct: string | null;
  explanation: string;
  reviewOnly: boolean;
  trapType?: string | null;
  relatedStudyUrl?: string | null;
}

interface NcertRef {
  classLevel: string;
  subject: string;
  gsPaper?: string;
  book: string;
  chapter: string;
  url: string;
}

interface TopicPayload {
  topic: { key: string; title: string; subject: string; parent_key?: string | null; exam_stage: string; upsc_weightage: number; content_quality?: string | null };
  wiki: null | { summary: string; description: string; imageUrl: string; sourceUrl: string; attribution: string };
  notes: string;
  notesStructured: StructuredTopicNotes;
  ncert: NcertRef[];
  ncertRefs: NcertRef[];
  sources: Array<{ name: string; url: string; type: string }>;
  progress: null | { status: string; confidence_score: number; last_studied_at: string | null };
  prevTopic: TopicLink | null;
  nextTopic: TopicLink | null;
  readTime: { full: string; revision: string };
  quizQuestions: QuizQuestion[];
}

const steps = [
  { id: "get-it", label: "Get It", title: "Understand It First" },
  { id: "learn-it", label: "Learn It", title: "Full Notes" },
  { id: "memorise-it", label: "Memorise It", title: "Concise Notes" },
  { id: "revise-it", label: "Revise It", title: "Last Night Notes" },
  { id: "read-it", label: "Read It", title: "NCERT" },
  { id: "prove-it", label: "Prove It", title: "Official + Pattern Questions" },
] as const;

export default function StudyTopicPage({ params }: { params: { topicId: string } }) {
  const [activeStep, setActiveStep] = useState(0);
  const [stepSixSeen, setStepSixSeen] = useState(false);
  const [notice, setNotice] = useState("");
  const [sessionStarted, setSessionStarted] = useState(false);
  const [actionPanel, setActionPanel] = useState<"flashcard" | "note" | null>(null);
  const [flashcard, setFlashcard] = useState({ question: "", answer: "" });
  const [note, setNote] = useState({ title: "", content: "" });

  const query = useQuery({
    queryKey: ["study-topic", params.topicId],
    queryFn: async () => {
      const response = await fetch(`/api/study/topic/${params.topicId}`);
      if (!response.ok) throw new Error("Topic unavailable");
      return (await response.json()) as TopicPayload;
    },
  });

  const markStudied = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/syllabus/${params.topicId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      if (!response.ok) throw new Error("Could not mark topic studied");
    },
    onSuccess: () => setNotice("Topic marked complete. Your syllabus progress has been updated."),
    onError: () => setNotice("Sign in first, then this will update your syllabus progress."),
  });

  const addFlashcard = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/study/topic/${params.topicId}/flashcard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(flashcard),
      });
      if (!response.ok) throw new Error("Could not add flashcard");
    },
    onSuccess: () => {
      setFlashcard({ question: "", answer: "" });
      setActionPanel(null);
      setNotice("Flashcard added. It will appear in your due-card queue.");
    },
    onError: () => setNotice("Sign in first, then flashcards will save to your revision queue."),
  });

  const addNote = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/study/topic/${params.topicId}/note`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(note),
      });
      if (!response.ok) throw new Error("Could not add note");
    },
    onSuccess: () => {
      setNote({ title: "", content: "" });
      setActionPanel(null);
      setNotice("Topic note saved. You can find it in Notes.");
    },
    onError: () => setNotice("Sign in first, then notes will save to your workspace."),
  });

  useEffect(() => {
    const updateFromScroll = () => {
      let current = 0;
      for (let index = 0; index < steps.length; index += 1) {
        const element = document.getElementById(steps[index].id);
        if (!element) continue;
        if (element.getBoundingClientRect().top <= 220) current = index;
      }
      setActiveStep(current);
      if (current >= 5) setStepSixSeen(true);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const index = steps.findIndex((step) => step.id === visible.target.id);
        if (index >= 0) {
          setActiveStep(index);
          if (index >= 5) setStepSixSeen(true);
        }
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0.15, 0.3, 0.5] },
    );
    steps.forEach((step) => {
      const element = document.getElementById(step.id);
      if (element) observer.observe(element);
    });
    updateFromScroll();
    window.addEventListener("scroll", updateFromScroll, { passive: true });
    window.addEventListener("resize", updateFromScroll);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateFromScroll);
      window.removeEventListener("resize", updateFromScroll);
    };
  }, [query.data?.topic.key]);

  if (query.isLoading) {
    return (
      <ProductShell>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <LoadingSkeleton rows={8} />
        </main>
      </ProductShell>
    );
  }

  if (!query.data) {
    return (
      <ProductShell>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-700">Topic could not be loaded.</div>
        </main>
      </ProductShell>
    );
  }

  const data = query.data;
  const ncert = data.ncertRefs?.[0] ?? data.ncert?.[0] ?? null;
  const answerUrl = `/answer-writing/practice?topic=${encodeURIComponent(data.topic.key)}&question=${encodeURIComponent(`Write a 150-word UPSC answer on ${data.topic.title}.`)}`;

  return (
    <ProductShell>
      <main className="scroll-smooth bg-slate-50 pb-28 text-slate-900">
        <Hero data={data} />
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[160px_minmax(0,1fr)] lg:px-8">
          <StepSidebar activeStep={activeStep} />
          <div className="min-w-0 space-y-8">
            <StudyLoopCard
              started={sessionStarted}
              onStart={() => {
                setSessionStarted(true);
                document.getElementById("get-it")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            />
            <StepSection id="get-it" step="01" label="Get It" title="Understand It First" tone="warm">
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm sm:p-7">
                <p className="text-sm font-black uppercase tracking-[0.16em] text-amber-700">Easy analogy</p>
                <h2 className="mt-2 text-2xl font-black text-amber-950">{data.notesStructured.analogy.heading}</h2>
                <div className="mt-4 space-y-3 text-base leading-8 text-amber-950">
                  {splitParagraphs(data.notesStructured.analogy.body).map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </StepSection>

            <StepSection id="learn-it" step="02" label="Learn It" title="Full Notes" tone="white">
              <RichNotes notes={data.notesStructured.full_notes} cases={data.notesStructured.cases} schemes={data.notesStructured.schemes} />
              <SourcePanel sources={data.sources} coverage={data.notesStructured.ncert_coverage} traps={data.notesStructured.prelims_traps} mainsAngles={data.notesStructured.mains_angles} />
              <Mindmap center={data.notesStructured.mindmap.center || data.topic.title} branches={data.notesStructured.mindmap.branches} />
            </StepSection>

            <StepSection id="memorise-it" step="03" label="Memorise It" title="Concise Notes" tone="gray">
              <ConciseTable rows={data.notesStructured.concise_notes} />
            </StepSection>

            <StepSection id="revise-it" step="04" label="Revise It" title="Last Night Notes" tone="white">
              <div className="mb-4 inline-flex rounded-full bg-red-100 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-red-700">
                Revise Before Exam
              </div>
              <ul className="grid gap-3">
                {data.notesStructured.revision_bullets.slice(0, 10).map((bullet, index) => (
                  <li key={`${bullet}-${index}`} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold leading-6 text-slate-700 shadow-sm">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-red-600 text-xs text-white">{index + 1}</span>
                    {bullet}
                  </li>
                ))}
              </ul>
            </StepSection>

            <StepSection id="read-it" step="05" label="Read It" title="NCERT" tone="gray">
              <NcertViewer ncert={ncert} />
            </StepSection>

            <StepSection id="prove-it" step="06" label="Prove It" title="Official + Pattern Questions" tone="white">
              <QuestionPractice questions={data.quizQuestions} />
            </StepSection>

            <ActionPanel
              active={actionPanel}
              flashcard={flashcard}
              note={note}
              onFlashcardChange={setFlashcard}
              onNoteChange={setNote}
              onSubmitFlashcard={() => addFlashcard.mutate()}
              onSubmitNote={() => addNote.mutate()}
              onClose={() => setActionPanel(null)}
              flashcardPending={addFlashcard.isPending}
              notePending={addNote.isPending}
            />

            {notice ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold text-[#1a2744] shadow-sm">{notice}</div>
            ) : null}
          </div>
        </div>

        <MobileProgress activeStep={activeStep} />
        <div className="fixed bottom-4 left-4 right-4 z-40 flex flex-wrap justify-center gap-2 rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-2xl backdrop-blur md:left-1/2 md:right-auto md:-translate-x-1/2">
          <button onClick={() => setActionPanel("flashcard")} className="min-h-11 rounded-full bg-[#1a2744] px-4 text-xs font-black text-white">
            Add Flashcard
          </button>
          <button onClick={() => setActionPanel("note")} className="min-h-11 rounded-full border border-slate-200 px-4 text-xs font-black text-[#1a2744]">
            Add Note
          </button>
          <Link href={answerUrl} className="inline-flex min-h-11 items-center rounded-full border border-slate-200 px-4 text-xs font-black text-[#1a2744]">
            Write Answer
          </Link>
        </div>
        {stepSixSeen ? (
          <button
            onClick={() => markStudied.mutate()}
            className="fixed bottom-28 right-4 z-40 inline-flex min-h-12 items-center gap-2 rounded-full bg-green-600 px-5 text-sm font-black text-white shadow-2xl md:bottom-24"
          >
            <CheckCircle2 className="h-4 w-4" /> Mark Topic Complete
          </button>
        ) : null}
      </main>
    </ProductShell>
  );
}

function Hero({ data }: { data: TopicPayload }) {
  const paperLabel = data.topic.subject.replace("GS", "GS-");
  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500">
              <Link href="/study" className="hover:text-[#1a2744]">Study</Link>
              <ChevronRight className="h-4 w-4" />
              <span>{paperLabel}</span>
              <ChevronRight className="h-4 w-4" />
              <span>{data.topic.parent_key?.replaceAll("_", " ") ?? "Syllabus"}</span>
              <ChevronRight className="h-4 w-4" />
              <span className="text-[#1a2744]">{data.topic.title}</span>
            </div>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-[#1a2744] sm:text-6xl">{data.topic.title}</h1>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge>{data.topic.exam_stage}</Badge>
              <Badge>{data.readTime.full}</Badge>
              <Badge>{data.readTime.revision}</Badge>
              <Badge>Weightage {data.topic.upsc_weightage}/5</Badge>
              <Badge>{qualityLabel(data.topic.content_quality)}</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <TopicNavLink direction="prev" topic={data.prevTopic} />
            <TopicNavLink direction="next" topic={data.nextTopic} />
          </div>
        </div>
      </div>
    </section>
  );
}

function TopicNavLink({ direction, topic }: { direction: "prev" | "next"; topic: TopicLink | null }) {
  const disabled = !topic;
  const label = direction === "prev" ? "Previous" : "Next";
  if (disabled) {
    return <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 px-4 text-sm font-black text-slate-300">{label}</span>;
  }
  return (
    <Link href={`/study/${topic.key}`} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-[#1a2744] shadow-sm hover:border-[#f97316]">
      {direction === "prev" ? <ArrowLeft className="h-4 w-4" /> : null}
      {label}
      {direction === "next" ? <ArrowRight className="h-4 w-4" /> : null}
    </Link>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.08em] text-slate-600">{children}</span>;
}

function qualityLabel(value?: string | null) {
  if (!value) return "Course layer";
  return value.replaceAll("_", " ");
}

function StudyLoopCard({ started, onStart }: { started: boolean; onStart: () => void }) {
  const items = ["Easy explanation", "Full notes", "Concise revision", "NCERT", "10 MCQs", "Flashcard", "Answer writing", "Progress"];
  return (
    <section className="rounded-[2rem] border border-indigo-100 bg-gradient-to-br from-[#1a2744] to-[#312e81] p-5 text-white shadow-sm sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-200">Today&apos;s Study Loop</p>
          <h2 className="mt-2 text-2xl font-black">Read, practise, revise, write, then mark progress.</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {items.map((item) => (
              <span key={item} className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-indigo-50">
                {item}
              </span>
            ))}
          </div>
        </div>
        <button onClick={onStart} className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#f97316] px-5 text-sm font-black text-white">
          {started ? "Continue Session" : "Start Study Session"}
        </button>
      </div>
    </section>
  );
}

function StepSidebar({ activeStep }: { activeStep: number }) {
  return (
    <aside className="sticky top-6 hidden self-start lg:block">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-4 text-xs font-black uppercase tracking-[0.16em] text-slate-400">Progress</p>
        <nav className="space-y-2">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => document.getElementById(step.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-xs font-black transition ${activeStep === index ? "bg-[#1a2744] text-white" : "text-slate-500 hover:bg-slate-50"}`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${activeStep >= index ? "bg-[#f97316]" : "bg-slate-300"}`} />
              {index + 1}. {step.label}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}

function MobileProgress({ activeStep }: { activeStep: number }) {
  return (
    <div className="fixed inset-x-3 bottom-20 z-30 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-2xl backdrop-blur lg:hidden">
      <div className="flex items-center justify-between text-xs font-black text-[#1a2744]">
        <span>Step {activeStep + 1} of 6</span>
        <span>{steps[activeStep].label}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all" style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }} />
      </div>
    </div>
  );
}

function StepSection({ id, step, label, title, tone, children }: { id: string; step: string; label: string; title: string; tone: "warm" | "white" | "gray"; children: React.ReactNode }) {
  const bg = tone === "gray" ? "bg-slate-100" : tone === "warm" ? "bg-amber-50/60" : "bg-white";
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={`relative scroll-mt-8 overflow-hidden rounded-[2rem] border border-slate-200 ${bg} p-5 shadow-sm sm:p-8`}
    >
      <span className="pointer-events-none absolute right-5 top-0 text-8xl font-black leading-none text-slate-200/70 sm:text-9xl">{step}</span>
      <div className="relative">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
        <h2 className="mt-2 bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-5xl">{title}</h2>
        <div className="mt-6">{children}</div>
      </div>
    </motion.section>
  );
}

function RichNotes({ notes, cases, schemes }: { notes: string; cases: StructuredTopicNotes["cases"]; schemes: StructuredTopicNotes["schemes"] }) {
  const lines = useMemo(() => notes.split(/\n+/).map((line) => line.trim()).filter(Boolean), [notes]);
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-3">
          {lines.map((line, index) => renderNoteLine(line, index))}
        </div>
      </div>
      <div className="space-y-4">
        <Callout title="Supreme Court Cases" color="blue" items={cases.length ? cases : [{ name: "Cases coming soon", note: "Case notes will appear here once this topic is reviewed." }]} />
        <Callout title="Schemes & Sources" color="green" items={schemes.length ? schemes : [{ name: "Reference layer", note: "Use government sources and current affairs links to enrich answers." }]} />
      </div>
    </div>
  );
}

function SourcePanel({
  sources,
  coverage,
  traps,
  mainsAngles,
}: {
  sources: TopicPayload["sources"];
  coverage: string[];
  traps: string[];
  mainsAngles: string[];
}) {
  return (
    <div className="mt-6 grid gap-4 xl:grid-cols-3">
      <MiniList title="NCERT Coverage" items={coverage} />
      <MiniList title="Prelims Traps" items={traps} />
      <MiniList title="Mains Angles" items={mainsAngles} />
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-3">
        <h3 className="text-lg font-black text-[#1a2744]">Reference Sources</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {(sources.length ? sources : [{ name: "PIB", url: "https://pib.gov.in/", type: "Government releases and schemes" }]).map((source) => (
            <a key={`${source.name}-${source.url}`} href={source.url} target="_blank" rel="noreferrer" className="rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:border-[#f97316]">
              <p className="font-black text-[#1a2744]">{source.name}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{source.type}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-black text-[#1a2744]">{title}</h3>
      <ul className="mt-3 space-y-2">
        {(items.length ? items : ["This layer is being reviewed."]).slice(0, 8).map((item) => (
          <li key={`${title}-${item}`} className="text-sm leading-6 text-slate-600">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function renderNoteLine(line: string, index: number) {
  if (/^PART [A-Z] -/.test(line)) {
    return <h2 key={`${line}-${index}`} className="pt-5 text-2xl font-black text-[#1a2744]">{line.replace(/^PART [A-Z] -\s*/, "")}</h2>;
  }
  if (/^\d+\.\s+/.test(line)) {
    return <h3 key={`${line}-${index}`} className="pt-4 text-xl font-black text-slate-900">{renderInlineChips(line)}</h3>;
  }
  if (/^[-\u2022]\s+/.test(line)) {
    return <p key={`${line}-${index}`} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold leading-7 text-slate-700">{renderInlineChips(line.replace(/^[-\u2022]\s+/, ""))}</p>;
  }
  if (/^[A-Z][A-Za-z0-9 .()/-]{2,64}:$/.test(line)) {
    return <h3 key={`${line}-${index}`} className="pt-3 text-lg font-black text-indigo-800">{line}</h3>;
  }
  return <p key={`${line}-${index}`} className="text-sm leading-7 text-slate-700">{renderInlineChips(line)}</p>;
}

function renderInlineChips(line: string) {
  const parts = line.split(/(\bArticle\s+\d+[A-Z]?\b|\b\d{4}\b|\b\d+%\b|\b[A-Z][A-Za-z-]+ v\.? [A-Z][A-Za-z ]+\b)/g);
  return parts.map((part, index) => {
    if (/^(Article\s+\d+[A-Z]?|\d{4}|\d+%)$/.test(part)) {
      return <span key={`${part}-${index}`} className="mx-1 inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-xs font-black text-purple-700">{part}</span>;
    }
    if (/\bv\.?\s+/.test(part)) {
      return <strong key={`${part}-${index}`} className="font-black text-blue-800">{part}</strong>;
    }
    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function Callout({ title, color, items }: { title: string; color: "blue" | "green"; items: Array<{ name: string; note: string }> }) {
  const className = color === "blue" ? "border-blue-500 bg-blue-50 text-blue-950" : "border-green-500 bg-green-50 text-green-950";
  return (
    <div className={`rounded-3xl border-l-4 p-4 ${className}`}>
      <h3 className="font-black">{title}</h3>
      <div className="mt-3 space-y-3">
        {items.slice(0, 6).map((item) => (
          <div key={`${title}-${item.name}`}>
            <p className="text-sm font-black">{item.name}</p>
            <p className="mt-1 text-xs leading-5 opacity-80">{item.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Mindmap({ center, branches }: { center: string; branches: string[] }) {
  const nodes = branches.slice(0, 6);
  const coords = [
    [50, 13],
    [82, 30],
    [78, 70],
    [50, 87],
    [18, 70],
    [18, 30],
  ];
  return (
    <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-black text-[#1a2744]">Simple mindmap</h3>
      <svg viewBox="0 0 100 100" className="mt-4 h-[320px] w-full">
        <defs>
          <linearGradient id="mindmap-gradient" x1="0" x2="1">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#9333ea" />
          </linearGradient>
        </defs>
        {nodes.map((node, index) => (
          <line key={`line-${node}`} x1="50" y1="50" x2={coords[index][0]} y2={coords[index][1]} stroke="#cbd5e1" strokeWidth="0.6" />
        ))}
        <circle cx="50" cy="50" r="13" fill="url(#mindmap-gradient)" />
        <foreignObject x="38" y="43" width="24" height="14">
          <div className="flex h-full items-center justify-center text-center text-[3px] font-black leading-tight text-white">{center}</div>
        </foreignObject>
        {nodes.map((node, index) => (
          <g key={node}>
            <circle cx={coords[index][0]} cy={coords[index][1]} r="10" fill="#fff" stroke="#cbd5e1" />
            <foreignObject x={coords[index][0] - 8} y={coords[index][1] - 5} width="16" height="10">
              <div className="flex h-full items-center justify-center text-center text-[2.5px] font-bold leading-tight text-slate-700">{node}</div>
            </foreignObject>
          </g>
        ))}
      </svg>
    </div>
  );
}

function ConciseTable({ rows }: { rows: StructuredTopicNotes["concise_notes"] }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-[0.8fr_1.2fr] bg-[#1a2744] text-sm font-black text-white">
        <div className="p-4">Term</div>
        <div className="p-4">Definition</div>
      </div>
      {rows.slice(0, 24).map((row, index) => (
        <div key={`${row.term}-${index}`} className="grid grid-cols-[0.8fr_1.2fr] border-t border-slate-200 text-sm">
          <div className="p-4 font-black text-[#1a2744]">{row.term}</div>
          <div className="p-4 leading-6 text-slate-700">{row.definition}</div>
        </div>
      ))}
    </div>
  );
}

function NcertViewer({ ncert }: { ncert: NcertRef | null }) {
  if (!ncert) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <BookOpen className="h-8 w-8 text-[#f97316]" />
        <h3 className="mt-3 text-xl font-black text-[#1a2744]">NCERT mapping coming soon</h3>
        <p className="mt-2 text-sm text-slate-600">Use the full NCERT library while this topic is mapped.</p>
        <Link href="/study/ncert" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#1a2744] px-4 text-sm font-black text-white">
          Open NCERT library <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
    );
  }
  const isPdf = ncert.url.toLowerCase().endsWith(".pdf");
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 rounded-2xl bg-indigo-50 p-4 text-sm font-bold leading-6 text-indigo-900">
        Now that you understand the topic, the NCERT will feel easy.
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-black text-[#1a2744]">{ncert.chapter}</h3>
          <p className="mt-1 text-sm text-slate-500">{ncert.classLevel} | {ncert.subject} | {ncert.book}</p>
        </div>
        <a href={ncert.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#1a2744] px-4 text-sm font-black text-white">
          Official PDF <ExternalLink className="h-4 w-4" />
        </a>
      </div>
      {isPdf ? (
        <iframe title={`${ncert.chapter} NCERT`} src={ncert.url} className="mt-5 h-[72vh] min-h-[520px] w-full rounded-2xl border border-slate-200 bg-slate-100" />
      ) : (
        <div className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
          This NCERT entry opens on the official NCERT textbook page.
        </div>
      )}
      <Link href="/study/ncert" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 px-4 text-sm font-black text-[#1a2744]">
        Full NCERT page <FileText className="h-4 w-4" />
      </Link>
    </div>
  );
}

function QuestionPractice({ questions }: { questions: QuizQuestion[] }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const answerable = questions.filter((question) => !question.reviewOnly && question.correct);
  const attempted = answerable.filter((question) => answers[question.id]).length;
  const correct = answerable.filter((question) => answers[question.id] === question.correct).length;
  const done = answerable.length > 0 && attempted === answerable.length;
  const score = answerable.length ? Math.round((correct / answerable.length) * 100) : 0;
  const chartData = [{ name: "Confidence", score }];

  if (!questions.length) {
    return <div className="rounded-3xl bg-white p-6 text-sm text-slate-600 shadow-sm">Questions are being mapped for this topic.</div>;
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3 text-sm font-black text-[#1a2744]">
          <span>{correct} of {answerable.length} answered correctly</span>
          <span>{score}%</span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all" style={{ width: `${score}%` }} />
        </div>
      </div>

      {questions.map((question, index) => {
        const selected = answers[question.id];
        const isCorrect = selected && question.correct ? selected === question.correct : false;
        return (
          <div key={question.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">Question {index + 1}</span>
              {question.year && String(question.source).toLowerCase().includes("official") ? (
                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">UPSC official {question.year}</span>
              ) : null}
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-black text-indigo-700">{question.source}</span>
              {question.trapType ? <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">{question.trapType}</span> : null}
            </div>
            <h3 className="mt-4 text-lg font-black leading-7 text-[#1a2744]">{question.question}</h3>
            <div className="mt-4 grid gap-2">
              {question.options.map((option) => {
                const showCorrect = selected && question.correct === option.label;
                const showWrong = selected === option.label && question.correct !== option.label && !question.reviewOnly;
                return (
                  <button
                    key={`${question.id}-${option.label}`}
                    onClick={() => setAnswers((current) => ({ ...current, [question.id]: option.label }))}
                    className={`min-h-12 rounded-2xl border px-4 text-left text-sm font-bold transition ${
                      showCorrect
                        ? "border-green-300 bg-green-50 text-green-800"
                        : showWrong
                          ? "border-red-300 bg-red-50 text-red-800"
                          : selected === option.label
                            ? "border-[#f97316] bg-orange-50 text-orange-800"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:border-[#f97316]"
                    }`}
                  >
                    {option.label}. {option.text}
                  </button>
                );
              })}
            </div>
            {selected ? (
              <div className={`mt-4 rounded-2xl p-4 text-sm leading-6 ${question.reviewOnly ? "bg-amber-50 text-amber-800" : isCorrect ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                <strong>{question.reviewOnly ? "Review-only official question." : isCorrect ? "Correct." : `Not quite. Correct answer: ${question.correct}.`}</strong> {question.explanation}
                {question.relatedStudyUrl ? (
                  <Link href={question.relatedStudyUrl} className="ml-2 font-black underline">
                    Review topic
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}

      {done ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            {score >= 80 ? <Trophy className="h-7 w-7 text-green-600" /> : <Target className="h-7 w-7 text-orange-600" />}
            <div>
              <h3 className="text-xl font-black text-[#1a2744]">Topic Confidence Score</h3>
              <p className="text-sm font-bold text-slate-500">{score >= 80 ? "You're ready to move to the next topic" : "Revise Step 4 once more"}</p>
            </div>
          </div>
          <div className="mt-5 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Bar dataKey="score" fill={score >= 80 ? "#16a34a" : "#f97316"} radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ActionPanel({
  active,
  flashcard,
  note,
  onFlashcardChange,
  onNoteChange,
  onSubmitFlashcard,
  onSubmitNote,
  onClose,
  flashcardPending,
  notePending,
}: {
  active: "flashcard" | "note" | null;
  flashcard: { question: string; answer: string };
  note: { title: string; content: string };
  onFlashcardChange: (value: { question: string; answer: string }) => void;
  onNoteChange: (value: { title: string; content: string }) => void;
  onSubmitFlashcard: () => void;
  onSubmitNote: () => void;
  onClose: () => void;
  flashcardPending: boolean;
  notePending: boolean;
}) {
  if (!active) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/30 p-3 backdrop-blur-sm sm:place-items-center">
      <div className="w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Save to workspace</p>
            <h3 className="mt-1 text-2xl font-black text-[#1a2744]">{active === "flashcard" ? "Add Flashcard" : "Add Note"}</h3>
          </div>
          <button onClick={onClose} className="min-h-11 rounded-full border border-slate-200 px-4 text-sm font-black text-slate-600">
            Close
          </button>
        </div>

        {active === "flashcard" ? (
          <div className="mt-5 grid gap-3">
            <input
              value={flashcard.question}
              onChange={(event) => onFlashcardChange({ ...flashcard, question: event.target.value })}
              placeholder="Question, e.g. Why is judicial independence important?"
              className="min-h-12 rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-[#f97316]"
            />
            <textarea
              value={flashcard.answer}
              onChange={(event) => onFlashcardChange({ ...flashcard, answer: event.target.value })}
              placeholder="Answer in your own words"
              className="min-h-32 rounded-2xl border border-slate-200 p-4 text-sm outline-none focus:border-[#f97316]"
            />
            <button onClick={onSubmitFlashcard} disabled={flashcardPending} className="min-h-12 rounded-full bg-[#1a2744] px-5 text-sm font-black text-white disabled:opacity-60">
              {flashcardPending ? "Saving..." : "Save Flashcard"}
            </button>
          </div>
        ) : (
          <div className="mt-5 grid gap-3">
            <input
              value={note.title}
              onChange={(event) => onNoteChange({ ...note, title: event.target.value })}
              placeholder="Note title"
              className="min-h-12 rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-[#f97316]"
            />
            <textarea
              value={note.content}
              onChange={(event) => onNoteChange({ ...note, content: event.target.value })}
              placeholder="Write your takeaway, doubt, or example"
              className="min-h-40 rounded-2xl border border-slate-200 p-4 text-sm outline-none focus:border-[#f97316]"
            />
            <button onClick={onSubmitNote} disabled={notePending} className="min-h-12 rounded-full bg-[#1a2744] px-5 text-sm font-black text-white disabled:opacity-60">
              {notePending ? "Saving..." : "Save Note"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function splitParagraphs(value: string) {
  return value.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
}
