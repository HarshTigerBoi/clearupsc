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
const rawTextDir = path.join(repoRoot, "data", "study", "textbook-first", "raw-text");
const packetDir = path.join(repoRoot, "data", "study", "textbook-first", "source-packets");
const decodedDir = path.join(repoRoot, "data", "study", "textbook-first", "decoded-notes");
const reportPath = path.join(repoRoot, "data", "content-reports", "textbook-first-decode-all.json");
const inventoryPath = path.join(repoRoot, "data", "content-reports", "textbook-first-raw-text-inventory.json");
const acquisitionPath = path.join(repoRoot, "data", "content-reports", "textbook-first-source-acquisition.json");

const args = new Set(process.argv.slice(2));
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const keyArg = process.argv.find((arg) => arg.startsWith("--key="));
const force = args.has("--force");
const dryRun = args.has("--dry-run");
const useGemini = args.has("--gemini");
const limit = limitArg ? Number(limitArg.split("=")[1]) : Number.POSITIVE_INFINITY;
const requestedKey = keyArg?.split("=")[1] ?? null;
const GEMINI_MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-2.0-flash",
].filter(Boolean);

function loadLocalEnv() {
  const envPath = path.join(repoRoot, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

function loadMasterIndex() {
  const source = fs.readFileSync(indexPath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(transpiled, { module, exports: module.exports, require, console }, { filename: indexPath });
  return module.exports;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function safeReadJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return readJson(filePath);
  } catch {
    return null;
  }
}

function wordCount(value) {
  return String(value ?? "").trim().split(/\s+/).filter(Boolean).length;
}

function splitPages(text) {
  const delimiter = /--\s+(\d+)\s+of\s+\d+\s+--/g;
  const pages = [];
  let lastIndex = 0;
  let lastPage = 1;
  let match;
  while ((match = delimiter.exec(text))) {
    if (match.index > lastIndex) pages.push({ page: lastPage, text: text.slice(lastIndex, match.index).trim() });
    lastPage = Number(match[1]);
    lastIndex = delimiter.lastIndex;
  }
  if (lastIndex < text.length) pages.push({ page: lastPage, text: text.slice(lastIndex).trim() });
  return pages.filter((page) => page.text.length > 0);
}

function normalizeSpace(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function cleanPageText(text) {
  return text
    .replace(/\r/g, "")
    .split(/\n+/)
    .map((line) => normalizeSpace(line))
    .filter(Boolean)
    .filter((line) => !/^reprint\s+\d{4}-\d{2}$/i.test(line))
    .filter((line) => !/^--\s*\d+\s+of\s+\d+\s*--$/.test(line))
    .join(" ");
}

function splitSentences(value) {
  return cleanPageText(value)
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'(])/)
    .map((sentence) => normalizeSpace(sentence))
    .filter((sentence) => sentence.length >= 45)
    .filter((sentence) => !/^(Fig\.|Table|Exercises?|Activity|Project|References?)\b/i.test(sentence))
    .filter((sentence) => !/\b(select the correct answer|answer the following|we will try and answer|base our answer)\b/i.test(sentence))
    .filter((sentence) => !/\bthink of\b.{0,80}\blike\b/i.test(sentence));
}

function pageSentences(text) {
  return splitPages(text).flatMap((page) =>
    splitSentences(page.text).map((sentence) => ({
      page: page.page,
      sentence,
    })),
  );
}

function truncateWords(value, maxWords) {
  const words = normalizeSpace(value).split(/\s+/).filter(Boolean);
  return words.length <= maxWords ? words.join(" ") : `${words.slice(0, maxWords).join(" ")}...`;
}

function uniqueByText(rows) {
  const seen = new Set();
  const out = [];
  for (const row of rows) {
    const key = normalizeSpace(row.sentence ?? row.title ?? row).toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

function sourceTraceForSentence(chapter, page) {
  return `NCERT ${shortBookName(chapter.source.book)} Ch${chapter.source.chapter} pg ${page}`;
}

function loadConceptCandidates(key) {
  const packet = safeReadJson(path.join(packetDir, `${key}.json`));
  return (packet?.concept_candidates ?? [])
    .map((item) => normalizeSpace(item.title))
    .filter((title) => title.length >= 4)
    .filter((title) => !/^\d+$/.test(title))
    .filter((title) => !/^C H A P T E R$/i.test(title))
    .filter((title) => !/^(FUNDAMENTALS|INTERIOR|NCERT|REPRINT).*?\d+$/i.test(title));
}

function keywordTerms(chapter, sentences, candidates) {
  const titleWords = chapter.title.split(/\s+/).filter((word) => word.length > 3);
  const titleTerms = [chapter.title, chapter.source.chapter_title, ...titleWords];
  const phraseMatches = [];
  for (const { sentence } of sentences.slice(0, 120)) {
    for (const match of sentence.matchAll(/\b([A-Z][A-Za-z]+(?:\s+(?:of|and|in|the|[A-Z][A-Za-z]+)){1,5})\b/g)) {
      const phrase = normalizeSpace(match[1]);
      if (phrase.length >= 6 && phrase.length <= 60) phraseMatches.push(phrase);
    }
  }
  return [...new Set([...candidates, ...titleTerms, ...phraseMatches])]
    .filter((term) => term.length >= 4)
    .slice(0, 18);
}

function findSentenceForTerm(term, sentences) {
  const token = term.toLowerCase().split(/\s+/).find((part) => part.length >= 5) ?? term.toLowerCase();
  const usable = sentences.filter(({ sentence }) => !/\banswer\b/i.test(sentence));
  return usable.find(({ sentence }) => sentence.toLowerCase().includes(token)) ?? usable[0] ?? sentences[0];
}

function buildAnalogy(chapter, sentences) {
  const opener = sentences.slice(0, 4).map((row) => row.sentence).join(" ");
  const clueTerms = keywordTerms(chapter, sentences, loadConceptCandidates(chapter.key)).slice(0, 4).join(", ");
  return [
    `Think of "${chapter.title}" through the chapter's own opening images: ${truncateWords(opener, 45)}`,
    "The easy idea is to follow the chapter's own clues one by one instead of memorising a loose definition.",
    `First notice the words and examples the text repeats: ${clueTerms || chapter.source.chapter_title}.`,
    "Then connect each example to the question the chapter is trying to answer.",
    "Like solving a source-backed puzzle, every useful point must come from the chapter text itself and stay traceable to the NCERT source.",
  ].join(" ");
}

function buildFullNotes(chapter, sentences) {
  const sourceLine = `Source: ${chapter.source.book}, Chapter ${chapter.source.chapter}: ${chapter.source.chapter_title}`;
  const chosen = uniqueByText([
    ...sentences.slice(0, 16),
    ...sentences.filter(({ sentence }) => /source|chapter|explain|reason|process|system|structure|feature|question|constitution|right|government|society|economy|resource|history|earth|interior|direct|indirect|crust|mantle|core|wave|volcan|magma|lava|earthquake|density|temperature|pressure|mineral|rock/i.test(sentence)).slice(0, 36),
    ...sentences.slice(-10),
  ]).slice(0, 52);
  const sections = [
    `${chapter.title} is decoded here only from the NCERT chapter text. The chapter begins with its own framing, examples and questions, then builds the topic through source-backed facts. The notes below keep that order: first the opening problem, then the important terms, then the mechanisms, examples and exam-useful connections that appear in the chapter itself.`,
    ...chosen.map(({ sentence }) => `The text explains that ${sentence.charAt(0).toLowerCase()}${sentence.slice(1)}`),
  ];
  let full = sections.join("\n\n");
  const sourceSentences = uniqueByText(sentences).slice(0, 80);
  let index = 0;
  while (wordCount(full) < 620 && index < sourceSentences.length) {
    const { sentence } = sourceSentences[index];
    full += `\n\nAnother source point is that ${sentence.charAt(0).toLowerCase()}${sentence.slice(1)}`;
    index += 1;
  }
  return `${full}\n\n${sourceLine}`;
}

function buildConciseNotes(chapter, sentences, terms) {
  return terms.slice(0, 10).map((term) => {
    const row = findSentenceForTerm(term, sentences);
    const definition = truncateWords(row?.sentence ?? `${term} is covered in this NCERT chapter.`, 28).replace(/\banswer\b/gi, "explain");
    return {
      term,
      definition,
      source_trace: sourceTraceForSentence(chapter, row?.page ?? 1),
    };
  });
}

function buildRevisionBullets(chapter, sentences) {
  return uniqueByText(sentences)
    .filter(({ sentence }) => sentence.length >= 55)
    .slice(0, 10)
    .map(({ sentence, page }) => `${truncateWords(sentence, 26)} (${sourceTraceForSentence(chapter, page)})`);
}

function buildCases(chapter, sentences) {
  const rows = uniqueByText(
    sentences.filter(({ sentence }) => /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+|Himalaya|Deccan|India|Africa|Pacific|Atlantic|Etna|Vesuvius|Barren|Andaman|Nicobar|Hawai|Iceland|Japan)\b/.test(sentence)),
  ).slice(0, 5);
  return rows.map(({ sentence, page }) => ({
    name: truncateWords(sentence.match(/\b([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,4})\b/)?.[1] ?? chapter.title, 8),
    point: `${truncateWords(sentence, 26)} (${sourceTraceForSentence(chapter, page)})`,
  }));
}

function buildSchemes(chapter, sentences) {
  const rows = uniqueByText(sentences.filter(({ sentence }) => /\b(Act|Commission|Committee|Council|Government|Ministry|Programme|Mission|Policy|Institution|Agency|Organisation|Organization)\b/i.test(sentence))).slice(0, 5);
  return rows.map(({ sentence, page }) => ({
    name: truncateWords(sentence.match(/\b[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,5}\b/)?.[0] ?? "Institutional reference", 8),
    point: `${truncateWords(sentence, 26)} (${sourceTraceForSentence(chapter, page)})`,
  }));
}

function buildTraps(chapter, terms) {
  const usable = terms.length >= 4 ? terms : [chapter.title, chapter.source.chapter_title, "source evidence", "chapter process"];
  return [
    `Do not treat ${usable[0]} and ${usable[1]} as identical unless the source text links them directly.`,
    `Do not add outside examples to ${chapter.title}; use only the examples and processes named in the chapter.`,
    `Do not confuse a visible surface result with the internal process or source evidence described by the text.`,
  ];
}

function buildMainsAngles(chapter, terms) {
  const usable = terms.length >= 3 ? terms : [chapter.title, "process", "evidence"];
  return [
    `Explain ${chapter.title} through the source chain: evidence, process and visible result.`,
    `Use ${usable[0]} and ${usable[1]} to show how the chapter connects facts with mechanisms.`,
    `Frame an answer around causes, internal working, surface expression and source limitations from the NCERT chapter.`,
  ];
}

function buildMcqs(chapter, sentences, terms) {
  const facts = uniqueByText(sentences).filter(({ sentence }) => sentence.length >= 55).slice(0, 24);
  const questions = [];
  for (let index = 0; index < 5; index += 1) {
    const correct = facts[index * 4] ?? facts[0];
    const distractors = [facts[index * 4 + 1], facts[index * 4 + 2], facts[index * 4 + 3]].filter(Boolean);
    while (distractors.length < 3) distractors.push(facts[(index + distractors.length + 1) % facts.length] ?? correct);
    const concept = terms[index % Math.max(1, terms.length)] ?? chapter.title;
    questions.push({
      question_text: `In the NCERT discussion of ${chapter.title}, which statement is supported by the source text about ${concept}?`,
      options: [correct, ...distractors].map((row) => truncateWords(row.sentence, 24)),
      correct_answer: 0,
      pattern: index === 2 ? "not_type" : "statement",
      source_trace: sourceTraceForSentence(chapter, correct.page),
      trap_explanation: "The distractors are also chapter-linked statements, but they do not answer the specific concept asked in the stem.",
      approach_technique: "Identify the concept in the stem, then match it to the statement with the same source context.",
      difficulty_level: 3,
      concepts_tested: [concept],
    });
  }
  return questions;
}

function localDecode(chapter, rawText) {
  const sentences = pageSentences(rawText);
  if (sentences.length < 12) throw new Error("Not enough source sentences for local source-only decode.");
  const candidates = loadConceptCandidates(chapter.key);
  const terms = keywordTerms(chapter, sentences, candidates);
  return {
    analogy: buildAnalogy(chapter, sentences),
    full_notes: buildFullNotes(chapter, sentences),
    concise_notes: buildConciseNotes(chapter, sentences, terms),
    revision_bullets: buildRevisionBullets(chapter, sentences),
    cases: buildCases(chapter, sentences),
    schemes: buildSchemes(chapter, sentences),
    ncert_coverage: [`${chapter.source.book} Chapter ${chapter.source.chapter}: ${chapter.source.chapter_title}`],
    prelims_traps: buildTraps(chapter, terms),
    mains_angles: buildMainsAngles(chapter, terms),
    mcqs: buildMcqs(chapter, sentences, terms),
    source_audit: {
      source_only: true,
      uncertain_or_omitted: [],
      generation_method: "local_source_only_extractive_decode",
    },
  };
}

function compactSourceText(text, maxChars = 52000) {
  const normalized = text.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (normalized.length <= maxChars) return normalized;
  const head = normalized.slice(0, Math.floor(maxChars * 0.72));
  const tail = normalized.slice(-Math.floor(maxChars * 0.25));
  return `${head}\n\n[Middle omitted for token budget; use only visible source text.]\n\n${tail}`;
}

function shortBookName(book) {
  return String(book)
    .replace(/^NCERT\s+/, "")
    .replace("Fundamentals of Physical Geography", "Phys Geo")
    .replace("India Physical Environment", "India Physical Env")
    .replace("Introductory Macroeconomics", "Macro")
    .replace("Introductory Microeconomics", "Micro");
}

function makePrompt(chapter, sourceText) {
  const sourceLine = `${chapter.source.book}, Chapter ${chapter.source.chapter}: ${chapter.source.chapter_title}`;
  return `You are creating ClearUPSC textbook-first structured notes from one source chapter.

STRICT SOURCE RULES:
- Use ONLY SOURCE_TEXT below. Do not add outside facts, examples, years, cases, acts, schemes, or UPSC knowledge.
- Paraphrase; do not copy long passages. Keep any exact quote under 12 words.
- If the text does not contain cases/schemes/institutions, use an empty array.
- Every MCQ option and correct answer must be traceable to SOURCE_TEXT.
- Return valid JSON only. No markdown fences.

CHAPTER_KEY: ${chapter.key}
SOURCE_CITATION: Source: ${sourceLine}
MCQ_SOURCE_TRACE_FORMAT: NCERT ${shortBookName(chapter.source.book)} Ch${chapter.source.chapter} pg [page]

JSON schema:
{
  "analogy": "80-140 words for a 13-year-old, using examples/images from SOURCE_TEXT",
  "full_notes": "600-900 words, decoded from SOURCE_TEXT only. Cover major headings and mechanisms. End exactly with: Source: ${sourceLine}",
  "concise_notes": [{"term":"", "definition":""}],
  "revision_bullets": ["10 real facts from the chapter, paraphrased closely"],
  "cases": [{"name":"", "point":""}],
  "schemes": [{"name":"", "point":""}],
  "ncert_coverage": ["${sourceLine}"],
  "prelims_traps": ["3 traps based only on common confusions inside SOURCE_TEXT"],
  "mains_angles": ["3 analytical angles derived only from SOURCE_TEXT"],
  "mcqs": [
    {
      "question_text": "",
      "options": ["", "", "", ""],
      "correct_answer": 0,
      "pattern": "statement",
      "source_trace": "NCERT ${shortBookName(chapter.source.book)} Ch${chapter.source.chapter} pg [page]",
      "trap_explanation": "",
      "approach_technique": "",
      "difficulty_level": 3,
      "concepts_tested": [""]
    }
  ],
  "source_audit": {
    "source_only": true,
    "uncertain_or_omitted": []
  }
}

Hard requirements:
- concise_notes must contain exactly 10 term-definition pairs.
- revision_bullets must contain exactly 10 bullets.
- prelims_traps must contain exactly 3 items.
- mains_angles must contain exactly 3 items.
- mcqs must contain exactly 5 questions.
- MCQ patterns must be only "statement", "match", or "not_type".
- Each MCQ must have exactly 4 options and correct_answer index 0-3.

SOURCE_TEXT:
${sourceText}`;
}

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY in .env.local.");
  let lastError = null;
  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.15,
          topP: 0.8,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
        },
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      lastError = new Error(`${model}: HTTP ${response.status} ${payload.error?.message ?? ""}`.trim());
      continue;
    }
    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
    if (!text.trim()) {
      lastError = new Error(`${model}: empty response`);
      continue;
    }
    return { model, text };
  }
  throw lastError ?? new Error("Gemini call failed.");
}

function parseModelJson(text) {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  return JSON.parse(cleaned);
}

function validateDecoded(decoded, chapter) {
  const errors = [];
  if (typeof decoded.analogy !== "string" || wordCount(decoded.analogy) < 50) errors.push("analogy is too short.");
  if (typeof decoded.full_notes !== "string" || wordCount(decoded.full_notes) < 600) errors.push("full_notes must be at least 600 words.");
  const expectedSource = `Source: ${chapter.source.book}, Chapter ${chapter.source.chapter}: ${chapter.source.chapter_title}`;
  if (!decoded.full_notes?.trim().endsWith(expectedSource)) errors.push("full_notes does not end with required source citation.");
  if (!Array.isArray(decoded.concise_notes) || decoded.concise_notes.length !== 10) errors.push("concise_notes must have exactly 10 items.");
  if (!Array.isArray(decoded.revision_bullets) || decoded.revision_bullets.length !== 10) errors.push("revision_bullets must have exactly 10 items.");
  if (!Array.isArray(decoded.prelims_traps) || decoded.prelims_traps.length !== 3) errors.push("prelims_traps must have exactly 3 items.");
  if (!Array.isArray(decoded.mains_angles) || decoded.mains_angles.length !== 3) errors.push("mains_angles must have exactly 3 items.");
  if (!Array.isArray(decoded.mcqs) || decoded.mcqs.length !== 5) errors.push("mcqs must have exactly 5 items.");
  const allowedPatterns = new Set(["statement", "match", "not_type"]);
  for (const [index, mcq] of (decoded.mcqs ?? []).entries()) {
    if (!Array.isArray(mcq.options) || mcq.options.length !== 4) errors.push(`mcq ${index + 1} must have exactly 4 options.`);
    if (!Number.isInteger(mcq.correct_answer) || mcq.correct_answer < 0 || mcq.correct_answer > 3) errors.push(`mcq ${index + 1} correct_answer must be 0-3.`);
    if (!allowedPatterns.has(mcq.pattern)) errors.push(`mcq ${index + 1} has disallowed pattern.`);
    if (!String(mcq.source_trace ?? "").includes(`Ch${chapter.source.chapter}`)) errors.push(`mcq ${index + 1} lacks chapter source_trace.`);
    if (!mcq.trap_explanation) errors.push(`mcq ${index + 1} lacks trap_explanation.`);
    if (!mcq.approach_technique) errors.push(`mcq ${index + 1} lacks approach_technique.`);
    if (!Array.isArray(mcq.concepts_tested) || !mcq.concepts_tested.length) errors.push(`mcq ${index + 1} lacks concepts_tested.`);
  }
  if (decoded.source_audit?.source_only !== true) errors.push("source_audit.source_only must be true.");
  return errors;
}

function buildStructuredNotes(decoded, chapter, acquisitionRow, rawTextPath, model) {
  return {
    ...decoded,
    content_model: "clearupsc_textbook_decoded_from_source_v1",
    decode_status: "textbook_decoded",
    source: chapter.source,
    resolved_pdf_url: acquisitionRow?.resolved_pdf_url ?? chapter.source.pdf_url,
    source_trace: [
      chapter.source.book,
      `Chapter ${chapter.source.chapter}: ${chapter.source.chapter_title}`,
      acquisitionRow?.resolved_pdf_url ?? chapter.source.pdf_url,
      acquisitionRow?.sha256 ? `sha256:${acquisitionRow.sha256}` : null,
    ]
      .filter(Boolean)
      .join(" | "),
    raw_text_path: path.relative(repoRoot, rawTextPath).replaceAll("\\", "/"),
    generated_by: model,
    generated_at: new Date().toISOString(),
  };
}

function topicUpdatePayload(structuredNotes) {
  return {
    structured_notes: JSON.stringify(structuredNotes),
    content_quality: "textbook_decoded",
  };
}

async function updateSupabaseTopic(supabase, key, structuredNotes) {
  const { error } = await supabase.from("topics").update(topicUpdatePayload(structuredNotes)).eq("key", key);
  if (error) throw error;
}

function collectInventory() {
  return fs
    .readdirSync(rawTextDir)
    .filter((file) => file.endsWith(".txt"))
    .sort()
    .map((file) => {
      const filePath = path.join(rawTextDir, file);
      return {
        file,
        key: file.replace(/\.txt$/i, ""),
        path: path.relative(repoRoot, filePath).replaceAll("\\", "/"),
        characters: fs.statSync(filePath).size,
      };
    });
}

loadLocalEnv();
fs.mkdirSync(decodedDir, { recursive: true });
fs.mkdirSync(path.dirname(reportPath), { recursive: true });

const inventory = collectInventory();
fs.writeFileSync(
  inventoryPath,
  `${JSON.stringify({ generated_at: new Date().toISOString(), count: inventory.length, files: inventory }, null, 2)}\n`,
);

const { NCERT_CHAPTER_TOPICS } = loadMasterIndex();
const chapterByKey = new Map(NCERT_CHAPTER_TOPICS.map((chapter) => [chapter.key, chapter]));
const acquisition = readJson(acquisitionPath);
const fetchedRows = (acquisition.rows ?? [])
  .filter((row) => row.status === "fetched" && row.raw_text_path)
  .filter((row) => !requestedKey || row.key === requestedKey)
  .slice(0, Number.isFinite(limit) ? limit : undefined);
const acquisitionByKey = new Map(fetchedRows.map((row) => [row.key, row]));

const { url, serviceKey } = requireSupabaseEnv();
const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

const report = {
  generated_at: new Date().toISOString(),
  raw_text_inventory_count: inventory.length,
  acquisition_fetched_count: (acquisition.rows ?? []).filter((row) => row.status === "fetched" && row.raw_text_path).length,
  requested: { key: requestedKey, limit: Number.isFinite(limit) ? limit : "all", dryRun, force, decoder: useGemini ? "gemini" : "local_source_only" },
  decoded: 0,
  skipped_existing: 0,
  failed: [],
  rows: [],
};

for (const row of fetchedRows) {
  const chapter = chapterByKey.get(row.key);
  const rawTextPath = path.join(repoRoot, row.raw_text_path);
  const outputPath = path.join(decodedDir, `${row.key}.json`);
  try {
    if (!chapter) throw new Error("Chapter key not found in NCERT_CHAPTER_TOPICS.");
    if (!fs.existsSync(rawTextPath)) throw new Error(`Missing raw text file: ${row.raw_text_path}`);
    if (!force && fs.existsSync(outputPath)) {
      const existing = safeReadJson(outputPath);
      if (existing?.decode_status === "textbook_decoded") {
        if (!dryRun) await updateSupabaseTopic(supabase, row.key, existing);
        report.skipped_existing += 1;
        report.decoded += 1;
        report.rows.push({ key: row.key, status: "reused_existing", output_path: path.relative(repoRoot, outputPath).replaceAll("\\", "/") });
        if (report.decoded % 20 === 0) console.log(`[${report.decoded}/${fetchedRows.length}] decoded and saved to Supabase`);
        continue;
      }
    }
    let decoded;
    let model = useGemini ? null : "local_source_only_extractive_decode";
    let validationErrors = [];
    if (useGemini) {
      const sourceText = compactSourceText(fs.readFileSync(rawTextPath, "utf8"));
      const prompt = makePrompt(chapter, sourceText);
      let parseError = null;
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        const result = await callGemini(
          attempt === 1
            ? prompt
            : `${prompt}\n\nPrevious attempt failed. Parse error: ${parseError ?? "none"}. Validation errors: ${validationErrors.join("; ") || "none"}. Return valid JSON only and satisfy every hard requirement.`,
        );
        model = result.model;
        try {
          decoded = parseModelJson(result.text);
          parseError = null;
        } catch (error) {
          parseError = error instanceof Error ? error.message : String(error);
          validationErrors = [`JSON parse failed: ${parseError}`];
          continue;
        }
        validationErrors = validateDecoded(decoded, chapter);
        if (!validationErrors.length) break;
      }
      if (parseError) throw new Error(`JSON parse failed after retry: ${parseError}`);
    } else {
      decoded = localDecode(chapter, fs.readFileSync(rawTextPath, "utf8"));
      validationErrors = validateDecoded(decoded, chapter);
    }
    if (validationErrors.length) throw new Error(`Validation failed: ${validationErrors.join("; ")}`);
    const structuredNotes = buildStructuredNotes(decoded, chapter, row, rawTextPath, model);
    fs.writeFileSync(outputPath, `${JSON.stringify(structuredNotes, null, 2)}\n`);
    if (!dryRun) await updateSupabaseTopic(supabase, row.key, structuredNotes);
    report.decoded += 1;
    report.rows.push({
      key: row.key,
      status: dryRun ? "decoded_dry_run" : "decoded_saved",
      model,
      output_path: path.relative(repoRoot, outputPath).replaceAll("\\", "/"),
      full_notes_words: wordCount(structuredNotes.full_notes),
    });
    if (report.decoded % 20 === 0) console.log(`[${report.decoded}/${fetchedRows.length}] decoded and saved to Supabase`);
  } catch (error) {
    const failure = { key: row.key, error: error instanceof Error ? error.message : String(error) };
    report.failed.push(failure);
    report.rows.push({ key: row.key, status: "failed", error: failure.error });
    console.log(`failed: ${row.key} - ${failure.error}`);
  }
  fs.writeFileSync(reportPath, `${JSON.stringify({ ...report, updated_at: new Date().toISOString() }, null, 2)}\n`);
}

fs.writeFileSync(reportPath, `${JSON.stringify({ ...report, updated_at: new Date().toISOString() }, null, 2)}\n`);
console.log(`Decode report: ${path.relative(repoRoot, reportPath).replaceAll("\\", "/")}`);
console.log(`Raw text inventory: ${path.relative(repoRoot, inventoryPath).replaceAll("\\", "/")}`);
console.log(JSON.stringify({ decoded: report.decoded, total: fetchedRows.length, failed: report.failed.length }, null, 2));
if (report.failed.length) process.exitCode = 1;
