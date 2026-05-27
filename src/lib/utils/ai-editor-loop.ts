import { z } from "zod";
import type { ChapterTopic, ConceptDecode } from "@/lib/types/ncert-types";

export interface AiEditorOptions {
  sanitizedText: string;
  provider?: "anthropic" | "openai" | "gemini";
  maxRewriteAttempts?: number;
}

export interface ConceptEditorScore {
  concept_name: string;
  analogy_score: number;
  depth_score: number;
  issues: string[];
  rewrites_applied: string[];
}

export interface AiEditorReport {
  status: "PASS" | "REWRITTEN";
  scores: ConceptEditorScore[];
}

const evaluatorResponseSchema = z.object({
  analogy_score: z.coerce.number().int().min(1).max(10),
  depth_score: z.coerce.number().int().min(1).max(10),
  issues: z.preprocess((value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string" && value.trim()) return [value.trim()];
    return [];
  }, z.array(z.string()).default([])),
});

const rewriteResponseSchema = z.object({
  simple_explanation: z.string().min(1).optional(),
  textbook_content: z.string().min(1).optional(),
});

const EVALUATOR_SYSTEM_PROMPT = `You are the Evaluator LLM for ClearUPSC. Grade the generated ConceptDecode JSON against this strict rubric:

Analogy Score (1-10): Does it use a concrete, physical object (like a roti, bicycle, or schoolyard) to explain the mechanism? If it uses abstract words, score it < 5.

Depth Score (1-10): Does the textbook_content string contain specific nouns, numbers, and dates from the raw NCERT text, or is it vague?

Return only strict JSON with analogy_score, depth_score, and issues.`;

export async function editChapterTopicWithAi(chapter: ChapterTopic, options: AiEditorOptions) {
  const maxRewriteAttempts = options.maxRewriteAttempts ?? 1;
  const editedConcepts: ConceptDecode[] = [];
  const scores: ConceptEditorScore[] = [];
  let rewroteAnything = false;

  for (const concept of chapter.concepts) {
    let current = concept;
    const rewritesApplied: string[] = [];
    let latestScore = await evaluateConcept(current, options);

    for (let attempt = 1; attempt <= maxRewriteAttempts; attempt += 1) {
      const needsAnalogyRewrite = latestScore.analogy_score < 8;
      const needsDepthRewrite = latestScore.depth_score < 8;
      if (!needsAnalogyRewrite && !needsDepthRewrite) break;

      const rewrite = await rewriteFailingFields(current, options, {
        analogyScore: latestScore.analogy_score,
        depthScore: latestScore.depth_score,
        rewriteAnalogy: needsAnalogyRewrite,
        rewriteDepth: needsDepthRewrite,
      });

      current = {
        ...current,
        simple_explanation: rewrite.simple_explanation ?? current.simple_explanation,
        textbook_content: rewrite.textbook_content ?? current.textbook_content,
      };
      rewroteAnything = true;
      if (rewrite.simple_explanation) rewritesApplied.push(`simple_explanation attempt ${attempt}`);
      if (rewrite.textbook_content) rewritesApplied.push(`textbook_content attempt ${attempt}`);
      latestScore = await evaluateConcept(current, options);
    }

    editedConcepts.push(current);
    scores.push({
      concept_name: current.concept_name,
      analogy_score: latestScore.analogy_score,
      depth_score: latestScore.depth_score,
      issues: latestScore.issues,
      rewrites_applied: rewritesApplied,
    });
  }

  return {
    chapter: {
      ...chapter,
      concepts: editedConcepts,
      concise_notes: editedConcepts.map((concept) => ({
        term: concept.recall_card.term,
        definition: concept.recall_card.definition,
        source_trace: concept.ncert_page,
      })),
      revision_bullets: editedConcepts.map((concept) => concept.recall_card.key_fact).slice(0, 10),
    },
    report: {
      status: rewroteAnything ? "REWRITTEN" : "PASS",
      scores,
    } satisfies AiEditorReport,
  };
}

async function evaluateConcept(concept: ConceptDecode, options: AiEditorOptions) {
  const userPrompt = [
    "Raw sanitized NCERT text:",
    options.sanitizedText,
    "Generated ConceptDecode JSON:",
    JSON.stringify(concept, null, 2),
  ].join("\n\n");
  const rawJson = await callProvider(options.provider ?? defaultProvider(), EVALUATOR_SYSTEM_PROMPT, userPrompt);
  return evaluatorResponseSchema.parse(parseJsonResponse(rawJson));
}

async function rewriteFailingFields(
  concept: ConceptDecode,
  options: AiEditorOptions,
  params: {
    analogyScore: number;
    depthScore: number;
    rewriteAnalogy: boolean;
    rewriteDepth: boolean;
  },
) {
  const tasks = [
    params.rewriteAnalogy
      ? `Your analogy scored a ${params.analogyScore}. It is too abstract. Rewrite ONLY the simple_explanation string. You MUST use a physical, real-world object to explain this mechanism to a 13-year-old.`
      : null,
    params.rewriteDepth
      ? `Your depth scored a ${params.depthScore}. Rewrite ONLY the textbook_content string using specific nouns, numbers, dates, and mechanisms that appear in the raw NCERT text. Do not add outside facts.`
      : null,
  ].filter(Boolean);

  const userPrompt = [
    tasks.join("\n"),
    "Return only JSON containing the rewritten fields. Do not rewrite untouched fields.",
    JSON.stringify({
      simple_explanation: params.rewriteAnalogy ? "string" : undefined,
      textbook_content: params.rewriteDepth ? "string" : undefined,
    }, null, 2),
    "Raw sanitized NCERT text:",
    options.sanitizedText,
    "Current ConceptDecode JSON:",
    JSON.stringify(concept, null, 2),
  ].join("\n\n");

  const rawJson = await callProvider(options.provider ?? defaultProvider(), "You are a precise UPSC content editor. Rewrite only the requested JSON fields using the provided NCERT text.", userPrompt);
  return rewriteResponseSchema.parse(parseJsonResponse(rawJson));
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
      max_tokens: 4096,
      temperature: 0.1,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error?.message ?? "Anthropic AI editor failed.");
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
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error?.message ?? "OpenAI AI editor failed.");
  return payload.choices?.[0]?.message?.content ?? "";
}

async function callGemini(systemPrompt: string, userPrompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY.");
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  let lastError = "Gemini AI editor failed.";
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
          generationConfig: {
            temperature: 0.1,
            topP: 0.8,
            maxOutputTokens: Number(process.env.GEMINI_MAX_OUTPUT_TOKENS ?? 8192),
            responseMimeType: "application/json",
          },
        }),
      });
      const payload = await response.json();
      if (response.ok) return payload.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? "").join("") ?? "";
      lastError = payload?.error?.message ?? lastError;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await sleep(1000 * attempt);
  }
  throw new Error(lastError);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseJsonResponse(rawJson: string) {
  const cleaned = rawJson.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error("LLM returned invalid JSON.");
  }
}
