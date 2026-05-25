import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";
import { PYQS } from "@/data/pyqs";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, Number(searchParams.get("limit") ?? 25));
    const topic = searchParams.get("topic");
    let query = supabase
      .from("pyq_questions")
      .select("id,year,paper,question_text,options,correct_option,explanation,topics,difficulty,source")
      .order("year", { ascending: false })
      .limit(limit);
    const year = searchParams.get("year");
    const paper = searchParams.get("paper");
    if (year) query = query.eq("year", Number(year));
    if (paper) query = query.eq("paper", paper);
    if (topic) query = query.contains("topics", [topic]);
    const { data, error } = await query;
    if (error) return ok({ questions: fallbackPyqs(year ? Number(year) : undefined, paper ?? undefined, topic ?? undefined), source: "fallback" });
    return ok({ questions: data ?? [] });
  } catch {
    return ok({ questions: fallbackPyqs(), source: "fallback" });
  }
}

function fallbackPyqs(year?: number, paper?: string, topic?: string) {
  return PYQS.filter((question) => !topic || question.subject.toLowerCase().includes(topic.toLowerCase()) || topic.toLowerCase().includes(question.subject.toLowerCase()))
    .slice(0, 50)
    .map((question) => ({
    id: question.id,
    year: year ?? question.year,
    paper: paper ?? "GS1",
    question_text: question.question,
    options: question.options.map((option) => option.text),
    correct_option: ["A", "B", "C", "D"].indexOf(question.correct),
    explanation: question.explanation,
    topics: [question.subject],
    difficulty: "medium",
    source: "Based on UPSC pattern",
  }));
}
