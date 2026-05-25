import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const BATCH_SIZE = 20;
const QUESTIONS_PER_TOPIC = 5;

loadLocalEnv();

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const LETTERS = ["A", "B", "C", "D"];

const subjectDistractors = {
  CSAT: {
    terms: ["Article 356", "GST Council", "Finance Commission", "Paris Agreement", "Basic Structure"],
    facts: ["CSAT Paper II carries 300 marks.", "CSAT has no qualifying threshold.", "CSAT wrong answers carry no penalty."],
  },
  Essay: {
    terms: ["Repo Rate", "Article 131", "CITES", "Panchsheel", "HCF"],
    facts: ["Essay paper carries 100 marks.", "Essay is part of Prelims.", "Essay requires only factual listing."],
  },
  GS1: {
    terms: ["Article 279A", "Repo Rate", "Lokpal Act", "QUAD", "Aditya-L1"],
    facts: ["Rigveda is the youngest Veda.", "Harappan cities were primarily Iron Age settlements.", "Census in India is conducted every five years."],
  },
  GS2: {
    terms: ["Black Soil", "Repo Rate", "Paris Agreement", "Aryabhata satellite", "HCF"],
    facts: ["Article 32 is not enforceable in courts.", "Finance Commission is a statutory body.", "The 73rd Amendment created GST Council."],
  },
  GS3: {
    terms: ["Article 32", "Sangam Literature", "Vishaka Guidelines", "SAARC", "Tone"],
    facts: ["GST was launched in 1991.", "RBI was established in 1950.", "Paris Agreement was adopted in 1986."],
  },
  GS4: {
    terms: ["Repo Rate", "Indus Waters Treaty", "Article 131", "Black Soil", "PSLV"],
    facts: ["Integrity means acting only when supervised.", "Probity means political favouritism.", "Nolan principles are Indian constitutional articles."],
  },
};

async function main() {
  let offset = 0;
  let processed = 0;
  const generated = [];

  while (true) {
    const { data: topics, error } = await supabase
      .from("topics")
      .select("key,title,subject,structured_notes")
      .order("key", { ascending: true })
      .range(offset, offset + BATCH_SIZE - 1);

    if (error) throw error;
    if (!topics?.length) break;

    for (const topic of topics) {
      processed += 1;
      generated.push(...makeQuestions(topic));

      if (processed % 100 === 0) {
        console.log(`[progress] generated questions for ${processed} topics (${generated.length} questions)`);
      }
    }

    offset += BATCH_SIZE;
  }

  console.log(`Generated ${generated.length} questions. Clearing old questions and options...`);
  await clearQuestionBank();

  const questionRows = generated.map(({ options, ...question }) => question);
  const optionRows = generated.flatMap((question) =>
    question.options.map((option) => ({
      question_id: question.id,
      option_label: option.label,
      option_text: option.text,
      is_correct: option.isCorrect,
    })),
  );

  let insertedQuestions = 0;
  for (let i = 0; i < questionRows.length; i += 200) {
    const chunk = questionRows.slice(i, i + 200);
    const { error } = await supabase.from("questions").insert(chunk);
    if (error) throw error;
    insertedQuestions += chunk.length;
    if (insertedQuestions % 1000 === 0 || insertedQuestions === questionRows.length) {
      console.log(`[insert] questions ${insertedQuestions}/${questionRows.length}`);
    }
  }

  let insertedOptions = 0;
  for (let i = 0; i < optionRows.length; i += 800) {
    const chunk = optionRows.slice(i, i + 800);
    const { error } = await supabase.from("question_options").insert(chunk);
    if (error) throw error;
    insertedOptions += chunk.length;
    if (insertedOptions % 4000 === 0 || insertedOptions === optionRows.length) {
      console.log(`[insert] options ${insertedOptions}/${optionRows.length}`);
    }
  }

  console.log(
    JSON.stringify(
      {
        processed,
        insertedQuestions,
        insertedOptions,
        expectedQuestions: processed * QUESTIONS_PER_TOPIC,
      },
      null,
      2,
    ),
  );
}

async function clearQuestionBank() {
  const { error: optionError } = await supabase.from("question_options").delete().not("id", "is", null);
  if (optionError) throw optionError;
  const { error: questionError } = await supabase.from("questions").delete().not("id", "is", null);
  if (questionError) throw questionError;
}

function makeQuestions(topic) {
  if (topic.key === "gs2_polity_local_bodies") return localBodiesQuestions(topic);

  const notes = parseNotes(topic.structured_notes);
  const title = clean(topic.title);
  const subject = clean(topic.subject || "UPSC");
  const concise = realConcise(notes).slice(0, 12);
  const bullets = realBullets(notes).slice(0, 10);
  const anchors = realAnchors(notes);

  const usableConcise = concise.length >= 4 ? concise : fallbackConcise(subject);
  const usableBullets = bullets.length >= 4 ? bullets : fallbackBullets(subject);
  const questions = [];

  const first = usableConcise[0];
  questions.push(
    buildQuestion(topic, 1, {
      text: `With reference to ${title}, which of the following correctly describes "${first.term}"?`,
      correct: first.definition,
      distractors: distractorDefinitions(usableConcise, first.term, subject),
      explanation: `"${first.term}" is correctly described as: ${first.definition}`,
      trap: "Term-definition mismatch",
    }),
  );

  const second = usableConcise[1] ?? usableConcise[0];
  questions.push(
    buildQuestion(topic, 2, {
      text: `In the context of ${title}, the description "${second.definition}" refers to which term?`,
      correct: second.term,
      distractors: distractorTerms(usableConcise, second.term, subject),
      explanation: `The description points to ${second.term}. Other options refer to different institutions, concepts or provisions.`,
      trap: "Concept identification",
    }),
  );

  const correctFact = usableBullets[0];
  questions.push(
    buildQuestion(topic, 3, {
      text: `Which of the following statements about ${title} is correct?`,
      correct: correctFact,
      distractors: wrongFacts(correctFact, usableBullets, subject),
      explanation: `The correct factual statement is: ${correctFact}`,
      trap: "Factual reversal",
    }),
  );

  const third = usableConcise[2] ?? usableConcise[0];
  questions.push(
    buildQuestion(topic, 4, {
      text: `Which of the following pairs is correctly matched with reference to ${title}?`,
      correct: `${third.term} - ${third.definition}`,
      distractors: mismatchedPairs(usableConcise, third.term, subject),
      explanation: `${third.term} is correctly matched with its actual definition. The other options mismatch terms with unrelated descriptions.`,
      trap: "Incorrectly matched pair",
    }),
  );

  const anchor = anchors[0] ?? usableConcise[3] ?? usableConcise[0];
  questions.push(
    buildQuestion(topic, 5, {
      text: `Which of the following is most directly associated with ${title}?`,
      correct: anchor.term,
      distractors: anchorDistractors(anchor.term, subject, usableConcise),
      explanation: `${anchor.term} is directly associated with ${title}. ${anchor.definition}`,
      trap: "Institution/source confusion",
    }),
  );

  return questions.slice(0, QUESTIONS_PER_TOPIC);
}

function localBodiesQuestions(topic) {
  const rows = [
    {
      text: "Under which constitutional amendment were Panchayati Raj institutions given constitutional status?",
      correct: "73rd Constitutional Amendment Act, 1992",
      distractors: ["42nd Constitutional Amendment Act, 1976", "74th Constitutional Amendment Act, 1992", "86th Constitutional Amendment Act, 2002"],
      explanation: "The 73rd Constitutional Amendment Act, 1992 inserted Part IX and gave constitutional status to Panchayats.",
      trap: "Amendment confusion",
    },
    {
      text: "Article 243G of the Constitution relates to which of the following?",
      correct: "Powers, authority and responsibilities of Panchayats",
      distractors: ["Powers of Municipalities", "Elections to Panchayats", "State Finance Commission for Panchayats"],
      explanation: "Article 243G deals with powers, authority and responsibilities of Panchayats, including matters in the Eleventh Schedule.",
      trap: "Article mismatch",
    },
    {
      text: "Which Schedule of the Constitution lists 29 subjects that may be devolved to Panchayats?",
      correct: "Eleventh Schedule",
      distractors: ["Seventh Schedule", "Tenth Schedule", "Twelfth Schedule"],
      explanation: "The Eleventh Schedule, added by the 73rd Amendment, contains 29 subjects for Panchayats.",
      trap: "Schedule confusion",
    },
    {
      text: "Which constitutional amendment gave constitutional status to Municipalities?",
      correct: "74th Constitutional Amendment Act, 1992",
      distractors: ["73rd Constitutional Amendment Act, 1992", "61st Constitutional Amendment Act, 1988", "97th Constitutional Amendment Act, 2011"],
      explanation: "The 74th Constitutional Amendment Act, 1992 inserted Part IXA and gave constitutional status to Municipalities.",
      trap: "Panchayat-municipality confusion",
    },
    {
      text: "State Finance Commissions for local bodies are provided under which articles?",
      correct: "Articles 243I and 243Y",
      distractors: ["Articles 280 and 281", "Articles 324 and 329", "Articles 124 and 217"],
      explanation: "Article 243I relates to State Finance Commission for Panchayats and Article 243Y applies it to Municipalities.",
      trap: "Institutional article mismatch",
    },
  ];
  return rows.map((row, index) => buildQuestion(topic, index + 1, row));
}

function buildQuestion(topic, slot, input) {
  const correctLabel = LETTERS[(hash(`${topic.key}:${slot}`) % 4 + 4) % 4];
  const options = placeCorrect(input.correct, input.distractors, correctLabel);
  const id = `codex_rewrite_mcq_${topic.key}_${String(slot).padStart(2, "0")}`.replace(/[^a-zA-Z0-9_-]/g, "_");

  return {
    id,
    topic_key: topic.key,
    question_text: input.text,
    question_type: "mcq",
    year: null,
    source: "ClearUPSC Pattern",
    difficulty: 3,
    model_answer: input.explanation,
    tags: [topic.subject, "ClearUPSC Pattern", input.trap].filter(Boolean),
    explanation: input.explanation,
    source_label: "ClearUPSC Pattern",
    trap_type: input.trap,
    options,
  };
}

function placeCorrect(correctText, distractors, correctLabel) {
  const cleanDistractors = uniqueStrings(distractors).filter((item) => item !== correctText).slice(0, 3);
  while (cleanDistractors.length < 3) cleanDistractors.push(`None of the above statement correctly describes ${correctText}`);
  const options = [];
  let d = 0;
  for (const label of LETTERS) {
    if (label === correctLabel) {
      options.push({ label, text: correctText, isCorrect: true });
    } else {
      options.push({ label, text: cleanDistractors[d], isCorrect: false });
      d += 1;
    }
  }
  return options;
}

function realConcise(notes) {
  return uniquePairs(
    (Array.isArray(notes.concise_notes) ? notes.concise_notes : [])
      .map((row) => ({ term: row.term, definition: row.definition }))
      .filter((row) => row.term && row.definition)
      .filter((row) => !/study|prepare|theme requiring|tested through|UPSC-ready/i.test(`${row.term} ${row.definition}`)),
  );
}

function realBullets(notes) {
  return uniqueStrings(Array.isArray(notes.revision_bullets) ? notes.revision_bullets : []).filter(
    (item) => !/study|prepare|revise|framework|answer/i.test(item),
  );
}

function realAnchors(notes) {
  const cases = Array.isArray(notes.cases) ? notes.cases : [];
  const schemes = Array.isArray(notes.schemes) ? notes.schemes : [];
  return uniquePairs([
    ...cases.map((row) => ({ term: row.name, definition: row.point ?? row.note ?? "" })),
    ...schemes.map((row) => ({ term: row.name, definition: row.point ?? row.note ?? "" })),
  ]).filter((row) => row.term && row.definition);
}

function distractorDefinitions(concise, correctTerm, subject) {
  return [
    ...concise.filter((row) => row.term !== correctTerm).map((row) => row.definition),
    ...fallbackConcise(subject).map((row) => row.definition),
  ];
}

function distractorTerms(concise, correctTerm, subject) {
  return [...concise.filter((row) => row.term !== correctTerm).map((row) => row.term), ...subjectDistractorsFor(subject).terms];
}

function wrongFacts(correctFact, bullets, subject) {
  const mutated = mutateFact(correctFact);
  return uniqueStrings([mutated, ...subjectDistractorsFor(subject).facts, ...bullets.filter((item) => item !== correctFact).map(mutateFact)]).slice(0, 3);
}

function mismatchedPairs(concise, correctTerm, subject) {
  const rows = concise.filter((row) => row.term !== correctTerm);
  const pairs = [];
  for (let i = 0; i < rows.length - 1; i += 1) pairs.push(`${rows[i].term} - ${rows[i + 1].definition}`);
  return [...pairs, ...fallbackConcise(subject).slice(0, 3).map((row) => `${row.term} - ${mutateFact(row.definition)}`)];
}

function anchorDistractors(correctTerm, subject, concise) {
  return uniqueStrings([
    ...subjectDistractorsFor(subject).terms,
    ...concise.map((row) => row.term),
  ]).filter((term) => term !== correctTerm).slice(0, 3);
}

function mutateFact(fact) {
  const replacements = [
    [/73rd/g, "74th"],
    [/74th/g, "73rd"],
    [/1992/g, "1976"],
    [/1973/g, "1993"],
    [/1981/g, "1998"],
    [/1993/g, "1981"],
    [/1998/g, "2015"],
    [/2015/g, "1992"],
    [/Article 32/g, "Article 31"],
    [/Article 131/g, "Article 143"],
    [/Article 136/g, "Article 129"],
    [/Article 280/g, "Article 279A"],
    [/4 percent/g, "8 percent"],
    [/33 percent/g, "50 percent"],
    [/65/g, "62"],
    [/62/g, "60"],
  ];
  for (const [pattern, replacement] of replacements) {
    if (pattern.test(fact)) return fact.replace(pattern, replacement);
  }
  if (/ is /i.test(fact)) return fact.replace(/ is /i, " is not ");
  if (/ was /i.test(fact)) return fact.replace(/ was /i, " was not ");
  if (/ under /i.test(fact)) return fact.replace(/ under /i, " unrelated to ");
  return `It is incorrect that ${fact.charAt(0).toLowerCase()}${fact.slice(1)}`;
}

function fallbackConcise(subject) {
  const map = {
    CSAT: [
      { term: "CSAT Paper II", definition: "UPSC Prelims qualifying paper carrying 200 marks." },
      { term: "Negative Marking", definition: "One-third penalty for wrong objective answers." },
      { term: "Article 320", definition: "Constitutional provision connected with UPSC examination functions." },
      { term: "Inference", definition: "Conclusion that follows from given passage or statements." },
    ],
    Essay: [
      { term: "Essay Paper", definition: "UPSC Mains paper carrying 250 marks." },
      { term: "Preamble", definition: "Constitutional source of justice, liberty, equality and fraternity." },
      { term: "Constitutional Morality", definition: "Respect for constitutional values in public life." },
      { term: "Gandhian Talisman", definition: "Ethical test focused on the poorest and weakest person." },
    ],
    GS1: [
      { term: "Indus Valley Civilization", definition: "Bronze Age urban civilization c. 2600-1900 BCE." },
      { term: "Monsoon", definition: "Seasonal reversal of winds over the Indian subcontinent." },
      { term: "Article 17", definition: "Abolishes untouchability." },
      { term: "Census 2011", definition: "Latest completed Census of India." },
    ],
    GS2: [
      { term: "Article 32", definition: "Right to constitutional remedies before the Supreme Court." },
      { term: "Article 280", definition: "Constitutional provision for Finance Commission." },
      { term: "RTI Act 2005", definition: "Law giving citizens access to information from public authorities." },
      { term: "Panchsheel", definition: "Five principles of peaceful coexistence articulated in 1954." },
    ],
    GS3: [
      { term: "GDP", definition: "Market value of final goods and services produced in a country." },
      { term: "CPI", definition: "Consumer Price Index used for inflation targeting." },
      { term: "Environment Protection Act 1986", definition: "Umbrella environmental law enacted after Bhopal disaster." },
      { term: "Chandrayaan-3", definition: "ISRO mission that soft-landed on Moon in 2023." },
    ],
    GS4: [
      { term: "Integrity", definition: "Consistency between values, words and actions." },
      { term: "Probity", definition: "Uprightness and honesty in public office." },
      { term: "Nolan Principles", definition: "Seven principles of public life from the UK." },
      { term: "2nd ARC", definition: "Commission that reported on Ethics in Governance." },
    ],
  };
  return map[subject] ?? map.GS4;
}

function fallbackBullets(subject) {
  return {
    CSAT: ["CSAT Paper II carries 200 marks.", "CSAT qualifying standard is 33 percent.", "Wrong answers carry one-third penalty."],
    Essay: ["Essay paper carries 250 marks.", "Preamble gives justice, liberty, equality and fraternity.", "Ambedkar stressed constitutional morality."],
    GS1: ["Mature Harappan phase is c. 2600-1900 BCE.", "Census 2011 is latest completed census.", "Rigveda is the oldest Veda."],
    GS2: ["Article 32 is a Fundamental Right.", "Finance Commission is under Article 280.", "RTI Act was enacted in 2005."],
    GS3: ["GST launched on 1 July 2017.", "RBI was established in 1935.", "Environment Protection Act was enacted in 1986."],
    GS4: ["Integrity means consistency between values and action.", "Probity means uprightness in public office.", "2nd ARC reported on Ethics in Governance."],
  }[subject] ?? ["Integrity means consistency between values and action.", "Probity means uprightness in public office.", "2nd ARC reported on Ethics in Governance."];
}

function subjectDistractorsFor(subject) {
  return subjectDistractors[subject] ?? subjectDistractors.GS4;
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

function uniquePairs(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const term = clean(item.term);
    const definition = clean(item.definition);
    if (!term || !definition) continue;
    const key = `${term.toLowerCase()}|${definition.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ term, definition });
  }
  return out;
}

function uniqueStrings(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const value = clean(item);
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

function hash(value) {
  let total = 0;
  for (const char of String(value)) total = (total * 31 + char.charCodeAt(0)) | 0;
  return Math.abs(total);
}

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function loadLocalEnv() {
  try {
    const env = readFileSync(".env.local", "utf8");
    for (const line of env.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index === -1) continue;
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
      process.env[key] ??= value;
    }
  } catch {}
}

await main();
