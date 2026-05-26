import { createClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "./script-env.mjs";

const { url, serviceKey } = requireSupabaseEnv();
const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BATCH_SIZE = 20;
const TARGET_TOTAL_MCQS = 10000;
const OPTION_LABELS = ["A", "B", "C", "D"];
const REFRESH_EXPANDED = process.argv.includes("--refresh-expanded");

const SUBJECT_DISTRACTORS = {
  GS1: {
    terms: ["Neolithic Age", "Mauryan Empire", "Sangam Literature", "Monsoon", "Black Soil", "Urbanisation"],
    facts: [
      "Harappan sites used baked bricks in many urban structures.",
      "Ashoka's inscriptions are major Mauryan historical sources.",
      "The monsoon strongly shapes Indian agriculture and settlement.",
      "Sangam texts are key sources for early historic Tamilakam.",
    ],
    cases: ["Hunter Commission", "Wood's Despatch", "Ilbert Bill controversy", "Simon Commission"],
    schemes: ["HRIDAY", "PRASHAD Scheme", "National Mission on Monuments and Antiquities", "AMRUT"],
  },
  GS2: {
    terms: ["Article 32", "Article 356", "Finance Commission", "GST Council", "Judicial Review", "Panchayati Raj"],
    facts: [
      "Article 32 provides constitutional remedies before the Supreme Court.",
      "Article 280 provides for the Finance Commission.",
      "Article 279A provides for the GST Council.",
      "Article 356 deals with President's Rule in States.",
    ],
    cases: ["Kesavananda Bharati case", "S.R. Bommai case", "Maneka Gandhi case", "Minerva Mills case"],
    schemes: ["Aspirational Districts Programme", "Digital India", "Ayushman Bharat", "Jal Jeevan Mission"],
  },
  GS3: {
    terms: ["GDP", "GVA", "Repo Rate", "Fiscal Deficit", "Paris Agreement", "Biotechnology"],
    facts: [
      "RBI's Monetary Policy Committee sets the policy repo rate.",
      "The Paris Agreement was adopted in 2015.",
      "The FRBM Act was enacted in 2003.",
      "The IBC was enacted in 2016.",
    ],
    cases: ["T.N. Godavarman case", "M.C. Mehta cases", "Lafarge judgment", "RBI Financial Stability Report"],
    schemes: ["PM-KISAN", "FAME India", "National Mission for Green India", "Atal Innovation Mission"],
  },
  GS4: {
    terms: ["Integrity", "Probity", "Objectivity", "Empathy", "Emotional Intelligence", "Conflict of Interest"],
    facts: [
      "Nolan Principles list seven principles of public life.",
      "The 2nd ARC discussed ethics in governance.",
      "Probity means uprightness in public life.",
      "Conflict of interest should be disclosed and managed.",
    ],
    cases: ["2nd ARC Fourth Report", "Nolan Committee Report", "Gandhian Talisman", "Code of Conduct for Civil Servants"],
    schemes: ["Mission Karmayogi", "CPGRAMS", "RTI Act 2005", "Lokpal and Lokayuktas Act 2013"],
  },
  CSAT: {
    terms: ["Inference", "Assumption", "Syllogism", "Average", "Ratio", "Data Interpretation"],
    facts: [
      "CSAT Paper II is qualifying with 33 percent minimum marks.",
      "Inference must follow only from the given passage.",
      "An assumption is an unstated premise required by an argument.",
      "Wrong answers in Prelims carry one-third negative marking.",
    ],
    cases: ["UPSC Examination Rules", "CSAT Paper II pattern", "UPSC Prelims notification", "Comprehension passage rules"],
    schemes: ["Elimination method", "Passage evidence method", "Unit checking", "Option substitution"],
  },
  Essay: {
    terms: ["Thesis", "Counter-argument", "Introduction", "Conclusion", "Examples", "Coherence"],
    facts: [
      "UPSC Essay paper carries 250 marks.",
      "A strong essay balances examples, analysis and conclusion.",
      "The introduction should frame the central argument.",
      "The conclusion should offer a balanced way forward.",
    ],
    cases: ["Green Revolution example", "ISRO example", "Constitutional morality", "Gandhian trusteeship"],
    schemes: ["Digital India", "Atmanirbhar Bharat", "Swachh Bharat Mission", "National Education Policy 2020"],
  },
};

const FALLBACK = SUBJECT_DISTRACTORS.GS2;

const WRONG_FACTS = {
  GS1: [
    "Harappan civilisation was primarily an Iron Age civilisation.",
    "The Rigveda was composed after the Sangam texts.",
    "The monsoon has no major influence on Indian agriculture.",
    "The Mauryan Empire emerged after the Gupta Empire.",
  ],
  GS2: [
    "The Finance Commission is a statutory body created by an ordinary law.",
    "The GST Council is established under Article 32.",
    "Judicial review was abolished by the 44th Amendment.",
    "Panchayats are governed by the Twelfth Schedule.",
  ],
  GS3: [
    "The Monetary Policy Committee is chaired by the Finance Minister.",
    "The Paris Agreement was adopted in 1986.",
    "Fiscal deficit equals exports minus imports.",
    "The IBC deals primarily with consumer price inflation targeting.",
  ],
  GS4: [
    "Integrity means acting ethically only when supervised.",
    "Probity is the same as political loyalty.",
    "Conflict of interest should be hidden if the outcome is efficient.",
    "Empathy requires ignoring rules in every administrative case.",
  ],
  CSAT: [
    "An inference can go beyond the information given in the passage.",
    "Assumptions are always directly stated in the passage.",
    "CSAT Paper II decides the final merit ranking.",
    "Averages can be calculated without considering the number of observations.",
  ],
  Essay: [
    "An essay should avoid examples and rely only on slogans.",
    "A conclusion should introduce a completely new argument.",
    "Coherence is irrelevant if the essay has many facts.",
    "Counter-arguments should never be acknowledged in a balanced essay.",
  ],
};

const FALSE_TRAPS = [
  "Ignore exact wording because UPSC tests only broad themes.",
  "Assume every constitutional body and statutory body is identical.",
  "Treat all years and amendments as interchangeable if the theme is similar.",
  "Prefer extreme words like always and never without checking exceptions.",
];

async function main() {
  const topics = await fetchAllTopics();
  const countMap = await fetchQuestionCounts();
  const currentTotal = Array.from(countMap.values()).reduce((sum, count) => sum + count, 0);
  let totalPlanned = currentTotal;
  const plans = REFRESH_EXPANDED ? await buildRefreshPlans(topics) : [];

  if (!REFRESH_EXPANDED) {
    for (const topic of topics) {
      const weight = Number(topic.upsc_weightage ?? 0);
      const current = countMap.get(topic.key) ?? 0;
      const priorityTarget = weight >= 4 ? 10 : weight >= 3 ? 7 : current;
      if (current >= priorityTarget) continue;
      const add = priorityTarget - current;
      plans.push({ topic, add, startCount: current, reason: weight >= 4 ? "high_weight_to_10" : "medium_weight_to_7" });
      countMap.set(topic.key, current + add);
      totalPlanned += add;
    }

    if (totalPlanned < TARGET_TOTAL_MCQS) {
      const topUpCandidates = [...topics].sort((a, b) => {
        const weightDiff = Number(b.upsc_weightage ?? 0) - Number(a.upsc_weightage ?? 0);
        if (weightDiff) return weightDiff;
        return String(a.key).localeCompare(String(b.key));
      });
      for (const topic of topUpCandidates) {
        if (totalPlanned >= TARGET_TOTAL_MCQS) break;
        const current = countMap.get(topic.key) ?? 0;
        if (current >= 10) continue;
        const add = Math.min(10 - current, TARGET_TOTAL_MCQS - totalPlanned);
        plans.push({ topic, add, startCount: current, reason: "target_10k_top_up" });
        countMap.set(topic.key, current + add);
        totalPlanned += add;
      }
    }
  }

  let addedQuestions = 0;
  let addedOptions = 0;
  let processedTopics = 0;
  const failed = [];

  for (let index = 0; index < plans.length; index += BATCH_SIZE) {
    const batch = plans.slice(index, index + BATCH_SIZE);
    for (const plan of batch) {
      try {
        const questions = plan.slots?.length
          ? makeQuestionsForSlots(plan.topic, plan.slots, plan.reason)
          : makeQuestions(plan.topic, plan.startCount, plan.add, plan.reason);
        const questionRows = questions.map(({ options, ...question }) => question);
        const optionRows = questions.flatMap((question) =>
          question.options.map((option) => ({
            question_id: question.id,
            option_label: option.label,
            option_text: option.text,
            is_correct: option.isCorrect,
          })),
        );
        await upsertChunk("questions", questionRows, { onConflict: "id" });
        await upsertChunk("question_options", optionRows, { onConflict: "question_id,option_label" });
        addedQuestions += questionRows.length;
        addedOptions += optionRows.length;
        processedTopics += 1;
      } catch (error) {
        failed.push({ key: plan.topic.key, error: error.message });
      }
    }
    console.log(`[batch ${Math.floor(index / BATCH_SIZE) + 1}] processed ${Math.min(index + BATCH_SIZE, plans.length)}/${plans.length}; added ${addedQuestions} questions`);
  }

  const finalCount = await countAllMcqs();
  console.log(
    JSON.stringify(
      {
        startingMcqs: currentTotal,
        targetMcqs: TARGET_TOTAL_MCQS,
        mode: REFRESH_EXPANDED ? "refresh-expanded" : "expand",
        finalMcqs: finalCount,
        plannedTopics: plans.length,
        processedTopics,
        addedQuestions,
        addedOptions,
        failed: failed.length,
        failedTopics: failed,
      },
      null,
      2,
    ),
  );
}

async function buildRefreshPlans(topics) {
  const topicByKey = new Map(topics.map((topic) => [topic.key, topic]));
  const expanded = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("questions")
      .select("id,topic_key")
      .eq("question_type", "mcq")
      .like("id", "codex_expand_%")
      .order("id", { ascending: true })
      .range(from, from + 999);
    if (error) throw error;
    expanded.push(...(data ?? []));
    if (!data || data.length < 1000) break;
    from += 1000;
  }
  const slotsByTopic = new Map();
  for (const question of expanded) {
    const match = String(question.id).match(/_(\d+)$/);
    const slot = match ? Number(match[1]) : null;
    if (!slot || !topicByKey.has(question.topic_key)) continue;
    const slots = slotsByTopic.get(question.topic_key) ?? [];
    slots.push(slot);
    slotsByTopic.set(question.topic_key, slots);
  }
  return Array.from(slotsByTopic.entries()).map(([topicKey, slots]) => ({
    topic: topicByKey.get(topicKey),
    slots: slots.sort((a, b) => a - b),
    add: slots.length,
    startCount: 0,
    reason: "refresh_expanded_quality",
  }));
}

async function fetchAllTopics() {
  const rows = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("topics")
      .select("key,title,subject,upsc_weightage,structured_notes")
      .order("key", { ascending: true })
      .range(from, from + 999);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
    from += 1000;
  }
  return rows;
}

async function fetchQuestionCounts() {
  const rows = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("questions")
      .select("id,topic_key")
      .eq("question_type", "mcq")
      .order("id", { ascending: true })
      .range(from, from + 999);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
    from += 1000;
  }
  const counts = new Map();
  for (const row of rows) counts.set(row.topic_key, (counts.get(row.topic_key) ?? 0) + 1);
  return counts;
}

async function countAllMcqs() {
  const { count, error } = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("question_type", "mcq");
  if (error) throw error;
  return count ?? 0;
}

function makeQuestions(topic, existingCount, add, reason) {
  const notes = parseNotes(topic.structured_notes);
  const subject = subjectBucket(topic);
  const templates = buildTemplates(topic, notes, subject);
  const rows = [];
  for (let index = 0; index < add; index += 1) {
    const slot = existingCount + index + 1;
    const template = templates[index % templates.length];
    rows.push(buildQuestion(topic, template, slot, reason));
  }
  return rows;
}

function makeQuestionsForSlots(topic, slots, reason) {
  const notes = parseNotes(topic.structured_notes);
  const subject = subjectBucket(topic);
  const templates = buildTemplates(topic, notes, subject);
  return slots.map((slot, index) => buildQuestion(topic, templates[index % templates.length], slot, reason));
}

function buildTemplates(topic, notes, subject) {
  const definitions = normalizedDefinitions(notes.concise_notes, topic, subject);
  const bullets = normalizedList(notes.revision_bullets, SUBJECT_DISTRACTORS[subject]?.facts ?? FALLBACK.facts, 10);
  const cases = normalizedNamed(notes.cases, SUBJECT_DISTRACTORS[subject]?.cases ?? FALLBACK.cases);
  const schemes = normalizedNamed(notes.schemes, SUBJECT_DISTRACTORS[subject]?.schemes ?? FALLBACK.schemes);
  const traps = normalizedList(notes.prelims_traps, ["Confusing similar institutions", "Treating exception as rule", "Ignoring chronology"], 6);
  const mains = normalizedList(notes.mains_angles, [`Define ${topic.title}, add a constitutional or factual anchor, then give a current example.`], 6);
  const coverage = normalizedList(notes.ncert_coverage, [`NCERT coverage for ${topic.title}`, "Official textbook foundation"], 6);

  return [
    termQuestion(topic, definitions, subject),
    factQuestion(topic, bullets, subject),
    caseQuestion(topic, cases, subject),
    schemeQuestion(topic, schemes, subject),
    trapQuestion(topic, traps, subject),
    mainsQuestion(topic, mains, subject),
    coverageQuestion(topic, coverage, subject),
    statementQuestion(topic, definitions, bullets, subject),
  ];
}

function termQuestion(topic, definitions, subject) {
  const correct =
    definitions.find((item) => !isTopicTitleTerm(topic, item.term) && !isGenericDefinition(item.definition)) ??
    definitions.find((item) => !isGenericDefinition(item.definition)) ??
    definitions[0];
  const wrongDefinitions = definitions
    .filter((item) => item.term !== correct.term)
    .map((item) => item.definition)
    .filter((definition) => !isGenericDefinition(definition));
  const wrong = wrongDefinitions.slice(0, 3).map((definition) => `${correct.term} - ${definition}`);
  const fallbackTerms = SUBJECT_DISTRACTORS[subject]?.terms ?? FALLBACK.terms;
  while (wrong.length < 3) {
    const term = fallbackTerms[wrong.length % fallbackTerms.length];
    wrong.push(`${correct.term} - ${term} is the controlling institution or concept for this topic.`);
  }
  return {
    questionText: `Which of the following pairs is correctly matched for ${topic.title}?`,
    correctText: `${correct.term} - ${correct.definition}`,
    distractors: fillOptions(wrong, subject, "terms"),
    explanation: `${correct.term} is correctly linked with ${correct.definition} This is a direct fact for ${topic.title}.`,
    trapType: "Matched pair trap",
  };
}

function isTopicTitleTerm(topic, term) {
  return cleanText(term).toLowerCase() === cleanText(topic.title).toLowerCase();
}

function isGenericDefinition(definition) {
  return /\bUPSC syllabus area\b|\bUPSC topic\b|\bshould be studied\b|\brequiring\b.+\bcases and reforms\b/i.test(definition);
}

function factQuestion(topic, bullets, subject) {
  const correct = bullets[0];
  return {
    questionText: `With reference to ${topic.title}, which statement is correct?`,
    correctText: correct,
    distractors: WRONG_FACTS[subject] ?? WRONG_FACTS.GS2,
    explanation: `The correct statement is: ${correct} The other options mix nearby but incorrect facts from the same syllabus area.`,
    trapType: "Statement trap",
  };
}

function caseQuestion(topic, cases, subject) {
  const correct = cases[0];
  return {
    questionText: `Which case, report or source is most directly associated with ${topic.title}?`,
    correctText: correct.name,
    distractors: fillOptions(cases.slice(1, 4).map((item) => item.name), subject, "cases"),
    explanation: `${correct.name} matters here because ${correct.note}`,
    trapType: "Source confusion",
  };
}

function schemeQuestion(topic, schemes, subject) {
  const correct = schemes[0];
  return {
    questionText: `Which scheme, act, policy or institution is most relevant to ${topic.title}?`,
    correctText: correct.name,
    distractors: fillOptions(schemes.slice(1, 4).map((item) => item.name), subject, "schemes"),
    explanation: `${correct.name} is relevant because ${correct.note}`,
    trapType: "Institution trap",
  };
}

function trapQuestion(topic, traps, subject) {
  const correct = traps[0];
  return {
    questionText: `Which is a common UPSC Prelims trap while studying ${topic.title}?`,
    correctText: correct,
    distractors: FALSE_TRAPS,
    explanation: `This is a high-frequency trap because UPSC often tests fine distinctions instead of only broad definitions.`,
    trapType: "Prelims trap",
  };
}

function mainsQuestion(topic, mains, subject) {
  const correct = mains[0];
  return {
    questionText: `For a Mains answer on ${topic.title}, which angle is the strongest?`,
    correctText: correct,
    distractors: fillOptions(mains.slice(1, 4), subject, "facts"),
    explanation: `This angle directly links ${topic.title} with analytical answer writing and gives the examiner a clear framework.`,
    trapType: "Mains angle",
  };
}

function coverageQuestion(topic, coverage, subject) {
  const correct = coverage[0];
  return {
    questionText: `Which source area should be treated as the most direct foundation for ${topic.title}?`,
    correctText: correct,
    distractors: fillOptions(coverage.slice(1, 4), subject, "terms"),
    explanation: `${correct} is the closest foundation source for this topic and should be revised before advanced material.`,
    trapType: "Source trap",
  };
}

function statementQuestion(topic, definitions, bullets, subject) {
  const correct = definitions[1] ?? definitions[0];
  return {
    questionText: `Which term is correctly explained in the context of ${topic.title}?`,
    correctText: `${correct.term}: ${correct.definition}`,
    distractors: fillOptions(bullets.slice(0, 3), subject, "facts"),
    explanation: `${correct.term} is a core term for ${topic.title}; the explanation matches the way UPSC tests the concept.`,
    trapType: "Concept trap",
  };
}

function buildQuestion(topic, template, slot, reason) {
  const correctIndex = hash(`${topic.key}-${slot}`) % 4;
  const uniqueDistractors = uniqueClean(template.distractors).filter((item) => item !== template.correctText).slice(0, 3);
  while (uniqueDistractors.length < 3) {
    uniqueDistractors.push(`Related but not the most precise option ${uniqueDistractors.length + 1}`);
  }
  const optionTexts = [...uniqueDistractors];
  optionTexts.splice(correctIndex, 0, template.correctText);
  return {
    id: `codex_expand_${topic.key}_${String(slot).padStart(2, "0")}`,
    topic_key: topic.key,
    question_text: template.questionText,
    question_type: "mcq",
    year: null,
    source: "ClearUPSC",
    difficulty: Number(topic.upsc_weightage ?? 3) >= 4 ? 4 : 3,
    model_answer: null,
    tags: [String(topic.subject ?? "GS"), "expanded-bank", reason],
    explanation: cleanSentence(template.explanation),
    source_label: "ClearUPSC Expanded Practice",
    trap_type: template.trapType,
    options: OPTION_LABELS.map((label, index) => ({
      label,
      text: cleanSentence(optionTexts[index]),
      isCorrect: index === correctIndex,
    })),
  };
}

function parseNotes(value) {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
  return value && typeof value === "object" ? value : {};
}

function normalizedDefinitions(value, topic, subject) {
  const rows = Array.isArray(value)
    ? value
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const term = cleanText(item.term);
          const definition = cleanText(item.definition);
          return term && definition ? { term, definition } : null;
        })
        .filter(Boolean)
    : [];
  const fallbackTerms = SUBJECT_DISTRACTORS[subject]?.terms ?? FALLBACK.terms;
  while (rows.length < 4) {
    const term = fallbackTerms[rows.length % fallbackTerms.length];
    rows.push({ term, definition: `${term} is a connected term used to test ${topic.title} in the UPSC syllabus.` });
  }
  return rows.slice(0, 8);
}

function normalizedNamed(value, fallback) {
  const rows = Array.isArray(value)
    ? value
        .map((item) => {
          if (typeof item === "string") return { name: cleanText(item), note: "Important reference for this topic." };
          if (!item || typeof item !== "object") return null;
          const name = cleanText(item.name);
          const note = cleanText(item.note ?? item.point ?? "Important reference for this topic.");
          return name ? { name, note } : null;
        })
        .filter(Boolean)
    : [];
  for (const item of fallback) rows.push({ name: item, note: "A plausible same-category distractor for UPSC elimination practice." });
  return rows.slice(0, 8);
}

function normalizedList(value, fallback, limit) {
  const rows = Array.isArray(value) ? value.map(cleanText).filter(Boolean) : [];
  return uniqueClean([...rows, ...fallback]).slice(0, limit);
}

function fillOptions(primary, subject, bucket) {
  const bank = SUBJECT_DISTRACTORS[subject]?.[bucket] ?? FALLBACK[bucket] ?? FALLBACK.terms;
  return uniqueClean([...primary, ...bank]).slice(0, 6);
}

function subjectBucket(topic) {
  const raw = `${topic.subject ?? ""} ${topic.key ?? ""} ${topic.title ?? ""}`.toLowerCase();
  if (raw.includes("csat")) return "CSAT";
  if (raw.includes("essay")) return "Essay";
  if (raw.includes("gs4") || raw.includes("ethics")) return "GS4";
  if (raw.includes("gs3") || raw.includes("economy") || raw.includes("environment") || raw.includes("science")) return "GS3";
  if (raw.includes("gs1") || raw.includes("history") || raw.includes("geography") || raw.includes("society")) return "GS1";
  return "GS2";
}

function cleanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").replace(/^[-•]\s*/, "").trim();
}

function cleanSentence(value) {
  return cleanText(value).replace(/\s+\./g, ".").slice(0, 700);
}

function uniqueClean(values) {
  const seen = new Set();
  const rows = [];
  for (const value of values.map(cleanText).filter(Boolean)) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(value);
  }
  return rows;
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

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
