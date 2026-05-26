import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const repoRoot = process.cwd();
const indexPath = path.join(repoRoot, "src", "lib", "study", "ncert-master-index.ts");
const reportPath = path.join(repoRoot, "data", "content-reports", "textbook-first-validation.json");
const overlayDir = path.join(repoRoot, "data", "study", "textbook-first", "chapters");
const decodedNotesDir = path.join(repoRoot, "data", "study", "textbook-first", "decoded-notes");
const sourceAcquisitionPath = path.join(repoRoot, "data", "content-reports", "textbook-first-source-acquisition.json");

function loadMasterIndex() {
  const source = fs.readFileSync(indexPath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(transpiled, {
    module,
    exports: module.exports,
    require,
    console,
  }, { filename: indexPath });
  return module.exports;
}

const {
  NCERT_CHAPTER_TOPICS,
  LEGACY_TOPIC_REDIRECTS,
  KILL_PHRASES,
  SHORT_THINK_OF_TEMPLATE,
  validateMcq,
  conceptHasSourceTrace,
  ALLOWED_PUBLIC_DOMAIN_SOURCE_HOSTS,
} = loadMasterIndex();

const bannedMcqPatterns = [
  /Which term means/i,
  /Which definition is correct/i,
  /\bis best described as\b/i,
  /Which is associated with/i,
  /\bdefinition\b[\s\S]{0,120}\banswer\b/i,
];

function walkFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, files);
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function relative(file) {
  return path.relative(repoRoot, file).replaceAll("\\", "/");
}

function scanTextFiles() {
  const roots = ["src", "data", "supabase"].map((root) => path.join(repoRoot, root));
  return roots
    .flatMap((root) => walkFiles(root))
    .filter((file) => /\.(ts|tsx|js|mjs|json|sql|md)$/.test(file))
    .filter((file) => !relative(file).includes("ncert-master-index.ts"))
    .filter((file) => !relative(file).includes("textbook-first-validation.json"));
}

function runPyqCoverageTest(chapters) {
  const traced = chapters.reduce((sum, chapter) => sum + Number(chapter.pyq_count ?? 0), 0);
  const expectedPrelimsQuestions = 1400;
  const coveragePercent = expectedPrelimsQuestions ? Number(((traced / expectedPrelimsQuestions) * 100).toFixed(2)) : 0;
  const gaps = chapters
    .filter((chapter) => Number(chapter.pyq_count ?? 0) === 0)
    .map((chapter) => ({ key: chapter.key, title: chapter.title, reason: "No PYQs traced to this chapter yet." }));
  return {
    status: coveragePercent >= 95 ? "pass" : "gap",
    traced_questions: traced,
    expected_prelims_questions: expectedPrelimsQuestions,
    coverage_percent: coveragePercent,
    target_percent: 95,
    gaps,
  };
}

function conceptComplete(concept) {
  return Boolean(
    concept.concept_name?.trim() &&
    concept.ncert_page?.trim() &&
    concept.simple_explanation?.trim() &&
    concept.textbook_content?.trim() &&
    concept.recall_card?.term?.trim() &&
    concept.recall_card?.definition?.trim() &&
    conceptHasSourceTrace(concept),
  );
}

function runChapterCompletionTest(chapters) {
  const rows = chapters.map((chapter) => {
    const hasTopicPage = Boolean(chapter.key && chapter.source?.pdf_url);
    const hasFourLayerDecode = chapter.concepts.length > 0 && chapter.concepts.every(conceptComplete);
    const hasTenMcqs = chapter.mcqs.length === 10;
    const pyqsMapped = chapter.pyq_count > 0 || chapter.concepts.some((concept) => concept.pyq_connections?.length);
    const hasMainsFramework = Boolean(chapter.mains_framework?.structure?.length && chapter.mains_framework?.source_trace);
    return {
      key: chapter.key,
      title: chapter.title,
      priority_band: chapter.priority_band,
      decode_status: chapter.decode_status,
      checks: {
        topic_page: hasTopicPage,
        four_layer_decode: hasFourLayerDecode,
        ten_upsc_pattern_mcqs: hasTenMcqs,
        pyqs_mapped: pyqsMapped,
        mains_framework: hasMainsFramework,
      },
      complete: hasTopicPage && hasFourLayerDecode && hasTenMcqs && pyqsMapped && hasMainsFramework,
    };
  });
  const priorityRows = rows.filter((row) => row.priority_band <= 2);
  const priorityComplete = priorityRows.filter((row) => row.complete).length;
  return {
    status: priorityRows.length > 0 && priorityComplete === priorityRows.length ? "pass" : "gap",
    priority_1_2_complete: priorityComplete,
    priority_1_2_total: priorityRows.length,
    rows,
  };
}

function runTemplateDetectorTest(chapters) {
  const findings = [];
  for (const file of scanTextFiles()) {
    const text = fs.readFileSync(file, "utf8");
    for (const phrase of KILL_PHRASES) {
      const index = text.indexOf(phrase);
      if (index !== -1) findings.push({ file: relative(file), pattern: phrase, index });
    }
    const shortThink = text.match(SHORT_THINK_OF_TEMPLATE);
    if (shortThink) findings.push({ file: relative(file), pattern: "short Think of [X] like template", match: shortThink[0] });
    for (const pattern of bannedMcqPatterns) {
      const match = text.match(pattern);
      if (match) findings.push({ file: relative(file), pattern: String(pattern), match: match[0] });
    }
  }
  for (const chapter of chapters) {
    for (const mcq of chapter.mcqs) {
      for (const pattern of bannedMcqPatterns) {
        if (pattern.test(mcq.question_text)) findings.push({ chapter: chapter.key, pattern: String(pattern), question_text: mcq.question_text });
      }
    }
  }
  return {
    status: findings.length ? "fail" : "pass",
    findings,
  };
}

function runVerificationTest(chapters) {
  const errors = [];
  const warnings = [];
  for (const chapter of chapters) {
    if (!chapter.source?.book || !chapter.source?.chapter || !chapter.source?.chapter_title || !chapter.source?.pdf_url || !chapter.source?.page_range) {
      errors.push({ key: chapter.key, issue: "Missing required source metadata." });
    }
    if (chapter.source_kind === "public_domain") {
      const sources = Array.isArray(chapter.public_domain_sources) ? chapter.public_domain_sources : [];
      if (!sources.length) errors.push({ key: chapter.key, issue: "Public-domain topic requires public_domain_sources." });
      for (const source of sources) {
        if (!source.source_name || !source.source_url || !source.section_or_page) {
          errors.push({ key: chapter.key, issue: "Public-domain source requires name, URL, and section/page." });
          continue;
        }
        try {
          const host = new URL(source.source_url).hostname.replace(/^www\./, "");
          if (!ALLOWED_PUBLIC_DOMAIN_SOURCE_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`))) {
            errors.push({ key: chapter.key, source_url: source.source_url, issue: "Public-domain source host is not in the approved source list." });
          }
        } catch {
          errors.push({ key: chapter.key, source_url: source.source_url, issue: "Public-domain source URL is invalid." });
        }
      }
    }
    if (chapter.decode_status === "source_verified" && chapter.concepts.length === 0) {
      errors.push({ key: chapter.key, issue: "source_verified chapter has no concepts." });
    }
    for (const concept of chapter.concepts) {
      if (!conceptHasSourceTrace(concept)) errors.push({ key: chapter.key, concept: concept.concept_name, issue: "Concept lacks source trace." });
    }
    for (const mcq of chapter.mcqs) {
      const mcqErrors = validateMcq(mcq);
      for (const issue of mcqErrors) errors.push({ key: chapter.key, question_text: mcq.question_text, issue });
    }
    if (chapter.decode_status === "pending_source_decode" && chapter.mcqs.length > 0) {
      warnings.push({ key: chapter.key, issue: "Pending chapter has MCQs; verify these are source-derived before publishing." });
    }
  }
  return {
    status: errors.length ? "fail" : "pass",
    errors,
    warnings,
  };
}

function runLegacyRoutingTest(chapters) {
  const chapterKeys = new Set(chapters.map((chapter) => chapter.key));
  const broken = Object.entries(LEGACY_TOPIC_REDIRECTS)
    .filter(([, target]) => !chapterKeys.has(target))
    .map(([legacy, target]) => ({ legacy, target }));
  return {
    status: broken.length ? "fail" : "pass",
    redirect_count: Object.keys(LEGACY_TOPIC_REDIRECTS).length,
    broken,
  };
}

function runStudentAnswerReadinessTest(chapters) {
  const sampleSize = 50;
  const targetCorrect = 45;
  const answerReadyChapters = chapters.filter((chapter) => {
    const hasCompleteDecode = chapter.concepts.length > 0 && chapter.concepts.every(conceptComplete);
    const hasPyqTrace = chapter.pyq_count > 0 || chapter.concepts.some((concept) => concept.pyq_connections?.length);
    return hasCompleteDecode && hasPyqTrace;
  });
  const estimatedAnswerable = answerReadyChapters.reduce((sum, chapter) => sum + Number(chapter.pyq_count ?? 0), 0);
  return {
    status: estimatedAnswerable >= targetCorrect ? "pass" : "gap",
    sample_size: sampleSize,
    target_correct: targetCorrect,
    answer_ready_chapters: answerReadyChapters.length,
    estimated_answerable_from_decoded_content: estimatedAnswerable,
    gap: "Run the 50-PYQ answerability drill after source-backed decodes and PYQ mappings exist. This scaffold must not infer answerability from pending chapters.",
  };
}

function runOverlayPublicationTest(chapters) {
  const chapterKeys = new Set(chapters.map((chapter) => chapter.key));
  const errors = [];
  const overlays = [];
  for (const file of walkFiles(overlayDir)) {
    if (!file.endsWith(".json")) continue;
    const rel = relative(file);
    let overlay;
    try {
      overlay = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
      errors.push({ file: rel, issue: "Overlay JSON could not be parsed." });
      continue;
    }
    overlays.push(overlay);
    if (!chapterKeys.has(overlay.key)) errors.push({ file: rel, key: overlay.key, issue: "Overlay key is not in NCERT_CHAPTER_TOPICS." });
    if (!overlay.source_verification?.verified_by) errors.push({ file: rel, key: overlay.key, issue: "Missing source_verification.verified_by." });
    if (!overlay.source_verification?.verified_at) errors.push({ file: rel, key: overlay.key, issue: "Missing source_verification.verified_at." });
    if (!overlay.source_verification?.source_trace) errors.push({ file: rel, key: overlay.key, issue: "Missing source_verification.source_trace." });
    if (!overlay.source_verification?.source_url) errors.push({ file: rel, key: overlay.key, issue: "Missing source_verification.source_url." });
    if (!Array.isArray(overlay.concepts)) errors.push({ file: rel, key: overlay.key, issue: "Overlay concepts must be an array." });
    if (!Array.isArray(overlay.mcqs)) errors.push({ file: rel, key: overlay.key, issue: "Overlay mcqs must be an array." });
    if (overlay.decode_status === "source_verified") {
      if (!overlay.concepts?.length) errors.push({ file: rel, key: overlay.key, issue: "source_verified overlay requires concepts." });
      if (overlay.mcqs?.length !== 10) errors.push({ file: rel, key: overlay.key, issue: "source_verified overlay requires exactly 10 MCQs." });
    }
    for (const concept of overlay.concepts ?? []) {
      if (!conceptHasSourceTrace(concept)) errors.push({ file: rel, key: overlay.key, concept: concept.concept_name, issue: "Concept lacks source trace." });
    }
    for (const mcq of overlay.mcqs ?? []) {
      for (const issue of validateMcq(mcq)) errors.push({ file: rel, key: overlay.key, question_text: mcq.question_text, issue });
    }
  }
  return {
    status: errors.length ? "fail" : "pass",
    overlay_count: overlays.length,
    published_source_verified_count: overlays.filter((overlay) => overlay.decode_status === "source_verified").length,
    errors,
  };
}

function runSourceAcquisitionTest(chapters) {
  if (!fs.existsSync(sourceAcquisitionPath)) {
    return {
      status: "gap",
      fetched: 0,
      total_chapters: chapters.length,
      missing_report: true,
      gap: "Run npm run content:textbook-fetch to fetch and extract official chapter sources.",
    };
  }
  const acquisition = JSON.parse(fs.readFileSync(sourceAcquisitionPath, "utf8"));
  const fetchedKeys = new Set((acquisition.rows ?? []).filter((row) => row.status === "fetched").map((row) => row.key));
  const errorRows = (acquisition.rows ?? []).filter((row) => row.status === "error");
  const missing = chapters.filter((chapter) => !fetchedKeys.has(chapter.key)).map((chapter) => chapter.key);
  return {
    status: missing.length || errorRows.length ? "gap" : "pass",
    fetched: fetchedKeys.size,
    total_chapters: chapters.length,
    acquisition_errors: errorRows,
    missing_count: missing.length,
    missing: missing.slice(0, 100),
  };
}

function runDecodedNotesQualityTest() {
  if (!fs.existsSync(decodedNotesDir)) {
    return {
      status: "gap",
      decoded_files: 0,
      gap: "No decoded notes directory found. Run npm run content:textbook-decode-all after source acquisition.",
    };
  }
  const expectedDifficulty = { 1: 1, 3: 3, 4: 4, 5: 2 };
  const files = fs.readdirSync(decodedNotesDir).filter((file) => file.endsWith(".json")).sort();
  const rows = [];
  const errors = [];

  for (const file of files) {
    const filePath = path.join(decodedNotesDir, file);
    const rel = relative(filePath);
    const text = fs.readFileSync(filePath, "utf8");
    let decoded;
    try {
      decoded = JSON.parse(text);
    } catch {
      errors.push({ file: rel, issue: "Decoded notes JSON could not be parsed." });
      continue;
    }

    const mcqs = Array.isArray(decoded.mcqs) ? decoded.mcqs : [];
    const killPhraseMatches = KILL_PHRASES.filter((phrase) => text.includes(phrase));
    for (const phrase of killPhraseMatches) errors.push({ file: rel, issue: "Decoded notes contain kill phrase.", phrase });
    if (mcqs.length < 10) errors.push({ file: rel, key: decoded.key ?? file.replace(/\.json$/, ""), issue: "Decoded chapter has fewer than 10 MCQs.", mcq_count: mcqs.length });
    if (decoded.decode_status !== "textbook_verified") errors.push({ file: rel, issue: "Decoded chapter is not marked textbook_verified.", decode_status: decoded.decode_status ?? null });

    const difficultyCounts = {};
    let missingSourceTrace = 0;
    let missingMandatoryFields = 0;
    let bannedPatternCount = 0;
    for (const [index, mcq] of mcqs.entries()) {
      const safeMcq = {
        question_text: String(mcq?.question_text ?? ""),
        options: Array.isArray(mcq?.options) ? mcq.options : [],
        correct_answer: Number.isInteger(mcq?.correct_answer) ? mcq.correct_answer : -1,
        pattern: String(mcq?.pattern ?? ""),
        source_trace: String(mcq?.source_trace ?? ""),
        trap_explanation: String(mcq?.trap_explanation ?? ""),
        approach_technique: String(mcq?.approach_technique ?? ""),
        difficulty_level: mcq?.difficulty_level,
        concepts_tested: Array.isArray(mcq?.concepts_tested) ? mcq.concepts_tested : [],
      };
      const mcqErrors = validateMcq(safeMcq);
      for (const issue of mcqErrors) errors.push({ file: rel, mcq: index + 1, question_text: mcq?.question_text ?? null, issue });
      if (!String(mcq?.source_trace ?? "").trim()) missingSourceTrace += 1;
      if (!mcq?.trap_explanation || !mcq?.approach_technique || !mcq?.difficulty_level || !mcq?.pattern || !Array.isArray(mcq?.concepts_tested) || !mcq.concepts_tested.length) {
        missingMandatoryFields += 1;
      }
      if (bannedMcqPatterns.some((pattern) => pattern.test(String(mcq?.question_text ?? "")))) bannedPatternCount += 1;
      difficultyCounts[mcq?.difficulty_level] = (difficultyCounts[mcq?.difficulty_level] ?? 0) + 1;
    }
    for (const [level, count] of Object.entries(expectedDifficulty)) {
      if ((difficultyCounts[level] ?? 0) !== count) {
        errors.push({ file: rel, issue: `MCQ difficulty_level ${level} count must be ${count}.`, difficulty_counts: difficultyCounts });
      }
    }

    rows.push({
      key: file.replace(/\.json$/, ""),
      mcq_count: mcqs.length,
      kill_phrase_count: killPhraseMatches.length,
      missing_source_trace: missingSourceTrace,
      missing_mandatory_fields: missingMandatoryFields,
      banned_pattern_count: bannedPatternCount,
      difficulty_counts: difficultyCounts,
      decode_status: decoded.decode_status ?? null,
    });
  }

  return {
    status: errors.length ? "fail" : "pass",
    decoded_files: files.length,
    chapters_with_kill_phrases: rows.filter((row) => row.kill_phrase_count > 0).length,
    chapters_with_fewer_than_10_mcqs: rows.filter((row) => row.mcq_count < 10).length,
    chapters_missing_mcq_source_trace: rows.filter((row) => row.missing_source_trace > 0).length,
    chapters_with_missing_mandatory_mcq_fields: rows.filter((row) => row.missing_mandatory_fields > 0).length,
    chapters_with_banned_mcq_patterns: rows.filter((row) => row.banned_pattern_count > 0).length,
    textbook_verified_count: rows.filter((row) => row.decode_status === "textbook_verified").length,
    rows,
    errors,
  };
}

fs.mkdirSync(path.dirname(reportPath), { recursive: true });

const report = {
  generated_at: new Date().toISOString(),
  source: "content-quality-overhaul.md",
  chapter_count: NCERT_CHAPTER_TOPICS.length,
  tests: {
    pyq_coverage: runPyqCoverageTest(NCERT_CHAPTER_TOPICS),
    chapter_completion: runChapterCompletionTest(NCERT_CHAPTER_TOPICS),
    template_detector: runTemplateDetectorTest(NCERT_CHAPTER_TOPICS),
    verification: runVerificationTest(NCERT_CHAPTER_TOPICS),
    legacy_routing: runLegacyRoutingTest(NCERT_CHAPTER_TOPICS),
    student_answer_readiness: runStudentAnswerReadinessTest(NCERT_CHAPTER_TOPICS),
    overlay_publication: runOverlayPublicationTest(NCERT_CHAPTER_TOPICS),
    source_acquisition: runSourceAcquisitionTest(NCERT_CHAPTER_TOPICS),
    decoded_notes_quality: runDecodedNotesQualityTest(),
  },
};

report.summary = {
  status: Object.values(report.tests).some((test) => test.status === "fail") ? "fail" : Object.values(report.tests).some((test) => test.status === "gap") ? "gap" : "pass",
  note: "Gaps are expected until source-backed NCERT decodes, PYQ mappings, and UPSC-pattern MCQs are supplied. The validator reports them without generating fake content.",
};

fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(`Textbook-first validation completed: ${report.summary.status}`);
console.log(`Report: ${relative(reportPath)}`);
console.log(`Chapters checked: ${report.chapter_count}`);
console.log(`Template findings: ${report.tests.template_detector.findings.length}`);
console.log(`Verification errors: ${report.tests.verification.errors.length}`);
console.log(`Decoded files checked: ${report.tests.decoded_notes_quality.decoded_files}`);
console.log(`Decoded kill-phrase chapters: ${report.tests.decoded_notes_quality.chapters_with_kill_phrases ?? 0}`);
console.log(`Decoded chapters with fewer than 10 MCQs: ${report.tests.decoded_notes_quality.chapters_with_fewer_than_10_mcqs ?? 0}`);
console.log(`Decoded chapters missing MCQ source_trace: ${report.tests.decoded_notes_quality.chapters_missing_mcq_source_trace ?? 0}`);
