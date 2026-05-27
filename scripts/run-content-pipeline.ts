import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { ChapterTopic, ConceptDecode, UPSCPatternMCQ } from "../src/lib/types/ncert-types";
import type { RedTeamAuditReport } from "../src/lib/utils/red-team-auditor";
import type { AiEditorReport } from "../src/lib/utils/ai-editor-loop";
import type { SyntheticOverrideChapterTopic } from "../src/lib/api/synthetic-override";

const require = createRequire(import.meta.url);
const { sanitizeNcertText } = require("./sanitize-ncert.js");

const repoRoot = process.cwd();
const defaultOutputDir = path.join(repoRoot, "src", "data", "chapters");

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

interface PipelineOptions {
  input: string;
  chapterKey: string;
  title: string;
  subject: string;
  book: string;
  chapterNumber: number;
  pageRange: string;
  pdfUrl: string;
  sourceTrace: string;
  outputDir: string;
  maxRetries: number;
  conceptLimit: number;
  provider?: "anthropic" | "openai" | "gemini";
  dryRun: boolean;
  saveLocal: boolean;
}

interface PipelineUtilities {
  auditChapterTopic: (chapter: ChapterTopic, sanitizedNcertText: string) => RedTeamAuditReport;
  formatAuditReport: (report: RedTeamAuditReport) => string;
  extractImportantConceptNames: (input: {
    sanitizedText: string;
    chapterTitle: string;
    sourceTrace: string;
    provider?: "anthropic" | "openai" | "gemini";
    validationFeedback?: string;
    conceptLimit?: number;
  }) => Promise<string[]>;
  generateSingleConceptDecode: (input: {
    sanitizedText: string;
    chapterTitle: string;
    sourceTrace: string;
    conceptName: string;
    provider?: "anthropic" | "openai" | "gemini";
    validationFeedback?: string;
  }) => Promise<ConceptDecode>;
  generateUpscPatternMcqs: (input: {
    sanitizedText: string;
    chapterTitle: string;
    sourceTrace: string;
    concepts: string[];
    provider?: "anthropic" | "openai" | "gemini";
    validationFeedback?: string;
  }) => Promise<UPSCPatternMCQ[]>;
  injectPyqConnections: (concepts: ConceptDecode[], sanitizedNcertText: string) => ConceptDecode[];
  editChapterTopicWithAi: (chapter: ChapterTopic, options: {
    sanitizedText: string;
    provider?: "anthropic" | "openai" | "gemini";
    maxRewriteAttempts?: number;
  }) => Promise<{ chapter: ChapterTopic; report: AiEditorReport }>;
  generateSyntheticOverrideChapter: (input: SyntheticOverrideInput) => Promise<SyntheticOverrideChapterTopic>;
  generateLocalSyntheticOverrideChapter: (input: SyntheticOverrideInput) => SyntheticOverrideChapterTopic;
}

async function loadPipelineUtilities(): Promise<PipelineUtilities> {
  const [auditor, decode, mcqs, pyqs, editor, syntheticOverride] = await Promise.all([
    import(pathToFileURL(path.join(repoRoot, "src", "lib", "utils", "red-team-auditor.ts")).href),
    import(pathToFileURL(path.join(repoRoot, "src", "lib", "api", "generate-decode.ts")).href),
    import(pathToFileURL(path.join(repoRoot, "src", "lib", "api", "generate-mcqs.ts")).href),
    import(pathToFileURL(path.join(repoRoot, "src", "lib", "api", "pyq-matcher.ts")).href),
    import(pathToFileURL(path.join(repoRoot, "src", "lib", "utils", "ai-editor-loop.ts")).href),
    import(pathToFileURL(path.join(repoRoot, "src", "lib", "api", "synthetic-override.ts")).href),
  ]);
  return {
    auditChapterTopic: auditor.auditChapterTopic,
    formatAuditReport: auditor.formatAuditReport,
    extractImportantConceptNames: decode.extractImportantConceptNames,
    generateSingleConceptDecode: decode.generateSingleConceptDecode,
    generateUpscPatternMcqs: mcqs.generateUpscPatternMcqs,
    injectPyqConnections: pyqs.injectPyqConnections,
    editChapterTopicWithAi: editor.editChapterTopicWithAi,
    generateSyntheticOverrideChapter: syntheticOverride.generateSyntheticOverrideChapter,
    generateLocalSyntheticOverrideChapter: syntheticOverride.generateLocalSyntheticOverrideChapter,
  };
}

interface SyntheticOverrideInput {
  sanitizedText: string;
  key: string;
  title: string;
  subject: string;
  book: string;
  chapterNumber: number;
  pageRange: string;
  pdfUrl: string;
  sourceTrace: string;
  failureLog: string;
  provider?: "anthropic" | "openai" | "gemini";
}

function parseArgs(argv: string[]): PipelineOptions {
  const args = new Map();
  const positional: string[] = [];
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg.startsWith("--")) {
      const [key, inlineValue] = arg.split("=");
      if (inlineValue !== undefined) {
        args.set(key, inlineValue);
      } else if (argv[index + 1] && !argv[index + 1].startsWith("--")) {
        args.set(key, argv[index + 1]);
        index += 1;
      } else {
        args.set(key, true);
      }
    } else {
      positional.push(arg);
    }
  }
  return {
    input: String(args.get("--input") ?? positional[0] ?? ""),
    chapterKey: String(args.get("--chapter-key") ?? args.get("--key") ?? "draft_chapter"),
    title: String(args.get("--title") ?? "Draft Chapter"),
    subject: String(args.get("--subject") ?? "GS1 Geography"),
    book: String(args.get("--book") ?? "NCERT"),
    chapterNumber: Number(args.get("--chapter") ?? 1),
    pageRange: String(args.get("--page-range") ?? "source text"),
    pdfUrl: String(args.get("--pdf-url") ?? ""),
    sourceTrace: String(args.get("--source-trace") ?? ""),
    outputDir: path.resolve(repoRoot, String(args.get("--out-dir") ?? defaultOutputDir)),
    maxRetries: Number(args.get("--max-retries") ?? 3),
    conceptLimit: Number(args.get("--concept-limit") ?? 15),
    provider: args.get("--provider") ? (String(args.get("--provider")) as "anthropic" | "openai" | "gemini") : undefined,
    dryRun: Boolean(args.get("--dry-run")),
    saveLocal: Boolean(args.get("--save-local")),
  };
}

function ensureValidArgs(options: PipelineOptions) {
  if (!options.input) {
    throw new Error("Usage: node scripts/run-content-pipeline.ts --input <raw.txt> --chapter-key <key> --title <title> [--dry-run]");
  }
  if (!fs.existsSync(path.resolve(repoRoot, options.input))) {
    throw new Error(`Input file not found: ${options.input}`);
  }
  if (!Number.isInteger(options.maxRetries) || options.maxRetries < 1) {
    throw new Error("--max-retries must be an integer greater than 0.");
  }
  if (!Number.isInteger(options.conceptLimit) || options.conceptLimit < 1 || options.conceptLimit > 15) {
    throw new Error("--concept-limit must be an integer from 1 to 15.");
  }
}

function sourceTraceFor(options: PipelineOptions) {
  return options.sourceTrace || `${options.book}, Chapter ${options.chapterNumber}: ${options.title}, pages ${options.pageRange}`;
}

function buildChapterTopic(options: PipelineOptions, concepts: ConceptDecode[], mcqs: UPSCPatternMCQ[]): ChapterTopic {
  return {
    key: options.chapterKey,
    title: options.title,
    source: {
      book: options.book,
      chapter: options.chapterNumber,
      chapter_title: options.title,
      pdf_url: options.pdfUrl,
      page_range: options.pageRange,
    },
    subject: options.subject,
    paper: "both" as const,
    upsc_weightage: 3 as const,
    pyq_count: 0,
    concepts,
    concise_notes: concepts.map((concept) => ({
      term: concept.recall_card.term,
      definition: concept.recall_card.definition,
      source_trace: concept.ncert_page,
    })),
    revision_bullets: concepts.map((concept) => concept.recall_card.key_fact).slice(0, 10),
    mcqs,
    mains_framework: {
      structure: [],
      source_trace: sourceTraceFor(options),
    },
    related_chapters: [],
  };
}

function removedLinePreview(rawText: string) {
  const artifactPatterns = [
    /^--\s*\d+\s+of\s+\d+\s*--$/i,
    /^UNIT$/i,
    /^[IVXLCDM]+$/i,
    /^Reprint\s+\d{4}-\d{2}$/i,
    /^This unit deals with$/i,
    new RegExp("^(?:\\u2022|\\*)\\s*"),
    /^[A-Z][A-Z\s,&:;()/-]{6,}\d*$/,
  ];
  return rawText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line && line.length <= 120 && artifactPatterns.some((pattern) => pattern.test(line)))
    .slice(0, 20);
}

function savePassedPayload(options: PipelineOptions, payload: ChapterTopic) {
  fs.mkdirSync(options.outputDir, { recursive: true });
  const outputPath = path.join(options.outputDir, `${options.chapterKey}.json`);
  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
  return outputPath;
}

async function saveFinalPayload(options: PipelineOptions, payload: ChapterTopic, mode: "pass" | "override") {
  if (options.dryRun) {
    const outputPath = path.join(repoRoot, "data", "content-reports", `${options.chapterKey}.pipeline-dry-run.json`);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
    return {
      target: "dry-run-file",
      path: outputPath,
    };
  }

  if (options.saveLocal) {
    return {
      target: "local-file",
      path: savePassedPayload(options, payload),
    };
  }

  await upsertChapterPayloadToSupabase(payload, mode);
  return {
    target: "supabase",
    path: `ncert_chapters:${payload.key}`,
  };
}

async function upsertChapterPayloadToSupabase(payload: ChapterTopic, mode: "pass" | "override") {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error("Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for ncert_chapters upsert.");
  }

  const supabase = createSupabaseClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  const contentPayload = {
    ...payload,
    pipeline_save_status: mode === "override" ? "auto-approved_via_override" : "red_team_passed",
  };
  const { error } = await supabase
    .from("ncert_chapters")
    .upsert({
      topic_key: payload.key,
      subject: payload.subject,
      book: payload.source.book,
      chapter_number: payload.source.chapter,
      content_payload: contentPayload,
    }, { onConflict: "topic_key" });

  if (error) {
    throw new Error(`Supabase ncert_chapters upsert failed for ${payload.key}: ${error.message}`);
  }
}

async function runPipeline(options: PipelineOptions) {
  loadLocalEnv();
  ensureValidArgs(options);
  const {
    auditChapterTopic,
    formatAuditReport,
    extractImportantConceptNames,
    generateSingleConceptDecode,
    generateUpscPatternMcqs,
    injectPyqConnections,
    editChapterTopicWithAi,
    generateSyntheticOverrideChapter,
    generateLocalSyntheticOverrideChapter,
  } = await loadPipelineUtilities();

  const inputPath = path.resolve(repoRoot, options.input);
  const rawText = fs.readFileSync(inputPath, "utf8");
  const sanitizedText = sanitizeNcertText(rawText);
  const strippedPreview = removedLinePreview(rawText);
  const sourceTrace = sourceTraceFor(options);

  console.log("[Stage 1: Ingest]");
  console.log(JSON.stringify({
    input: path.relative(repoRoot, inputPath).replaceAll("\\", "/"),
    raw_characters: rawText.length,
    sanitized_characters: sanitizedText.length,
    stripped_character_count: Math.max(0, rawText.length - sanitizedText.length),
    stripped_line_preview: strippedPreview,
  }, null, 2));

  let feedback = "";
  let latestPayload: ChapterTopic | null = null;
  let latestReport: RedTeamAuditReport | null = null;

  for (let attempt = 1; attempt <= options.maxRetries; attempt += 1) {
    console.log(`[Stage 2: Generate] attempt ${attempt}/${options.maxRetries}`);
    let concepts: ConceptDecode[];
    let mcqs: UPSCPatternMCQ[];
    let editorReport: AiEditorReport | null = null;
    try {
      const conceptNames = await extractImportantConceptNames({
        sanitizedText,
        chapterTitle: options.title,
        sourceTrace,
        provider: options.provider,
        validationFeedback: feedback || undefined,
        conceptLimit: options.conceptLimit,
      });
      console.log(JSON.stringify({
        pass_1_concepts_extracted: conceptNames.length,
        concept_names: conceptNames,
      }, null, 2));

      concepts = [];
      for (const [conceptIndex, conceptName] of conceptNames.entries()) {
        console.log(`[Stage 2: Deep Decode] ${conceptIndex + 1}/${conceptNames.length} ${conceptName}`);
        concepts.push(await generateSingleConceptDecode({
          sanitizedText,
          chapterTitle: options.title,
          sourceTrace,
          conceptName,
          provider: options.provider,
          validationFeedback: feedback || undefined,
        }));
      }

      console.log("[Stage 3: PYQ Matrix]");
      concepts = injectPyqConnections(concepts, sanitizedText);

      mcqs = await generateUpscPatternMcqs({
        sanitizedText,
        chapterTitle: options.title,
        sourceTrace,
        concepts: concepts.map((concept) => concept.concept_name),
        provider: options.provider,
        validationFeedback: feedback || undefined,
      });

      latestPayload = buildChapterTopic(options, concepts, mcqs);
      console.log("[Stage 4: AI Editor]");
      const edited = await editChapterTopicWithAi(latestPayload, {
        sanitizedText,
        provider: options.provider,
        maxRewriteAttempts: 1,
      });
      latestPayload = edited.chapter;
      editorReport = edited.report;
      console.log(JSON.stringify(editorReport, null, 2));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      latestReport = {
        status: "REJECTED",
        findings: [{
          status: "REJECTED",
          reason: "Invalid JSON",
          path: "$.generation",
          message,
        }],
      };
      feedback = formatAuditReport(latestReport);
      console.log(`[Stage 2: Generate] REJECTED invalid generation output:\n${feedback}`);
      continue;
    }

    console.log(JSON.stringify({
      concepts_generated: latestPayload.concepts.length,
      mcqs_generated: mcqs.length,
      editor_status: editorReport?.status ?? "not_run",
      mcq_patterns: mcqs.reduce<Record<string, number>>((acc, mcq) => {
        acc[mcq.pattern] = (acc[mcq.pattern] ?? 0) + 1;
        return acc;
      }, {}),
      sample_concepts: latestPayload.concepts.slice(0, 3).map((concept) => concept.concept_name),
    }, null, 2));

    console.log("[Stage 5: Audit]");
    latestReport = auditChapterTopic(latestPayload, sanitizedText);
    console.log(JSON.stringify(latestReport, null, 2));

    if (latestReport.status === "PASS") {
      const saveResult = await saveFinalPayload(options, latestPayload, "pass");
      console.log(`[Stage 6: Result] PASS saved to ${formatSaveTarget(saveResult)}`);
      return { payload: latestPayload, report: latestReport, outputPath: saveResult.path };
    }

    feedback = formatAuditReport(latestReport);
    console.log(`[Stage 6: Retry Loop] REJECTED. Feedback for next attempt:\n${feedback}`);
  }

  console.log(`[Stage 7: Synthetic Override] retry_count === ${options.maxRetries}. Triggering override failsafe.`);
  const overrideInput: SyntheticOverrideInput = {
    sanitizedText,
    key: options.chapterKey,
    title: options.title,
    subject: options.subject,
    book: options.book,
    chapterNumber: options.chapterNumber,
    pageRange: options.pageRange,
    pdfUrl: options.pdfUrl,
    sourceTrace,
    failureLog: buildFailureLog(latestReport, latestPayload),
    provider: options.provider,
  };

  let overridePayload: SyntheticOverrideChapterTopic;
  try {
    overridePayload = await generateSyntheticOverrideChapter(overrideInput);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`[Stage 7: Synthetic Override] provider override failed. Using local source-sentence fallback: ${message}`);
    overridePayload = generateLocalSyntheticOverrideChapter({
      ...overrideInput,
      failureLog: `${overrideInput.failureLog}\nSynthetic override provider failure: ${message}`,
    });
  }

  const saveResult = await saveFinalPayload(options, overridePayload, "override");
  console.log(`[Stage 7: Synthetic Override] ${overridePayload.status} saved to ${formatSaveTarget(saveResult)}`);
  return { payload: overridePayload, report: latestReport, outputPath: saveResult.path };
}

function formatSaveTarget(saveResult: { target: string; path: string }) {
  if (saveResult.target === "supabase") return saveResult.path;
  return path.relative(repoRoot, saveResult.path).replaceAll("\\", "/");
}

function buildFailureLog(report: RedTeamAuditReport | null, payload: ChapterTopic | null) {
  return JSON.stringify({
    report,
    payload_summary: payload
      ? {
          key: payload.key,
          concepts: payload.concepts.length,
          mcqs: payload.mcqs.length,
        }
      : null,
  }, null, 2);
}

if (import.meta.url === `file://${process.argv[1].replaceAll("\\", "/")}` || process.argv[1]?.endsWith("run-content-pipeline.ts")) {
  runPipeline(parseArgs(process.argv.slice(2))).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

export { runPipeline };
