import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import vm from "node:vm";
import ts from "typescript";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "./script-env.mjs";

const ROOT = process.cwd();
const KNOWLEDGE_DIR = join(ROOT, "src", "lib", "study", "knowledge");
const KNOWLEDGE_FILES = ["gs1-history.ts", "gs2-polity-gov.ts", "gs3-economy.ts"];
const REPORT_PATH = join(ROOT, "data", "content-reports", "course-knowledge-import-report.json");

function loadKnowledgeFile(fileName) {
  const filePath = join(KNOWLEDGE_DIR, fileName);
  const source = readFileSync(filePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName,
  }).outputText;

  const exports = {};
  const sandboxRequire = (specifier) => {
    if (specifier === "./types" || specifier.endsWith("/types")) return {};
    throw new Error(`Unexpected import "${specifier}" in ${fileName}.`);
  };
  const wrapper = `(function(exports, require) { ${transpiled}\n })`;
  vm.runInNewContext(wrapper, {}, { filename: fileName })(exports, sandboxRequire);
  return Object.values(exports).flatMap((value) => (Array.isArray(value) ? value : []));
}

function normalizeText(value) {
  if (typeof value !== "string") return value;
  return value
    .replace(/\u00e2\u0080[\u0090-\u0095]/g, "-")
    .replace(/\u00e2\u0080[\u0098\u0099]/g, "'")
    .replace(/\u00e2\u0080[\u009c\u009d]/g, '"')
    .replace(/\u00e2\u0082\u00b9/g, "Rs ")
    .replace(/\u00e2\u0086\u0092/g, "->")
    .replace(/\u00e2\u0089[\u00a4\u00a5]/g, "")
    .replaceAll("â€“", "-")
    .replaceAll("â€”", "-")
    .replaceAll("â€˜", "'")
    .replaceAll("â€™", "'")
    .replaceAll("â€œ", '"')
    .replaceAll("â€", '"')
    .replaceAll("â‚¹", "Rs ")
    .replaceAll("Â·", "-")
    .replaceAll("Â", "")
    .replaceAll("â‰¥", ">=")
    .replaceAll("â‰¤", "<=")
    .replaceAll("â†’", "->")
    .replaceAll("â€¢", "-")
    .replaceAll("Ã©", "e")
    .replaceAll("Ã", "");
}

function deepNormalize(value) {
  if (Array.isArray(value)) return value.map(deepNormalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, deepNormalize(item)]));
  }
  return normalizeText(value);
}

function normalizeSubject(subject) {
  const clean = normalizeText(String(subject || ""));
  if (clean.startsWith("GS1")) return "GS1";
  if (clean.startsWith("GS2")) return "GS2";
  if (clean.startsWith("GS3")) return "GS3";
  if (clean.startsWith("GS4")) return "GS4";
  if (clean.startsWith("CSAT")) return "CSAT";
  if (clean.startsWith("Essay")) return "Essay";
  return clean || "GS";
}

function makeStructuredNotes(topic) {
  const normalized = deepNormalize(topic);
  return {
    analogy: {
      heading: "Understand It First",
      body: normalized.analogy,
    },
    full_notes: [normalized.easyExplanation, normalized.fullNotes].filter(Boolean).join("\n\n"),
    concise_notes: normalized.conciseNotes ?? [],
    revision_bullets: (normalized.revisionBullets ?? []).slice(0, 10),
    mindmap: {
      center: normalized.title,
      branches: (normalized.mindmapBranches ?? []).slice(0, 6),
    },
    cases: (normalized.cases ?? []).map((item) => ({ name: item.name, note: item.point ?? item.note })),
    schemes: (normalized.schemes ?? []).map((item) => ({ name: item.name, note: item.point ?? item.note })),
    articles: normalized.articles ?? [],
    key_facts: normalized.keyFacts ?? [],
    ncert_coverage: [
      `Begin with the simple explanation for ${normalized.title}.`,
      "Read the linked NCERT chapter for original context and examples.",
      "Convert hard facts into flashcards after the first reading.",
      "Use the Mains angles for answer writing practice.",
    ],
    prelims_traps: normalized.prelimsTraps ?? [],
    mains_angles: normalized.mainsAngles ?? [],
    related_topics: normalized.relatedTopics ?? [],
    content_model: "clearupsc_publish_ready_v1",
    content_quality: "publish_ready",
  };
}

function titleToWikiSlug(title) {
  return String(title || "")
    .replace(/\s+[-–—]\s+Overview$/i, "")
    .replace(/\s+/g, "_");
}

function makeTopicRow(topic) {
  const normalized = deepNormalize(topic);
  return {
    key: normalized.key,
    title: normalized.title,
    subject: normalizeSubject(normalized.subject),
    exam_stage: normalized.subject?.includes("CSAT") ? "prelims" : "both",
    upsc_weightage: normalized.key.includes("economy") || normalized.key.includes("polity") ? 5 : 4,
    wiki_slug: titleToWikiSlug(normalized.title),
    structured_notes: JSON.stringify(makeStructuredNotes(normalized)),
  };
}

async function updateTopic(supabase, row) {
  const withQuality = { ...row, content_quality: "publish_ready" };
  const { error } = await supabase.from("topics").upsert(withQuality, { onConflict: "key" });
  if (!error) return { ok: true, withQuality: true };
  if (!String(error.message).includes("content_quality")) throw error;
  const fallback = await supabase.from("topics").upsert(row, { onConflict: "key" });
  if (fallback.error) throw fallback.error;
  return { ok: true, withQuality: false };
}

async function main() {
  const { url, serviceKey } = requireSupabaseEnv();
  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const rawTopics = KNOWLEDGE_FILES.flatMap(loadKnowledgeFile);
  const uniqueTopics = Array.from(new Map(rawTopics.map((topic) => [topic.key, topic])).values());
  const rows = uniqueTopics.map(makeTopicRow);
  const report = {
    generatedAt: new Date().toISOString(),
    sourceFiles: KNOWLEDGE_FILES,
    totalKnowledgeTopics: rows.length,
    imported: 0,
    importedWithContentQuality: 0,
    importedWithoutContentQuality: 0,
    failed: [],
    sampleKeys: rows.slice(0, 12).map((row) => row.key),
  };

  for (const row of rows) {
    try {
      const result = await updateTopic(supabase, row);
      report.imported += result.ok ? 1 : 0;
      if (result.withQuality) report.importedWithContentQuality += 1;
      else report.importedWithoutContentQuality += 1;
    } catch (error) {
      report.failed.push({ key: row.key, error: error.message });
    }
  }

  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Course knowledge import complete: ${report.imported}/${report.totalKnowledgeTopics}`);
  if (report.failed.length) {
    console.log(`Failed imports: ${report.failed.length}`);
    process.exitCode = 1;
  }
  console.log(`Report: ${resolve(REPORT_PATH)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
