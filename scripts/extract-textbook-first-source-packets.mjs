import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const acquisitionPath = path.join(repoRoot, "data", "content-reports", "textbook-first-source-acquisition.json");
const packetDir = path.join(repoRoot, "data", "study", "textbook-first", "source-packets");
const reportPath = path.join(repoRoot, "data", "content-reports", "textbook-first-source-packets.json");

function cleanLine(line) {
  return line.replace(/\s+/g, " ").trim();
}

function isCandidateHeading(line) {
  const text = cleanLine(line);
  if (text.length < 4 || text.length > 90) return false;
  if (/^(--|\d+ of \d+|reprint|202\d-\d|unit|exercises?|references?)\b/i.test(text)) return false;
  if (/^\d+$/.test(text)) return false;
  const letters = text.replace(/[^A-Za-z]/g, "");
  if (letters.length < 4) return false;
  const upperRatio = letters.replace(/[^A-Z]/g, "").length / letters.length;
  return upperRatio >= 0.65 || /^\d+(\.\d+)*\s+[A-Z]/.test(text);
}

function splitPages(text) {
  const parts = text.split(/\n--\s+\d+\s+of\s+\d+\s+--\n/i);
  if (parts.length <= 1) return [{ page_index: 1, text }];
  return parts.filter((part) => part.trim()).map((part, index) => ({ page_index: index + 1, text: part }));
}

function extractPacket(row) {
  const textPath = path.join(repoRoot, row.raw_text_path);
  const text = fs.readFileSync(textPath, "utf8");
  const pages = splitPages(text);
  const headingMap = new Map();
  const paragraphCounts = [];
  for (const page of pages) {
    const lines = page.text.split(/\n+/).map(cleanLine).filter(Boolean);
    paragraphCounts.push(lines.filter((line) => line.length > 120).length);
    for (const line of lines) {
      if (!isCandidateHeading(line)) continue;
      const key = line.toLowerCase();
      if (!headingMap.has(key)) {
        headingMap.set(key, {
          title: line,
          first_seen_page_index: page.page_index,
          source_trace: `${row.source.book}, Chapter ${row.source.chapter}, extracted page ${page.page_index}`,
        });
      }
    }
  }
  const conceptCandidates = [...headingMap.values()].slice(0, 40);
  return {
    key: row.key,
    title: row.title,
    source: row.source,
    resolved_pdf_url: row.resolved_pdf_url,
    sha256: row.sha256,
    extraction: {
      raw_text_path: row.raw_text_path,
      extracted_characters: row.extracted_characters,
      page_count: pages.length,
      paragraph_count_estimate: paragraphCounts.reduce((sum, count) => sum + count, 0),
      title_match_score: row.title_match_score,
    },
    concept_candidates: conceptCandidates,
    production_status: conceptCandidates.length ? "concept_candidates_ready_for_human_decode" : "needs_manual_source_review",
  };
}

if (!fs.existsSync(acquisitionPath)) {
  throw new Error("Run npm run content:textbook-fetch before extracting source packets.");
}

fs.mkdirSync(packetDir, { recursive: true });
fs.mkdirSync(path.dirname(reportPath), { recursive: true });

const acquisition = JSON.parse(fs.readFileSync(acquisitionPath, "utf8"));
const fetchedRows = (acquisition.rows ?? []).filter((row) => row.status === "fetched" && row.raw_text_path);
const packets = [];
const errors = [];

for (const row of fetchedRows) {
  try {
    const packet = extractPacket(row);
    const packetPath = path.join(packetDir, `${row.key}.json`);
    fs.writeFileSync(packetPath, `${JSON.stringify(packet, null, 2)}\n`);
    packets.push({ key: row.key, concept_candidates: packet.concept_candidates.length, packet_path: path.relative(repoRoot, packetPath).replaceAll("\\", "/") });
    console.log(`packet: ${row.key} (${packet.concept_candidates.length} candidates)`);
  } catch (error) {
    errors.push({ key: row.key, error: error instanceof Error ? error.message : String(error) });
    console.log(`error: ${row.key}`);
  }
}

const report = {
  generated_at: new Date().toISOString(),
  fetched_sources: fetchedRows.length,
  packets_created: packets.length,
  errors,
  packets,
};

fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Source packet report: ${path.relative(repoRoot, reportPath).replaceAll("\\", "/")}`);
