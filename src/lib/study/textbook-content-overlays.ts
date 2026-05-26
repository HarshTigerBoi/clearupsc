import fs from "node:fs";
import path from "node:path";
import type { ChapterTopicRecord, ConceptDecode, ConciseNote, MainsFramework, UPSCPatternMCQ } from "./ncert-master-index";
import { conceptHasSourceTrace, validateMcq } from "./ncert-master-index";

export type TextbookChapterOverlay = {
  key: string;
  decode_status: "pending_source_decode" | "in_review" | "source_verified";
  source_verification: {
    verified_by: string;
    verified_at: string;
    source_trace: string;
    source_url: string;
    source_hash?: string;
  };
  pyq_count?: number;
  concepts: ConceptDecode[];
  concise_notes: ConciseNote[];
  revision_bullets: string[];
  mcqs: UPSCPatternMCQ[];
  mains_framework?: MainsFramework;
  related_chapters?: string[];
};

const overlayDir = path.join(process.cwd(), "data", "study", "textbook-first", "chapters");

export function loadTextbookChapterOverlay(topicKey: string) {
  const file = path.join(overlayDir, `${topicKey}.json`);
  if (!fs.existsSync(file)) return null;
  const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as TextbookChapterOverlay;
  const errors = validateTextbookChapterOverlay(parsed);
  if (errors.length) {
    throw new Error(`Invalid textbook-first overlay for ${topicKey}: ${errors.join("; ")}`);
  }
  return parsed;
}

export function mergeTextbookChapterOverlay(chapter: ChapterTopicRecord, overlay: TextbookChapterOverlay | null): ChapterTopicRecord {
  if (!overlay) return chapter;
  return {
    ...chapter,
    decode_status: overlay.decode_status,
    pyq_count: overlay.pyq_count ?? chapter.pyq_count,
    concepts: overlay.concepts,
    concise_notes: overlay.concise_notes,
    revision_bullets: overlay.revision_bullets,
    mcqs: overlay.mcqs,
    mains_framework: overlay.mains_framework ?? chapter.mains_framework,
    related_chapters: overlay.related_chapters ?? chapter.related_chapters,
  };
}

export function validateTextbookChapterOverlay(overlay: TextbookChapterOverlay) {
  const errors: string[] = [];
  if (!overlay.key?.trim()) errors.push("Overlay requires key.");
  if (!["pending_source_decode", "in_review", "source_verified"].includes(overlay.decode_status)) errors.push("Overlay decode_status is invalid.");
  if (!overlay.source_verification?.verified_by?.trim()) errors.push("Overlay requires source_verification.verified_by.");
  if (!overlay.source_verification?.verified_at?.trim()) errors.push("Overlay requires source_verification.verified_at.");
  if (!overlay.source_verification?.source_trace?.trim()) errors.push("Overlay requires source_verification.source_trace.");
  if (!overlay.source_verification?.source_url?.trim()) errors.push("Overlay requires source_verification.source_url.");
  if (!Array.isArray(overlay.concepts)) errors.push("Overlay concepts must be an array.");
  if (!Array.isArray(overlay.concise_notes)) errors.push("Overlay concise_notes must be an array.");
  if (!Array.isArray(overlay.revision_bullets)) errors.push("Overlay revision_bullets must be an array.");
  if (!Array.isArray(overlay.mcqs)) errors.push("Overlay mcqs must be an array.");

  if (overlay.decode_status === "source_verified") {
    if (!overlay.concepts?.length) errors.push("source_verified overlay requires concepts.");
    if (overlay.mcqs?.length !== 10) errors.push("source_verified overlay requires exactly 10 MCQs.");
  }

  for (const concept of overlay.concepts ?? []) {
    if (!conceptHasSourceTrace(concept)) errors.push(`Concept lacks source trace: ${concept.concept_name || "unnamed concept"}.`);
  }
  for (const mcq of overlay.mcqs ?? []) {
    errors.push(...validateMcq(mcq).map((issue) => `MCQ "${mcq.question_text || "untitled"}": ${issue}`));
  }
  return errors;
}
