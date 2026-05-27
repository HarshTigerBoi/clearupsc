import { z } from "zod";
import type { ConceptDecode } from "@/lib/types/ncert-types";

export const CONCEPT_DECODE_SYSTEM_PROMPT = `You are an elite UPSC tutor. Your job is synthesis, not transcription. Extract up to 15 core concepts from the provided textbook text.
STRICT RULE 1: You are forbidden from using phrases like 'The text explains that...'. You must explain the mechanism directly using a real-world analogy.
STRICT RULE 2: You must output strictly in the provided JSON schema.`;

export const conceptDecodeSchema = z.object({
  concept_name: z.string().min(1),
  ncert_page: z.string().min(1),
  simple_explanation: z.string().min(1),
  textbook_content: z.string().min(1),
  pyq_connections: z.array(z.object({
    year: z.number().int(),
    paper: z.string().min(1),
    question_summary: z.string().min(1),
    ncert_line_that_answers: z.string().min(1),
  })),
  recall_card: z.object({
    term: z.string().min(1),
    definition: z.string().min(1),
    key_fact: z.string().min(1),
    upsc_trap: z.string().min(1),
  }),
});

export const conceptDecodeResponseSchema = z.object({
  concepts: z.array(conceptDecodeSchema).max(15),
});

export const conceptNamesResponseSchema = z.object({
  concepts: z.array(z.string().min(1)).min(1).max(15),
});

export interface GenerateDecodeInput {
  sanitizedText: string;
  chapterTitle: string;
  sourceTrace: string;
  provider?: "anthropic" | "openai" | "gemini";
  validationFeedback?: string;
  conceptLimit?: number;
}

const conceptDecodeJsonSchemaDescription = {
  concepts: [{
    concept_name: "string",
    ncert_page: "string",
    simple_explanation: "string",
    textbook_content: "string",
    pyq_connections: [{
      year: "number",
      paper: "string",
      question_summary: "string",
      ncert_line_that_answers: "string",
    }],
    recall_card: {
      term: "string",
      definition: "string",
      key_fact: "string",
      upsc_trap: "string",
    },
  }],
};

export async function generateConceptDecodes(input: GenerateDecodeInput): Promise<ConceptDecode[]> {
  const provider = input.provider ?? defaultProvider();
  const userPrompt = [
    `Chapter: ${input.chapterTitle}`,
    `Source trace: ${input.sourceTrace}`,
    "JSON schema:",
    JSON.stringify(conceptDecodeJsonSchemaDescription, null, 2),
    input.validationFeedback ? `Your previous attempt failed validation for these reasons: ${input.validationFeedback}. Rewrite the JSON and fix these specific issues.` : null,
    "Sanitized textbook text:",
    input.sanitizedText,
  ].filter(Boolean).join("\n\n");

  const rawJson = provider === "anthropic"
    ? await callAnthropic(CONCEPT_DECODE_SYSTEM_PROMPT, userPrompt)
    : provider === "gemini"
      ? await callGemini(CONCEPT_DECODE_SYSTEM_PROMPT, userPrompt)
      : await callOpenAi(CONCEPT_DECODE_SYSTEM_PROMPT, userPrompt);

  return conceptDecodeResponseSchema.parse(parseJsonResponse(rawJson)).concepts;
}

export async function extractImportantConceptNames(input: GenerateDecodeInput): Promise<string[]> {
  const provider = input.provider ?? defaultProvider();
  const conceptLimit = Math.min(Math.max(input.conceptLimit ?? 15, 1), 15);
  const userPrompt = [
    `Chapter: ${input.chapterTitle}`,
    `Source trace: ${input.sourceTrace}`,
    `Analyze this text and return a JSON array of just the names of the ${conceptLimit} most important concepts. Nothing else.`,
    "Return exactly this JSON shape:",
    JSON.stringify({ concepts: ["concept name"] }, null, 2),
    input.validationFeedback ? `Your previous attempt failed validation for these reasons: ${input.validationFeedback}. Rewrite the JSON and fix these specific issues.` : null,
    "Sanitized textbook text:",
    input.sanitizedText,
  ].filter(Boolean).join("\n\n");

  const rawJson = provider === "anthropic"
    ? await callAnthropic(CONCEPT_DECODE_SYSTEM_PROMPT, userPrompt)
    : provider === "gemini"
      ? await callGemini(CONCEPT_DECODE_SYSTEM_PROMPT, userPrompt)
      : await callOpenAi(CONCEPT_DECODE_SYSTEM_PROMPT, userPrompt);

  return conceptNamesResponseSchema.parse(parseJsonResponse(rawJson)).concepts.slice(0, conceptLimit);
}

export async function generateSingleConceptDecode(input: GenerateDecodeInput & { conceptName: string }): Promise<ConceptDecode> {
  const provider = input.provider ?? defaultProvider();
  const userPrompt = [
    `Chapter: ${input.chapterTitle}`,
    `Source trace: ${input.sourceTrace}`,
    `Focus ONLY on the concept: ${input.conceptName}. Generate the 4-layer decode (Analogy, Textbook Content, Recall Card) for this specific concept according to the Zod schema.`,
    "Do not generate or guess PYQ connections. Set pyq_connections to an empty array; the PYQ matcher will inject verified matches from the local database.",
    "The simple_explanation must use concrete transition words such as Imagine, Similarly, or Just like, and explain the mechanism to a 13-year-old.",
    "The textbook_content must be deep, non-generic, source-grounded prose using only facts present in the sanitized text.",
    "JSON schema:",
    JSON.stringify({ concept: conceptDecodeJsonSchemaDescription.concepts[0] }, null, 2),
    input.validationFeedback ? `Your previous attempt failed validation for these reasons: ${input.validationFeedback}. Rewrite the JSON and fix these specific issues.` : null,
    "Sanitized textbook text:",
    input.sanitizedText,
  ].filter(Boolean).join("\n\n");

  const rawJson = provider === "anthropic"
    ? await callAnthropic(CONCEPT_DECODE_SYSTEM_PROMPT, userPrompt)
    : provider === "gemini"
      ? await callGemini(CONCEPT_DECODE_SYSTEM_PROMPT, userPrompt)
      : await callOpenAi(CONCEPT_DECODE_SYSTEM_PROMPT, userPrompt);

  const parsed = parseJsonResponse(rawJson);
  return conceptDecodeSchema.parse(parsed.concept ?? parsed);
}

function defaultProvider(): "anthropic" | "openai" | "gemini" {
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.GEMINI_API_KEY) return "gemini";
  return "openai";
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
      temperature: 0.1,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error?.message ?? "Anthropic decode generation failed.");
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
  if (!response.ok) throw new Error(payload?.error?.message ?? "OpenAI decode generation failed.");
  return payload.choices?.[0]?.message?.content ?? "";
}

async function callGemini(systemPrompt: string, userPrompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY.");
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  let lastError = "Gemini decode generation failed.";
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
            maxOutputTokens: Number(process.env.GEMINI_MAX_OUTPUT_TOKENS ?? 32768),
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
