import { createClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "./script-env.mjs";

const TARGET_PER_TOPIC = Number(process.argv.find((arg) => arg.startsWith("--target="))?.split("=")[1] ?? 5);
const DRY_RUN = process.argv.includes("--dry-run");

const { url, serviceKey } = requireSupabaseEnv();
const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const topics = await fetchAllTopics();
  if (!topics.length) throw new Error("No topics found in Supabase.");

  const existingCounts = await fetchExistingMcqCounts();
  const generated = [];
  const skipped = [];

  for (const topic of topics) {
    const currentCount = existingCounts.get(topic.key) ?? 0;
    if (currentCount >= TARGET_PER_TOPIC) {
      skipped.push(topic.key);
      continue;
    }
    const needed = TARGET_PER_TOPIC - currentCount;
    for (let offset = 0; offset < needed; offset += 1) {
      generated.push(makeQuestion(topic, currentCount + offset));
    }
  }

  console.log(`Topics fetched: ${topics.length}`);
  console.log(`Topics skipped with ${TARGET_PER_TOPIC}+ MCQs: ${skipped.length}`);
  console.log(`Questions to generate: ${generated.length}`);

  if (!generated.length) {
    console.log("Every topic already has enough MCQs.");
    return;
  }

  if (DRY_RUN) {
    console.log(JSON.stringify(generated.slice(0, 5), null, 2));
    return;
  }

  const questionRows = generated.map(({ options, correct, ...question }) => question);
  const legacyQuestionRows = questionRows.map(({ explanation, source_label, trap_type, related_topic_key, ...question }) => question);
  const optionRows = generated.flatMap((question) =>
    question.options.map((option) => ({
      question_id: question.id,
      option_label: option.label,
      option_text: option.text,
      is_correct: option.label === question.correct,
    })),
  );

  let enrichedColumns = true;
  try {
    await upsertChunk("questions", questionRows, { onConflict: "id" });
  } catch (error) {
    if (!isMissingColumnError(error)) throw error;
    enrichedColumns = false;
    await upsertChunk("questions", legacyQuestionRows, { onConflict: "id" });
  }

  await upsertChunk("question_options", optionRows, { onConflict: "question_id,option_label" });

  console.log(
    JSON.stringify(
      {
        topics: topics.length,
        targetPerTopic: TARGET_PER_TOPIC,
        skippedTopics: skipped.length,
        insertedOrUpdatedQuestions: questionRows.length,
        insertedOrUpdatedOptions: optionRows.length,
        enrichedColumns,
        sourceLabel: "ClearUPSC Pattern",
      },
      null,
      2,
    ),
  );
}

async function fetchAllTopics() {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("topics")
      .select("key,title,subject,structured_notes")
      .order("key", { ascending: true })
      .range(from, from + 999);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

async function fetchExistingMcqCounts() {
  const counts = new Map();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("questions")
      .select("topic_key")
      .eq("question_type", "mcq")
      .range(from, from + 999);
    if (error) throw error;
    for (const row of data ?? []) {
      if (!row.topic_key) continue;
      counts.set(row.topic_key, (counts.get(row.topic_key) ?? 0) + 1);
    }
    if (!data || data.length < 1000) break;
  }
  return counts;
}

function makeQuestion(topic, slot) {
  const notes = parseNotes(topic.structured_notes);
  const profile = profileFor(topic, notes);
  const pattern = PATTERNS[slot % PATTERNS.length];
  const title = cleanTitle(topic.title);
  const questionText = pattern.question(title, profile, notes);
  const correctText = pattern.correct(title, profile, notes);
  const distractors = pattern.distractors(title, profile, notes);
  const correct = ["A", "B", "C", "D"][(hash(topic.key) + slot) % 4];
  const options = placeCorrect(correctText, distractors, correct);
  const id = `codex_mcq_${topic.key}_${String(slot + 1).padStart(2, "0")}`.replace(/[^a-zA-Z0-9_-]/g, "_");

  return {
    id,
    topic_key: topic.key,
    question_text: questionText,
    question_type: "mcq",
    difficulty: 3,
    source_label: "ClearUPSC Pattern",
    explanation: pattern.explanation(title, profile, notes),
    year: null,
    source: "ClearUPSC Pattern",
    model_answer: pattern.explanation(title, profile, notes),
    tags: Array.from(new Set([topic.subject, profile.tag, "ClearUPSC Pattern", profile.paper])).filter(Boolean),
    trap_type: pattern.trap,
    related_topic_key: topic.key,
    correct,
    options,
  };
}

const PATTERNS = [
  {
    trap: "Concept clarity",
    question: (title, p) => `With reference to "${title}", which option best reflects the UPSC-ready understanding of the topic?`,
    correct: (title, p) => p.keyFact,
    distractors: (title, p) => [
      `${title} is useful only as a one-line definition and does not require examples.`,
      `${title} should be prepared only from current affairs without static fundamentals.`,
      `${title} is relevant only for optional papers and not for General Studies.`,
    ],
    explanation: (title, p) => `UPSC usually tests ${title} through concept plus application. The correct approach combines definition, source-based facts, institutions and current examples instead of memorising an isolated line.`,
  },
  {
    trap: "Statement extremity",
    question: (title, p) => `Aspirants often make mistakes in statement-based questions on "${title}". Which statement is the safest?`,
    correct: (title, p) => p.prelimsTrap,
    distractors: (title, p) => [
      `Every statement using "always" about ${title} is normally correct in UPSC.`,
      `${title} never changes with law, policy, technology, geography or society.`,
      `UPSC asks ${title} only through direct factual recall and never through application.`,
    ],
    explanation: (title, p) => `UPSC commonly uses absolute words, half-true claims and mismatched institutions. A careful answer checks the condition under which a statement on ${title} is true.`,
  },
  {
    trap: "Static-current linkage",
    question: (title, p) => `Which source combination is most reliable for preparing "${title}" for Prelims and Mains?`,
    correct: (title, p) => `${p.sources}, ${p.ncert}, previous-year questions and current government updates relevant to ${title}.`,
    distractors: (title, p) => [
      `Only social media summaries, because official sources are unnecessary for ${title}.`,
      `Only coaching shortcuts, without NCERT, official documents or PYQ analysis.`,
      `Only newspaper editorials, while ignoring basic definitions and institutions.`,
    ],
    explanation: (title, p) => `${title} needs both a static base and current examples. NCERT/official sources build accuracy, while PYQs reveal the way UPSC frames traps.`,
  },
  {
    trap: "Institution mismatch",
    question: (title, p) => `For "${title}", which institutional or source-linked statement is most appropriate?`,
    correct: (title, p) => `${p.caseOrReport} is relevant because ${p.casePoint}`,
    distractors: (title, p) => [
      `Institutional context is irrelevant because UPSC asks only abstract theory.`,
      `Any constitutional body, statutory body and executive body can be treated as identical.`,
      `Reports and committees should be memorised without knowing their recommendations.`,
    ],
    explanation: (title, p) => `Many wrong options in UPSC mix up bodies, functions and legal status. For ${title}, connect the concept to its correct institutional anchor.`,
  },
  {
    trap: "Mains framework",
    question: (title, p) => `Which answer-writing framework is most balanced for a Mains question on "${title}"?`,
    correct: (title, p) => p.mainsAngle,
    distractors: (title, p) => [
      `Write only criticism and avoid any solution or institutional reference.`,
      `List only facts without causes, consequences, examples or conclusion.`,
      `Use emotional language and avoid source-based evidence.`,
    ],
    explanation: (title, p) => `A good Mains answer on ${title} needs balance. The correct framework gives meaning, evidence, analysis and realistic reforms instead of a one-sided list.`,
  },
];

function profileFor(topic, notes) {
  const key = String(topic.key).toLowerCase();
  const title = String(topic.title).toLowerCase();
  const subject = String(topic.subject ?? "").toLowerCase();

  if (subject.includes("csat") && (key.includes("numeracy") || title.includes("average") || title.includes("ratio") || title.includes("percentage"))) {
    return withNotes({
      paper: "CSAT",
      tag: "Numeracy",
      sources: "NCERT Class 6-10 Mathematics, UPSC CSAT syllabus",
    }, notes);
  }
  if (subject.includes("csat")) {
    return withNotes({
      paper: "CSAT",
      tag: "Comprehension and reasoning",
      sources: "NCERT English comprehension practice, UPSC CSAT syllabus",
    }, notes);
  }
  if (subject.includes("essay")) {
    return withNotes({
      paper: "Essay",
      tag: "Essay theme",
      sources: "GS syllabus themes, NCERT social science, government reports",
    }, notes);
  }
  if (key.includes("polity") || title.includes("constitution") || title.includes("parliament") || title.includes("judiciary") || subject.includes("gs2")) {
    return withNotes({
      paper: "GS Paper II",
      tag: "Polity and governance",
      sources: "NCERT Indian Constitution at Work, Constitution of India, Supreme Court judgments, PRS",
    }, notes);
  }
  if (key.includes("economy") || title.includes("budget") || title.includes("inflation") || title.includes("bank")) {
    return withNotes({
      paper: "GS Paper III",
      tag: "Economy",
      sources: "NCERT Economics, Economic Survey, Union Budget, RBI publications",
    }, notes);
  }
  if (key.includes("agriculture") || title.includes("agriculture") || title.includes("msp")) {
    return withNotes({
      paper: "GS Paper III",
      tag: "Agriculture",
      sources: "NCERT Geography/Economics, Ministry of Agriculture, CACP, Economic Survey",
    }, notes);
  }
  if (key.includes("environment") || title.includes("climate") || title.includes("biodiversity")) {
    return withNotes({
      paper: "GS Paper III",
      tag: "Environment",
      sources: "NCERT Ecology, MoEFCC, UNEP/IPCC reports, environmental laws",
    }, notes);
  }
  if (key.includes("science") || title.includes("technology") || title.includes("space") || title.includes("biotech")) {
    return withNotes({
      paper: "GS Paper III",
      tag: "Science and technology",
      sources: "NCERT Science, PIB, ISRO/DST/DBT official updates",
    }, notes);
  }
  if (key.includes("security") || title.includes("security") || title.includes("border")) {
    return withNotes({
      paper: "GS Paper III",
      tag: "Internal security",
      sources: "MHA documents, security laws, official reports and current affairs",
    }, notes);
  }
  if (key.includes("ethics") || subject.includes("gs4")) {
    return withNotes({
      paper: "GS Paper IV",
      tag: "Ethics",
      sources: "GS4 syllabus, 2nd ARC reports, conduct rules, public administration examples",
    }, notes);
  }
  if (key.includes("geography") || title.includes("monsoon") || title.includes("river")) {
    return withNotes({
      paper: "GS Paper I",
      tag: "Geography",
      sources: "NCERT Physical and Indian Geography, maps, IMD and atlas practice",
    }, notes);
  }
  if (key.includes("society") || title.includes("women") || title.includes("urban") || title.includes("poverty")) {
    return withNotes({
      paper: "GS Paper I",
      tag: "Indian society",
      sources: "NCERT Sociology, Census/NFHS data, government social sector reports",
    }, notes);
  }
  return withNotes({
    paper: subject.includes("gs1") ? "GS Paper I" : subject.includes("gs3") ? "GS Paper III" : "General Studies",
    tag: "UPSC core topic",
    sources: "NCERTs, official syllabus, government sources and previous-year questions",
  }, notes);
}

function parseNotes(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  if (typeof value !== "string") return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function withNotes(profile, notes) {
  const concise = Array.isArray(notes.concise_notes) ? notes.concise_notes : [];
  const cases = Array.isArray(notes.cases) ? notes.cases : [];
  const schemes = Array.isArray(notes.schemes) ? notes.schemes : [];
  const ncert = Array.isArray(notes.ncert_coverage) ? notes.ncert_coverage : [];
  const traps = Array.isArray(notes.prelims_traps) ? notes.prelims_traps : [];
  const mains = Array.isArray(notes.mains_angles) ? notes.mains_angles : [];
  const firstDefinition = concise.find((item) => item?.term && item?.definition);
  const firstCase = cases.find((item) => item?.name && (item?.point || item?.note));
  const firstScheme = schemes.find((item) => item?.name && (item?.point || item?.note));
  const sourceAnchor = firstCase || firstScheme;

  return {
    ...profile,
    keyFact: firstDefinition
      ? `${firstDefinition.term}: ${firstDefinition.definition}`
      : `${profile.tag} should be studied through definition, source facts, examples and exam application in ${profile.paper}.`,
    prelimsTrap: traps[0] || "Avoid absolute statements, mismatched institutions and unsupported current-affairs claims.",
    ncert: ncert[0] || "mapped NCERT chapter or official source",
    caseOrReport: sourceAnchor?.name || firstDefinition?.term || profile.tag,
    casePoint: sourceAnchor?.point || sourceAnchor?.note || firstDefinition?.definition || "it gives the topic an official source anchor for UPSC preparation.",
    mainsAngle: mains[0] || `Define the topic, add source-backed facts, analyse challenges and conclude with a practical way forward linked to ${profile.paper}.`,
  };
}

function placeCorrect(correctText, distractors, correctLabel) {
  const labels = ["A", "B", "C", "D"];
  const options = [];
  let distractorIndex = 0;
  for (const label of labels) {
    if (label === correctLabel) {
      options.push({ label, text: correctText });
    } else {
      options.push({ label, text: distractors[distractorIndex] });
      distractorIndex += 1;
    }
  }
  return options;
}

async function upsertChunk(table, rows, options) {
  for (let index = 0; index < rows.length; index += 500) {
    const chunk = rows.slice(index, index + 500);
    const { error } = await supabase.from(table).upsert(chunk, options);
    if (error) throw error;
    console.log(`${table}: upserted ${Math.min(index + chunk.length, rows.length)}/${rows.length}`);
  }
}

function cleanTitle(value) {
  return String(value || "UPSC topic").replace(/\s+/g, " ").trim();
}

function hash(value) {
  return Array.from(String(value)).reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function isMissingColumnError(error) {
  const message = String(error?.message ?? "");
  return message.includes("schema cache") || message.includes("column") || message.includes("Could not find");
}

await main();
