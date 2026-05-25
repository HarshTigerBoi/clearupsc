import { fail, ok } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";
import type { PYQOption, PYQQuestion } from "@/types";
import type { NextRequest } from "next/server";

type DbQuestion = {
  id: string;
  question_text: string;
  year: number | null;
  tags: string[] | null;
  topic_key: string | null;
  explanation?: string | null;
  source_label?: string | null;
  trap_type?: string | null;
  question_options: Array<{
    option_label: string;
    option_text: string;
    is_correct: boolean;
  }>;
};

const allowedSubjects = new Set([
  "GS1",
  "GS2",
  "GS3",
  "GS4",
  "CSAT",
  "Essay",
  "History",
  "Polity",
  "Governance",
  "Geography",
  "Economy",
  "Environment",
  "Science",
  "Ethics",
  "Security",
  "Society",
]);

export async function GET(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return fail("Supabase is not configured.", 503);
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get("topic");
    const limit = Math.min(10000, Math.max(10, Number(searchParams.get("limit") ?? (topic ? 30 : 3000))));

    const buildQuery = (start: number) => {
      let query = supabase
        .from("questions")
        .select("id, question_text, year, tags, topic_key, explanation, source_label, trap_type, question_options(option_label, option_text, is_correct)")
        .eq("question_type", "mcq")
        .order("id", { ascending: true })
        .range(start, start + 999);
      if (topic) query = query.eq("topic_key", topic);
      return query;
    };

    const buildLegacyQuery = (start: number) => {
      let query = supabase
        .from("questions")
        .select("id, question_text, year, tags, topic_key, question_options(option_label, option_text, is_correct)")
        .eq("question_type", "mcq")
        .order("id", { ascending: true })
        .range(start, start + 999);
      if (topic) query = query.eq("topic_key", topic);
      return query;
    };

    const starts = Array.from({ length: Math.ceil(limit / 1000) }, (_, index) => index * 1000);
    let chunks = (await Promise.all(starts.map((start) => buildQuery(start)))) as Array<{ data: DbQuestion[] | null; error: { message: string } | null }>;
    const firstError = chunks.find((chunk) => chunk.error)?.error;
    if (firstError) {
      chunks = (await Promise.all(starts.map((start) => buildLegacyQuery(start)))) as Array<{ data: DbQuestion[] | null; error: { message: string } | null }>;
      const legacyError = chunks.find((chunk) => chunk.error)?.error;
      if (legacyError) return fail(legacyError.message, 500);
    }
    const data = chunks.flatMap((chunk) => chunk.data ?? []).slice(0, limit);

    const questions: PYQQuestion[] = ((data ?? []) as DbQuestion[]).map((question) => {
      const sortedOptions = [...question.question_options].sort((a, b) => a.option_label.localeCompare(b.option_label));
      const subject = question.tags?.find((tag) => allowedSubjects.has(tag)) ?? "Polity";
      const correct = sortedOptions.find((option) => option.is_correct)?.option_label ?? "A";

      return {
        id: question.id,
        subject: subject as PYQQuestion["subject"],
        year: question.year ?? 2026,
        question: question.question_text,
        options: sortedOptions.map(
          (option): PYQOption => ({
            label: option.option_label as PYQOption["label"],
            text: option.option_text,
          }),
        ),
        correct: correct as PYQQuestion["correct"],
        explanation: question.explanation ?? "Correct approach: build conceptual clarity, link the concept to the syllabus demand, and eliminate statements that sound absolute or disconnected from current affairs.",
        sourceLabel: question.source_label ?? "UPSC-pattern practice (ClearUPSC original)",
        sourceType: question.source_label?.toLowerCase().includes("official") ? "official_pyq" : "clearupsc_original",
        topicKey: question.topic_key,
        trapType: question.trap_type ?? "Concept trap",
      };
    });

    return ok({ questions });
  } catch {
    return fail("Could not load practice questions.", 500);
  }
}
