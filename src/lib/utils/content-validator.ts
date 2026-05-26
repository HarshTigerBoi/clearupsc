import type { ChapterTopic } from "@/lib/types/ncert-types";

export const TEMPLATE_KILL_PHRASES = [
  ["is best understood", "through the concrete syllabus area"].join(" "),
  "The text explains that",
] as const;

const THINK_OF_TEMPLATE = /\bThink of\s+.+?\s+like\b/i;

export interface TemplateFinding {
  path: string;
  phrase: string;
  excerpt: string;
}

export class ContentValidationError extends Error {
  constructor(public findings: TemplateFinding[]) {
    super(`Generated content rejected by Template Detector Test: ${findings.map((finding) => `${finding.path} -> ${finding.phrase}`).join("; ")}`);
    this.name = "ContentValidationError";
  }
}

export function findTemplateKillPhrases(chapter: ChapterTopic): TemplateFinding[] {
  const findings: TemplateFinding[] = [];
  walkValue(chapter, "$", findings);
  return findings;
}

export function assertNoTemplateKillPhrases(chapter: ChapterTopic): ChapterTopic {
  const findings = findTemplateKillPhrases(chapter);
  if (findings.length) throw new ContentValidationError(findings);
  return chapter;
}

function walkValue(value: unknown, path: string, findings: TemplateFinding[]) {
  if (typeof value === "string") {
    scanString(value, path, findings);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkValue(item, `${path}[${index}]`, findings));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      walkValue(nested, `${path}.${key}`, findings);
    }
  }
}

function scanString(value: string, path: string, findings: TemplateFinding[]) {
  for (const phrase of TEMPLATE_KILL_PHRASES) {
    const index = value.toLowerCase().indexOf(phrase.toLowerCase());
    if (index >= 0) {
      findings.push({ path, phrase, excerpt: excerptAround(value, index) });
    }
  }
  const match = value.match(THINK_OF_TEMPLATE);
  if (match?.index !== undefined) {
    findings.push({ path, phrase: ["Think of [X]", "like"].join(" "), excerpt: excerptAround(value, match.index) });
  }
}

function excerptAround(value: string, index: number) {
  const start = Math.max(0, index - 60);
  const end = Math.min(value.length, index + 120);
  return value.slice(start, end).replace(/\s+/g, " ").trim();
}
