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

export interface GenerateDecodeInput {
  sanitizedText: string;
  chapterTitle: string;
  sourceTrace: string;
  provider?: "anthropic" | "openai";
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
  const provider = input.provider ?? (process.env.ANTHROPIC_API_KEY ? "anthropic" : "openai");
  const userPrompt = [
    `Chapter: ${input.chapterTitle}`,
    `Source trace: ${input.sourceTrace}`,
    "JSON schema:",
    JSON.stringify(conceptDecodeJsonSchemaDescription, null, 2),
    "Sanitized textbook text:",
    input.sanitizedText,
  ].join("\n\n");

  const rawJson = provider === "anthropic"
    ? await callAnthropic(CONCEPT_DECODE_SYSTEM_PROMPT, userPrompt)
    : await callOpenAi(CONCEPT_DECODE_SYSTEM_PROMPT, userPrompt);

  return conceptDecodeResponseSchema.parse(JSON.parse(rawJson)).concepts;
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
