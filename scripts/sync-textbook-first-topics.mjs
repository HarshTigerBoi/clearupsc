import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import vm from "node:vm";
import { createClient } from "@supabase/supabase-js";
import ts from "typescript";
import { requireSupabaseEnv } from "./script-env.mjs";

const require = createRequire(import.meta.url);
const repoRoot = process.cwd();
const indexPath = path.join(repoRoot, "src", "lib", "study", "ncert-master-index.ts");
const acquisitionPath = path.join(repoRoot, "data", "content-reports", "textbook-first-source-acquisition.json");
const draftReportPath = path.join(repoRoot, "data", "content-reports", "textbook-first-decode-drafts.json");
const reportPath = path.join(repoRoot, "data", "content-reports", "textbook-first-supabase-sync.json");

function loadMasterIndex() {
  const source = fs.readFileSync(indexPath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(transpiled, { module, exports: module.exports, require, console }, { filename: indexPath });
  return module.exports;
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function toDbSubject(subject) {
  if (subject.startsWith("GS1")) return "GS1";
  if (subject.startsWith("GS2")) return "GS2";
  if (subject.startsWith("GS3")) return "GS3";
  if (subject.startsWith("GS4")) return "GS4";
  return subject;
}

function toExamStage(paper) {
  if (paper === "both") return "both";
  return paper;
}

function sourceTrace(chapter, acquisitionRow) {
  return [
    chapter.source.book,
    `Chapter ${chapter.source.chapter}: ${chapter.source.chapter_title}`,
    acquisitionRow?.resolved_pdf_url ?? chapter.source.pdf_url,
    acquisitionRow?.sha256 ? `sha256:${acquisitionRow.sha256}` : null,
  ]
    .filter(Boolean)
    .join(" | ");
}

function structuredNotesForChapter(chapter, acquisitionRow, draft) {
  const status = draft ? "source_packet_ready_for_human_decode" : chapter.decode_status;
  return {
    content_model: "clearupsc_textbook_first_scaffold_v1",
    decode_status: status,
    source_kind: chapter.source_kind,
    source_status: chapter.source_status ?? null,
    source: chapter.source,
    resolved_pdf_url: acquisitionRow?.resolved_pdf_url ?? chapter.source.pdf_url,
    source_trace: sourceTrace(chapter, acquisitionRow),
    raw_text_path: acquisitionRow?.raw_text_path ?? null,
    source_packet_path: draft?.source_packet_path ?? null,
    concept_candidates: draft?.concept_candidates ?? [],
    publication_overlay: {
      concepts: [],
      concise_notes: [],
      revision_bullets: [],
      mcqs: [],
      mains_framework: null,
    },
    required_before_publication: [
      "Human/source-backed 4-layer ConceptDecode entries with ncert_line_that_answers.",
      "Exactly 10 source-traced UPSCPatternMCQ entries with allowed pattern types only.",
      "PYQ mappings traced to official UPSC question papers.",
      "Mains framework derived from the chapter and verified against source text.",
    ],
    guardrails: [
      "Do not publish this scaffold as decoded content.",
      "Do not infer explanations, PYQ links, or MCQs without source verification.",
      "Use source packets only as navigation hints for manual decoding.",
    ],
  };
}

function topicRow(chapter, acquisitionRow, draft) {
  return {
    key: chapter.key,
    title: chapter.title,
    subject: toDbSubject(chapter.subject),
    parent_key: chapter.maps_to_topics?.[0] ?? null,
    exam_stage: toExamStage(chapter.paper),
    upsc_weightage: chapter.upsc_weightage,
    wiki_slug: null,
    structured_notes: JSON.stringify(structuredNotesForChapter(chapter, acquisitionRow, draft)),
    govt_sources: [],
    ncert_refs: [
      {
        book: chapter.source.book,
        chapter: chapter.source.chapter_title,
        classLevel: chapter.source.book.match(/Class\s+\d+/)?.[0] ?? null,
        url: acquisitionRow?.resolved_pdf_url ?? chapter.source.pdf_url,
        pageRange: chapter.source.page_range,
        topicKeys: [chapter.key],
      },
    ],
    content_quality: draft ? "source_packet_ready_for_human_decode" : chapter.decode_status,
  };
}

async function fetchExistingKeys(supabase, keys) {
  const existing = new Set();
  for (let index = 0; index < keys.length; index += 50) {
    const chunk = keys.slice(index, index + 50);
    const { data, error } = await supabase.from("topics").select("key").in("key", chunk);
    if (error) throw error;
    for (const row of data ?? []) existing.add(row.key);
  }
  return existing;
}

async function insertRows(supabase, rows) {
  const inserted = [];
  const failed = [];
  for (let index = 0; index < rows.length; index += 100) {
    const chunk = rows.slice(index, index + 100);
    const { error } = await supabase.from("topics").insert(chunk);
    if (!error) {
      inserted.push(...chunk.map((row) => row.key));
      continue;
    }
    for (const row of chunk) {
      const single = await supabase.from("topics").insert(row);
      if (single.error) failed.push({ key: row.key, error: single.error.message });
      else inserted.push(row.key);
    }
  }
  return { inserted, failed };
}

const { NCERT_CHAPTER_TOPICS } = loadMasterIndex();
const acquisition = readJsonIfExists(acquisitionPath);
const acquisitionByKey = new Map((acquisition?.rows ?? []).map((row) => [row.key, row]));
const draftReport = readJsonIfExists(draftReportPath);
const draftsByKey = new Map(
  (draftReport?.drafts ?? []).map((draft) => {
    const draftPath = path.join(repoRoot, draft.draft_path);
    return [draft.key, readJsonIfExists(draftPath) ?? draft];
  }),
);

const { url, serviceKey } = requireSupabaseEnv();
const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

const keys = NCERT_CHAPTER_TOPICS.map((chapter) => chapter.key);
const existingKeys = await fetchExistingKeys(supabase, keys);
const rows = NCERT_CHAPTER_TOPICS.filter((chapter) => !existingKeys.has(chapter.key)).map((chapter) =>
  topicRow(chapter, acquisitionByKey.get(chapter.key), draftsByKey.get(chapter.key)),
);

const result = await insertRows(supabase, rows);
const report = {
  generated_at: new Date().toISOString(),
  total_chapter_topics: NCERT_CHAPTER_TOPICS.length,
  already_existing: existingKeys.size,
  attempted_insert: rows.length,
  inserted: result.inserted.length,
  failed: result.failed,
  draft_ready_inserted: rows.filter((row) => row.content_quality === "source_packet_ready_for_human_decode").length,
  textbook_decoded_inserted: rows.filter((row) => row.content_quality === "textbook_decoded").length,
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (result.failed.length) process.exitCode = 1;
