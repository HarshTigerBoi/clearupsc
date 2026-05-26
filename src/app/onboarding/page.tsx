"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const optionalSubjects = [
  "Sociology",
  "Political Science & IR",
  "Anthropology",
  "Geography",
  "History",
  "Public Administration",
  "Philosophy",
  "Psychology",
  "Law",
  "Mathematics",
  "Commerce & Accountancy",
  "Literature",
  "Help me choose",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    targetExamYear: 2026,
    optionalSubject: "Help me choose",
    dailyHoursAvailable: 4,
    weakestPaper: "GS2",
    currentLevel: "Beginner",
  });

  async function finish() {
    setSaving(true);
    setError("");
    const payload = {
      attemptNumber: form.currentLevel === "Advanced" ? 3 : form.currentLevel === "Intermediate" ? 2 : 1,
      educationalBackground: form.currentLevel,
      dailyHoursAvailable: form.dailyHoursAvailable,
      optionalSubject: form.optionalSubject,
      targetExamYear: form.targetExamYear,
      weakSubjects: form.weakestPaper === "Equal" ? [] : [form.weakestPaper],
      strongSubjects: form.weakestPaper === "Equal" ? ["Balanced GS"] : [],
      prelimsClearedBefore: form.currentLevel === "Advanced",
    };

    window.localStorage.setItem("clearupsc_guest_onboarding", JSON.stringify({ ...payload, onboardingComplete: true, updatedAt: new Date().toISOString() }));
    router.push("/dashboard");

    fetch("/api/onboarding/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => setError("Using guest mode. Sign in later if you want cloud sync."));
  }

  const screens = [
    <Question key="year" eyebrow="Step 1 of 5" title="When is your UPSC exam?">
      <ChoiceGrid>
        {[2026, 2027, 2028].map((year) => (
          <Choice key={year} active={form.targetExamYear === year} onClick={() => setForm({ ...form, targetExamYear: year })}>
            {year}
          </Choice>
        ))}
      </ChoiceGrid>
    </Question>,
    <Question key="optional" eyebrow="Step 2 of 5" title="Which optional subject?">
      <select
        value={form.optionalSubject}
        onChange={(event) => setForm({ ...form, optionalSubject: event.target.value })}
        className="mt-6 min-h-14 w-full rounded-md border border-white/10 bg-white/5 px-4 text-sm font-black text-white outline-none focus:border-[#f97316]"
      >
        {optionalSubjects.map((subject) => (
          <option key={subject} value={subject} className="bg-[#0a0a0a] text-white">
            {subject}
          </option>
        ))}
      </select>
    </Question>,
    <Question key="hours" eyebrow="Step 3 of 5" title="How many hours can you study daily?">
      <ChoiceGrid>
        {[2, 4, 6, 8].map((hours) => (
          <Choice key={hours} active={form.dailyHoursAvailable === hours} onClick={() => setForm({ ...form, dailyHoursAvailable: hours })}>
            {hours === 8 ? "8+" : hours}
          </Choice>
        ))}
      </ChoiceGrid>
    </Question>,
    <Question key="weakest" eyebrow="Step 4 of 5" title="Which GS paper feels weakest?">
      <ChoiceGrid>
        {["GS1", "GS2", "GS3", "GS4", "Equal"].map((paper) => (
          <Choice key={paper} active={form.weakestPaper === paper} onClick={() => setForm({ ...form, weakestPaper: paper })}>
            {paper}
          </Choice>
        ))}
      </ChoiceGrid>
    </Question>,
    <Question key="level" eyebrow="Step 5 of 5" title="What is your current level?">
      <ChoiceGrid>
        {["Beginner", "Intermediate", "Advanced"].map((level) => (
          <Choice key={level} active={form.currentLevel === level} onClick={() => setForm({ ...form, currentLevel: level })}>
            {level}
          </Choice>
        ))}
      </ChoiceGrid>
    </Question>,
  ];

  return (
    <main className="grid min-h-[calc(100vh-65px)] place-items-center bg-[#0a0a0a] px-4 py-8 text-white">
      <section className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl sm:p-8">
        {screens[step]}
        {error ? <p className="mt-5 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200">{error}</p> : null}
        <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => setStep((value) => Math.max(0, value - 1))}
            className="min-h-12 w-full rounded-md border border-white/10 px-5 text-sm font-black text-white transition hover:border-[#f97316] hover:text-[#f97316] sm:w-auto"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => (step === screens.length - 1 ? finish() : setStep((value) => value + 1))}
            disabled={saving}
            className="min-h-12 w-full rounded-md bg-[#f97316] px-5 text-sm font-black text-white transition hover:bg-[#ea580c] disabled:opacity-60 sm:w-auto"
          >
            {step === screens.length - 1 ? (saving ? "Saving..." : "Build Dashboard") : "Next"}
          </button>
        </div>
      </section>
    </main>
  );
}

function Question({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#f97316] sm:tracking-[0.22em]">{eyebrow}</p>
      <h1 className="mt-4 text-3xl font-black tracking-normal text-white sm:text-5xl">{title}</h1>
      {children}
    </div>
  );
}

function ChoiceGrid({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 grid gap-3 sm:grid-cols-2">{children}</div>;
}

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-16 w-full rounded-md border px-4 text-left text-base font-black transition ${
        active ? "border-[#f97316] bg-[#f97316] text-white" : "border-white/10 bg-white/5 text-zinc-300 hover:border-[#f97316] hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
