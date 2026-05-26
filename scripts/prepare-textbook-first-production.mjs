import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const repoRoot = process.cwd();
const indexPath = path.join(repoRoot, "src", "lib", "study", "ncert-master-index.ts");
const reportDir = path.join(repoRoot, "data", "content-reports");
const worklistPath = path.join(reportDir, "textbook-first-production-worklist.json");
const templateDir = path.join(repoRoot, "data", "study", "textbook-first", "chapter-templates");

function loadMasterIndex() {
  const source = fs.readFileSync(indexPath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(transpiled, { module, exports: module.exports, require, console }, { filename: indexPath });
  return module.exports;
}

function priorityLabel(priorityBand) {
  return priorityBand <= 2 ? "decode-first" : priorityBand === 3 ? "decode-next" : "decode-later";
}

function buildWorkItem(chapter) {
  return {
    key: chapter.key,
    title: chapter.title,
    source: chapter.source,
    subject: chapter.subject,
    paper: chapter.paper,
    priority_band: chapter.priority_band,
    production_lane: priorityLabel(chapter.priority_band),
    expected_outputs: {
      concept_map: "15-25 source-extracted concepts in order of chapter appearance.",
      four_layer_decodes: "Each concept requires simple_explanation, textbook_content with source markers, pyq_connections, and recall_card.",
      mcqs: "Exactly 10 UPSC-pattern MCQs with source_trace, trap_explanation, approach_technique, difficulty_level, and concepts_tested.",
      mains_framework: chapter.mains_framework.framework_type,
    },
    absolute_rules: [
      "Do not write a fact unless it is traceable to NCERT or an approved public-domain source.",
      "Do not copy full textbook pages into the repo.",
      "Do not mark source_verified until every concept and MCQ passes validation.",
    ],
  };
}

function writeTemplate(chapter) {
  fs.mkdirSync(templateDir, { recursive: true });
  const file = path.join(templateDir, `${chapter.key}.json`);
  if (fs.existsSync(file)) return;
  const template = {
    key: chapter.key,
    decode_status: "in_review",
    source_verification: {
      verified_by: "",
      verified_at: "",
      source_trace: `${chapter.source.book}, Chapter ${chapter.source.chapter}: ${chapter.source.chapter_title}`,
      source_url: chapter.source.pdf_url,
      source_hash: "",
    },
    pyq_count: 0,
    concepts: [],
    concise_notes: [],
    revision_bullets: [],
    mcqs: [],
    mains_framework: chapter.mains_framework,
    related_chapters: chapter.related_chapters,
  };
  fs.writeFileSync(file, `${JSON.stringify(template, null, 2)}\n`);
}

const { NCERT_CHAPTER_TOPICS } = loadMasterIndex();
const sorted = [...NCERT_CHAPTER_TOPICS].sort((a, b) => a.priority_band - b.priority_band || a.subject.localeCompare(b.subject) || a.key.localeCompare(b.key));
const worklist = sorted.map(buildWorkItem);
const summary = {
  generated_at: new Date().toISOString(),
  chapter_count: worklist.length,
  priority_counts: worklist.reduce((counts, item) => {
    counts[item.production_lane] = (counts[item.production_lane] ?? 0) + 1;
    return counts;
  }, {}),
  note: "This is a production worklist, not decoded content. Fill chapter overlays only from cited source extraction.",
};

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(worklistPath, `${JSON.stringify({ summary, worklist }, null, 2)}\n`);

const shouldWriteTemplates = process.argv.includes("--write-templates");
if (shouldWriteTemplates) {
  for (const chapter of sorted) writeTemplate(chapter);
}

console.log(`Prepared textbook-first production worklist: ${path.relative(repoRoot, worklistPath).replaceAll("\\", "/")}`);
console.log(`Chapters queued: ${summary.chapter_count}`);
console.log(`Priority lanes: ${JSON.stringify(summary.priority_counts)}`);
if (shouldWriteTemplates) console.log(`Templates written under: ${path.relative(repoRoot, templateDir).replaceAll("\\", "/")}`);
