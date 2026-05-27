import { z } from "zod";
import type { UPSCPatternMCQ } from "@/lib/types/ncert-types";

export const UPSC_MCQ_SYSTEM_PROMPT = `Generate 10 UPSC-pattern MCQs based ONLY on the provided text.
STRICT RULE 1: To generate a false option (a distractor), take a true fact from the text and alter one critical mechanism (e.g., change 'convergent' to 'divergent'). Do not invent outside information.
STRICT RULE 2: Do not use definitions as questions (e.g., avoid '${"Which term"} means...').
STRICT RULE 3: You must include a trap_explanation explaining why the distractor is logically flawed.
STRICT RULE 4: correct_answer and difficulty_level must be JSON numbers, not strings.`;

const difficultyLevelSchema = z.coerce
  .number()
  .int()
  .pipe(z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]));

export const upscPatternMcqSchema = z.object({
  question_text: z.string().min(1),
  options: z.array(z.string().min(1)).length(4),
  correct_answer: z.coerce.number().int().min(0).max(3),
  pattern: z.enum(["statement", "match", "not_type", "arrange", "assertion_reason"]),
  source_trace: z.string().min(1),
  trap_explanation: z.string().min(1),
  approach_technique: z.string().min(1),
  difficulty_level: difficultyLevelSchema,
  concepts_tested: z.array(z.string().min(1)).min(1),
});

export const upscMcqResponseSchema = z.object({
  mcqs: z.array(upscPatternMcqSchema).length(10),
});

export interface GenerateMcqsInput {
  sanitizedText: string;
  chapterTitle: string;
  sourceTrace: string;
  concepts: string[];
  provider?: "anthropic" | "openai" | "gemini";
  validationFeedback?: string;
}

const mcqJsonSchemaDescription = {
  mcqs: [{
    question_text: "string",
    options: ["string", "string", "string", "string"],
    correct_answer: "JSON number from 0 to 3, not a string",
    pattern: "statement | match | not_type | arrange | assertion_reason",
    source_trace: "string",
    trap_explanation: "string",
    approach_technique: "string",
    difficulty_level: "JSON number 1 | 2 | 3 | 4 | 5, not a string",
    concepts_tested: ["string"],
  }],
};

export async function generateUpscPatternMcqs(input: GenerateMcqsInput): Promise<UPSCPatternMCQ[]> {
  const provider = input.provider ?? defaultProvider();
  const userPrompt = [
    `Chapter: ${input.chapterTitle}`,
    `Source trace: ${input.sourceTrace}`,
    `Concepts to test: ${input.concepts.join(", ")}`,
    "JSON schema:",
    JSON.stringify(mcqJsonSchemaDescription, null, 2),
    input.validationFeedback ? `Your previous attempt failed validation for these reasons: ${input.validationFeedback}. Rewrite the JSON and fix these specific issues.` : null,
    "Sanitized textbook text:",
    input.sanitizedText,
  ].filter(Boolean).join("\n\n");

  const rawJson = provider === "anthropic"
    ? await callAnthropic(UPSC_MCQ_SYSTEM_PROMPT, userPrompt)
    : provider === "gemini"
      ? await callGemini(UPSC_MCQ_SYSTEM_PROMPT, userPrompt)
      : await callOpenAi(UPSC_MCQ_SYSTEM_PROMPT, userPrompt);

  return upscMcqResponseSchema.parse(parseJsonResponse(rawJson)).mcqs;
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
  if (!response.ok) throw new Error(payload?.error?.message ?? "Anthropic MCQ generation failed.");
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
  if (!response.ok) throw new Error(payload?.error?.message ?? "OpenAI MCQ generation failed.");
  return payload.choices?.[0]?.message?.content ?? "";
}

async function callGemini(systemPrompt: string, userPrompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY.");
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  let lastError = "Gemini MCQ generation failed.";
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
