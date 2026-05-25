"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Clock, FileQuestion } from "lucide-react";
import { Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import ProductShell from "@/components/product/ProductShell";
import { PageHeader } from "@/components/layout/PageHeader";

interface MockSummary {
  id: string;
  title: string;
  duration_minutes?: number;
  durationMinutes?: number;
  total_marks?: number;
  totalMarks?: number;
  test_type?: string;
  testType?: string;
}

export default function MockTestsPage() {
  const testsQuery = useQuery({
    queryKey: ["mock-tests"],
    queryFn: async () => {
      const response = await fetch("/api/mock-tests");
      if (!response.ok) throw new Error("Mock tests unavailable");
      const data = (await response.json()) as { tests: MockSummary[] };
      return data.tests;
    },
  });

  return (
    <ProductShell>
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader eyebrow="Prelims" title="Mock tests with UPSC-style scoring." description="Timed attempts, negative marking, result analysis and weak-area detection." />
        {testsQuery.isError ? <StateBox title="No mocks loaded" body="Seed mock_tests and question data in Supabase to start protected mock attempts." /> : null}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {(testsQuery.data ?? []).map((test) => (
            <Link key={test.id} href={`/prelims/mock-tests/${test.id}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-[#f97316]">
              <div className="flex items-start justify-between gap-3">
                <FileQuestion className="text-[#f97316]" />
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-[#1a2744]">{typeLabel(test.test_type ?? test.testType)}</span>
              </div>
              <h2 className="mt-4 text-xl font-black text-[#1a2744]">{test.title}</h2>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-500">
                <Clock className="h-4 w-4" /> {test.duration_minutes ?? test.durationMinutes ?? 20} minutes
              </p>
              <div className="mt-4 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={distribution(test.title)} dataKey="value" nameKey="name" innerRadius={28} outerRadius={48} fill="#f97316" />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-4 inline-flex rounded-full bg-[#1a2744] px-4 py-2 text-sm font-black text-white">Start mock</p>
            </Link>
          ))}
        </div>
      </section>
    </ProductShell>
  );
}

function typeLabel(type?: string) {
  if (type === "prelims_full") return "Full Length";
  if (type === "prelims_sectional") return "Sectional";
  return "Mini";
}

function distribution(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes("csat")) return [{ name: "CSAT", value: 100 }];
  if (lower.includes("polity")) return [{ name: "Polity", value: 70 }, { name: "Mixed", value: 30 }];
  if (lower.includes("economy")) return [{ name: "Economy", value: 70 }, { name: "Mixed", value: 30 }];
  if (lower.includes("full")) return [
    { name: "CA", value: 22 },
    { name: "Polity", value: 18 },
    { name: "History", value: 17 },
    { name: "Geography", value: 16 },
    { name: "Economy", value: 14 },
    { name: "Env", value: 14 },
  ];
  return [{ name: "Subject", value: 70 }, { name: "CA", value: 30 }];
}

function StateBox({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-sm">
      <p className="font-black text-[#1a2744]">{title}</p>
      <p className="mt-1 text-slate-500">{body}</p>
    </div>
  );
}
