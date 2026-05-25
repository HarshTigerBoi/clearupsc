import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PDFParse } from "pdf-parse";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "./script-env.mjs";

const { url, serviceKey } = requireSupabaseEnv();
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
const cacheDir = join(process.cwd(), "data", "ncert-pdfs");
mkdirSync(cacheDir, { recursive: true });

const OFFICIAL_NCERT_CHAPTERS = [
  {
    classLevel: "Class 11",
    subject: "Political Science",
    book: "Indian Constitution at Work",
    chapter: "Rights in the Indian Constitution",
    topicKeys: ["gs2_polity_constitution", "gs2_polity_fundamental_rights"],
    url: "https://ncert.nic.in/textbook/pdf/keps202.pdf",
  },
  {
    classLevel: "Class 11",
    subject: "Political Science",
    book: "Indian Constitution at Work",
    chapter: "Election and Representation",
    topicKeys: ["gs2_polity_elections", "gs2_polity_democracy"],
    url: "https://ncert.nic.in/textbook/pdf/keps203.pdf",
  },
  {
    classLevel: "Class 11",
    subject: "Political Science",
    book: "Indian Constitution at Work",
    chapter: "Executive",
    topicKeys: ["gs2_polity_executive", "gs2_polity_parliamentary_system"],
    url: "https://ncert.nic.in/textbook/pdf/keps204.pdf",
  },
  {
    classLevel: "Class 11",
    subject: "Political Science",
    book: "Indian Constitution at Work",
    chapter: "Legislature",
    topicKeys: ["gs2_polity_parliament", "gs2_polity_law_making"],
    url: "https://ncert.nic.in/textbook/pdf/keps205.pdf",
  },
  {
    classLevel: "Class 11",
    subject: "Political Science",
    book: "Indian Constitution at Work",
    chapter: "Judiciary",
    topicKeys: ["gs2_polity_judiciary", "gs2_polity_supreme_court"],
    url: "https://ncert.nic.in/textbook/pdf/keps206.pdf",
  },
  {
    classLevel: "Class 11",
    subject: "Political Science",
    book: "Indian Constitution at Work",
    chapter: "Federalism",
    topicKeys: ["gs2_polity_federalism"],
    url: "https://ncert.nic.in/textbook/pdf/keps207.pdf",
  },
  {
    classLevel: "Class 11",
    subject: "Geography",
    book: "Fundamentals of Physical Geography",
    chapter: "Geomorphic Processes",
    topicKeys: ["gs1_geography_physical", "gs1_geography_geomorphology"],
    url: "https://ncert.nic.in/textbook/pdf/kegy106.pdf",
  },
  {
    classLevel: "Class 11",
    subject: "Geography",
    book: "Fundamentals of Physical Geography",
    chapter: "Composition and Structure of Atmosphere",
    topicKeys: ["gs1_geography_climatology", "gs1_geography_atmosphere"],
    url: "https://ncert.nic.in/textbook/pdf/kegy108.pdf",
  },
  {
    classLevel: "Class 12",
    subject: "Economics",
    book: "Introductory Macroeconomics",
    chapter: "Money and Banking",
    topicKeys: ["gs3_economy_banking", "gs3_economy_monetary_policy"],
    url: "https://ncert.nic.in/textbook/pdf/leec102.pdf",
  },
  {
    classLevel: "Class 12",
    subject: "Economics",
    book: "Introductory Macroeconomics",
    chapter: "Government Budget and the Economy",
    topicKeys: ["gs3_economy_budget", "gs3_economy_fiscal_policy"],
    url: "https://ncert.nic.in/textbook/pdf/leec105.pdf",
  },
  {
    classLevel: "Class 12",
    subject: "History",
    book: "Themes in Indian History III",
    chapter: "Colonialism and the Countryside",
    topicKeys: ["gs1_history_modern_india", "gs1_history_modern_india_historical_background"],
    url: "https://ncert.nic.in/textbook/pdf/lehs301.pdf",
  },
  {
    classLevel: "Class 12",
    subject: "History",
    book: "Themes in Indian History III",
    chapter: "Mahatma Gandhi and the Nationalist Movement",
    topicKeys: ["gs1_history_modern_india", "gs1_history_freedom_struggle"],
    url: "https://ncert.nic.in/textbook/pdf/lehs303.pdf",
  },
  {
    classLevel: "Class 12",
    subject: "Sociology",
    book: "Indian Society",
    chapter: "The Demographic Structure of Indian Society",
    topicKeys: ["gs1_society", "gs1_society_population"],
    url: "https://ncert.nic.in/textbook/pdf/lesy102.pdf",
  },
];

let downloaded = 0;
let parsed = 0;
let updatedTopics = 0;
let failed = 0;

for (const chapter of OFFICIAL_NCERT_CHAPTERS) {
  try {
    const pdfPath = await downloadChapter(chapter);
    const text = await extractText(pdfPath);
    parsed += 1;
    for (const topicKey of chapter.topicKeys) {
      const { data: topic, error } = await supabase.from("topics").select("key,title,subject,structured_notes").eq("key", topicKey).maybeSingle();
      if (error || !topic) continue;
      const notes = buildNcertEnrichedNotes(topic, chapter, text);
      const { error: updateError } = await supabase.from("topics").update({ structured_notes: notes, content_quality: "ncert_enriched" }).eq("key", topicKey);
      if (updateError) {
        const { error: fallbackError } = await supabase.from("topics").update({ structured_notes: notes }).eq("key", topicKey);
        if (fallbackError) throw fallbackError;
      }
      updatedTopics += 1;
      console.log(`Updated ${topicKey} from ${chapter.book}: ${chapter.chapter}`);
    }
  } catch (error) {
    failed += 1;
    console.error(`Failed ${chapter.url}: ${error.message}`);
  }
}

const report = { chapters: OFFICIAL_NCERT_CHAPTERS.length, downloaded, parsed, updatedTopics, failed };
writeReport("ncert-enriched-notes-report.json", report);
console.log(JSON.stringify(report, null, 2));

async function downloadChapter(chapter) {
  const name = `${slug(chapter.book)}-${slug(chapter.chapter)}-${createHash("sha1").update(chapter.url).digest("hex").slice(0, 8)}.pdf`;
  const path = join(cacheDir, name);
  if (existsSync(path)) return path;
  const response = await fetch(chapter.url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  writeFileSync(path, bytes);
  downloaded += 1;
  return path;
}

async function extractText(path) {
  const buffer = readFileSync(path);
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return cleanText(result.text);
  } finally {
    await parser.destroy();
  }
}

function buildNcertEnrichedNotes(topic, chapter, text) {
  const title = String(topic.title);
  const subject = String(topic.subject);
  const facts = extractFacts(text, title);
  const terms = extractTerms(text, title);
  const structure = inferChapterStructure(text);
  const questionAngles = makeQuestionAngles(title, subject, chapter, terms);
  const memory = memoryModel(title, subject, chapter);

  const fullNotes = `Source-grounded ClearUPSC notes
Topic: ${title}
Paper: ${subject}
NCERT base used: ${chapter.classLevel} ${chapter.subject}, ${chapter.book}, chapter "${chapter.chapter}"
Attribution: Original ClearUPSC explanation based on official NCERT chapter reading. The app links to the official NCERT PDF instead of reproducing textbook text.

1. What this topic is really about
${conceptIntro(title, subject, chapter)}

2. NCERT chapter logic in simple language
${structure.map((point, index) => `${index + 1}. ${point}`).join("\n")}

3. Mental model for memory
${memory}

4. Core explanation for UPSC
${coreExplanation(title, subject, chapter, terms)}

5. High-yield facts and concepts to remember
${facts.map((fact, index) => `${index + 1}. ${fact}`).join("\n")}

6. Important terms you should be able to explain
${terms.slice(0, 12).map((term) => `- ${term}`).join("\n")}

7. Prelims traps
${prelimsTraps(title, subject, chapter).map((trap) => `- ${trap}`).join("\n")}

8. Mains answer angles
${questionAngles.map((angle) => `- ${angle}`).join("\n")}

9. 150-word answer skeleton
Intro: Define ${title} and place it in ${subject}.
Body 1: Explain the NCERT foundation: ${structure[0] ?? "basic concept and background"}.
Body 2: Add institutions, examples, provisions, processes, maps, or data from the chapter theme.
Body 3: Add the UPSC layer: challenges, current relevance, and reform/way forward.
Conclusion: End with constitutional values, sustainable development, citizen welfare, or administrative effectiveness, depending on the topic.

10. Revision checklist
- Can I explain ${title} to a beginner in 60 seconds?
- Can I solve statement-based MCQs without confusing similar terms?
- Can I connect the topic to one current affairs example?
- Can I write a 150-word answer using intro-body-conclusion?
- Did I create at least one flashcard from the fact I forgot?

Practice task
Read the NCERT tab once, revise these notes, attempt the topic MCQs, and write one short answer from the skeleton.`;
  return structuredNcertNotes({ title, subject, chapter, fullNotes, facts, terms, structure, questionAngles });
}

function structuredNcertNotes({ title, subject, chapter, fullNotes, facts, terms, structure, questionAngles }) {
  return JSON.stringify(
    {
      analogy: {
        heading: `${title} through a simple story`,
        body: `${conceptIntro(title, subject, chapter)}\n\n${memoryModel(title, subject, chapter)}`,
      },
      full_notes: fullNotes,
      concise_notes: terms.slice(0, 12).map((term) => {
        const [name, ...rest] = term.split(":");
        return {
          term: name.slice(0, 64),
          definition: rest.join(":").trim() || `Important term connected to ${title}.`,
        };
      }),
      revision_bullets: facts.slice(0, 5).concat(prelimsTraps(title, subject, chapter).slice(0, 5)).slice(0, 10),
      mindmap: {
        center: title,
        branches: [chapter.chapter, "NCERT logic", "Key facts", "Prelims traps", "Mains angle", "Revision"],
      },
      cases: extractNamedItems(fullNotes, /(case|v\.|Supreme Court|judgment|judicial review)/i),
      schemes: extractNamedItems(fullNotes, /(scheme|mission|programme|yojana|policy|report|committee|survey|NCERT)/i),
      ncert_coverage: structure.concat(facts).slice(0, 12),
      prelims_traps: prelimsTraps(title, subject, chapter).slice(0, 10),
      mains_angles: questionAngles.slice(0, 10),
    },
    null,
    2,
  );
}

function extractNamedItems(text, pattern) {
  return text
    .split(/\n+/)
    .map((line) => line.trim().replace(/^[-\d. ]+/, ""))
    .filter((line) => pattern.test(line))
    .slice(0, 8)
    .map((line) => ({ name: line.slice(0, 90), note: "Use this as a source, example, case, scheme or report reference." }));
}

function conceptIntro(title, subject, chapter) {
  if (chapter.subject === "Political Science") {
    return `${title} is part of the way India's constitutional democracy is designed to work. The NCERT foundation is not only "what the institution is", but why it exists, how power is limited, how rights are protected, and how accountability is maintained.`;
  }
  if (chapter.subject === "Economics") {
    return `${title} is an economic mechanism that affects prices, income, savings, investment, welfare, and state capacity. The NCERT foundation helps you understand the chain of cause and effect before you memorise policy terms.`;
  }
  if (chapter.subject === "Geography") {
    return `${title} is a process-and-pattern topic. The NCERT foundation helps you see causes, spatial distribution, diagrams, and consequences instead of memorising isolated facts.`;
  }
  if (chapter.subject === "History") {
    return `${title} is a timeline-plus-interpretation topic. The NCERT foundation shows actors, causes, events, evidence, and consequences so the topic becomes a story with logic.`;
  }
  if (chapter.subject === "Sociology") {
    return `${title} is about how Indian society changes, distributes opportunities, and creates challenges for policy. The NCERT foundation helps convert social facts into analytical Mains points.`;
  }
  return `${title} is a UPSC foundation topic. The NCERT base gives the simplest explanation, and ClearUPSC turns it into Prelims and Mains-ready notes.`;
}

function coreExplanation(title, subject, chapter, terms) {
  const termLine = terms.slice(0, 5).join(", ");
  if (chapter.subject === "Political Science") {
    return `${title} should be understood through four questions: who has power, what limits that power, what remedy exists if power is misused, and how citizens are affected. Keep linking the topic with constitutional morality, institutional independence, checks and balances, and public accountability. Key terms from the chapter orbit include ${termLine}.`;
  }
  if (chapter.subject === "Economics") {
    return `${title} should be understood through definitions, flows, incentives, institutions, and trade-offs. Ask: what changes, who gains, who loses, what government/RBI can do, and what unintended consequences may follow. Key terms from the chapter orbit include ${termLine}.`;
  }
  if (chapter.subject === "Geography") {
    return `${title} should be understood as a chain: factor -> process -> landform/pattern -> impact -> human response. Use maps, diagrams, and Indian examples. Key terms from the chapter orbit include ${termLine}.`;
  }
  if (chapter.subject === "History") {
    return `${title} should be understood as background -> causes -> actors -> turning points -> consequences. UPSC rewards interpretation, not only dates. Key terms from the chapter orbit include ${termLine}.`;
  }
  return `${title} should be understood through concepts, examples, evidence, and implications. Key terms from the chapter orbit include ${termLine}.`;
}

function extractFacts(text, title) {
  const sentences = splitSentences(text);
  const titleWords = new Set(title.toLowerCase().split(/\W+/).filter((word) => word.length > 3));
  const scored = sentences
    .map((sentence) => ({ sentence, score: scoreSentence(sentence, titleWords) }))
    .filter((item) => item.score > 1 && item.sentence.length > 60 && item.sentence.length < 260)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((item) => paraphraseSignal(item.sentence));
  while (scored.length < 8) scored.push(genericFact(title, scored.length));
  return scored.slice(0, 8);
}

function extractTerms(text, title) {
  const matches = text.match(/\b(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,4}|Article\s+\d+[A-Z]?|[A-Z]{2,})\b/g) ?? [];
  const blocked = new Set(["Chapter", "Exercises", "Questions", "Figure", "Box", "Activity", "India", "Indian"]);
  const terms = [];
  for (const match of matches) {
    const term = match.trim().replace(/\s+/g, " ");
    if (term.length < 4 || blocked.has(term)) continue;
    if (!terms.includes(term)) terms.push(term);
  }
  if (!terms.includes(title)) terms.unshift(title);
  return terms.slice(0, 18);
}

function inferChapterStructure(text) {
  const sentences = splitSentences(text).filter((sentence) => sentence.length > 70 && sentence.length < 240);
  const starters = sentences.filter((sentence) => /means|refers|because|therefore|however|important|constitution|government|people|state|rights|court|money|bank|budget|process|movement/i.test(sentence));
  const selected = starters.slice(0, 5).map(paraphraseSignal);
  while (selected.length < 5) selected.push(["The chapter begins from basic meaning and context.", "It then builds the mechanism through examples.", "It shows why the concept matters in real life.", "It adds institutional or practical complications.", "It ends with points that can be converted into MCQs and Mains answers."][selected.length]);
  return selected;
}

function makeQuestionAngles(title, subject, chapter, terms) {
  const base = [
    `Explain why ${title} matters for ${subject} and not just as a static fact.`,
    `Analyse the challenges in making ${title} work effectively in India.`,
    `Discuss how ${title} links constitutional values, public welfare, and institutional performance.`,
    `Use examples from ${chapter.book} and current affairs to show the practical relevance of ${title}.`,
  ];
  if (terms[1]) base.push(`Write a short note linking ${title} with ${terms[1]}.`);
  return base;
}

function prelimsTraps(title, subject, chapter) {
  if (chapter.subject === "Political Science") return ["Confusing constitutional provisions with ordinary laws.", "Mixing powers, functions, jurisdiction, appointment and removal.", "Assuming every right or institutional power is absolute.", "Ignoring exceptions, emergency provisions, and federal limits."];
  if (chapter.subject === "Economics") return ["Confusing stock and flow variables.", "Ignoring real vs nominal values.", "Assuming one policy instrument solves every problem.", "Mixing fiscal policy, monetary policy and banking regulation."];
  if (chapter.subject === "Geography") return ["Memorising terms without process.", "Ignoring spatial distribution and maps.", "Confusing weather with climate or cause with consequence.", "Missing Indian examples."];
  if (chapter.subject === "History") return ["Wrong chronology.", "Confusing similar movements or personalities.", "Forgetting socio-economic background.", "Writing only events without consequences."];
  return [`Vague definition of ${title}.`, "No examples.", "No syllabus linkage.", "Confusing similar terms."];
}

function memoryModel(title, subject, chapter) {
  if (chapter.chapter === "Judiciary") return `Imagine democracy as a match where the Constitution is the rulebook. The Judiciary is the referee: it does not play for one team, but it checks whether every player follows the rules, protects weaker players, and can stop unfair moves. For UPSC, remember: independence + jurisdiction + review + rights protection + accountability.`;
  if (chapter.subject === "Political Science") return `Think of the Constitution as an operating system. ${title} is one app inside it: it has a role, permissions, limits, update history, and bugs in implementation.`;
  if (chapter.subject === "Economics") return `Think of the economy as water flowing through pipes. ${title} changes pressure, direction, leakage, and who finally receives water.`;
  if (chapter.subject === "Geography") return `Think of geography as a machine where forces create patterns. ${title} is understood by tracking input, process, output, and impact on people.`;
  if (chapter.subject === "History") return `Think of history as linked dominoes. ${title} is one cluster: causes push events, events create reactions, reactions reshape society and politics.`;
  return `Think of ${title} as a connected system: definition, mechanism, examples, problem, solution.`;
}

function scoreSentence(sentence, titleWords) {
  const lower = sentence.toLowerCase();
  let score = 0;
  for (const word of titleWords) if (lower.includes(word)) score += 3;
  if (/\b(article|constitution|rights|court|government|state|law|bank|budget|money|process|movement|society|climate|resources)\b/i.test(sentence)) score += 2;
  if (/\b(because|therefore|however|important|means|refers|helps|protects|ensures|affects)\b/i.test(sentence)) score += 2;
  if (/\d/.test(sentence)) score += 1;
  return score;
}

function splitSentences(text) {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function paraphraseSignal(sentence) {
  const lower = sentence.toLowerCase();
  if (lower.includes("supreme court") && lower.includes("power")) return "Understand the Supreme Court as a constitutionally powerful institution, not merely as an ordinary dispute-settling court.";
  if (lower.includes("dispute") && lower.includes("court")) return "The chapter begins from a simple function: courts resolve disputes between people, groups, institutions and government.";
  if (lower.includes("protect") && lower.includes("rights")) return "A central NCERT idea is that courts protect rights when state action or social power threatens individual liberty.";
  if (lower.includes("interpreting") && lower.includes("constitution")) return "The judiciary matters because constitutional meaning often becomes clear only through interpretation in real cases.";
  if (lower.includes("judicial review")) return "Judicial review is the power to test laws and executive action against the Constitution.";
  if (lower.includes("independence") && lower.includes("judiciary")) return "Judicial independence means judges must be able to decide cases without pressure from the legislature, executive or powerful interests.";
  if (lower.includes("high court")) return "High Courts matter because constitutional justice is not only centralised in Delhi; states also have powerful constitutional courts.";
  if (lower.includes("money") && lower.includes("bank")) return "The chapter treats money and banking as a flow system: money enables exchange, banks mobilise savings, and credit supports economic activity.";
  if (lower.includes("budget")) return "The budget chapter shows government priorities through revenue, expenditure, deficits and fiscal choices.";
  if (lower.includes("process") || lower.includes("weathering") || lower.includes("erosion")) return "The geography chapter explains landforms through processes: forces act over time and create visible patterns on the earth's surface.";
  if (lower.includes("movement") || lower.includes("gandhi")) return "The history chapter should be read as a mass-mobilisation story: leadership, people, events and colonial response interacted over time.";
  if (lower.includes("population") || lower.includes("demographic")) return "The society chapter uses population data to explain how age, gender, region and social structure affect development.";
  const terms = (sentence.match(/\b[A-Z][a-z]{3,}(?:\s+[A-Z][a-z]{3,})?\b/g) ?? []).slice(0, 3);
  if (terms.length) return `The chapter builds a concept cluster around ${terms.join(", ")}; revise how these terms connect to the topic.`;
  return "The chapter moves from basic meaning to examples, then to implications that can be converted into MCQs and Mains points.";
}

function genericFact(title, index) {
  const facts = [
    `${title} should be revised with definition, institutional context and one example.`,
    `UPSC can frame ${title} as a statement-based Prelims question or an analytical Mains question.`,
    `Connect ${title} with current affairs instead of reading it only as a textbook term.`,
    `Use one diagram, flowchart, timeline or institution map where possible.`,
    `End revision by converting the weakest point into a flashcard.`,
  ];
  return facts[index % facts.length];
}

function cleanText(text) {
  return text
    .replace(/\u0000/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function writeReport(name, value) {
  const dir = join(process.cwd(), "data", "content-reports");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, name), `${JSON.stringify({ ...value, generatedAt: new Date().toISOString() }, null, 2)}\n`);
}
