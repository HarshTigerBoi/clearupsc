"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Clock, Loader2, PenLine } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import ProductShell from "@/components/product/ProductShell";
import { Button } from "@/components/ui/button";
import { addGuestXp } from "@/lib/gamification/xp";
import type { AnswerEvaluation } from "@/types";

const questions = [
  "Discuss the role of local bodies in strengthening cooperative federalism in India.",
  "Examine how climate adaptation can be integrated into urban governance.",
  "Explain why inflation affects vulnerable households more severely than higher-income groups.",
];

function plainTextFromHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export default function AnswerWritingPracticePage() {
  const [questionText, setQuestionText] = useState(questions[0]);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null);
  const [error, setError] = useState("");

  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p>Start with a crisp introduction. Then write body points with examples, and end with a balanced way forward.</p>",
    editorProps: {
      attributes: {
        class:
          "min-h-[280px] rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-7 text-slate-800 outline-none focus:border-[#f97316]",
      },
    },
  });

  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [running]);

  const answerText = plainTextFromHtml(editor?.getHTML() ?? "");
  const wordCount = answerText ? answerText.split(/\s+/).length : 0;
  const warning = seconds >= 420;

  async function submitAnswer() {
    setLoading(true);
    setEvaluation(null);
    setError("");
    try {
      const response = await fetch("/api/answers/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionText, answerText, wordCount, timeTakenSeconds: seconds }),
      });
      const data = (await response.json()) as { evaluation?: AnswerEvaluation; error?: string };
      if (!response.ok) {
        setError(data.error ?? "Evaluation is unavailable right now.");
        return;
      }
      if (data.evaluation) {
        addGuestXp("answer_submitted");
        setEvaluation(data.evaluation);
      }
    } finally {
      setLoading(false);
      setRunning(false);
    }
  }

  return (
    <ProductShell>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Answer writing"
          title="Write like the examiner has only 90 seconds."
          description="TipTap editor, live word count, timer, and a five-dimension UPSC rubric for serious Mains practice."
        />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Question</label>
            <select value={questionText} onChange={(event) => setQuestionText(event.target.value)} className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-[#1a2744]">
              {questions.map((question) => (
                <option key={question} value={question}>{question}</option>
              ))}
            </select>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-black ${warning ? "bg-red-100 text-red-700" : "bg-navy-50 text-[#1a2744]"}`}>
                <Clock className="h-4 w-4" />
                {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
              </span>
              <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-black text-orange-700">{wordCount} words</span>
              <Button onClick={() => setRunning((value) => !value)} variant="outline">{running ? "Pause" : "Start timer"}</Button>
            </div>

            <div className="mt-5">
              <EditorContent editor={editor} />
            </div>

            <div className="mt-5 flex justify-end">
              <Button onClick={submitAnswer} disabled={loading || wordCount < 20}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PenLine className="mr-2 h-4 w-4" />}
                Evaluate answer
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#f97316]">Rubric score</p>
            {evaluation ? (
              <div className="mt-4 space-y-5">
                <p className="text-5xl font-black text-[#1a2744]">{evaluation.total_score}<span className="text-lg text-slate-400">/100</span></p>
                {[
                  ["Content", evaluation.content_score, 40],
                  ["Structure", evaluation.structure_score, 25],
                  ["Depth", evaluation.depth_score, 20],
                  ["Presentation", evaluation.presentation_score, 15],
                ].map(([label, score, max]) => (
                  <div key={String(label)}>
                    <div className="flex justify-between text-sm font-bold text-slate-600">
                      <span>{label}</span><span>{score}/{max}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-[#f97316]" style={{ width: `${(Number(score) / Number(max)) * 100}%` }} />
                    </div>
                  </div>
                ))}
                <div>
                  <p className="font-black text-[#1a2744]">Improve next</p>
                  <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
                    {evaluation.improvements.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="font-black text-[#1a2744]">What worked</p>
                  <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
                    {evaluation.strengths.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{evaluation.model_answer_hint}</div>
                <div className="rounded-2xl bg-orange-50 p-4 text-sm leading-6 text-orange-800">{evaluation.overall_feedback}</div>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl bg-slate-50 p-5 text-sm leading-6 text-slate-600">
                {error || "Submit an answer to see the five-dimension UPSC rubric. Without an AI key, ClearUPSC uses the local rubric engine and still saves your attempt."}
              </div>
            )}
          </div>
        </div>
      </section>
    </ProductShell>
  );
}
