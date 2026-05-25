"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProductShell from "@/components/product/ProductShell";
import { Button } from "@/components/ui/button";

const weakOptions = ["Modern History", "Polity", "Economy", "Environment", "CSAT", "Ethics"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    attemptNumber: 1,
    educationalBackground: "engineering",
    dailyHoursAvailable: 6,
    optionalSubject: "help me choose",
    targetExamYear: 2027,
    weakSubjects: ["Economy"],
    strongSubjects: ["Polity"],
    prelimsClearedBefore: false,
  });

  async function finish() {
    await fetch("/api/onboarding/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    router.push("/dashboard");
  }

  const screens = [
    <Field key="attempt" title="Attempt number" helper="This controls plan intensity. First attempt gets more foundation time.">
      {[1, 2, 3].map((value) => (
        <Choice key={value} active={form.attemptNumber === value} onClick={() => setForm({ ...form, attemptNumber: value })}>{value === 3 ? "3rd+" : `${value}${value === 1 ? "st" : "nd"}`}</Choice>
      ))}
    </Field>,
    <Field key="background" title="Academic background" helper="The app uses this for optional and answer examples.">
      {["engineering", "arts", "science", "law", "commerce"].map((value) => (
        <Choice key={value} active={form.educationalBackground === value} onClick={() => setForm({ ...form, educationalBackground: value })}>{value}</Choice>
      ))}
    </Field>,
    <Field key="hours" title="Daily hours available" helper="The planner stays realistic instead of heroic.">
      {[4, 6, 8, 10].map((value) => (
        <Choice key={value} active={form.dailyHoursAvailable === value} onClick={() => setForm({ ...form, dailyHoursAvailable: value })}>{value}+ hours</Choice>
      ))}
    </Field>,
    <Field key="optional" title="Optional subject" helper="You can change this later.">
      {["help me choose", "Sociology", "PSIR", "Anthropology", "Geography"].map((value) => (
        <Choice key={value} active={form.optionalSubject === value} onClick={() => setForm({ ...form, optionalSubject: value })}>{value}</Choice>
      ))}
    </Field>,
    <Field key="weak" title="Weak areas" helper="These appear more often in plans, flashcards and mocks.">
      {weakOptions.map((value) => (
        <Choice
          key={value}
          active={form.weakSubjects.includes(value)}
          onClick={() =>
            setForm({
              ...form,
              weakSubjects: form.weakSubjects.includes(value) ? form.weakSubjects.filter((item) => item !== value) : [...form.weakSubjects, value],
            })
          }
        >
          {value}
        </Choice>
      ))}
    </Field>,
  ];

  return (
    <ProductShell>
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#f97316]">Onboarding {step + 1}/5</p>
          <div className="mt-5">{screens[step]}</div>
          <div className="mt-8 flex justify-between">
            <Button variant="outline" onClick={() => setStep((value) => Math.max(0, value - 1))}>Back</Button>
            <Button onClick={() => (step === screens.length - 1 ? finish() : setStep((value) => value + 1))}>{step === screens.length - 1 ? "Build my dashboard" : "Next"}</Button>
          </div>
        </div>
      </section>
    </ProductShell>
  );
}

function Field({ title, helper, children }: { title: string; helper: string; children: React.ReactNode }) {
  return (
    <div>
      <h1 className="text-3xl font-black text-[#1a2744]">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">{helper}</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`rounded-2xl border p-4 text-left text-sm font-black capitalize ${active ? "border-[#f97316] bg-orange-50 text-[#1a2744]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
      {children}
    </button>
  );
}
