import { z } from "zod";
import type { UPSCPatternMCQ } from "@/lib/types/ncert-types";

export const UPSC_MCQ_SYSTEM_PROMPT = `Generate 10 UPSC-pattern MCQs based ONLY on the provided text.
STRICT RULE 1: To generate a false option (a distractor), take a true fact from the text and alter one critical mechanism (e.g., change 'convergent' to 'divergent'). Do not invent outside information.
STRICT RULE 2: Do not use definitions as questions (e.g., avoid '${"Which term"} means...').
STRICT RULE 3: You must include a trap_explanation explaining why the distractor is logically flawed.`;

export const upscPatternMcqSchema = z.object({
  question_text: z.string().min(1),
  options: z.array(z.string().min(1)).length(4),
  correct_answer: z.number().int().min(0).max(3),
  pattern: z.enum(["statement", "match", "not_type", "arrange", "assertion_reason"]),
  source_trace: z.string().min(1),
  trap_explanation: z.string().min(1),
  approach_technique: z.string().min(1),
  difficulty_level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
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
  provider?: "anthropic" | "openai";
}

const mcqJsonSchemaDescription = {
  mcqs: [{
    question_text: "string",
    options: ["string", "string", "string", "string"],
    correct_answer: "number from 0 to 3",
    pattern: "statement | match | not_type | arrange | assertion_reason",
    source_trace: "string",
    trap_explanation: "string",
    approach_technique: "string",
    difficulty_level: "1 | 2 | 3 | 4 | 5",
    concepts_tested: ["string"],
  }],
};

export async function generateUpscPatternMcqs(input: GenerateMcqsInput): Promise<UPSCPatternMCQ[]> {
  const provider = input.provider ?? (process.env.ANTHROPIC_API_KEY ? "anthropic" : "openai");
  const userPrompt = [
    `Chapter: ${input.chapterTitle}`,
    `Source trace: ${input.sourceTrace}`,
    `Concepts to test: ${input.concepts.join(", ")}`,
    "JSON schema:",
    JSON.stringify(mcqJsonSchemaDescription, null, 2),
    "Sanitized textbook text:",
    input.sanitizedText,
  ].join("\n\n");

  const rawJson = provider === "anthropic"
    ? await callAnthropic(UPSC_MCQ_SYSTEM_PROMPT, userPrompt)
    : await callOpenAi(UPSC_MCQ_SYSTEM_PROMPT, userPrompt);

  return upscMcqResponseSchema.parse(JSON.parse(rawJson)).mcqs;
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
