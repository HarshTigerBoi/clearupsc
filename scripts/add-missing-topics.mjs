import { createClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "./script-env.mjs";

const { url, serviceKey } = requireSupabaseEnv();
const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const topics = [
  {
    key: "gs3_economy_basics",
    title: "Economy Basics",
    subject: "GS3",
    parent_key: null,
    upsc_weightage: 5,
    exam_stage: "both",
  },
  {
    key: "gs4_ethics_integrity",
    title: "Integrity and Ethics",
    subject: "GS4",
    parent_key: null,
    upsc_weightage: 5,
    exam_stage: "mains",
  },
  {
    key: "gs1_geography_physical",
    title: "Physical Geography",
    subject: "GS1",
    parent_key: null,
    upsc_weightage: 5,
    exam_stage: "both",
  },
];

const notesByKey = {
  gs3_economy_basics: {
    analogy: "Think of Economy Basics like learning how money moves through a large city: households earn and spend, firms produce, banks circulate credit, and the government builds roads, collects taxes and supports people who need help.",
    full_notes: `## Economy Basics

### Meaning
Economy Basics covers the essential language of economic development: GDP, GVA, inflation, fiscal policy, monetary policy, employment, savings, investment, taxation, budget and inclusive growth. UPSC asks economy not as pure commerce, but as public policy. A good aspirant must understand how growth, welfare, markets and government decisions affect citizens.

### Core Concepts
**GDP** measures the value of final goods and services produced in an economy. **GVA** measures value added by sectors before adding product taxes and subtracting subsidies. **Fiscal policy** is the government's use of taxation, borrowing and expenditure. **Monetary policy** is managed by the RBI through tools like repo rate, CRR, SLR and open market operations. India follows flexible inflation targeting with CPI inflation target of **4% +/- 2%**, based on the RBI Act amendment after the Urjit Patel Committee.

### Constitutional And Institutional Base
The Union Budget is presented under **Article 112** as the Annual Financial Statement. **Article 265** says no tax can be levied except by authority of law. **Article 280** creates the Finance Commission for Centre-State fiscal transfers. **Article 279A** creates the GST Council. Important institutions include the RBI, Ministry of Finance, NITI Aayog, GST Council, Finance Commission, SEBI, NABARD and CCI.

### India-Specific Context
India has a mixed economy where public and private sectors both operate. The 1991 LPG reforms liberalised industry, trade and investment. Current themes include inclusive growth, formalisation through GST and digital payments, manufacturing push through PLI, infrastructure-led growth, inflation management, employment creation, agricultural productivity and fiscal consolidation.

### UPSC Use
For Prelims, remember definitions, institutions, laws, indicators and schemes. For Mains, connect economy with poverty, jobs, inequality, federalism, infrastructure, welfare, environment and governance. Strong answers use examples from the Economic Survey, Union Budget, RBI reports and current schemes.`,
    concise_notes: [
      { term: "GDP", definition: "Total market value of final goods and services produced within an economy." },
      { term: "GVA", definition: "Sector-wise value added before product taxes and subsidies are adjusted." },
      { term: "Fiscal Policy", definition: "Government policy on taxation, borrowing and expenditure." },
      { term: "Monetary Policy", definition: "RBI policy controlling money supply, credit and inflation." },
      { term: "Inflation Targeting", definition: "India targets CPI inflation at 4% with a 2-6% tolerance band." },
      { term: "Article 112", definition: "Constitutional provision for the Union Budget." },
      { term: "Article 280", definition: "Provides for the Finance Commission." },
      { term: "GST Council", definition: "Constitutional body under Article 279A for GST recommendations." },
      { term: "Inclusive Growth", definition: "Growth that creates broad opportunities and reduces deprivation." },
      { term: "LPG Reforms", definition: "1991 reforms of liberalisation, privatisation and globalisation." },
    ],
    revision_bullets: [
      "GDP measures final output value.",
      "GVA shows sector-wise value addition.",
      "Budget is under Article 112.",
      "Finance Commission is Article 280.",
      "GST Council is Article 279A.",
      "RBI manages monetary policy.",
      "Inflation target is 4% +/- 2%.",
      "Fiscal deficit shows borrowing need.",
      "1991 reforms opened the economy.",
      "Inclusive growth links GDP with welfare.",
    ],
    mindmap: ["Economy Basics", "GDP/GVA", "Budget", "RBI", "Inflation", "GST", "Inclusive Growth"],
    cases: [
      { name: "Mohit Minerals v Union of India (2022)", point: "Held GST Council recommendations are persuasive, not binding." },
      { name: "Swiss Ribbons v Union of India (2019)", point: "Upheld the constitutional validity of the Insolvency and Bankruptcy Code." },
      { name: "Vodafone tax case (2012)", point: "Important for retrospective taxation and investor certainty." },
    ],
    schemes: [
      { name: "PM Jan Dhan Yojana", point: "Financial inclusion through basic bank accounts." },
      { name: "Production Linked Incentive Scheme", point: "Incentivises manufacturing in selected sectors." },
      { name: "MUDRA Yojana", point: "Supports micro-enterprise credit through banks and financial institutions." },
    ],
    ncert_coverage: [
      "Class 11 Indian Economic Development: Indian Economy on the Eve of Independence",
      "Class 11 Indian Economic Development: Economic Reforms Since 1991",
      "Class 12 Introductory Macroeconomics: National Income Accounting",
      "Class 12 Introductory Macroeconomics: Government Budget and the Economy",
    ],
    prelims_traps: [
      "GDP and GVA are not the same.",
      "Fiscal deficit and revenue deficit are different.",
      "GST Council recommendations are not binding after Mohit Minerals.",
    ],
    mains_angles: [
      "GS Paper III angle: analyse growth versus inclusive development.",
      "GS Paper III angle: discuss fiscal consolidation with welfare needs.",
      "GS Paper III angle: evaluate RBI inflation targeting in Indian conditions.",
    ],
  },
  gs4_ethics_integrity: {
    analogy: "Think of Integrity and Ethics like the steering wheel and brakes of public power: skill may move the vehicle, but ethics decides direction and integrity stops misuse.",
    full_notes: `## Integrity and Ethics

### Meaning
Ethics means principles that help decide right and wrong conduct. Integrity means consistency between values, words and actions, especially when nobody is watching. In public administration, integrity is not private goodness alone; it is reliable honesty in handling public power, public money and citizen trust.

### UPSC Relevance
GS Paper IV tests ethics, integrity, aptitude, attitude, emotional intelligence, probity in governance and case-study decision-making. A civil servant faces conflicts between rules, compassion, political pressure, public interest, scarce resources and personal safety. UPSC expects practical moral reasoning, not sermons.

### Constitutional And Administrative Base
The Preamble gives values of justice, liberty, equality and fraternity. **Article 14** supports equality before law. **Article 21** protects life and dignity. **Article 311** gives civil servants procedural safeguards, but safeguards do not mean freedom from accountability. Conduct rules, vigilance systems, CVC, CAG, Lokpal, RTI and social audit mechanisms support integrity in governance.

### Important Ideas
**Probity** means uprightness and honesty in public life. **Accountability** means answerability for decisions and outcomes. **Transparency** means citizens can inspect reasons, rules and records. **Conflict of interest** arises when private interest can influence public duty. **Empathy** helps administrators understand vulnerable citizens without abandoning law.

### Thinkers And Reports
The Nolan Committee listed seven principles of public life: selflessness, integrity, objectivity, accountability, openness, honesty and leadership. The 2nd Administrative Reforms Commission is important for ethics in governance, RTI, civil-service reform and anti-corruption design. For case studies, identify stakeholders, facts, values, options, consequences and the legally ethical way forward.`,
    concise_notes: [
      { term: "Ethics", definition: "Principles guiding right and wrong human conduct." },
      { term: "Integrity", definition: "Consistency of values, words and actions." },
      { term: "Probity", definition: "Uprightness and honesty in public life." },
      { term: "Accountability", definition: "Obligation to explain and justify decisions." },
      { term: "Transparency", definition: "Openness of rules, reasons and records." },
      { term: "Conflict of Interest", definition: "Private interest interfering with public duty." },
      { term: "Article 14", definition: "Equality before law and equal protection of laws." },
      { term: "Article 21", definition: "Right to life and dignity." },
      { term: "Nolan Principles", definition: "Seven principles for standards in public life." },
      { term: "Emotional Intelligence", definition: "Ability to understand and manage emotions in self and others." },
    ],
    revision_bullets: [
      "Integrity means values match action.",
      "Probity means upright public conduct.",
      "Ethics case studies need stakeholder mapping.",
      "Article 14 supports equal treatment.",
      "Article 21 protects dignity.",
      "Nolan gives seven public-life principles.",
      "RTI strengthens transparency.",
      "Lokpal addresses corruption complaints.",
      "Empathy must work within law.",
      "Avoid extreme answers in case studies.",
    ],
    mindmap: ["Integrity and Ethics", "Values", "Probity", "Accountability", "Transparency", "Empathy", "Case Studies"],
    cases: [
      { name: "Nolan Committee Principles", point: "Core principles of public life used in ethics answers." },
      { name: "2nd Administrative Reforms Commission", point: "Major source for ethics, governance and civil-service reforms." },
      { name: "Vineet Narain v Union of India (1997)", point: "Important for institutional independence and anti-corruption governance." },
    ],
    schemes: [
      { name: "RTI Act 2005", point: "Promotes transparency and accountability." },
      { name: "Lokpal and Lokayuktas Act 2013", point: "Creates anti-corruption ombudsman framework." },
      { name: "Mission Karmayogi", point: "Capacity-building framework for civil servants." },
    ],
    ncert_coverage: [
      "Class 11 Political Theory: Rights",
      "Class 11 Political Theory: Justice",
      "Class 12 Political Science: Politics in India Since Independence",
    ],
    prelims_traps: [
      "Legality and morality are related but not identical.",
      "Empathy does not mean bypassing law.",
      "Integrity is broader than not taking bribes.",
    ],
    mains_angles: [
      "GS Paper IV angle: integrity as foundation of public trust.",
      "GS Paper IV angle: probity mechanisms in governance.",
      "GS Paper IV angle: ethical decision-making under pressure.",
    ],
  },
  gs1_geography_physical: {
    analogy: "Think of Physical Geography like understanding the engine room of Earth: rocks, rivers, winds, oceans and climate systems keep shaping the surface on which humans live.",
    full_notes: `## Physical Geography

### Meaning
Physical Geography studies natural features and processes of Earth: landforms, rocks, plate tectonics, rivers, glaciers, atmosphere, climate, oceans, soils, vegetation and natural hazards. UPSC asks it because physical processes explain agriculture, settlement, disasters, water resources, environment and geopolitics.

### Geomorphology
Earth's crust is shaped by internal forces like tectonic movement, earthquakes and volcanism, and external forces like rivers, wind, glaciers and waves. Plate tectonics explains continental drift, mountain building, earthquakes and volcanoes. The Himalayas are young fold mountains formed by collision of the Indian and Eurasian plates.

### Climatology
Weather is short-term atmospheric condition; climate is long-term average. Major controls of climate include latitude, altitude, pressure belts, winds, ocean currents and distance from sea. Indian monsoon is a seasonal reversal of winds influenced by differential heating, ITCZ shift, Tibetan Plateau, jet streams, ENSO and Indian Ocean Dipole.

### Oceanography
Oceans influence climate through currents, heat storage, moisture supply and carbon cycling. Warm currents generally raise coastal temperature and rainfall potential, while cold currents can create dry coastal deserts. Tides are caused mainly by gravitational pull of the Moon and Sun.

### UPSC Use
For Prelims, maps, processes and definitions are important. For Mains, connect physical geography with disaster management, climate change, water crisis, agriculture, urban floods and environmental degradation. Use diagrams: plate boundary, river basin, cyclone structure, monsoon mechanism and soil profile.`,
    concise_notes: [
      { term: "Physical Geography", definition: "Study of Earth's natural features and processes." },
      { term: "Geomorphology", definition: "Study of landforms and processes shaping them." },
      { term: "Plate Tectonics", definition: "Theory explaining lithospheric plate movement." },
      { term: "Weather", definition: "Short-term atmospheric condition." },
      { term: "Climate", definition: "Long-term average weather pattern." },
      { term: "Monsoon", definition: "Seasonal reversal of winds with rainfall pattern." },
      { term: "Ocean Current", definition: "Large-scale movement of ocean water." },
      { term: "Tide", definition: "Periodic sea-level rise and fall due to gravity." },
      { term: "Earthquake", definition: "Sudden ground shaking from energy release in crust." },
      { term: "Cyclone", definition: "Low-pressure system with spiralling winds." },
    ],
    revision_bullets: [
      "Himalayas are young fold mountains.",
      "Plates move over the asthenosphere.",
      "Weather is short-term.",
      "Climate is long-term average.",
      "Monsoon involves seasonal wind reversal.",
      "ENSO affects Indian rainfall.",
      "Cold currents can create deserts.",
      "Tides depend on Moon and Sun.",
      "Rivers erode, transport and deposit.",
      "Use diagrams in Mains answers.",
    ],
    mindmap: ["Physical Geography", "Landforms", "Climate", "Oceans", "Rivers", "Soils", "Hazards"],
    cases: [
      { name: "IPCC Assessment Reports", point: "Authoritative source for climate science and physical impacts." },
      { name: "Sendai Framework 2015-2030", point: "Links hazards with disaster risk reduction." },
      { name: "National Disaster Management Plan", point: "Uses hazard mapping and risk reduction principles." },
    ],
    schemes: [
      { name: "National Mission for Sustaining Himalayan Ecosystem", point: "NAPCC mission relevant to Himalayan physical systems." },
      { name: "National Cyclone Risk Mitigation Project", point: "Reduces cyclone vulnerability in coastal regions." },
      { name: "Jal Shakti Abhiyan", point: "Water conservation and recharge initiative." },
    ],
    ncert_coverage: [
      "Class 11 Fundamentals of Physical Geography: Interior of the Earth",
      "Class 11 Fundamentals of Physical Geography: Geomorphic Processes",
      "Class 11 Fundamentals of Physical Geography: Climate",
      "Class 11 India Physical Environment: Physiography",
      "Class 11 India Physical Environment: Climate",
    ],
    prelims_traps: [
      "Weather and climate are different.",
      "Fold mountains and block mountains form differently.",
      "Ocean currents are not the same as tides.",
    ],
    mains_angles: [
      "GS Paper I angle: explain monsoon variability and Indian agriculture.",
      "GS Paper I angle: connect plate tectonics with Himalayan hazards.",
      "GS Paper III angle: link physical geography with disaster risk reduction.",
    ],
  },
};

const questionsByKey = Object.fromEntries(
  topics.map((topic) => [topic.key, makeQuestions(topic, notesByKey[topic.key])]),
);

const topicRows = topics.map((topic) => ({
  ...topic,
  wiki_slug: topic.title.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, ""),
  structured_notes: notesByKey[topic.key],
  content_quality: "human_review_needed",
}));

await upsertTopics(topicRows);

const questionRows = Object.values(questionsByKey)
  .flat()
  .map(({ options, correct, ...question }) => question);
const legacyQuestionRows = questionRows.map(({ explanation, source_label, trap_type, related_topic_key, ...question }) => question);
const optionRows = Object.values(questionsByKey)
  .flat()
  .flatMap((question) =>
    question.options.map((option) => ({
      question_id: question.id,
      option_label: option.label,
      option_text: option.text,
      is_correct: option.label === question.correct,
    })),
  );

let enrichedQuestions = true;
try {
  await upsertChunk("questions", questionRows, { onConflict: "id" });
} catch (error) {
  if (!isMissingColumnError(error)) throw error;
  enrichedQuestions = false;
  await upsertChunk("questions", legacyQuestionRows, { onConflict: "id" });
}

await upsertChunk("question_options", optionRows, { onConflict: "question_id,option_label" });

for (const topic of topics) {
  const { data, error } = await supabase.from("topics").select("key,title").eq("key", topic.key).single();
  if (error) throw error;
  console.log(`${topic.key} -> ${data ? "EXISTS: " + data.title : "NOT FOUND"}`);
}

console.log(
  JSON.stringify(
    {
      topicsUpserted: topicRows.length,
      questionsUpserted: questionRows.length,
      optionsUpserted: optionRows.length,
      enrichedQuestions,
    },
    null,
    2,
  ),
);

async function upsertTopics(rows) {
  try {
    const { error } = await supabase.from("topics").upsert(rows, { onConflict: "key" });
    if (error) throw error;
  } catch (error) {
    if (!isMissingColumnError(error)) throw error;
    const fallbackRows = rows.map(({ structured_notes, content_quality, ...row }) => ({
      ...row,
      structured_notes: JSON.stringify(structured_notes),
    }));
    const { error: fallbackError } = await supabase.from("topics").upsert(fallbackRows, { onConflict: "key" });
    if (fallbackError) throw fallbackError;
  }
}

function makeQuestions(topic, notes) {
  const title = topic.title;
  const baseId = `codex_mcq_${topic.key}`;
  const items = [
    {
      stem: `With reference to "${title}", which statement is most accurate?`,
      correct: notes.concise_notes[0].definition,
      wrong: [
        `${title} is only a current-affairs topic and needs no conceptual base.`,
        `${title} is irrelevant for UPSC General Studies preparation.`,
        `${title} should be prepared only through memorised one-line facts.`,
      ],
      explanation: `${title} must be studied through concept, source-backed facts and application. UPSC usually tests whether aspirants can connect the definition with institutions, examples and current relevance.`,
      trap: "Concept clarity",
    },
    {
      stem: `Which source base is most useful for preparing "${title}"?`,
      correct: notes.ncert_coverage.slice(0, 2).join("; "),
      wrong: [
        "Only social media summaries without NCERT or official sources.",
        "Only editorials, while ignoring definitions and basic concepts.",
        "Only answer-writing templates without factual grounding.",
      ],
      explanation: `The listed NCERT chapters build the basic conceptual foundation for ${title}. After NCERT, aspirants should add official sources, PYQs and current examples.`,
      trap: "Source selection",
    },
    {
      stem: `Which Prelims trap should be avoided while studying "${title}"?`,
      correct: notes.prelims_traps[0],
      wrong: [
        "Assume every absolute statement is correct.",
        "Ignore official terminology and rely only on intuition.",
        "Treat all similar terms as interchangeable.",
      ],
      explanation: `UPSC statement questions often use close but incorrect wording. The correct option identifies a real trap that can change the answer even when the topic looks familiar.`,
      trap: "Prelims trap",
    },
    {
      stem: `Which case, report or policy reference is most relevant to "${title}"?`,
      correct: `${notes.cases[0].name}: ${notes.cases[0].point}`,
      wrong: [
        "A random quote without institutional or source relevance.",
        "A newspaper headline with no link to the syllabus.",
        "A coaching mnemonic that replaces official facts.",
      ],
      explanation: `${notes.cases[0].name} gives ${title} a reliable source anchor for UPSC answers. Such references improve both factual accuracy and analytical depth.`,
      trap: "Institutional anchor",
    },
    {
      stem: `For a Mains answer on "${title}", which framework is best?`,
      correct: notes.mains_angles[0],
      wrong: [
        "Write only criticism and avoid any way forward.",
        "List facts without causes, consequences or examples.",
        "Use emotional language instead of balanced analysis.",
      ],
      explanation: `A good Mains answer on ${title} needs definition, context, examples, challenges and a practical conclusion. The correct framework links the topic to the relevant GS paper and answer-writing demand.`,
      trap: "Mains framework",
    },
  ];

  return items.map((item, index) => {
    const correct = ["A", "B", "C", "D"][(hash(topic.key) + index) % 4];
    return {
      id: `${baseId}_${String(index + 1).padStart(2, "0")}`,
      topic_key: topic.key,
      question_text: item.stem,
      question_type: "mcq",
      year: null,
      source: "ClearUPSC Pattern",
      source_label: "ClearUPSC Pattern",
      difficulty: 3,
      model_answer: item.explanation,
      explanation: item.explanation,
      trap_type: item.trap,
      related_topic_key: topic.key,
      tags: [topic.subject, "ClearUPSC Pattern", title],
      correct,
      options: placeCorrect(item.correct, item.wrong, correct),
    };
  });
}

function placeCorrect(correctText, wrong, correctLabel) {
  const labels = ["A", "B", "C", "D"];
  const options = [];
  let wrongIndex = 0;
  for (const label of labels) {
    if (label === correctLabel) {
      options.push({ label, text: correctText });
    } else {
      options.push({ label, text: wrong[wrongIndex] });
      wrongIndex += 1;
    }
  }
  return options;
}

async function upsertChunk(table, rows, options) {
  for (let index = 0; index < rows.length; index += 500) {
    const chunk = rows.slice(index, index + 500);
    const { error } = await supabase.from(table).upsert(chunk, options);
    if (error) throw error;
  }
}

function hash(value) {
  return Array.from(String(value)).reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function isMissingColumnError(error) {
  const message = String(error?.message ?? "");
  return message.includes("schema cache") || message.includes("column") || message.includes("Could not find");
}
