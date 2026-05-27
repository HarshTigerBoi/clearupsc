import { z } from "zod";
import type { ChapterTopic, ConceptDecode, UPSCPatternMCQ } from "@/lib/types/ncert-types";

export const SYNTHETIC_OVERRIDE_SYSTEM_PROMPT = `SYSTEM OVERRIDE. Your previous attempts failed quality control due to stylistic errors or complex analogies. Abandon all attempts at analogies or creative teaching. Extract the raw facts from the provided text into the JSON format. Use simple, dry, bulleted textbook language. Prioritize 100% factual accuracy from the source text. Do not invent any explanatory frameworks.`;

export type SyntheticOverrideStatus = "auto-approved_via_override" | "auto-approved_via_override_local_fallback";

export type SyntheticOverrideChapterTopic = ChapterTopic & {
  status: SyntheticOverrideStatus;
  override_metadata: {
    generated_at: string;
    reason: string;
    source: "llm_synthetic_override" | "local_source_sentence_fallback";
  };
};

export interface SyntheticOverrideInput {
  sanitizedText: string;
  key: string;
  title: string;
  subject: string;
  book: string;
  chapterNumber: number;
  pageRange: string;
  pdfUrl: string;
  sourceTrace: string;
  failureLog: string;
  provider?: "anthropic" | "openai" | "gemini";
}

const overrideConceptSchema = z.object({
  concept_name: z.string().min(1),
  ncert_page: z.string().min(1),
  simple_explanation: z.string().min(1),
  textbook_content: z.string().min(1),
  pyq_connections: z.array(z.object({
    year: z.coerce.number().int(),
    paper: z.string().min(1),
    question_summary: z.string().min(1),
    ncert_line_that_answers: z.string().min(1),
  })).default([]),
  recall_card: z.object({
    term: z.string().min(1),
    definition: z.string().min(1),
    key_fact: z.string().min(1),
    upsc_trap: z.string().min(1),
  }),
});

const overrideMcqSchema = z.object({
  question_text: z.string().min(1),
  options: z.array(z.string().min(1)).length(4),
  correct_answer: z.coerce.number().int().min(0).max(3),
  pattern: z.enum(["statement", "match", "not_type", "arrange", "assertion_reason"]),
  source_trace: z.string().min(1),
  trap_explanation: z.string().min(1),
  approach_technique: z.string().min(1),
  difficulty_level: z.coerce.number().int().pipe(z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)])),
  concepts_tested: z.array(z.string().min(1)).min(1),
});

const overrideResponseSchema = z.object({
  concepts: z.array(overrideConceptSchema).min(1).max(15),
  mcqs: z.array(overrideMcqSchema).default([]),
  mains_framework: z.object({
    structure: z.array(z.string()).default([]),
    source_trace: z.string().min(1),
  }).optional(),
  related_chapters: z.array(z.string()).default([]),
});

export async function generateSyntheticOverrideChapter(input: SyntheticOverrideInput): Promise<SyntheticOverrideChapterTopic> {
  const userPrompt = [
    `Chapter key: ${input.key}`,
    `Chapter title: ${input.title}`,
    `Source trace: ${input.sourceTrace}`,
    `Previous failure log: ${input.failureLog}`,
    "Return strict JSON with: concepts, mcqs, mains_framework, related_chapters.",
    "For concepts, simple_explanation may be dry factual language; do not use analogies.",
    "For MCQs, include only source-backed questions. If source-backed MCQs cannot be safely formed, return an empty mcqs array.",
    "Sanitized NCERT text:",
    input.sanitizedText,
  ].join("\n\n");

  const rawJson = await callProvider(input.provider ?? defaultProvider(), SYNTHETIC_OVERRIDE_SYSTEM_PROMPT, userPrompt);
  const parsed = overrideResponseSchema.parse(parseJsonResponse(rawJson));
  return assembleOverrideChapter(input, parsed.concepts, parsed.mcqs, parsed.mains_framework, parsed.related_chapters, "llm_synthetic_override", "auto-approved_via_override");
}

export function generateLocalSyntheticOverrideChapter(input: SyntheticOverrideInput): SyntheticOverrideChapterTopic {
  const sentences = extractSourceSentences(input.sanitizedText);
  const conceptSentences = sentences.slice(0, Math.min(8, Math.max(1, sentences.length)));
  const concepts: ConceptDecode[] = conceptSentences.map((sentence, index) => ({
    concept_name: makeConceptName(sentence, index),
    ncert_page: input.sourceTrace,
    simple_explanation: sentence,
    textbook_content: conceptSentences.slice(index, index + 3).join(" ") || sentence,
    pyq_connections: [],
    recall_card: {
      term: makeConceptName(sentence, index),
      definition: truncate(sentence, 180),
      key_fact: sentence,
      upsc_trap: "Override fallback: verify the exact wording from the source before using as an exam shortcut.",
    },
  }));

  return assembleOverrideChapter(
    input,
    concepts,
    [],
    { structure: sentences.slice(0, 5), source_trace: input.sourceTrace },
    [],
    "local_source_sentence_fallback",
    "auto-approved_via_override_local_fallback",
  );
}

function assembleOverrideChapter(
  input: SyntheticOverrideInput,
  concepts: ConceptDecode[],
  mcqs: UPSCPatternMCQ[],
  mainsFramework: { structure: string[]; source_trace: string } | undefined,
  relatedChapters: string[],
  source: "llm_synthetic_override" | "local_source_sentence_fallback",
  status: SyntheticOverrideStatus,
): SyntheticOverrideChapterTopic {
  return {
    key: input.key,
    title: input.title,
    source: {
      book: input.book,
      chapter: input.chapterNumber,
      chapter_title: input.title,
      pdf_url: input.pdfUrl,
      page_range: input.pageRange,
    },
    subject: input.subject,
    paper: "both",
    upsc_weightage: 3,
    pyq_count: concepts.reduce((total, concept) => total + concept.pyq_connections.length, 0),
    concepts,
    concise_notes: concepts.map((concept) => ({
      term: concept.recall_card.term,
      definition: concept.recall_card.definition,
      source_trace: concept.ncert_page,
    })),
    revision_bullets: concepts.map((concept) => concept.recall_card.key_fact).slice(0, 10),
    mcqs,
    mains_framework: mainsFramework ?? { structure: [], source_trace: input.sourceTrace },
    related_chapters: relatedChapters,
    status,
    override_metadata: {
      generated_at: new Date().toISOString(),
      reason: input.failureLog,
      source,
    },
  };
}

function defaultProvider(): "anthropic" | "openai" | "gemini" {
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.GEMINI_API_KEY) return "gemini";
  return "openai";
}

async function callProvider(provider: "anthropic" | "openai" | "gemini", systemPrompt: string, userPrompt: string) {
  if (provider === "anthropic") return callAnthropic(systemPrompt, userPrompt);
  if (provider === "gemini") return callGemini(systemPrompt, userPrompt);
  return callOpenAi(systemPrompt, userPrompt);
}

async function callAnthropic(systemPrompt: string, userPrompt: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY.");
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest",
      max_tokens: 8192,
      temperature: 0,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error?.message ?? "Anthropic synthetic override failed.");
  return payload.content?.map((part: { text?: string }) => part.text ?? "").join("") ?? "";
}

async function callOpenAi(systemPrompt: string, userPrompt: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY.");
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4.1",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error?.message ?? "OpenAI synthetic override failed.");
  return payload.choices?.[0]?.message?.content ?? "";
}

async function callGemini(systemPrompt: string, userPrompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY.");
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
      generationConfig: {
        temperature: 0,
        topP: 0.8,
        maxOutputTokens: Number(process.env.GEMINI_MAX_OUTPUT_TOKENS ?? 32768),
        responseMimeType: "application/json",
      },
    }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error?.message ?? "Gemini synthetic override failed.");
  return payload.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? "").join("") ?? "";
}

function parseJsonResponse(rawJson: string) {
  const cleaned = rawJson.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error("LLM returned invalid override JSON.");
  }
}

function extractSourceSentences(text: string) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 80 && sentence.length <= 500)
    .slice(0, 20);
}

function makeConceptName(sentence: string, index: number) {
  const words = sentence.replace(/[^A-Za-z0-9\s-]/g, " ").split(/\s+/).filter((word) => word.length > 2).slice(0, 6);
  return words.length ? words.join(" ") : `Source Fact ${index + 1}`;
}

function truncate(value: string, maxLength: number) {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 3).trim()}...`;
}
