"use client";

import { useState } from "react";
import ProductShell from "@/components/product/ProductShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import type { InterviewQuestion } from "@/types";

interface InterviewReport {
  overallScore: number;
  confidenceScore: number;
  strongestAnswers: string[];
  improvements: string[];
  overallFeedback: string;
}

export default function InterviewPage() {
  const [daf, setDaf] = useState({
    name: "",
    dateOfBirth: "",
    hometown: "",
    graduationSubject: "Commerce",
    collegeName: "",
    stateOfDomicile: "Madhya Pradesh",
    hobbies: "reading biographies",
    workExperience: "",
    optionalSubject: "Sociology",
    servicePreference: "IAS",
    achievements: "",
    educationDetails: "",
    familyBackground: "",
    nativeLanguage: "",
    visitedPlaces: "",
    extracurriculars: "",
  });
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const dafPayload = {
    ...daf,
    hobbies: daf.hobbies.split(",").map((item) => item.trim()).filter(Boolean),
    servicePreference: daf.servicePreference.split(",").map((item) => item.trim()).filter(Boolean),
  };

  async function generate() {
    setLoading(true);
    setError("");
    setReport(null);
    const response = await fetch("/api/interview/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dafPayload),
    });
    const data = (await response.json()) as { questions?: InterviewQuestion[]; error?: string };
    if (data.error) setError(data.error);
    setQuestions(data.questions ?? []);
    setLoading(false);
  }

  async function evaluate() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/interview/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questions,
        answers: questions.map((question) => ({ question: question.question, answer: answers[question.id] ?? "" })),
      }),
    });
    const data = (await response.json()) as { report?: InterviewReport; error?: string };
    if (data.error) setError(data.error);
    if (data.report) setReport(data.report);
    setLoading(false);
  }

  return (
    <ProductShell>
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="DAF interview"
          title="Interview practice that starts from your life."
          description="Save your DAF details, generate a realistic board, type answers, and get a structured readiness report."
        />

        {error ? <p className="mt-6 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p> : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black text-[#1a2744]">Detailed DAF inputs</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ["name", "Name"],
                ["dateOfBirth", "Date of birth"],
                ["hometown", "Hometown"],
                ["graduationSubject", "Graduation subject"],
                ["collegeName", "College name"],
                ["stateOfDomicile", "State of domicile"],
                ["educationDetails", "Education details"],
                ["hobbies", "Hobbies, comma separated"],
                ["workExperience", "Work experience"],
                ["optionalSubject", "Optional subject"],
                ["servicePreference", "Service preference"],
                ["familyBackground", "Family background"],
                ["nativeLanguage", "Native language"],
                ["visitedPlaces", "Visited places"],
                ["extracurriculars", "Sports/extracurriculars"],
                ["achievements", "Achievements"],
              ].map(([key, label]) => (
                <label key={key} className="text-sm font-bold text-slate-600">
                  {label}
                  <input
                    value={daf[key as keyof typeof daf]}
                    onChange={(event) => setDaf({ ...daf, [key]: event.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-[#1a2744] outline-none focus:border-[#f97316]"
                  />
                </label>
              ))}
            </div>
            <Button className="mt-5 w-full" onClick={generate} disabled={loading}>
              {loading ? "Working..." : "Generate 20 DAF questions"}
            </Button>
            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <p className="font-black text-[#1a2744]">Common model-answer prompts</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                <li>Tell me about yourself: keep it personal, relevant and calm.</li>
                <li>Why IAS: connect service motivation with public problem-solving.</li>
                <li>Ethical dilemma: show legality, empathy, transparency and accountability.</li>
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black text-[#1a2744]">Mock board session</h2>
            <div className="mt-5 grid gap-4">
              {questions.map((item, index) => (
                <div key={item.id} className="rounded-2xl bg-slate-50 p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1a2744] text-sm font-black text-white">{index + 1}</span>
                    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">{item.category}</span>
                  </div>
                  <p className="mt-4 text-lg font-bold leading-8 text-[#1a2744]">{item.question}</p>
                  <p className="mt-2 text-sm text-slate-500">{item.whyAsked}</p>
                  <textarea
                    value={answers[item.id] ?? ""}
                    onChange={(event) => setAnswers({ ...answers, [item.id]: event.target.value })}
                    placeholder="Type your spoken answer in 4-6 lines..."
                    className="mt-4 min-h-28 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700 outline-none focus:border-[#f97316]"
                  />
                </div>
              ))}
            </div>
            {questions.length ? <Button className="mt-5" onClick={evaluate} disabled={loading}>Save session and get report</Button> : null}
            {report ? (
              <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-5">
                <p className="text-3xl font-black text-green-800">{report.overallScore}/100</p>
                <p className="mt-1 text-sm font-bold text-green-700">Confidence score: {report.confidenceScore}/100</p>
                <p className="mt-4 text-sm leading-6 text-green-900">{report.overallFeedback}</p>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-green-900">
                  {report.improvements.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </ProductShell>
  );
}
