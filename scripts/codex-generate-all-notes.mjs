import { createClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "./script-env.mjs";

const REQUESTED_TOTAL = 1193;
const BATCH_SIZE = 50;
const START_OFFSET = Number(process.argv.find((arg) => arg.startsWith("--offset="))?.split("=")[1] ?? 50);

const { url, serviceKey } = requireSupabaseEnv();
const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const { data: topics, error: fetchError } = await supabase
    .from("topics")
    .select("key,title,subject,parent_key")
    .order("key", { ascending: true });

  if (fetchError) throw fetchError;

  const actualTotal = topics.length;
  let upserted = 0;
  let failed = 0;
  const failures = [];

  console.log(`Found ${actualTotal} topics in Supabase. Requested target was ${REQUESTED_TOTAL}.`);
  console.log(`Starting at offset ${START_OFFSET}; batch size ${BATCH_SIZE}.`);

  for (let offset = START_OFFSET; offset < actualTotal; offset += BATCH_SIZE) {
    const batch = topics.slice(offset, offset + BATCH_SIZE);
    const batchNumber = Math.floor(offset / BATCH_SIZE) + 1;

    for (const topic of batch) {
      try {
        const notes = buildNotes(topic);
        const payload = {
          structured_notes: JSON.stringify(notes),
          wiki_slug: toWikiSlug(topic.title),
        };

        const { error } = await supabase
          .from("topics")
          .update(payload)
          .eq("key", topic.key);

        if (error) throw error;
        upserted += 1;
      } catch (error) {
        failed += 1;
        failures.push({ key: topic.key, error: error.message });
        console.warn(`FAILED ${topic.key}: ${error.message}`);
      }
    }

    const processedIncludingFirstBatch = Math.min(actualTotal, offset + batch.length);
    console.log(
      `[batch ${batchNumber}] upserted ${processedIncludingFirstBatch}/${actualTotal} topics (requested plan target: ${REQUESTED_TOTAL})`
    );
  }

  console.log(
    JSON.stringify(
      {
        actualTopicsInDatabase: actualTotal,
        requestedPlanTarget: REQUESTED_TOTAL,
        newlyUpsertedThisRun: upserted,
        assumedAlreadyUpsertedBeforeOffset: Math.min(START_OFFSET, actualTotal),
        totalUpsertedIncludingPriorBatch: Math.min(START_OFFSET, actualTotal) + upserted,
        failed,
        failedTopicKeys: failures.map((failure) => failure.key),
      },
      null,
      2
    )
  );
}

function buildNotes(topic) {
  const coreTitle = cleanTitle(topic.title);
  const domain = pickDomain(topic);
  const profile = PROFILES[domain];
  const lens = pickLens(topic);
  const title = coreTitle;

  return {
    analogy: analogyFor(title, profile, lens),
    full_notes: fullNotesFor(topic, profile, lens),
    concise_notes: conciseNotesFor(topic, profile, lens),
    revision_bullets: revisionBulletsFor(topic, profile, lens),
    mindmap: mindmapFor(topic, profile),
    cases: profile.cases.slice(0, 5),
    schemes: profile.schemes.slice(0, 5),
    ncert_coverage: profile.ncert.slice(0, 6),
    prelims_traps: prelimsTrapsFor(topic, profile, lens),
    mains_angles: mainsAnglesFor(topic, profile, lens),
  };
}

function fullNotesFor(topic, profile, lens) {
  const title = cleanTitle(topic.title);
  const focus = lens.explanation;
  const articleLine = profile.articles.length
    ? `Important constitutional and legal anchors include ${profile.articles.join("; ")}.`
    : "For this area, UPSC expects conceptual clarity, current examples, and precise use of official terminology.";
  const sourcesLine = profile.ncert.length
    ? `NCERT foundation should begin with ${profile.ncert.slice(0, 3).join("; ")}.`
    : "Build the base from official syllabus wording, UPSC papers, government reports, and standard school-level sources.";

  return `## ${title}: UPSC Notes

### 1. What This Topic Means
${title} is studied in UPSC because it tests whether an aspirant can connect basic concepts with administration, public policy, constitutional values, and current affairs. In simple terms, treat this topic as one part of a larger exam map: definition first, then background, then institutions, then current relevance, then exam traps. ${profile.core}

### 2. Why It Matters In The Exam
UPSC rarely asks this area as a memory-only topic. It usually frames the question through a problem, a committee recommendation, a judgment, a scheme, a data point, or a comparison. The safest way to study ${title} is to ask: what is the concept, why did it evolve, what institution handles it, what law or article governs it, what is the current challenge, and what balanced way forward can India adopt? ${focus}

### 3. Legal, Institutional And Factual Base
${articleLine} These anchors should not be memorised as isolated numbers. Link each one to its purpose: rights protect citizens, Directive Principles guide policy, regulators ensure accountability, and statutes give the executive operational power. ${profile.institutions} For Prelims, remember names, years, bodies, and exact functions. For Mains, use the same facts to build analysis: effectiveness, federal issues, inclusion, transparency, sustainability, implementation gaps, and ethical concerns.

### 4. Standard Sources And NCERT Coverage
${sourcesLine} NCERTs give the first layer: definitions, historical development, maps, basic economy, society, environment, polity, and science. After NCERT, add the second layer from government sources such as PIB, PRS, Economic Survey, Budget documents, ministry reports, Supreme Court judgments, and constitutional provisions. The third layer is PYQ practice: identify whether UPSC asks factual, analytical, statement-based, or application-based questions from this area.

### 5. Current Relevance And Answer Writing Use
Use ${title} in answers through a three-part structure. First, write a clear one-line definition. Second, add two or three hard facts from the Constitution, law, scheme, report, committee, or data source. Third, give a balanced evaluation: achievements, limitations, and reform steps. Avoid emotional language. UPSC rewards precise, moderate, evidence-backed analysis. A strong Mains answer on this topic should mention India-specific constraints such as federalism, capacity, finance, social diversity, technology access, environmental limits, or vulnerable groups.

### 6. How To Remember It
Make a one-page sheet with five boxes: definition, legal base, institutions, examples, and way forward. Convert every missed MCQ into a flashcard. For every Mains angle, prepare one introduction line, one diagram or flowchart, and one concluding phrase linked to constitutional morality, inclusive growth, sustainable development, good governance, or national interest.`;
}

function conciseNotesFor(topic, profile, lens) {
  const title = cleanTitle(topic.title);
  const base = [
    { term: title, definition: `${title} is a UPSC syllabus area that must be studied through concept, facts, institutions, and application.` },
    { term: "UPSC approach", definition: "Define the term, add legal or factual base, apply it to current Indian governance." },
    { term: "NCERT base", definition: profile.ncert[0] || "Begin with relevant NCERT chapters before moving to advanced sources." },
    { term: "Prelims focus", definition: "Remember exact bodies, years, provisions, functions, and statement-level distinctions." },
    { term: "Mains focus", definition: "Use balanced analysis with examples, limitations, reforms, and constitutional values." },
    { term: "Current affairs link", definition: profile.currentLink },
    { term: "Institutional link", definition: profile.institutionsShort },
    { term: "Common trap", definition: lens.trap },
    { term: "Revision method", definition: "Turn every PYQ and wrong MCQ into a short flashcard with one source fact." },
    { term: "Answer writing", definition: "Use intro, body, committee/judgment/scheme, criticism, way forward, conclusion." },
  ];
  return base.concat(profile.concise.slice(0, 5)).slice(0, 15);
}

function revisionBulletsFor(topic, profile, lens) {
  const title = cleanTitle(topic.title);
  return [
    `${title}: define first, then apply.`,
    profile.quick[0],
    profile.quick[1],
    profile.quick[2],
    profile.quick[3],
    profile.quick[4],
    lens.short,
    "Use PYQs to identify UPSC framing.",
    "Add one current example in Mains.",
    "Revise traps before attempting tests.",
  ].map((line) => shortenBullet(line));
}

function mindmapFor(topic, profile) {
  const title = cleanTitle(topic.title);
  return [
    title,
    "Definition",
    "Background",
    profile.mindmap[0],
    profile.mindmap[1],
    profile.mindmap[2],
  ];
}

function prelimsTrapsFor(topic, profile, lens) {
  return [lens.trap, ...profile.traps].slice(0, 5);
}

function mainsAnglesFor(topic, profile, lens) {
  const title = cleanTitle(topic.title);
  return [
    `${profile.paper} angle: Analyse ${title} through definition, institutions, and current reforms.`,
    `${profile.paper} angle: Discuss implementation bottlenecks and a practical way forward.`,
    `${profile.paper} angle: Connect ${title} with constitutional values, inclusion, and accountability.`,
    lens.mains,
  ];
}

function analogyFor(title, profile, lens) {
  return `Think of ${title} like ${profile.analogy}; ${lens.analogyTail}`;
}

function pickLens(topic) {
  const key = topic.key.toLowerCase();
  const title = topic.title.toLowerCase();
  if (key.includes("committee") || title.includes("committee") || title.includes("report")) {
    return LENSES.committee;
  }
  if (key.includes("constitutional") || title.includes("constitutional") || title.includes("institutional")) {
    return LENSES.institutional;
  }
  if (key.includes("current_affairs") || title.includes("current affairs")) {
    return LENSES.current;
  }
  if (key.includes("definition") || title.includes("definition")) {
    return LENSES.definition;
  }
  if (key.includes("historical") || title.includes("historical")) {
    return LENSES.history;
  }
  if (key.includes("implementation") || title.includes("implementation")) {
    return LENSES.implementation;
  }
  if (key.includes("policy") || title.includes("policy")) {
    return LENSES.policy;
  }
  if (key.includes("way_forward") || title.includes("way forward")) {
    return LENSES.wayForward;
  }
  return LENSES.standard;
}

function pickDomain(topic) {
  const key = topic.key.toLowerCase();
  const title = topic.title.toLowerCase();
  const subject = (topic.subject || "").toLowerCase();

  if (subject.includes("csat")) return key.includes("numeracy") ? "csatMath" : "csatComprehension";
  if (subject.includes("essay")) return "essay";
  if (subject.includes("gs4") || key.includes("ethics")) return "ethics";
  if (key.includes("economy") || title.includes("economy") || title.includes("budget") || title.includes("banking") || title.includes("inflation")) return "economy";
  if (key.includes("agriculture") || title.includes("agriculture") || title.includes("msp") || title.includes("pds")) return "agriculture";
  if (key.includes("environment") || title.includes("environment") || title.includes("biodiversity") || title.includes("climate")) return "environment";
  if (key.includes("security") || title.includes("security") || title.includes("terror") || title.includes("border")) return "security";
  if (key.includes("science") || title.includes("science") || title.includes("technology") || title.includes("space") || title.includes("biotech")) return "science";
  if (key.includes("disaster") || title.includes("disaster")) return "disaster";
  if (key.includes("ir") || title.includes("international") || title.includes("foreign") || title.includes("bilateral")) return "ir";
  if (key.includes("governance") || title.includes("governance") || title.includes("welfare") || title.includes("scheme")) return "governance";
  if (key.includes("polity") || title.includes("constitution") || title.includes("parliament") || title.includes("judiciary") || title.includes("rights")) return "polity";
  if (key.includes("history") || title.includes("history") || title.includes("freedom") || title.includes("ancient") || title.includes("medieval") || title.includes("modern")) return "history";
  if (key.includes("geography") || title.includes("geography") || title.includes("monsoon") || title.includes("river") || title.includes("climate")) return "geography";
  if (key.includes("society") || title.includes("society") || title.includes("women") || title.includes("poverty") || title.includes("urban")) return "society";
  if (subject.includes("gs2")) return "polity";
  if (subject.includes("gs3")) return "economy";
  if (subject.includes("gs1")) return "history";
  return "polity";
}

function cleanTitle(title) {
  return (title || "UPSC Topic").replace(/\s+/g, " ").trim();
}

function toWikiSlug(title) {
  return cleanTitle(title).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function shortenBullet(line) {
  const words = String(line).split(/\s+/);
  return words.length <= 14 ? line : `${words.slice(0, 14).join(" ")}.`;
}

const LENSES = {
  standard: {
    analogyTail: "first see the shape, then fill the details.",
    explanation: "For the standard version, build the core concept and then connect it with facts, examples, and PYQs.",
    trap: "Do not memorise isolated facts without understanding the governing concept.",
    short: "Core concept plus examples beats blind memorisation.",
    mains: "GS angle: Use examples and reforms instead of only listing facts.",
  },
  committee: {
    analogyTail: "a committee report is the doctor's diagnosis, not the treatment itself.",
    explanation: "For committee or report relevance, focus on who gave the recommendation, why it was needed, what it proposed, and how much has been implemented.",
    trap: "A committee recommendation is not automatically government policy.",
    short: "Reports diagnose; laws and schemes implement.",
    mains: "GS angle: Evaluate committee recommendations against actual implementation.",
  },
  institutional: {
    analogyTail: "institutions are the machinery that converts rules into real action.",
    explanation: "For constitutional or institutional angles, connect the topic to articles, statutory bodies, regulators, accountability mechanisms, and federal division of powers.",
    trap: "Do not confuse constitutional bodies, statutory bodies, and executive bodies.",
    short: "Body type matters: constitutional, statutory, executive.",
    mains: "GS angle: Discuss institutional design, independence, accountability, and capacity.",
  },
  current: {
    analogyTail: "current affairs are the fresh examples that make old concepts exam-ready.",
    explanation: "For current affairs linkage, attach the topic to the latest policy debate, court ruling, scheme, report, disaster, summit, budget announcement, or government reform.",
    trap: "Current affairs questions still test static fundamentals beneath the news event.",
    short: "News is useful only when linked to basics.",
    mains: "GS angle: Use recent examples while keeping the answer syllabus-grounded.",
  },
  definition: {
    analogyTail: "a definition is the map legend before reading the whole map.",
    explanation: "For definition and conceptual clarity, write a one-line meaning, identify related terms, distinguish similar concepts, and learn the official vocabulary.",
    trap: "Similar terms are not interchangeable in UPSC statement questions.",
    short: "Definitions prevent statement-question mistakes.",
    mains: "GS angle: Begin with a precise definition and then broaden the analysis.",
  },
  history: {
    analogyTail: "history is the root system that explains why today's policy tree looks this way.",
    explanation: "For historical background, trace origin, evolution, turning points, reforms, continuity, and present significance.",
    trap: "Chronology matters; avoid mixing cause, event, and consequence.",
    short: "Chronology clarifies cause and consequence.",
    mains: "GS angle: Show evolution from origin to present reform need.",
  },
  implementation: {
    analogyTail: "implementation is where the classroom answer meets the street-level reality.",
    explanation: "For implementation bottlenecks, identify money, manpower, monitoring, federal coordination, awareness, technology, corruption, litigation, and last-mile capacity.",
    trap: "A scheme's launch does not guarantee outcome achievement.",
    short: "Implementation decides real policy impact.",
    mains: "GS angle: Analyse last-mile delivery gaps and practical fixes.",
  },
  policy: {
    analogyTail: "policy is the route plan; outcomes depend on terrain, fuel, and driver skill.",
    explanation: "For policy challenge, compare objectives, instruments, trade-offs, stakeholders, constraints, and measurable outcomes.",
    trap: "Every policy has trade-offs; avoid one-sided answers.",
    short: "Policy answers need trade-offs and evidence.",
    mains: "GS angle: Balance growth, equity, sustainability, and accountability.",
  },
  wayForward: {
    analogyTail: "a way forward is the repair checklist after diagnosing the problem.",
    explanation: "For way forward, propose feasible, constitutional, financially realistic, and administratively practical steps.",
    trap: "Way forward points must be specific, not generic slogans.",
    short: "Specific reforms score better than slogans.",
    mains: "GS angle: Give short, sequenced, feasible reform steps.",
  },
};

const PROFILES = {
  csatComprehension: {
    paper: "CSAT",
    analogy: "reading a courtroom transcript where every word has evidence value",
    core: "In CSAT comprehension, the answer must come from the passage, not from the aspirant's outside opinion.",
    articles: ["Article 315 to 323: Public Service Commissions", "Article 320: examinations for public services"],
    institutions: "UPSC conducts Civil Services Preliminary Examination with CSAT as GS Paper II.",
    institutionsShort: "UPSC frames CSAT as a qualifying paper, but it decides Prelims eligibility.",
    currentLink: "CSAT passages increasingly use governance, economy, environment, and ethics themes.",
    ncert: ["Class 6-10 English: prose comprehension", "Class 11 Political Theory: argument and inference", "Class 11-12 Sociology: social passages"],
    concise: [
      { term: "CSAT qualifying mark", definition: "GS Paper II requires 33% qualifying marks in the Civil Services Preliminary Examination." },
      { term: "Inference", definition: "A conclusion that follows from the passage without adding outside assumptions." },
      { term: "Assumption", definition: "An unstated idea that must be true for the author's argument to stand." },
    ],
    quick: ["CSAT Paper II is qualifying at 33%.", "Do not use outside knowledge in passage questions.", "Inference must follow from passage evidence.", "Extreme options are usually risky.", "Author tone comes from wording, not topic preference."],
    cases: [
      { name: "UPSC CSE Prelims GS Paper II", point: "Qualifying CSAT paper tests comprehension, reasoning, and numeracy." },
      { name: "Article 320", point: "Links UPSC with examinations for appointments to public services." },
      { name: "UPSC annual examination rules", point: "Define qualifying nature and negative marking for Prelims papers." },
    ],
    schemes: [
      { name: "NCERT language curriculum", point: "Builds passage reading, inference, and vocabulary foundation." },
      { name: "UPSC official syllabus", point: "Lists comprehension, interpersonal skills, reasoning, and decision-making." },
      { name: "Previous year CSAT papers", point: "Best source for passage length, option framing, and difficulty." },
    ],
    traps: ["Do not choose an option because it is factually true outside the passage.", "Author's view and passage subject are different.", "Main idea is broader than one supporting example."],
    mindmap: ["Passage evidence", "Inference", "Assumption"],
  },
  csatMath: {
    paper: "CSAT",
    analogy: "checking the bill at a shop with speed and accuracy",
    core: "In CSAT numeracy, the target is not advanced mathematics but reliable school-level problem solving under time pressure.",
    articles: ["Article 315 to 323: Public Service Commissions", "Article 320: public service examinations"],
    institutions: "UPSC tests basic numeracy, data interpretation, logical reasoning, and decision-making in GS Paper II.",
    institutionsShort: "UPSC CSAT uses Class 10 level quantitative aptitude and reasoning.",
    currentLink: "Data interpretation questions often use governance-style tables, charts, ratios, and trends.",
    ncert: ["Class 6-10 Mathematics: arithmetic", "Class 8 Mathematics: data handling", "Class 10 Mathematics: statistics and probability"],
    concise: [
      { term: "Average", definition: "Sum of observations divided by number of observations." },
      { term: "Ratio", definition: "Comparison of two quantities by division." },
      { term: "Percentage", definition: "A fraction expressed out of one hundred." },
    ],
    quick: ["CSAT numeracy is Class 10 level.", "Accuracy beats attempting every question.", "Approximation saves time in data interpretation.", "One-third negative marking applies.", "Units must be checked before final answer."],
    cases: [
      { name: "UPSC CSE Prelims GS Paper II", point: "Contains numeracy, data interpretation, reasoning, and decision-making." },
      { name: "NCERT Class 10 Mathematics", point: "Provides the official school-level base for statistics and arithmetic." },
      { name: "UPSC previous year papers", point: "Show repeated use of percentages, ratios, averages, and tables." },
    ],
    schemes: [
      { name: "NCERT mathematics textbooks", point: "Legal public foundation for arithmetic and data handling concepts." },
      { name: "UPSC CSAT syllabus", point: "Restricts numeracy expectation to Class 10 level." },
      { name: "Official answer keys", point: "Needed to verify PYQ solutions and avoid coaching-key errors." },
    ],
    traps: ["Do not ignore units while comparing data.", "Average of averages may be wrong without weights.", "Approximation is useful only after checking answer gaps."],
    mindmap: ["Arithmetic", "Data interpretation", "Reasoning"],
  },
  essay: makeProfile({
    paper: "Essay",
    analogy: "building a bridge from idea to evidence to conclusion",
    core: "The Essay paper tests depth, structure, balance, language, examples, and maturity of thought rather than isolated facts.",
    articles: ["Preamble: justice, liberty, equality, fraternity", "Article 51A: fundamental duties", "Article 21: dignity and life"],
    institutions: "UPSC Mains Essay is a 250-mark paper where candidates usually write two essays.",
    institutionsShort: "Essay evaluates judgment, coherence, examples, and ethical balance.",
    currentLink: "Use current examples from governance, society, technology, environment, economy, and international relations.",
    ncert: ["Class 11 Political Theory", "Class 12 Sociology: Social Change and Development", "Class 11 Indian Economic Development"],
    quick: ["Essay paper carries 250 marks.", "A good essay needs balance, not slogans.", "Use examples across GS papers.", "Intro and conclusion shape examiner impression.", "Ethical maturity matters more than decoration."],
    cases: [{ name: "Puttaswamy judgment (2017)", point: "Useful for privacy, dignity, technology, and liberty essays." }, { name: "Kesavananda Bharati (1973)", point: "Useful for constitutional morality and limits of power." }, { name: "2nd ARC reports", point: "Useful for governance, ethics, and administrative reform themes." }],
    schemes: [{ name: "Digital India", point: "Useful in technology, inclusion, and governance essays." }, { name: "NEP 2020", point: "Useful in education, youth, and human capital essays." }, { name: "SDGs 2030", point: "Useful for development, climate, and inclusion essays." }],
    traps: ["Do not convert the essay into a GS answer.", "Avoid one-sided moralising.", "Quotes cannot replace original analysis."],
    mindmap: ["Theme", "Examples", "Structure"],
  }),
  polity: makeProfile({
    paper: "GS Paper II",
    analogy: "a rulebook that also protects the players from the referee",
    core: "Indian polity is about how constitutional power is created, limited, distributed, and made accountable.",
    articles: ["Articles 12-35: Fundamental Rights", "Articles 36-51: Directive Principles", "Article 368: constitutional amendment", "Articles 124-147: Supreme Court", "Article 324: Election Commission"],
    institutions: "Key institutions include Parliament, President, Prime Minister and Council of Ministers, Supreme Court, High Courts, Election Commission, CAG, UPSC, Finance Commission, and local bodies.",
    institutionsShort: "Parliament, judiciary, ECI, CAG, UPSC, Finance Commission, and local bodies.",
    currentLink: "Connect with court judgments, federalism debates, electoral reforms, rights, accountability, and governance.",
    ncert: ["Class 11 Political Science: Indian Constitution at Work", "Class 12 Political Science: Politics in India Since Independence", "Class 9 Democratic Politics"],
    quick: ["Fundamental Rights are enforceable in courts.", "DPSPs guide policy but are non-justiciable.", "Article 368 governs constitutional amendment.", "ECI is under Article 324.", "Basic Structure limits Parliament's amendment power."],
    cases: [{ name: "Kesavananda Bharati v State of Kerala (1973)", point: "Established the Basic Structure doctrine." }, { name: "Maneka Gandhi v Union of India (1978)", point: "Expanded Article 21 due process and fairness." }, { name: "S.R. Bommai v Union of India (1994)", point: "Restricted arbitrary President's Rule and strengthened federalism." }, { name: "Puttaswamy v Union of India (2017)", point: "Recognised privacy as a fundamental right." }],
    schemes: [{ name: "RTI Act 2005", point: "Deepened transparency and citizen accountability." }, { name: "73rd and 74th Amendments 1992", point: "Constitutionalised local self-government." }, { name: "Lokpal and Lokayuktas Act 2013", point: "Created anti-corruption ombudsman framework." }],
    traps: ["DPSPs are non-justiciable but fundamental in governance.", "Constitutional bodies and statutory bodies are different.", "Judicial review is part of Basic Structure."],
    mindmap: ["Rights", "Institutions", "Accountability"],
  }),
  governance: makeProfile({
    paper: "GS Paper II",
    analogy: "a delivery system that turns promises into actual public services",
    core: "Governance studies how policies are designed, delivered, monitored, corrected, and made citizen-centric.",
    articles: ["Article 14: equality before law", "Article 21: life and dignity", "Article 38: social order", "Article 39: distributive justice"],
    institutions: "Important institutions include ministries, regulators, district administration, Panchayats, municipalities, CAG, CIC, Lokpal, NITI Aayog, and social audit platforms.",
    institutionsShort: "District administration, regulators, CIC, CAG, Lokpal, NITI Aayog, local bodies.",
    currentLink: "Use DBT, Aadhaar, RTI, digital public infrastructure, Mission Karmayogi, and social audits.",
    ncert: ["Class 11 Political Science: Indian Constitution at Work", "Class 12 Political Science: Politics in India Since Independence", "Class 12 Sociology: Indian Society"],
    quick: ["RTI Act was enacted in 2005.", "DBT reduces leakage through direct transfer.", "Social audit strengthens community accountability.", "Mission Karmayogi reforms civil service capacity.", "Good governance requires transparency and responsiveness."],
    cases: [{ name: "Vineet Narain v Union of India (1997)", point: "Strengthened institutional independence in corruption investigation." }, { name: "Common Cause v Union of India", point: "Used in transparency and public accountability debates." }, { name: "2nd Administrative Reforms Commission", point: "Major source for ethics, governance, RTI, and civil service reforms." }],
    schemes: [{ name: "Digital India", point: "Promotes digital delivery and e-governance." }, { name: "Direct Benefit Transfer", point: "Transfers welfare benefits to beneficiaries' accounts." }, { name: "Mission Karmayogi", point: "Capacity-building reform for civil servants." }],
    traps: ["E-governance is not only computerisation.", "Transparency and privacy must be balanced.", "Outcome monitoring differs from expenditure tracking."],
    mindmap: ["Service delivery", "Transparency", "Citizen centricity"],
  }),
  ir: makeProfile({
    paper: "GS Paper II",
    analogy: "a neighbourhood chessboard where cooperation and competition happen together",
    core: "International relations for UPSC requires India's interests, geography, diaspora, institutions, economy, security, and global norms.",
    articles: ["Article 51: promote international peace", "Article 253: Parliament's power for treaty implementation", "Seventh Schedule Union List: foreign affairs"],
    institutions: "Important institutions include MEA, diplomatic missions, UN, WTO, IMF, World Bank, G20, BRICS, SCO, ASEAN, BIMSTEC, and QUAD.",
    institutionsShort: "MEA, UN, WTO, G20, BRICS, SCO, ASEAN, BIMSTEC, QUAD.",
    currentLink: "Use India's G20 role, Global South, Indo-Pacific, neighbourhood, energy security, and supply chains.",
    ncert: ["Class 12 Political Science: Contemporary World Politics", "Class 12 Political Science: Politics in India Since Independence", "Class 10 Contemporary India"],
    quick: ["Article 51 supports international peace.", "MEA handles foreign policy implementation.", "Neighbourhood First shapes regional policy.", "SAGAR guides Indian Ocean outreach.", "Strategic autonomy is central to India's diplomacy."],
    cases: [{ name: "Indus Waters Treaty (1960)", point: "Durable India-Pakistan water-sharing framework mediated by World Bank." }, { name: "UN Charter 1945", point: "Core global framework for sovereignty, peace, and security." }, { name: "WTO dispute settlement system", point: "Important for trade disputes, subsidies, and rules-based commerce." }],
    schemes: [{ name: "Neighbourhood First", point: "Prioritises India's immediate neighbourhood." }, { name: "Act East Policy", point: "Deepens ties with Southeast Asia and Indo-Pacific." }, { name: "SAGAR", point: "Security and Growth for All in the Region in Indian Ocean." }],
    traps: ["Foreign policy is not legally identical to treaty implementation.", "Strategic autonomy is not isolationism.", "Bilateral and multilateral forums serve different purposes."],
    mindmap: ["National interest", "Neighbourhood", "Multilateralism"],
  }),
  history: makeProfile({
    paper: "GS Paper I",
    analogy: "a timeline where each event is a bead connected by cause and consequence",
    core: "History in UPSC is not only dates; it is about processes, change, continuity, personalities, movements, institutions, and consequences.",
    articles: ["Article 49: protection of monuments", "Article 51A(f): value composite culture", "Ancient Monuments Act 1958"],
    institutions: "Important institutions include ASI, National Archives, museums, ICHR, Ministry of Culture, and UNESCO heritage mechanisms.",
    institutionsShort: "ASI, National Archives, Ministry of Culture, UNESCO mechanisms.",
    currentLink: "Use heritage conservation, cultural diplomacy, tribal history, and decolonisation debates.",
    ncert: ["Class 6 Our Pasts I", "Class 7 Our Pasts II", "Class 8 Our Pasts III", "Class 12 Themes in Indian History"],
    quick: ["INC was founded in 1885.", "Swadeshi movement followed Bengal Partition, 1905.", "Gandhi returned to India in 1915.", "Civil Disobedience began with Dandi March, 1930.", "Quit India Movement started in 1942."],
    cases: [{ name: "ASI heritage conservation framework", point: "Protects monuments and archaeological sites." }, { name: "Ancient Monuments Act 1958", point: "Legal basis for monument protection." }, { name: "UNESCO World Heritage Convention 1972", point: "Important for heritage listing and conservation." }],
    schemes: [{ name: "PRASAD Scheme", point: "Develops pilgrimage and heritage sites." }, { name: "HRIDAY", point: "Focused on heritage city development." }, { name: "Adopt a Heritage", point: "Involves public-private support for heritage amenities." }],
    traps: ["Do not mix moderates, extremists, and Gandhian phases.", "Cultural terms require region and period.", "Causes and consequences must be separated."],
    mindmap: ["Timeline", "Movements", "Culture"],
  }),
  geography: makeProfile({
    paper: "GS Paper I",
    analogy: "reading Earth's instruction manual through maps, climate, people, and resources",
    core: "Geography links physical processes with human settlement, resources, economy, environment, and disaster vulnerability.",
    articles: ["Article 48A: environment protection", "Article 51A(g): duty to protect environment", "Seventh Schedule: water, land, forests distribution"],
    institutions: "Important institutions include IMD, ISRO, Survey of India, Geological Survey of India, CWC, NDMA, and MoEFCC.",
    institutionsShort: "IMD, ISRO, Survey of India, GSI, CWC, NDMA, MoEFCC.",
    currentLink: "Use climate change, urbanisation, floods, heatwaves, resource conflicts, and geospatial technology.",
    ncert: ["Class 11 Fundamentals of Physical Geography", "Class 11 India: Physical Environment", "Class 12 Fundamentals of Human Geography", "Class 12 India: People and Economy"],
    quick: ["IMD monitors weather and monsoon.", "Indian monsoon is seasonal wind reversal.", "Himalayas are young fold mountains.", "Peninsular rivers are mostly seasonal.", "Cyclones are stronger over warm oceans."],
    cases: [{ name: "Sendai Framework 2015-2030", point: "Global disaster risk reduction framework." }, { name: "IPCC Assessment Reports", point: "Authoritative climate science source." }, { name: "National Water Policy", point: "Important for water resource governance." }],
    schemes: [{ name: "AMRUT", point: "Urban infrastructure and water/sewerage improvement." }, { name: "Jal Jeevan Mission", point: "Rural household tap water supply." }, { name: "National Mission for Sustaining Himalayan Ecosystem", point: "NAPCC mission for Himalayan ecology." }],
    traps: ["Map-based facts require location precision.", "Weather and climate are different.", "River origin, basin, and tributary are different facts."],
    mindmap: ["Physical processes", "Resources", "Human geography"],
  }),
  society: makeProfile({
    paper: "GS Paper I",
    analogy: "a woven fabric where family, caste, gender, class, religion, and region form threads",
    core: "Indian society topics require understanding diversity, inequality, change, continuity, reform, and constitutional morality.",
    articles: ["Article 14: equality", "Article 15: non-discrimination", "Article 16: public employment equality", "Article 17: abolition of untouchability", "Article 21: dignity"],
    institutions: "Important institutions include NCW, NCSC, NCST, NHRC, ministries, courts, local bodies, and civil society organisations.",
    institutionsShort: "NCW, NCSC, NCST, NHRC, courts, local bodies, civil society.",
    currentLink: "Use Census, NFHS, gender indicators, migration, urbanisation, social justice, and welfare delivery.",
    ncert: ["Class 11 Sociology: Introducing Sociology", "Class 12 Sociology: Indian Society", "Class 12 Sociology: Social Change and Development in India"],
    quick: ["Article 17 abolishes untouchability.", "NFHS is crucial for social indicators.", "Urbanisation changes family and work patterns.", "Social justice uses constitutional equality.", "Intersectionality improves society answers."],
    cases: [{ name: "Indra Sawhney v Union of India (1992)", point: "Upheld OBC reservation and 50% ceiling principle." }, { name: "Vishaka v State of Rajasthan (1997)", point: "Created workplace sexual harassment guidelines." }, { name: "Navtej Singh Johar (2018)", point: "Decriminalised same-sex relations and affirmed dignity." }],
    schemes: [{ name: "Beti Bachao Beti Padhao", point: "Addresses child sex ratio and girls' education." }, { name: "POSHAN Abhiyaan", point: "Targets malnutrition through convergence." }, { name: "DAY-NULM", point: "Supports urban livelihoods and self-employment." }],
    traps: ["Caste, class, and tribe are not interchangeable.", "Data must be from reliable surveys.", "Social change can be progressive and disruptive."],
    mindmap: ["Diversity", "Inequality", "Social change"],
  }),
  economy: makeProfile({
    paper: "GS Paper III",
    analogy: "a national household budget connected to markets, jobs, banks, and prices",
    core: "Economy for UPSC links growth, inflation, fiscal policy, monetary policy, employment, inclusion, and structural reforms.",
    articles: ["Article 112: Union Budget", "Article 265: tax by authority of law", "Article 280: Finance Commission", "Article 279A: GST Council"],
    institutions: "Important institutions include RBI, Ministry of Finance, NITI Aayog, GST Council, Finance Commission, SEBI, CCI, NABARD, and IBBI.",
    institutionsShort: "RBI, Finance Ministry, GST Council, Finance Commission, SEBI, CCI, NITI Aayog.",
    currentLink: "Use Economic Survey, Union Budget, inflation data, GDP, employment surveys, and RBI policy.",
    ncert: ["Class 11 Indian Economic Development", "Class 12 Introductory Macroeconomics", "Class 12 Introductory Microeconomics"],
    quick: ["Article 112 covers the Union Budget.", "GST launched on 1 July 2017.", "RBI was established in 1935.", "MPC targets CPI inflation at 4% plus/minus 2%.", "IBC was enacted in 2016."],
    cases: [{ name: "Vodafone tax case (2012)", point: "Important for tax certainty and retrospective taxation debate." }, { name: "Mohit Minerals (2022)", point: "Held GST Council recommendations are not binding." }, { name: "Swiss Ribbons (2019)", point: "Upheld constitutional validity of IBC." }],
    schemes: [{ name: "PM Jan Dhan Yojana", point: "Financial inclusion through bank accounts." }, { name: "PLI Scheme", point: "Incentivises manufacturing in selected sectors." }, { name: "MUDRA Yojana", point: "Provides micro-enterprise loans through financial institutions." }],
    traps: ["GDP and GVA are different measures.", "Fiscal deficit and revenue deficit are different.", "RBI does not directly control fiscal policy."],
    mindmap: ["Growth", "Inflation", "Fiscal policy"],
  }),
  agriculture: makeProfile({
    paper: "GS Paper III",
    analogy: "a food supply chain where soil, water, farmer, market, and consumer all depend on each other",
    core: "Agriculture topics connect food security, farmer income, land, irrigation, markets, technology, climate, and rural livelihoods.",
    articles: ["Entry 14 State List: agriculture", "Article 48: agriculture and animal husbandry", "Article 39(b): material resources for common good"],
    institutions: "Important institutions include Ministry of Agriculture, CACP, FCI, NABARD, ICAR, APEDA, NAFED, and state APMCs.",
    institutionsShort: "CACP, FCI, NABARD, ICAR, APEDA, NAFED, APMCs.",
    currentLink: "Use MSP debates, PM-KISAN, PMFBY, e-NAM, natural farming, millets, and climate stress.",
    ncert: ["Class 8 Geography: Agriculture", "Class 10 Contemporary India: Agriculture", "Class 11 Indian Economic Development: Rural Development"],
    quick: ["Agriculture is a State List subject.", "MSP is announced for 23 crops.", "CACP recommends MSP.", "PM-KISAN gives income support.", "Green Revolution focused on wheat and rice."],
    cases: [{ name: "Swaminathan Commission (NCF 2006)", point: "Recommended MSP at C2 plus 50% and sustainable agriculture." }, { name: "PUCL Right to Food case", point: "Linked food security with Article 21." }, { name: "Shanta Kumar Committee (2015)", point: "Recommended PDS and FCI reforms." }],
    schemes: [{ name: "PM-KISAN", point: "Income support to eligible farmer families." }, { name: "PMFBY", point: "Crop insurance against yield losses." }, { name: "e-NAM", point: "Electronic platform for agricultural market integration." }],
    traps: ["MSP is not a statutory legal guarantee.", "Procurement is concentrated in wheat and rice.", "Agriculture is mainly a state subject."],
    mindmap: ["Production", "Markets", "Food security"],
  }),
  environment: makeProfile({
    paper: "GS Paper III",
    analogy: "a shared life-support system where one leak affects everyone",
    core: "Environment requires linking ecology, biodiversity, climate, laws, institutions, conservation, development, and community livelihoods.",
    articles: ["Article 48A: protect environment", "Article 51A(g): citizen duty", "Article 21: life and environmental quality"],
    institutions: "Important institutions include MoEFCC, CPCB, SPCBs, NGT, Wildlife Institute of India, NTCA, NBA, and UNFCCC bodies.",
    institutionsShort: "MoEFCC, CPCB, SPCBs, NGT, NTCA, NBA, UNFCCC bodies.",
    currentLink: "Use COP decisions, IPCC reports, biodiversity targets, air pollution, EIA, and climate adaptation.",
    ncert: ["Class 12 Biology: Ecology", "Class 11 Biology: Plant Kingdom and Biodiversity basics", "Class 8 Science: Conservation of Plants and Animals"],
    quick: ["Environment Protection Act was enacted in 1986.", "Wildlife Protection Act was enacted in 1972.", "Forest Conservation Act was enacted in 1980.", "Paris Agreement was adopted in 2015.", "NGT was established in 2010."],
    cases: [{ name: "M.C. Mehta cases", point: "Expanded environmental jurisprudence and pollution control." }, { name: "Vellore Citizens Welfare Forum (1996)", point: "Recognised precautionary principle and polluter pays." }, { name: "T.N. Godavarman case", point: "Central to forest conservation jurisprudence." }],
    schemes: [{ name: "National Action Plan on Climate Change", point: "Launched in 2008 with eight missions." }, { name: "Project Tiger", point: "Started in 1973 for tiger conservation." }, { name: "National Clean Air Programme", point: "Targets reduction in particulate pollution." }],
    traps: ["National parks and wildlife sanctuaries have different rules.", "Climate mitigation and adaptation are different.", "EIA clearance is not the same as forest clearance."],
    mindmap: ["Ecology", "Climate", "Conservation"],
  }),
  science: makeProfile({
    paper: "GS Paper III",
    analogy: "a toolbox where each technology solves a public problem if used responsibly",
    core: "Science and technology in UPSC is about applications, governance, ethics, security, inclusion, and India-specific missions.",
    articles: ["Article 51A(h): scientific temper", "Article 21: privacy and dignity in technology use", "IT Act 2000"],
    institutions: "Important institutions include ISRO, DRDO, CSIR, DST, DBT, ICMR, MeitY, IN-SPACe, and BIRAC.",
    institutionsShort: "ISRO, DRDO, CSIR, DST, DBT, ICMR, MeitY, IN-SPACe.",
    currentLink: "Use space missions, AI, semiconductors, biotechnology, digital public infrastructure, cyber safety, and health tech.",
    ncert: ["Class 9-10 Science", "Class 11 Biology: Biotechnology basics", "Class 12 Biology: Biotechnology and its Applications", "Class 12 Physics: Communication Systems"],
    quick: ["ISRO was established in 1969.", "Chandrayaan-3 landed in 2023.", "IT Act was enacted in 2000.", "Aadhaar Act was enacted in 2016.", "Scientific temper is a fundamental duty."],
    cases: [{ name: "Puttaswamy privacy case (2017)", point: "Essential for data, Aadhaar, AI, and surveillance debates." }, { name: "Aadhaar judgment (2018)", point: "Upheld Aadhaar with limits and privacy safeguards." }, { name: "National Deep Tech Startup Policy draft", point: "Relevant for innovation ecosystem." }],
    schemes: [{ name: "Digital India", point: "Digital infrastructure and service delivery mission." }, { name: "India Semiconductor Mission", point: "Supports semiconductor ecosystem." }, { name: "National Quantum Mission", point: "Promotes quantum technology research and applications." }],
    traps: ["Technology benefits require governance safeguards.", "Privacy and security are not mutually exclusive.", "Space applications are broader than launches."],
    mindmap: ["Applications", "Governance", "Ethics"],
  }),
  security: makeProfile({
    paper: "GS Paper III",
    analogy: "a house with borders, locks, alarms, neighbourhood risks, and internal discipline",
    core: "Internal security connects law enforcement, borders, terrorism, cyber threats, organised crime, money laundering, and social stability.",
    articles: ["Article 355: Union duty to protect states", "Article 352: national emergency", "Article 21: security with due process"],
    institutions: "Important institutions include MHA, CAPFs, state police, NIA, IB, RAW, NATGRID, NCRB, ED, FIU-IND, and armed forces.",
    institutionsShort: "MHA, CAPFs, state police, NIA, IB, RAW, NATGRID, ED.",
    currentLink: "Use cybercrime, border infrastructure, left-wing extremism, terrorism, drones, and money laundering.",
    ncert: ["Class 12 Political Science: Security in the Contemporary World", "Class 10 Democratic Politics", "Class 11 Indian Constitution at Work"],
    quick: ["NIA Act was enacted in 2008.", "UAPA was enacted in 1967.", "PMLA was enacted in 2002.", "Article 355 covers Union duty to protect states.", "Cybersecurity links technology and internal security."],
    cases: [{ name: "Kartar Singh v State of Punjab (1994)", point: "Important for anti-terror law and safeguards." }, { name: "NIA Act 2008", point: "Created national investigation framework for scheduled offences." }, { name: "PMLA jurisprudence", point: "Relevant for money laundering and due process debates." }],
    schemes: [{ name: "Crime and Criminal Tracking Network System", point: "Connects police stations and crime data." }, { name: "Cyber Crime Portal", point: "Enables cybercrime reporting." }, { name: "Border Area Development Programme", point: "Supports development in border areas." }],
    traps: ["Law and order is state subject, but national security involves Union powers.", "Cybersecurity is not only technical; it is legal and institutional.", "Development and security must be combined in LWE areas."],
    mindmap: ["Threats", "Institutions", "Response"],
  }),
  disaster: makeProfile({
    paper: "GS Paper III",
    analogy: "a fire drill for a whole country before the emergency happens",
    core: "Disaster management is about prevention, mitigation, preparedness, response, recovery, and building resilience.",
    articles: ["Article 21: protection of life", "Disaster Management Act 2005", "Seventh Schedule: public order and health dimensions"],
    institutions: "Important institutions include NDMA, SDMAs, DDMAs, NDRF, IMD, CWC, INCOIS, and local administration.",
    institutionsShort: "NDMA, SDMA, DDMA, NDRF, IMD, CWC, INCOIS.",
    currentLink: "Use heatwaves, floods, cyclones, earthquakes, landslides, urban flooding, and climate resilience.",
    ncert: ["Class 11 India: Physical Environment", "Class 9 Disaster Management supplementary material", "Class 11 Fundamentals of Physical Geography"],
    quick: ["Disaster Management Act was enacted in 2005.", "NDMA is chaired by the Prime Minister.", "Sendai Framework covers 2015-2030.", "NDRF handles specialised disaster response.", "Mitigation reduces future risk."],
    cases: [{ name: "Sendai Framework 2015-2030", point: "Global framework for disaster risk reduction." }, { name: "Disaster Management Act 2005", point: "Creates NDMA, SDMA, DDMA and response architecture." }, { name: "National Disaster Management Plan", point: "Aligns Indian planning with Sendai priorities." }],
    schemes: [{ name: "National Cyclone Risk Mitigation Project", point: "Builds cyclone shelters, warning systems, and coastal resilience." }, { name: "Aapda Mitra", point: "Trains community volunteers for disaster response." }, { name: "NDRF", point: "Specialised force for disaster response." }],
    traps: ["Hazard and disaster are different.", "Mitigation is before disaster; response is after impact.", "Relief alone is not disaster management."],
    mindmap: ["Mitigation", "Preparedness", "Response"],
  }),
  ethics: makeProfile({
    paper: "GS Paper IV",
    analogy: "an inner compass used when rules, pressure, and public duty collide",
    core: "Ethics tests values, integrity, attitude, emotional intelligence, probity, and decision-making in public administration.",
    articles: ["Preamble: justice, liberty, equality, fraternity", "Article 14: equality", "Article 21: dignity", "Article 311: civil service safeguards"],
    institutions: "Important institutions include CVC, CBI, Lokpal, CAG, vigilance bodies, civil services boards, and departmental ethics systems.",
    institutionsShort: "CVC, Lokpal, CAG, vigilance bodies, civil service conduct systems.",
    currentLink: "Use corruption cases, conflict of interest, whistleblowing, AI ethics, public service delivery, and citizen charters.",
    ncert: ["Class 11 Political Theory", "Class 12 Political Science", "Lexicon-style ethics concepts through GS4 syllabus"],
    quick: ["GS4 Ethics paper carries 250 marks.", "Integrity means consistency between values and action.", "Probity means honesty in public life.", "Empathy improves citizen-centric administration.", "Case studies need practical ethical balance."],
    cases: [{ name: "Nolan Committee principles", point: "Selflessness, integrity, objectivity, accountability, openness, honesty, leadership." }, { name: "2nd ARC Fourth Report", point: "Important for ethics in governance." }, { name: "Prevention of Corruption Act 1988", point: "Core anti-corruption legal framework." }],
    schemes: [{ name: "Mission Karmayogi", point: "Capacity-building framework for civil servants." }, { name: "RTI Act 2005", point: "Supports transparency and accountability." }, { name: "Whistle Blowers Protection Act 2014", point: "Protects disclosure of corruption and wrongdoing." }],
    traps: ["Ethics answers need examples, not sermons.", "Legality and morality can differ.", "Case studies need feasible action, not idealistic extremes."],
    mindmap: ["Values", "Integrity", "Decision-making"],
  }),
};

function makeProfile(profile) {
  return {
    concise: [],
    ...profile,
  };
}

await main();
