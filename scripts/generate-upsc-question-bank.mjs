import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "./script-env.mjs";

const { url, serviceKey } = requireSupabaseEnv();
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const targetCount = Number(process.argv.find((arg) => arg.startsWith("--count="))?.split("=")[1] ?? "3000");
const source = "clearupsc_original_practice";
const sourceLabel = "UPSC-pattern practice (ClearUPSC original)";

const topics = await fetchAllTopics();
if (!topics.length) throw new Error("No topics found. Seed topics before generating questions.");

const usableTopics = topics.filter((topic) => !isContainerTopic(topic, topics));
const questionsPerTopic = Math.ceil(targetCount / usableTopics.length);
const generated = [];

for (const topic of usableTopics) {
  const profile = profileFor(topic);
  for (let index = 0; index < questionsPerTopic; index += 1) {
    if (generated.length >= targetCount) break;
    generated.push(makeQuestion(topic, profile, index));
  }
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
  if (!String(error.message).includes("schema cache") && !String(error.message).includes("column")) throw error;
  enrichedColumns = false;
  await upsertChunk("questions", legacyQuestionRows, { onConflict: "id" });
}
await upsertChunk("question_options", optionRows, { onConflict: "question_id,option_label" });

const report = { ...buildReport(generated), enrichedColumns };
writeReport("upsc-question-bank-report.json", report);
console.log(JSON.stringify(report, null, 2));

function isContainerTopic(topic, allTopics) {
  return allTopics.some((candidate) => candidate.parent_key === topic.key) && !String(topic.title).includes(":");
}

async function fetchAllTopics() {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("topics")
      .select("key,title,subject,parent_key,upsc_weightage,exam_stage")
      .order("subject", { ascending: true })
      .order("key", { ascending: true })
      .range(from, from + 999);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

function makeQuestion(topic, profile, localIndex) {
  const title = cleanTitle(topic.title);
  const patterns = questionPatterns();
  const pattern = patterns[localIndex % patterns.length];
  const stem = pattern.stem(title, profile);
  const correctText = pattern.correct(title, profile);
  const distractors = pattern.distractors(title, profile);
  const correctLabel = ["A", "B", "C", "D"][(localIndex + hash(topic.key)) % 4];
  const options = placeCorrect(correctText, distractors, correctLabel);
  const id = `clearupsc_${topic.key}_${String(localIndex + 1).padStart(2, "0")}`.replace(/[^a-zA-Z0-9_-]/g, "_");

  return {
    id,
    topic_key: topic.key,
    question_text: stem,
    question_type: "mcq",
    year: null,
    source,
    difficulty: Math.min(5, Math.max(2, 2 + (localIndex % 4))),
    model_answer: pattern.explanation(title, profile),
    tags: Array.from(new Set([topic.subject, profile.subjectTag, profile.areaTag, "UPSC-pattern", profile.examUse])),
    explanation: pattern.explanation(title, profile),
    source_label: sourceLabel,
    trap_type: pattern.trap,
    related_topic_key: topic.key,
    correct: correctLabel,
    options,
  };
}

function questionPatterns() {
  return [
  {
    trap: "conceptual_clarity",
    stem: (title, p) => `Which option best captures the UPSC-ready meaning of "${title}"?`,
    correct: (title, p) => `${title} should be understood through its definition, context, mechanism, examples, and exam relevance in ${p.subjectTag}.`,
    distractors: (title, p) => [
      `${title} is useful only as a one-line definition and does not need examples.`,
      `${title} should be prepared only from current affairs without static background.`,
      `${title} is relevant only for interview and can be ignored for Prelims and Mains.`,
    ],
    explanation: (title, p) => `UPSC rarely rewards isolated memory. For ${title}, first learn the meaning, then the mechanism, then examples, and finally the way UPSC can frame statements or analytical questions.`,
  },
  {
    trap: "absolute_statement",
    stem: (title, p) => `In a statement-based Prelims question on "${title}", which statement is safest?`,
    correct: (title, p) => `${title} may involve exceptions, context, institutional limits, or implementation gaps, so absolute words must be checked carefully.`,
    distractors: (title, p) => [
      `Every statement containing "always" or "never" about ${title} is automatically correct.`,
      `${title} never changes with law, policy, geography, society, or technology.`,
      `UPSC asks ${title} only as direct factual recall and never through application.`,
    ],
    explanation: (title, p) => `Common UPSC traps use absolute words, half-truths, and familiar terms in unfamiliar contexts. Treat ${title} as a concept with conditions and exceptions.`,
  },
  {
    trap: "mains_framework",
    stem: (title, p) => `For a Mains answer on "${title}", which structure is most balanced?`,
    correct: (title, p) => `Intro definition, background/mechanism, examples or data, challenges, and a practical way forward linked to ${p.mainsValue}.`,
    distractors: (title, p) => [
      `Only list facts about ${title} without causes, effects, examples, or conclusion.`,
      `Write only criticism and avoid any institutional or policy solution.`,
      `Use a generic conclusion without connecting it to citizen outcomes or governance.`,
    ],
    explanation: (title, p) => `A strong Mains answer on ${title} needs a framework. Define it, analyse dimensions, add evidence, mention limits, and end with a realistic way forward.`,
  },
  {
    trap: "source_linking",
    stem: (title, p) => `Which source-combination is most useful for mastering "${title}"?`,
    correct: (title, p) => `${p.baseSource}, official government/source links, previous-year questions, and topic-wise practice with explanations.`,
    distractors: (title, p) => [
      `Only random social media summaries, because official sources are unnecessary.`,
      `Only one coaching note, without NCERT, PYQ, or source verification.`,
      `Only newspaper reading, without linking the topic to syllabus and static concepts.`,
    ],
    explanation: (title, p) => `${title} becomes exam-ready when static source, official source, PYQ pattern, and practice feedback are connected in one loop.`,
  },
  {
    trap: "application",
    stem: (title, p) => `A question asks the practical significance of "${title}". What should the answer focus on?`,
    correct: (title, p) => `How ${title} affects institutions, citizens, resources, rights, welfare, security, economy, or environment depending on context.`,
    distractors: (title, p) => [
      `Only the spelling and literal meaning of ${title}.`,
      `Only a historical anecdote, with no present-day relevance.`,
      `Only a slogan-style conclusion, without analysis.`,
    ],
    explanation: (title, p) => `UPSC tests application. After defining ${title}, explain why it matters in real governance, society, economy, ecology, ethics, or security.`,
  },
  {
    trap: "incorrect_statement",
    stem: (title, p) => `Which statement about preparing "${title}" is incorrect?`,
    correct: (title, p) => `${title} can be mastered by memorising one sentence and avoiding MCQ/PYQ practice.`,
    distractors: (title, p) => [
      `${title} should be linked to the syllabus and revised through questions.`,
      `For ${title}, examples improve Mains answers and explanations improve retention.`,
      `Prelims preparation for ${title} should include traps, definitions, and exceptions.`,
    ],
    explanation: (title, p) => `The incorrect statement is the one that reduces ${title} to one-line memory. ClearUPSC should train concept, facts, traps, and answer use together.`,
  },
  {
    trap: "interlinking",
    stem: (title, p) => `Why is "${title}" linked with other UPSC topics?`,
    correct: (title, p) => `Because UPSC mixes static syllabus, current affairs, examples, and analytical dimensions instead of asking topics in isolation.`,
    distractors: (title, p) => [
      `Because every UPSC question comes from only one chapter and never crosses subjects.`,
      `Because interlinking is needed only for essays, not GS or Prelims.`,
      `Because optional subjects decide all GS questions related to ${title}.`,
    ],
    explanation: (title, p) => `${title} should be studied as part of a network. Link it to adjacent topics, current examples, and previous questions to make recall usable.`,
  },
  ];
}

function profileFor(topic) {
  const text = `${topic.key} ${topic.title} ${topic.subject}`.toLowerCase();
  if (text.includes("polity") || text.includes("constitution") || text.includes("parliament") || text.includes("judiciary")) {
    return {
      subjectTag: "Polity",
      areaTag: "GS2",
      examUse: "Prelims+Mains",
      baseSource: "NCERT Indian Constitution at Work + Constitution provisions + Supreme Court cases",
      mainsValue: "constitutional morality, rights, accountability, separation of powers and democratic governance",
    };
  }
  if (text.includes("governance") || text.includes("rti") || text.includes("civil") || text.includes("ngo")) {
    return {
      subjectTag: "Governance",
      areaTag: "GS2",
      examUse: "Mains",
      baseSource: "Second ARC themes, PIB/government portals, PRS, and real service-delivery examples",
      mainsValue: "transparency, accountability, responsiveness, participation and last-mile delivery",
    };
  }
  if (text.includes("economy") || text.includes("budget") || text.includes("bank") || text.includes("inflation") || text.includes("agriculture")) {
    return {
      subjectTag: "Economy",
      areaTag: "GS3",
      examUse: "Prelims+Mains",
      baseSource: "NCERT Economics + Economic Survey + Budget + RBI/Government releases",
      mainsValue: "growth, inclusion, fiscal prudence, employment, productivity and welfare",
    };
  }
  if (text.includes("environment") || text.includes("ecology") || text.includes("biodiversity") || text.includes("climate")) {
    return {
      subjectTag: "Environment",
      areaTag: "GS3",
      examUse: "Prelims+Mains",
      baseSource: "NCERT Biology/Geography + MoEFCC + conventions + species/habitat references",
      mainsValue: "sustainability, conservation, climate resilience and development balance",
    };
  }
  if (text.includes("geography") || text.includes("geo") || text.includes("climatology") || text.includes("resource")) {
    return {
      subjectTag: "Geography",
      areaTag: "GS1",
      examUse: "Prelims+Mains",
      baseSource: "NCERT Geography + maps + atlas + disaster/resource examples",
      mainsValue: "spatial causation, distribution, human impact and resource management",
    };
  }
  if (text.includes("history") || text.includes("freedom") || text.includes("ancient") || text.includes("medieval") || text.includes("culture")) {
    return {
      subjectTag: "History",
      areaTag: "GS1",
      examUse: "Prelims+Mains",
      baseSource: "NCERT History + culture references + previous-year chronology and theme questions",
      mainsValue: "continuity, change, causation, personalities, movements and historical significance",
    };
  }
  if (text.includes("society") || text.includes("women") || text.includes("urban") || text.includes("communalism")) {
    return {
      subjectTag: "Society",
      areaTag: "GS1",
      examUse: "Mains",
      baseSource: "NCERT Sociology + Census/NFHS style data + social justice examples",
      mainsValue: "social change, diversity, inclusion, vulnerability, reform and social harmony",
    };
  }
  if (text.includes("ethics") || text.includes("integrity") || text.includes("probity") || text.includes("case")) {
    return {
      subjectTag: "Ethics",
      areaTag: "GS4",
      examUse: "Mains",
      baseSource: "GS4 syllabus terms + real administration examples + case-study frameworks",
      mainsValue: "values, dilemmas, stakeholder analysis, public interest and ethical decision-making",
    };
  }
  if (text.includes("csat") || text.includes("reasoning") || text.includes("numeracy") || text.includes("comprehension")) {
    return {
      subjectTag: "CSAT",
      areaTag: "CSAT",
      examUse: "Prelims",
      baseSource: "CSAT PYQ patterns + timed comprehension, reasoning and numeracy drills",
      mainsValue: "speed, accuracy, elimination and calm problem-solving",
    };
  }
  return {
    subjectTag: String(topic.subject ?? "General Studies"),
    areaTag: String(topic.subject ?? "UPSC"),
    examUse: "Prelims+Mains",
    baseSource: "NCERT/Wikipedia foundation + official sources + PYQ pattern",
    mainsValue: "clarity, examples, analysis and balanced conclusion",
  };
}

function placeCorrect(correctText, distractors, correctLabel) {
  const labels = ["A", "B", "C", "D"];
  const options = [];
  let distractorIndex = 0;
  for (const label of labels) {
    options.push({
      label,
      text: label === correctLabel ? correctText : distractors[distractorIndex++],
    });
  }
  return options;
}

function cleanTitle(title) {
  return String(title).replace(/\s+/g, " ").trim();
}

function hash(value) {
  return Array.from(String(value)).reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

async function upsertChunk(table, rows, options = {}) {
  for (let index = 0; index < rows.length; index += 250) {
    const chunk = rows.slice(index, index + 250);
    const { error } = await supabase.from(table).upsert(chunk, options);
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

function buildReport(rows) {
  const bySubject = {};
  const byTrap = {};
  for (const row of rows) {
    const subject = row.tags[0] ?? "Unknown";
    bySubject[subject] = (bySubject[subject] ?? 0) + 1;
    byTrap[row.trap_type] = (byTrap[row.trap_type] ?? 0) + 1;
  }
  return {
    targetCount,
    generated: rows.length,
    source,
    sourceLabel,
    bySubject,
    byTrap,
    officialPyqWarning: "These are original ClearUPSC UPSC-pattern practice questions, not official UPSC PYQs.",
    generatedAt: new Date().toISOString(),
  };
}

function writeReport(name, report) {
  const dir = join(process.cwd(), "data", "content-reports");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, name), `${JSON.stringify(report, null, 2)}\n`);
}
