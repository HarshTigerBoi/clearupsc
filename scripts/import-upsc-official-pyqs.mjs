import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { PDFParse } from "pdf-parse";
import { requireSupabaseEnv } from "./script-env.mjs";

const { url, serviceKey } = requireSupabaseEnv();
const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const DATA_DIR = join(process.cwd(), "data", "upsc-pyq-pdfs");
const REPORT_PATH = join(process.cwd(), "data", "upsc-official-pyq-import-report.json");

const OFFICIAL_PAPERS = [
  {
    year: 2025,
    paper: "GS1",
    url: "https://upsc.gov.in/sites/default/files/QP-CSP-25-GENERAL-STUDIES-PAPER-I-26052025.pdf",
  },
  {
    year: 2025,
    paper: "CSAT",
    url: "https://upsc.gov.in/sites/default/files/QP-CSP-25-GENERAL-STUDIES-PAPER-II-26052025.pdf",
  },
  {
    year: 2024,
    paper: "GS1",
    url: "https://upsc.gov.in/sites/default/files/QP-CSP-24-GENERAL-STUDIES-PAPER-I-180624.pdf",
  },
  {
    year: 2024,
    paper: "CSAT",
    url: "https://upsc.gov.in/sites/default/files/QP-CSP-24-GENERAL-STUDIES-PAPER-II-180624.pdf",
  },
  {
    year: 2023,
    paper: "GS1",
    url: "https://upsc.gov.in/sites/default/files/QP_CS_Pre_Exam_2023_280523.pdf",
  },
  {
    year: 2023,
    paper: "CSAT",
    url: "https://upsc.gov.in/sites/default/files/QP_CS_Pre_Exam_2023_GENERAL_STUDIES_PAPER_II_280523.pdf",
  },
  {
    year: 2022,
    paper: "GS1",
    url: "https://upsc.gov.in/sites/default/files/GENERAL%20STUDIES%20PAPER%20I.pdf",
  },
  {
    year: 2022,
    paper: "CSAT",
    url: "https://upsc.gov.in/sites/default/files/GENERAL%20STUDIES%20PAPER%20II.pdf",
  },
  {
    year: 2021,
    paper: "GS1",
    url: "https://upsc.gov.in/sites/default/files/QP-CSP-21-GeneralStudiesPaper-I-121021.pdf",
  },
  {
    year: 2021,
    paper: "CSAT",
    url: "https://upsc.gov.in/sites/default/files/QP-CSP-21-GeneralStudiesPaper-II-121021.pdf",
  },
  {
    year: 2020,
    paper: "GS1",
    url: "https://upsc.gov.in/sites/default/files/CSP_2020_GS_Paper-1.pdf",
  },
  {
    year: 2020,
    paper: "CSAT",
    url: "https://upsc.gov.in/sites/default/files/CSP_2020_GS_Paper-2.pdf",
  },
];

const TOPIC_RULES = [
  { key: "gs2_polity_judiciary", tags: ["judiciary", "supreme court", "high court", "judge", "judicial", "tribunal"] },
  { key: "gs2_polity_parliament", tags: ["parliament", "lok sabha", "rajya sabha", "speaker", "bill", "committee"] },
  { key: "gs2_polity_constitution", tags: ["constitution", "constitutional", "fundamental rights", "directive principles", "article "] },
  { key: "gs2_polity_federalism", tags: ["federal", "state list", "union list", "inter-state", "governor"] },
  { key: "gs2_governance", tags: ["governance", "rti", "accountability", "citizen", "civil service"] },
  { key: "gs2_ir", tags: ["united nations", "international", "treaty", "india and", "asean", "g20", "brics", "saarc"] },
  { key: "gs3_economy", tags: ["rbi", "bank", "inflation", "gdp", "budget", "tax", "fiscal", "monetary", "market", "wto"] },
  { key: "gs3_agriculture", tags: ["crop", "agriculture", "farmer", "irrigation", "msp", "pds", "soil"] },
  { key: "gs3_environment", tags: ["biodiversity", "ecology", "environment", "climate", "forest", "wetland", "wildlife", "pollution"] },
  { key: "gs3_science_technology", tags: ["space", "satellite", "biotechnology", "virus", "vaccine", "technology", "digital", "semiconductor"] },
  { key: "gs3_security", tags: ["security", "cyber", "terrorism", "border", "money laundering"] },
  { key: "gs1_history_modern_india", tags: ["british", "congress", "gandhi", "swadeshi", "revolt", "freedom", "national movement"] },
  { key: "gs1_history_ancient_india", tags: ["vedic", "buddha", "mauryan", "gupta", "harappan", "ashoka"] },
  { key: "gs1_history_medieval_india", tags: ["mughal", "sultanate", "vijayanagara", "bhakti", "sufi"] },
  { key: "gs1_geography", tags: ["river", "lake", "monsoon", "ocean", "mountain", "plateau", "island", "climate", "rainfall"] },
  { key: "gs1_society", tags: ["women", "population", "tribe", "caste", "society", "urban"] },
  { key: "gs4_ethics", tags: ["ethics", "integrity", "probity", "attitude", "emotional intelligence"] },
];

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  mkdirSync(DATA_DIR, { recursive: true });
  const report = {
    source: "UPSC official previous-question-paper PDFs",
    sourcePage: "https://upsc.gov.in/examinations/previous-question-papers",
    generatedAt: new Date().toISOString(),
    papers: [],
    totals: { papers: 0, parsedQuestions: 0, inserted: 0, scannedOrUnreadable: 0, failed: 0 },
  };

  for (const paper of OFFICIAL_PAPERS) {
    console.log(`\nImporting ${paper.year} ${paper.paper}`);
    const entry = { ...paper, downloaded: false, textLength: 0, parsedQuestions: 0, inserted: 0, status: "pending" };
    try {
      const pdfPath = await downloadPaper(paper);
      entry.downloaded = true;
      const text = await extractPdfText(pdfPath);
      entry.textLength = text.length;

      const questions = parseQuestions(text, paper);
      entry.parsedQuestions = questions.length;

      if (!questions.length) {
        entry.status = "needs_ocr";
        entry.note = "Official PDF appears scanned/image-only or extraction failed. Do not replace it with synthetic data.";
        report.totals.scannedOrUnreadable += 1;
        console.log(`  needs OCR: extracted ${text.length} chars, parsed 0 questions`);
      } else {
        await supabase
          .from("pyq_questions")
          .delete()
          .eq("source", "UPSC Official Question Paper")
          .eq("year", paper.year)
          .eq("paper", paper.paper);
        const { error } = await supabase.from("pyq_questions").upsert(questions, { onConflict: "id" });
        if (error) throw error;
        entry.inserted = questions.length;
        entry.status = "imported";
        report.totals.parsedQuestions += questions.length;
        report.totals.inserted += questions.length;
        console.log(`  imported ${questions.length} official questions`);
      }
    } catch (error) {
      entry.status = "failed";
      entry.error = error instanceof Error ? error.message : String(error);
      report.totals.failed += 1;
      console.log(`  failed: ${entry.error}`);
    }
    report.totals.papers += 1;
    report.papers.push(entry);
  }

  writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  console.log("\nOfficial PYQ import report");
  console.log(JSON.stringify(report.totals, null, 2));
  console.log(`Report: ${REPORT_PATH}`);
}

async function downloadPaper(paper) {
  const filename = `upsc-csp-${paper.year}-${paper.paper.toLowerCase()}.pdf`;
  const pdfPath = join(DATA_DIR, filename);
  if (existsSync(pdfPath)) return pdfPath;
  const response = await fetch(paper.url);
  if (!response.ok) throw new Error(`Could not download ${paper.url}: HTTP ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(pdfPath, buffer);
  return pdfPath;
}

async function extractPdfText(pdfPath) {
  const buffer = readFileSync(pdfPath);
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return normalizeText(result.text);
  } finally {
    await parser.destroy();
  }
}

function normalizeText(text) {
  return text
    .replace(/\r/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseQuestions(text, paper) {
  const englishText = extractEnglishQuestionText(text);
  if (!englishText || englishText.length < 5000) return [];

  const lines = englishText.split(/\n/).map((line) => line.trim()).filter(Boolean);
  const blocks = [];
  let current = [];
  let expected = 1;
  let currentNumber = 0;

  for (const line of lines) {
    if (isJunkLine(line)) continue;
    const start = line.match(/^(\d{1,3})\.\s*(.+)$/);
    const hasFourOptions = current.filter(isOptionLine).length >= 4;
    const startNumber = start ? Number(start[1]) : 0;
    if (start && startNumber === expected && current.length === 0 && looksLikeEnglishQuestionStart(start[2])) {
      currentNumber = expected;
      current.push(line);
      continue;
    }
    if (start && startNumber > expected && startNumber <= 100 && hasFourOptions && looksLikeEnglishQuestionStart(start[2])) {
      blocks.push({ number: currentNumber, text: current.join("\n") });
      expected = startNumber;
      currentNumber = startNumber;
      current = [line];
      continue;
    }
    if (current.length) current.push(line);
  }
  if (current.length && current.filter(isOptionLine).length >= 4) {
    blocks.push({ number: currentNumber, text: current.join("\n") });
  }

  return blocks
    .map((block) => toQuestionRow(block, paper))
    .filter(Boolean)
    .slice(0, paper.paper === "CSAT" ? 80 : 100);
}

function extractEnglishQuestionText(text) {
  const markers = [
    "1. Consider the following statements",
    "1. Consider the following",
    "1. With reference",
    "1. Which one of the following",
  ];
  const indices = markers.map((marker) => text.indexOf(marker)).filter((index) => index >= 0);
  if (!indices.length) return "";
  return text.slice(Math.min(...indices));
}

function isJunkLine(line) {
  return (
    /^-- \d+ of \d+ --$/.test(line) ||
    /^\d+\s*\[\s*P\.T\.O\.?\s*\]$/i.test(line) ||
    /^XDTG/i.test(line) ||
    /^CIVIL SERVICES/i.test(line) ||
    /^GENERAL STUDIES/i.test(line)
  );
}

function isOptionLine(line) {
  return /^[.\s]*[\(\{]?[a-d]\)/i.test(line);
}

function looksLikeEnglishQuestionStart(text) {
  const letters = text.replace(/[^A-Za-z]/g, "");
  if (letters.length < 4) return false;
  const asciiRatio = letters.length / Math.max(1, text.replace(/\s/g, "").length);
  return asciiRatio > 0.45;
}

function isMostlyEnglish(text) {
  const visible = text.replace(/\s/g, "");
  if (!visible) return false;
  const asciiLettersAndCommonMarks = text.replace(/[^A-Za-z0-9\s.,;:?!'"()\-–/%₹]/g, "");
  return asciiLettersAndCommonMarks.length / text.length > 0.72;
}

function toQuestionRow(block, paper) {
  const optionMatches = [...block.text.matchAll(/[\(\{]([a-d])\)\s*/gi)];
  if (optionMatches.length < 4) return null;
  const firstOption = optionMatches[0].index ?? 0;
  const questionText = cleanQuestion(block.text.slice(0, firstOption));
  const options = optionMatches.slice(0, 4).map((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const next = optionMatches[index + 1]?.index ?? block.text.length;
    return cleanOption(block.text.slice(start, next));
  });
  if (!questionText || options.some((option) => !option)) return null;
  if (!isMostlyEnglish(`${questionText} ${options.join(" ")}`)) return null;
  const topics = inferTopics(questionText, options, paper.paper);
  return {
    id: `upsc-official-csp-${paper.year}-${paper.paper.toLowerCase()}-${String(block.number).padStart(3, "0")}`,
    year: paper.year,
    paper: paper.paper,
    question_text: questionText,
    options,
    correct_option: null,
    explanation: "Official UPSC question imported from the Commission's question-paper PDF. Answer key and explanation are pending verified source mapping; ClearUPSC will not guess the correct option.",
    topics,
    difficulty: "official",
    source: "UPSC Official Question Paper",
  };
}

function cleanQuestion(text) {
  return text
    .replace(/^\d{1,3}\.\s*/, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n+/g, "\n")
    .replace(/\s+([?.:,;])/g, "$1")
    .trim();
}

function cleanOption(text) {
  return text
    .replace(/[ \t]+/g, " ")
    .replace(/\n+/g, " ")
    .replace(/\s+([?.:,;])/g, "$1")
    .trim();
}

function inferTopics(questionText, options, paper) {
  if (paper === "CSAT") return ["csat"];
  const haystack = `${questionText} ${options.join(" ")}`.toLowerCase();
  const topics = new Set(["upsc_official"]);
  for (const rule of TOPIC_RULES) {
    if (rule.tags.some((tag) => haystack.includes(tag))) topics.add(rule.key);
  }
  if (topics.size === 1) topics.add("general_studies");
  return [...topics];
}
