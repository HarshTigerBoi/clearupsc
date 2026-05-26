"use client";

import { useEffect, useMemo, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { ChevronDown, Clock, FileText, Loader2, PenLine } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import ProductShell from "@/components/product/ProductShell";
import { Button } from "@/components/ui/button";
import { evaluateAnswer } from "@/lib/answer-writing/evaluator";
import { addGuestXp } from "@/lib/gamification/xp";
import { ESSAY_CATEGORIES, ESSAY_TOPICS, type EssayDifficulty } from "@/lib/essay/topics";
import type { AnswerEvaluation } from "@/types";

function plainTextFromHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function formatTime(seconds: number) {
  const minutes = Math.max(0, Math.floor(seconds / 60));
  return `${minutes}:${String(Math.max(0, seconds % 60)).padStart(2, "0")}`;
}

export default function EssayPracticePage() {
  const [category, setCategory] = useState("All");
  const [difficulty, setDifficulty] = useState<"All" | EssayDifficulty>("All");
  const [topicId, setTopicId] = useState(ESSAY_TOPICS[0].id);
  const [secondsLeft, setSecondsLeft] = useState(ESSAY_TOPICS[0].timeLimit * 60);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null);

  const filteredTopics = useMemo(
    () =>
      ESSAY_TOPICS.filter((topic) => (category === "All" || topic.category === category) && (difficulty === "All" || topic.difficulty === difficulty)),
    [category, difficulty],
  );
  const selectedTopic = ESSAY_TOPICS.find((topic) => topic.id === topicId) ?? filteredTopics[0] ?? ESSAY_TOPICS[0];

  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p>Write a clear thesis, build 4-5 dimensions with examples, add a counter-view, and close with a balanced way forward.</p>",
    editorProps: {
      attributes: {
        class:
          "min-h-[58vh] rounded-2xl border border-slate-200 bg-white p-4 text-base leading-8 text-slate-800 outline-none focus:border-[#f97316]",
      },
    },
  });

  useEffect(() => {
    setSecondsLeft(selectedTopic.timeLimit * 60);
    setEvaluation(null);
  }, [selectedTopic.id, selectedTopic.timeLimit]);

  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => {
      setSecondsLeft((value) => {
        if (value <= 1) {
          window.clearInterval(interval);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [running]);

  useEffect(() => {
    if (filteredTopics.length && !filteredTopics.some((topic) => topic.id === topicId)) setTopicId(filteredTopics[0].id);
  }, [filteredTopics, topicId]);

  const answerText = plainTextFromHtml(editor?.getHTML() ?? "");
  const wordCount = answerText ? answerText.split(/\s+/).length : 0;

  async function submitEssay() {
    setSubmitting(true);
    try {
      const result = evaluateAnswer(answerText, {
        questionText: selectedTopic.title,
        marks: 125,
        recommendedWords: selectedTopic.wordLimit,
      });
      setEvaluation(result);
      setRunning(false);
      addGuestXp("answer_submitted");
      await fetch("/api/answers/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText: `Essay: ${selectedTopic.title}`,
          answerText,
          wordCount,
          timeTakenSeconds: selectedTopic.timeLimit * 60 - secondsLeft,
        }),
      }).catch(() => null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ProductShell>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Essay Practice"
          title="Train the paper that decides the final rank."
          description="Pick a UPSC-style essay, write with a 60-minute timer, and score it against the same deterministic rubric used in answer writing."
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#f97316]">Choose topic</p>
              <div className="mt-4 grid gap-3">
                <select value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-[#1a2744]">
                  <option value="All">All categories</option>
                  {ESSAY_CATEGORIES.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <select value={difficulty} onChange={(event) => setDifficulty(event.target.value as "All" | EssayDifficulty)} className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-[#1a2744]">
                  <option value="All">All difficulty</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
                <select value={selectedTopic.id} onChange={(event) => setTopicId(event.target.value)} className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-[#1a2744]">
                  {filteredTopics.map((topic) => (
                    <option key={topic.id} value={topic.id}>{topic.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <details open className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-black uppercase tracking-[0.16em] text-[#f97316]">
                Framework hint <ChevronDown className="h-4 w-4" />
              </summary>
              <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                {selectedTopic.framework.map((step, index) => (
                  <li key={step} className="rounded-xl bg-slate-50 p-3">
                    <span className="font-black text-[#1a2744]">{index + 1}.</span> {step}
                  </li>
                ))}
              </ol>
              <div className="mt-4 rounded-xl bg-orange-50 p-3 text-sm leading-6 text-orange-800">
                <p className="font-black">Key points</p>
                <p>{selectedTopic.keyPoints.join(" · ")}</p>
              </div>
            </details>
          </aside>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  {selectedTopic.category} · {selectedTopic.difficulty}
                </p>
                <h2 className="mt-2 text-2xl font-black text-[#1a2744]">{selectedTopic.title}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex min-h-10 items-center gap-2 rounded-full bg-slate-100 px-3 text-sm font-black text-[#1a2744]">
                  <Clock className="h-4 w-4" /> {formatTime(secondsLeft)}
                </span>
                <span className="inline-flex min-h-10 items-center gap-2 rounded-full bg-orange-100 px-3 text-sm font-black text-orange-700">
                  <FileText className="h-4 w-4" /> {wordCount}/{selectedTopic.wordLimit}
                </span>
              </div>
            </div>

            <div className="mt-5">
              <EditorContent editor={editor} />
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setRunning((value) => !value)}>{running ? "Pause timer" : "Start timer"}</Button>
              <Button type="button" onClick={submitEssay} disabled={submitting || wordCount < 80}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PenLine className="mr-2 h-4 w-4" />}
                Submit essay
              </Button>
            </div>

            {evaluation ? (
              <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                <p className="text-sm font-black uppercase tracking-[0.16em] text-[#f97316]">Rubric result</p>
                <p className="mt-2 text-5xl font-black text-[#1a2744]">{evaluation.total_score}<span className="text-lg text-slate-400">/100</span></p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    ["Content", evaluation.content_score, 40],
                    ["Structure", evaluation.structure_score, 25],
                    ["Depth", evaluation.depth_score, 20],
                    ["Presentation", evaluation.presentation_score, 15],
                  ].map(([label, score, max]) => (
                    <div key={String(label)} className="rounded-xl bg-white p-3">
                      <div className="flex justify-between text-sm font-bold text-slate-600">
                        <span>{label}</span><span>{score}/{max}</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-slate-100">
                        <div className="h-2 rounded-full bg-[#f97316]" style={{ width: `${(Number(score) / Number(max)) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
                  {evaluation.improvements.map((item) => <li key={item}>{item}</li>)}
                </ul>
                <p className="mt-4 rounded-xl bg-orange-50 p-4 text-sm leading-6 text-orange-800">{evaluation.overall_feedback}</p>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </ProductShell>
  );
}

