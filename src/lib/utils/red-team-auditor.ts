import type { ChapterTopic, ConceptDecode, UPSCPatternMCQ } from "@/lib/types/ncert-types";

export type AuditStatus = "PASS" | "REJECTED";

export type AuditReason =
  | "Too Complex"
  | "Missing Analogy"
  | "Hallucination Detected"
  | "MCQs Not Complex Enough";

export interface AuditFinding {
  status: "REJECTED";
  reason: AuditReason;
  path: string;
  message: string;
  evidence?: string[];
  score?: number;
}

export interface RedTeamAuditReport {
  status: AuditStatus;
  findings: AuditFinding[];
}

const MAX_SIMPLE_EXPLANATION_GRADE = 8;
const REQUIRED_MCQ_PATTERNS: Array<UPSCPatternMCQ["pattern"]> = ["statement", "match", "assertion_reason"];
const ANALOGY_MARKERS = [
  /\bImagine\b/i,
  /\bSimilarly\b/i,
  /\bJust like\b/i,
  /\bThink of\b/i,
  /\bworks like\b/i,
  /\bis like\b/i,
  /\bcompare it to\b/i,
  /\bpicture\b/i,
];

const COMMON_SENTENCE_STARTERS = new Set([
  "A",
  "An",
  "As",
  "But",
  "For",
  "From",
  "If",
  "In",
  "It",
  "Its",
  "Many",
  "Most",
  "One",
  "Some",
  "That",
  "The",
  "These",
  "This",
  "Thus",
  "When",
  "Where",
  "While",
  "With",
]);

export function auditChapterTopic(chapter: ChapterTopic, sanitizedNcertText: string): RedTeamAuditReport {
  const sourceIndex = buildSourceIndex(sanitizedNcertText);
  const findings: AuditFinding[] = [
    ...auditSimpleExplanations(chapter.concepts),
    ...auditHallucinationTrace(chapter.concepts, sourceIndex),
    ...auditMcqComplexity(chapter.mcqs),
  ];

  return {
    status: findings.length ? "REJECTED" : "PASS",
    findings,
  };
}

export function assertChapterTopicPassesRedTeam(chapter: ChapterTopic, sanitizedNcertText: string): ChapterTopic {
  const report = auditChapterTopic(chapter, sanitizedNcertText);
  if (report.status === "REJECTED") {
    throw new Error(formatAuditReport(report));
  }
  return chapter;
}

export function formatAuditReport(report: RedTeamAuditReport) {
  if (report.status === "PASS") return "PASS";
  return report.findings
    .map((finding) => {
      const score = typeof finding.score === "number" ? ` score=${Number(finding.score.toFixed(2))}` : "";
      const evidence = finding.evidence?.length ? ` evidence=${finding.evidence.join(", ")}` : "";
      return `REJECTED: ${finding.reason} at ${finding.path}.${score} ${finding.message}${evidence}`.trim();
    })
    .join("\n");
}

export function fleschKincaidGradeLevel(text: string) {
  const sentences = Math.max(1, splitSentences(text).length);
  const words = tokenizeWords(text);
  const wordCount = Math.max(1, words.length);
  const syllables = Math.max(1, words.reduce((sum, word) => sum + countSyllables(word), 0));
  return 0.39 * (wordCount / sentences) + 11.8 * (syllables / wordCount) - 15.59;
}

function auditSimpleExplanations(concepts: ConceptDecode[]): AuditFinding[] {
  const findings: AuditFinding[] = [];

  concepts.forEach((concept, index) => {
    const path = `$.concepts[${index}].simple_explanation`;
    const gradeLevel = fleschKincaidGradeLevel(concept.simple_explanation);
    if (gradeLevel > MAX_SIMPLE_EXPLANATION_GRADE) {
      findings.push({
        status: "REJECTED",
        reason: "Too Complex",
        path,
        score: gradeLevel,
        message: `simple_explanation must read at grade ${MAX_SIMPLE_EXPLANATION_GRADE} or below.`,
      });
    }

    if (!ANALOGY_MARKERS.some((marker) => marker.test(concept.simple_explanation))) {
      findings.push({
        status: "REJECTED",
        reason: "Missing Analogy",
        path,
        message: "simple_explanation must use a concrete analogy marker such as Imagine, Similarly, or Just like.",
      });
    }
  });

  return findings;
}

function auditHallucinationTrace(concepts: ConceptDecode[], sourceIndex: SourceIndex): AuditFinding[] {
  const findings: AuditFinding[] = [];

  concepts.forEach((concept, index) => {
    const path = `$.concepts[${index}].textbook_content`;
    const claims = extractTraceableClaims(concept.textbook_content);
    const missing = claims.filter((claim) => !sourceIndex.has(claim));
    if (missing.length) {
      findings.push({
        status: "REJECTED",
        reason: "Hallucination Detected",
        path,
        message: "Specific dates, article numbers, or proper nouns in textbook_content must also appear in the sanitized NCERT source.",
        evidence: missing.slice(0, 12),
      });
    }
  });

  return findings;
}

function auditMcqComplexity(mcqs: UPSCPatternMCQ[]): AuditFinding[] {
  const patterns = new Set(mcqs.map((mcq) => mcq.pattern));
  const missingPatterns = REQUIRED_MCQ_PATTERNS.filter((pattern) => !patterns.has(pattern));
  if (!missingPatterns.length && !(mcqs.length === 10 && mcqs.every((mcq) => mcq.pattern === "statement"))) return [];

  return [{
    status: "REJECTED",
    reason: "MCQs Not Complex Enough",
    path: "$.mcqs",
    message: "MCQ set must mix statement, match, and assertion_reason patterns; ten plain statement questions are not accepted.",
    evidence: missingPatterns.length ? missingPatterns.map((pattern) => `missing ${pattern}`) : ["all questions are statement pattern"],
  }];
}

interface SourceIndex {
  normalizedText: string;
  has: (claim: string) => boolean;
}

function buildSourceIndex(text: string): SourceIndex {
  const normalizedText = normalizeForTrace(text);
  return {
    normalizedText,
    has: (claim: string) => normalizedText.includes(normalizeForTrace(claim)),
  };
}

function extractTraceableClaims(text: string) {
  const claims = new Set<string>();

  for (const match of text.matchAll(/\b(?:1[0-9]{3}|20[0-9]{2})\b/g)) {
    claims.add(match[0]);
  }

  for (const match of text.matchAll(/\b(?:Article|Art\.?)\s+\d+[A-Z]?(?:\(\d+\))?\b/g)) {
    claims.add(match[0]);
  }

  for (const match of text.matchAll(/\b[A-Z][a-z]+(?:\s+(?:of|and|the|for|in|on|at|to|[A-Z][a-z]+)){1,5}\b/g)) {
    const candidate = match[0].trim();
    const firstWord = candidate.split(/\s+/)[0];
    if (!COMMON_SENTENCE_STARTERS.has(firstWord) && candidate.length >= 6) {
      claims.add(candidate);
    }
  }

  return [...claims];
}

function normalizeForTrace(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitSentences(text: string) {
  return String(text).split(/[.!?]+/).map((part) => part.trim()).filter(Boolean);
}

function tokenizeWords(text: string) {
  return String(text).toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) ?? [];
}

function countSyllables(word: string) {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!cleaned) return 1;
  const withoutSilentE = cleaned.length > 3 ? cleaned.replace(/e$/, "") : cleaned;
  const groups = withoutSilentE.match(/[aeiouy]+/g);
  return Math.max(1, groups?.length ?? 1);
}
