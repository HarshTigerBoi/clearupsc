"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import ProductShell from "@/components/product/ProductShell";
import type { StudyPlanTask } from "@/types";

const recoveryRules = [
  "Move unfinished low-weightage tasks into a two-day recovery block.",
  "Protect Sunday mock tests even when backlog increases.",
  "Insert current affairs and answer writing automatically through the week.",
  "Show Recovery Mode if backlog crosses five study-days.",
];

interface PlanPayload {
  date: string;
  totalMinutes: number;
  completedMinutes: number;
  recoveryMode: boolean;
  tasks: StudyPlanTask[];
}

export default function PlannerPage() {
  const queryClient = useQueryClient();
  const planQuery = useQuery({
    queryKey: ["plans", "today"],
    queryFn: async () => {
      const response = await fetch("/api/plans/today");
      if (!response.ok) throw new Error("Plan unavailable");
      return (await response.json()) as PlanPayload;
    },
  });

  const completeMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const response = await fetch(`/api/plans/tasks/${id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
      if (!response.ok) throw new Error("Could not update task");
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["plans", "today"] }),
  });

  const plan = planQuery.data;

  return (
    <ProductShell>
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Adaptive planner"
          title="Stop asking what to study today."
          description="The planner converts exam date, daily hours, syllabus weightage, weak areas and unfinished work into one clean daily schedule."
        />
        {planQuery.isError ? <StateBox title="Planner not ready" body="Connect Supabase and sign in to generate persistent study plans." /> : null}
        {plan ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black text-[#1a2744]">Today’s generated plan</h2>
                  <p className="mt-1 text-sm text-slate-500">{plan.completedMinutes} of {plan.totalMinutes} minutes already completed.</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-sm font-black ${plan.recoveryMode ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-700"}`}>
                  {plan.recoveryMode ? "Recovery on" : "Recovery off"}
                </span>
              </div>
              <div className="mt-5 space-y-3">
                {plan.tasks.map((task, index) => (
                  <button
                    key={task.id}
                    onClick={() => completeMutation.mutate({ id: task.id, completed: !task.completed })}
                    className="grid w-full gap-3 rounded-2xl bg-slate-50 p-4 text-left hover:bg-orange-50 sm:grid-cols-[42px_1fr_92px] sm:items-center"
                  >
                    <p className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-black text-[#1a2744]">{index + 1}</p>
                    <div>
                      <p className="font-bold text-slate-900">{task.topicTitle}</p>
                      <p className="mt-1 text-sm capitalize text-slate-500">{task.taskType.replace("_", " ")}</p>
                    </div>
                    <p className="rounded-full bg-white px-3 py-1 text-center text-sm font-bold text-slate-600">{task.completed ? "Done" : `${task.durationMinutes} min`}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                <AlertTriangle className="text-amber-700" size={24} />
                <h2 className="mt-4 text-xl font-black text-amber-900">Recovery Mode logic</h2>
                <p className="mt-2 text-sm leading-6 text-amber-800">
                  If tasks pile up, ClearUPSC compresses the plan without sacrificing high-weightage topics or mock-test rhythm.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-xl font-black text-[#1a2744]">Planner rules</h2>
                <div className="mt-4 space-y-3">
                  {recoveryRules.map((rule) => (
                    <div key={rule} className="flex gap-3 text-sm leading-6 text-slate-700">
                      <CheckCircle2 className="mt-0.5 shrink-0 text-green-600" size={18} />
                      {rule}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </ProductShell>
  );
}

function StateBox({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-sm">
      <p className="font-black text-[#1a2744]">{title}</p>
      <p className="mt-1 text-slate-500">{body}</p>
    </div>
  );
}
