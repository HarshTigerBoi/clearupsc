import crypto from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import vm from "node:vm";
import { PDFParse } from "pdf-parse";
import ts from "typescript";

const require = createRequire(import.meta.url);
const repoRoot = process.cwd();
const indexPath = path.join(repoRoot, "src", "lib", "study", "ncert-master-index.ts");
const pdfDir = path.join(repoRoot, "data", "study", "textbook-first", "raw-pdfs");
const textDir = path.join(repoRoot, "data", "study", "textbook-first", "raw-text");
const metaDir = path.join(repoRoot, "data", "study", "textbook-first", "raw-meta");
const reportPath = path.join(repoRoot, "data", "content-reports", "textbook-first-source-acquisition.json");

const args = new Set(process.argv.slice(2));
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const priorityArg = process.argv.find((arg) => arg.startsWith("--priority="));
const keyArg = process.argv.find((arg) => arg.startsWith("--key="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : args.has("--all") ? Number.POSITIVE_INFINITY : 20;
const priority = priorityArg ? Number(priorityArg.split("=")[1]) : args.has("--all") ? 4 : 1;

const VERIFIED_NCERT_BOOK_CODES = {
  "NCERT Class 6 Our Pasts I": { code: "fess1", unavailable: true, reason: "The legacy Class 6 Our Pasts I direct PDFs are no longer published at NCERT's current direct-PDF endpoint." },
  "NCERT Class 7 Our Pasts II": { code: "gess1", maxChapter: 8 },
  "NCERT Class 8 Our Pasts III": { code: "hess2", maxChapter: 8 },
  "NCERT Class 9 India and the Contemporary World I": { code: "iess3", unavailable: true, reason: "NCERT's current direct-PDF endpoint returns 404 for this legacy Class 9 History code." },
  "NCERT Class 10 India and the Contemporary World II": { code: "jess3" },
  "NCERT Class 11 Themes in World History": { code: "kehs1" },
  "NCERT Class 12 Themes in Indian History I": { code: "lehs1" },
  "NCERT Class 12 Themes in Indian History II": { code: "lehs2", maxChapter: 4 },
  "NCERT Class 12 Themes in Indian History III": { code: "lehs3" },

  "NCERT Class 9 Contemporary India I": { code: "iegy1", unavailable: true, reason: "The requested iegy1 direct-PDF code currently returns 404 at NCERT's endpoint; the older iess3 code also returns 404." },
  "NCERT Class 10 Contemporary India II": { code: "jess1" },
  "NCERT Class 11 Fundamentals of Physical Geography": { code: "kegy2", maxChapter: 14 },
  "NCERT Class 11 India Physical Environment": { code: "kegy1", maxChapter: 6 },
  "NCERT Class 12 Fundamentals of Human Geography": { code: "legy1", maxChapter: 8 },
  "NCERT Class 12 India People and Economy": { code: "legy2", maxChapter: 9 },

  "NCERT Class 9 Democratic Politics I": { code: "iess4", unavailable: true, reason: "NCERT's current direct-PDF endpoint does not publish this legacy Class 9 Democratic Politics I code." },
  "NCERT Class 10 Democratic Politics II": { code: "jess4", maxChapter: 5 },
  "NCERT Class 11 Indian Constitution at Work": { code: "keps2" },
  "NCERT Class 11 Political Theory": { code: "keps1", maxChapter: 8 },
  "NCERT Class 12 Politics in India since Independence": { code: "leps2" },
  "NCERT Class 12 Contemporary World Politics": { code: "leps1", maxChapter: 7 },

  "NCERT Class 9 Economics": { code: "iess2", unavailable: true, reason: "NCERT's current direct-PDF endpoint returns 404 for this legacy Class 9 Economics code." },
  "NCERT Class 10 Understanding Economic Development": { code: "jess2" },
  "NCERT Class 11 Indian Economic Development": { code: "keec1", maxChapter: 8 },
  "NCERT Class 12 Introductory Macroeconomics": { code: "leec1" },
  "NCERT Class 12 Introductory Microeconomics": { code: "leec2" },

  "NCERT Class 11 Introducing Sociology": { code: "kesy1" },
  "NCERT Class 11 Understanding Society": { code: "kesy2" },
  "NCERT Class 12 Indian Society": { code: "lesy1" },
  "NCERT Class 12 Social Change and Development in India": { code: "lesy2" },

  "NCERT Class 11 Biology": { code: "kebo1", maxChapter: 19 },
  "NCERT Class 12 Biology": { code: "lebo1", maxChapter: 13 },

  "NCERT Class 6 The Earth Our Habitat": { code: "fess2", unavailable: true, reason: "The legacy Class 6 Earth Our Habitat direct PDFs are no longer published at NCERT's current direct-PDF endpoint." },
  "NCERT Class 6 Social and Political Life I": { code: "fess3", unavailable: true, reason: "The legacy Class 6 Social and Political Life I direct PDFs are no longer published at NCERT's current direct-PDF endpoint." },
  "NCERT Class 6 Science": { code: "fesc1", unavailable: true, reason: "The legacy Class 6 Science direct PDFs are no longer published at NCERT's current direct-PDF endpoint." },
  "NCERT Class 7 Our Environment": { code: "gess2", maxChapter: 7 },
  "NCERT Class 7 Social and Political Life II": { code: "gess3", maxChapter: 8 },
  "NCERT Class 7 Science": { code: "gesc1", maxChapter: 13 },
  "NCERT Class 8 Science": { code: "hesc1", maxChapter: 13 },
  "NCERT Class 9 Science": { code: "iesc1", maxChapter: 13 },
  "NCERT Class 10 Science": { code: "jesc1", maxChapter: 13 },
  "NCERT Class 11 Chemistry": { code: "kech1", maxChapter: 6 },
  "NCERT Class 11 Physics": { code: "keph1", maxChapter: 7 },
  "NCERT Class 12 Chemistry": { code: "lech1", maxChapter: 5 },
  "NCERT Class 12 Physics": { code: "leph1", maxChapter: 8 },
  "NCERT Class 11 Living Craft Traditions of India": { code: "kefa2", unavailable: true, reason: "NCERT's current direct-PDF endpoint returns 404 for this living craft traditions source." },
};

function loadMasterIndex() {
  const source = fs.readFileSync(indexPath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(transpiled, { module, exports: module.exports, require, console }, { filename: indexPath });
  return module.exports;
}

function resolveChapterPdfSource(chapter) {
  const verified = VERIFIED_NCERT_BOOK_CODES[chapter.source.book];
  if (verified) {
    const chapterNumber = Number(chapter.source.chapter) + Number(verified.chapterOffset ?? 0);
    const url = `https://ncert.nic.in/textbook/pdf/${verified.code}${String(chapterNumber).padStart(2, "0")}.pdf`;
    if (verified.unavailable) {
      return { url, status: "skipped_unavailable", reason: verified.reason };
    }
    if (verified.maxChapter && chapterNumber > verified.maxChapter) {
      return {
        url,
        status: "skipped_unavailable",
        reason: `${chapter.source.book} is published up to chapter ${verified.maxChapter} at NCERT's current direct-PDF endpoint; chapter ${chapterNumber} is rationalized or unavailable.`,
      };
    }
    return { url, status: "available" };
  }
  const url = chapter.source.pdf_url;
  if (/\.pdf(?:$|\?)/i.test(url)) return { url, status: "available" };
  const match = url.match(/[?&]([a-z0-9]+)=\d+-\d+/i);
  if (!match) return { url: null, status: "error", reason: "Could not resolve chapter PDF URL." };
  return { url: `https://ncert.nic.in/textbook/pdf/${match[1]}${String(chapter.source.chapter).padStart(2, "0")}.pdf`, status: "available" };
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function hasCurrentCache({ pdfPath, textPath, metaPath, pdfUrl }) {
  if (!fs.existsSync(pdfPath) || !fs.existsSync(textPath) || !fs.existsSync(metaPath)) return false;
  const meta = readJsonIfExists(metaPath);
  return meta?.resolved_pdf_url === pdfUrl;
}

function normalizeText(text) {
  return text.replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function titleTokens(value) {
  return String(value).toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length >= 4);
}

function titleMatchScore(title, text) {
  const tokens = titleTokens(title);
  if (!tokens.length) return 0;
  const sample = text.toLowerCase().slice(0, 4000);
  return Number((tokens.filter((token) => sample.includes(token)).length / tokens.length).toFixed(2));
}

async function downloadPdf(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const type = response.headers.get("content-type") ?? "";
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length || (!type.includes("pdf") && !bytes.subarray(0, 5).toString().includes("%PDF"))) {
    throw new Error(`Response is not a PDF (${type || "unknown content-type"})`);
  }
  return bytes;
}

async function extractPdfText(bytes) {
  const parser = new PDFParse({ data: bytes });
  try {
    const result = await parser.getText();
    return normalizeText(result.text ?? "");
  } finally {
    await parser.destroy();
  }
}

fs.mkdirSync(pdfDir, { recursive: true });
fs.mkdirSync(textDir, { recursive: true });
fs.mkdirSync(metaDir, { recursive: true });
fs.mkdirSync(path.dirname(reportPath), { recursive: true });

const { NCERT_CHAPTER_TOPICS } = loadMasterIndex();
let chapters = [...NCERT_CHAPTER_TOPICS].sort((a, b) => a.priority_band - b.priority_band || a.key.localeCompare(b.key));
if (keyArg) {
  const key = keyArg.split("=")[1];
  chapters = chapters.filter((chapter) => chapter.key === key);
} else {
  chapters = chapters.filter((chapter) => chapter.priority_band <= priority).slice(0, limit);
}

const rows = [];
for (const chapter of chapters) {
  const pdfSource = resolveChapterPdfSource(chapter);
  const pdfUrl = pdfSource.url;
  const row = {
    key: chapter.key,
    title: chapter.title,
    priority_band: chapter.priority_band,
    source: chapter.source,
    resolved_pdf_url: pdfUrl,
    status: "pending",
  };
  try {
    if (pdfSource.status === "skipped_unavailable") {
      row.status = "skipped_unavailable";
      row.reason = pdfSource.reason;
      rows.push(row);
      console.log(`${row.status}: ${chapter.key}`);
      continue;
    }
    if (!pdfUrl) throw new Error("Could not resolve chapter PDF URL.");
    const pdfPath = path.join(pdfDir, `${chapter.key}.pdf`);
    const textPath = path.join(textDir, `${chapter.key}.txt`);
    const metaPath = path.join(metaDir, `${chapter.key}.json`);
    if (hasCurrentCache({ pdfPath, textPath, metaPath, pdfUrl })) {
      const bytes = fs.readFileSync(pdfPath);
      const text = fs.readFileSync(textPath, "utf8");
      const meta = readJsonIfExists(metaPath) ?? {};
      row.status = "fetched";
      row.sha256 = meta.sha256 ?? crypto.createHash("sha256").update(bytes).digest("hex");
      row.bytes = bytes.length;
      row.extracted_characters = text.length;
      row.title_match_score = titleMatchScore(chapter.source.chapter_title, text);
      row.raw_pdf_path = path.relative(repoRoot, pdfPath).replaceAll("\\", "/");
      row.raw_text_path = path.relative(repoRoot, textPath).replaceAll("\\", "/");
      row.cache_meta_path = path.relative(repoRoot, metaPath).replaceAll("\\", "/");
      rows.push(row);
      console.log(`${row.status}: ${chapter.key} (cache)`);
      continue;
    }
    const bytes = await downloadPdf(pdfUrl);
    const hash = crypto.createHash("sha256").update(bytes).digest("hex");
    const text = await extractPdfText(bytes);
    if (text.length < 500) throw new Error("Extracted text is too short for a full chapter.");
    fs.writeFileSync(pdfPath, bytes);
    fs.writeFileSync(textPath, `${text}\n`);
    fs.writeFileSync(
      metaPath,
      `${JSON.stringify(
        {
          key: chapter.key,
          resolved_pdf_url: pdfUrl,
          source_book: chapter.source.book,
          source_chapter: chapter.source.chapter,
          source_chapter_title: chapter.source.chapter_title,
          sha256: hash,
          bytes: bytes.length,
          extracted_characters: text.length,
          generated_at: new Date().toISOString(),
        },
        null,
        2,
      )}\n`,
    );
    row.status = "fetched";
    row.sha256 = hash;
    row.bytes = bytes.length;
    row.extracted_characters = text.length;
    row.title_match_score = titleMatchScore(chapter.source.chapter_title, text);
    row.raw_pdf_path = path.relative(repoRoot, pdfPath).replaceAll("\\", "/");
    row.raw_text_path = path.relative(repoRoot, textPath).replaceAll("\\", "/");
    row.cache_meta_path = path.relative(repoRoot, metaPath).replaceAll("\\", "/");
  } catch (error) {
    row.status = "error";
    row.error = error instanceof Error ? error.message : String(error);
  }
  rows.push(row);
  console.log(`${row.status}: ${chapter.key}`);
}

const report = {
  generated_at: new Date().toISOString(),
  requested: {
    priority,
    limit: Number.isFinite(limit) ? limit : "all",
    key: keyArg?.split("=")[1] ?? null,
  },
  total: rows.length,
  fetched: rows.filter((row) => row.status === "fetched").length,
  skipped_unavailable: rows.filter((row) => row.status === "skipped_unavailable").length,
  errors: rows.filter((row) => row.status === "error").length,
  rows,
};

fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Source acquisition report: ${path.relative(repoRoot, reportPath).replaceAll("\\", "/")}`);
