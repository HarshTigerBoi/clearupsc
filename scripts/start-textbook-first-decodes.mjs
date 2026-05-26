import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const acquisitionPath = path.join(repoRoot, "data", "content-reports", "textbook-first-source-acquisition.json");
const packetDir = path.join(repoRoot, "data", "study", "textbook-first", "source-packets");
const draftDir = path.join(repoRoot, "data", "study", "textbook-first", "decode-drafts");
const reportPath = path.join(repoRoot, "data", "content-reports", "textbook-first-decode-drafts.json");

const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : 10;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sourceTrace(row) {
  return [
    row.source.book,
    `Chapter ${row.source.chapter}: ${row.source.chapter_title}`,
    row.resolved_pdf_url,
    row.sha256 ? `sha256:${row.sha256}` : null,
  ]
    .filter(Boolean)
    .join(" | ");
}

if (!fs.existsSync(acquisitionPath)) {
  throw new Error("Run npm run content:textbook-fetch -- --all before starting decode drafts.");
}

fs.mkdirSync(draftDir, { recursive: true });
fs.mkdirSync(path.dirname(reportPath), { recursive: true });

const acquisition = readJson(acquisitionPath);
const fetchedRows = (acquisition.rows ?? []).filter((row) => row.status === "fetched" && row.raw_text_path);
const selectedRows = fetchedRows.slice(0, limit);
const drafts = [];
const errors = [];

for (const row of selectedRows) {
  try {
    const packetPath = path.join(packetDir, `${row.key}.json`);
    if (!fs.existsSync(packetPath)) {
      throw new Error(`Missing source packet: ${path.relative(repoRoot, packetPath).replaceAll("\\", "/")}`);
    }
    const packet = readJson(packetPath);
    const draft = {
      key: row.key,
      title: row.title,
      decode_status: "source_packet_ready_for_human_decode",
      generated_at: new Date().toISOString(),
      source: row.source,
      resolved_pdf_url: row.resolved_pdf_url,
      source_trace: sourceTrace(row),
      raw_text_path: row.raw_text_path,
      source_packet_path: path.relative(repoRoot, packetPath).replaceAll("\\", "/"),
      concept_candidates: packet.concept_candidates ?? [],
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
        "Do not publish this draft as decoded content.",
        "Do not infer explanations, PYQ links, or MCQs without source verification.",
        "Use candidate headings only as navigation hints for manual decoding.",
      ],
    };
    const draftPath = path.join(draftDir, `${row.key}.json`);
    fs.writeFileSync(draftPath, `${JSON.stringify(draft, null, 2)}\n`);
    drafts.push({
      key: row.key,
      source_trace: draft.source_trace,
      concept_candidates: draft.concept_candidates.length,
      draft_path: path.relative(repoRoot, draftPath).replaceAll("\\", "/"),
    });
    console.log(`draft: ${row.key} (${draft.concept_candidates.length} candidates)`);
  } catch (error) {
    errors.push({ key: row.key, error: error instanceof Error ? error.message : String(error) });
    console.log(`error: ${row.key}`);
  }
}

const report = {
  generated_at: new Date().toISOString(),
  requested_limit: limit,
  fetched_sources_available: fetchedRows.length,
  drafts_created: drafts.length,
  errors,
  drafts,
};

fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Decode draft report: ${path.relative(repoRoot, reportPath).replaceAll("\\", "/")}`);
