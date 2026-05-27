import fs from "node:fs";
import path from "node:path";
import type { ConceptDecode } from "@/lib/types/ncert-types";

export interface PyqRecord {
  id?: string;
  year?: number;
  paper?: string;
  subject?: string;
  question?: string;
  question_summary?: string;
  explanation?: string;
  options?: unknown;
}

export interface PyqMatcherOptions {
  pyqPath?: string;
  maxMatchesPerConcept?: number;
  minSharedKeywords?: number;
}

const DEFAULT_PYQ_PATH = path.join(process.cwd(), "data", "raw", "upsc_pyqs_2011_2024.json");
const STOPWORDS = new Set([
  "about",
  "after",
  "also",
  "among",
  "based",
  "because",
  "been",
  "being",
  "between",
  "chapter",
  "could",
  "does",
  "from",
  "have",
  "into",
  "more",
  "most",
  "only",
  "other",
  "such",
  "than",
  "that",
  "their",
  "there",
  "these",
  "this",
  "through",
  "which",
  "with",
  "would",
]);

export function injectPyqConnections(
  concepts: ConceptDecode[],
  sanitizedNcertText: string,
  options: PyqMatcherOptions = {},
): ConceptDecode[] {
  const pyqs = loadPyqRecords(options.pyqPath ?? DEFAULT_PYQ_PATH);
  const maxMatches = options.maxMatchesPerConcept ?? 3;
  const minSharedKeywords = options.minSharedKeywords ?? 2;

  return concepts.map((concept) => {
    const matches = findPyqMatches(concept, pyqs, { maxMatches, minSharedKeywords });
    const pyqConnections = matches.length
      ? matches.map(({ record, sharedKeywords }) => ({
          year: Number(record.year ?? 0),
          paper: String(record.paper ?? "UPSC Prelims"),
          question_summary: summarizeQuestion(record),
          ncert_line_that_answers: findBestSourceSentence(sanitizedNcertText, sharedKeywords) || "Source line requires manual confirmation in NCERT text.",
        }))
      : [createNoDirectPyqConnection(concept, sanitizedNcertText)];

    return {
      ...concept,
      pyq_connections: pyqConnections,
    };
  });
}

export function findPyqMatches(
  concept: ConceptDecode,
  pyqs: PyqRecord[],
  options: { maxMatches?: number; minSharedKeywords?: number } = {},
) {
  const conceptKeywords = extractKeywords([
    concept.concept_name,
    concept.textbook_content,
    concept.recall_card.term,
    concept.recall_card.definition,
    concept.recall_card.key_fact,
  ].join(" "));
  const minSharedKeywords = options.minSharedKeywords ?? 2;

  return pyqs
    .map((record) => {
      const questionText = [
        record.question,
        record.question_summary,
        record.explanation,
        typeof record.options === "string" ? record.options : JSON.stringify(record.options ?? ""),
      ].filter(Boolean).join(" ");
      const questionKeywords = extractKeywords(questionText);
      const sharedKeywords = [...conceptKeywords].filter((keyword) => questionKeywords.has(keyword));
      const score = sharedKeywords.length / Math.max(1, Math.min(conceptKeywords.size, questionKeywords.size));
      return { record, sharedKeywords, score };
    })
    .filter((match) => match.sharedKeywords.length >= minSharedKeywords)
    .sort((a, b) => b.score - a.score || b.sharedKeywords.length - a.sharedKeywords.length)
    .slice(0, options.maxMatches ?? 3);
}

export function loadPyqRecords(pyqPath = DEFAULT_PYQ_PATH): PyqRecord[] {
  if (!fs.existsSync(pyqPath)) return [];
  const payload = JSON.parse(fs.readFileSync(pyqPath, "utf8"));
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.pyqs)) return payload.pyqs;
  if (Array.isArray(payload.questions)) return payload.questions;
  return [];
}

function createNoDirectPyqConnection(concept: ConceptDecode, sanitizedNcertText: string) {
  return {
    year: 0,
    paper: "prediction",
    question_summary: "Not yet asked directly — predict likely questions.",
    ncert_line_that_answers: findBestSourceSentence(sanitizedNcertText, [...extractKeywords(concept.concept_name)].slice(0, 6))
      || "No direct PYQ match found in the local PYQ database.",
  };
}

function summarizeQuestion(record: PyqRecord) {
  return String(record.question_summary ?? record.question ?? "Matched UPSC PYQ").replace(/\s+/g, " ").trim();
}

function findBestSourceSentence(sanitizedNcertText: string, keywords: string[]) {
  const sentences = sanitizedNcertText.split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim()).filter(Boolean);
  let best = "";
  let bestScore = 0;
  for (const sentence of sentences) {
    const normalizedSentence = normalize(sentence);
    const score = keywords.filter((keyword) => normalizedSentence.includes(keyword)).length;
    if (score > bestScore) {
      best = sentence;
      bestScore = score;
    }
  }
  return bestScore > 0 ? best : "";
}

function extractKeywords(text: string) {
  const keywords = new Set<string>();
  for (const token of normalize(text).split(" ")) {
    if (token.length >= 4 && !STOPWORDS.has(token) && !/^\d+$/.test(token)) {
      keywords.add(token);
    }
  }
  return keywords;
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
