import { createClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "./script-env.mjs";

const SOURCE_URL = "https://raw.githubusercontent.com/amanbh2/UPSC-Star/master/UPSC%20Star%20Data.json";
const SOURCE = "UPSC Official Mains";
const SOURCE_LABEL = "Official UPSC Mains PYQ";

const { url, serviceKey } = requireSupabaseEnv();
const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const PAPER_TO_SUBJECT = {
  "GS-I": "GS1",
  "GS-II": "GS2",
  "GS-III": "GS3",
  "GS-IV": "GS4",
};

const FALLBACK_TOPIC_HINTS = {
  "GS-I": [
    ["society", ["women", "population", "urban", "tribal", "caste", "social"]],
    ["geography", ["monsoon", "river", "climate", "ocean", "earthquake", "cyclone", "soil", "mountain", "plateau"]],
    ["history_modern", ["gandhi", "freedom", "british", "congress", "swadeshi", "revolt", "moderates"]],
    ["history_ancient", ["vedic", "buddha", "mauryan", "gupta", "harappan", "ashoka"]],
    ["history_medieval", ["bhakti", "sufi", "mughal", "vijayanagara", "sultanate"]],
  ],
  "GS-II": [
    ["polity_judiciary", ["judiciary", "supreme court", "high court", "judge", "judicial", "tribunal"]],
    ["polity_parliament", ["parliament", "lok sabha", "rajya sabha", "speaker", "bill", "committee"]],
    ["governance", ["governance", "rti", "accountability", "citizen", "civil service", "welfare"]],
    ["ir", ["international", "foreign", "united nations", "asean", "saarc", "g20", "neighbourhood"]],
    ["polity", ["constitution", "constitutional", "fundamental", "federal", "article", "governor"]],
  ],
  "GS-III": [
    ["economy", ["gdp", "inflation", "rbi", "bank", "budget", "tax", "fiscal", "monetary", "market", "growth"]],
    ["environment", ["environment", "biodiversity", "climate", "forest", "wildlife", "wetland", "pollution"]],
    ["science", ["space", "satellite", "technology", "digital", "biotechnology", "vaccine", "semiconductor"]],
    ["security", ["security", "cyber", "terrorism", "border", "money laundering", "insurgency"]],
    ["agriculture", ["agriculture", "farmer", "crop", "irrigation", "msp", "soil", "food"]],
  ],
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  const topics = await fetchTopics();
  const rows = await fetchUpscStarRows();
  const questionRows = rows.map((row) => toQuestionRow(row, topics));

  const { error: deleteError } = await supabase.from("questions").delete().eq("source", SOURCE);
  if (deleteError) throw deleteError;

  const result = await insertQuestions(questionRows);
  const byPaper = groupCount(questionRows, (row) => row.tags[0]);
  const byType = groupCount(questionRows, (row) => row.question_type);
  const years = [...new Set(questionRows.map((row) => row.year))].sort((a, b) => a - b);

  console.log(
    JSON.stringify(
      {
        source: SOURCE_URL,
        years: `${years[0]}-${years[years.length - 1]}`,
        totalFetched: rows.length,
        inserted: result.inserted,
        failed: result.failed,
        byPaper,
        byType,
      },
      null,
      2,
    ),
  );
}

async function fetchTopics() {
  const all = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("topics")
      .select("key,title,subject,parent_key")
      .range(from, from + 999);
    if (error) throw error;
    all.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return all.map((topic) => ({
    key: String(topic.key),
    title: String(topic.title ?? ""),
    subject: String(topic.subject ?? ""),
    parent_key: String(topic.parent_key ?? ""),
  }));
}

async function fetchUpscStarRows() {
  const response = await fetch(SOURCE_URL);
  if (!response.ok) throw new Error(`Could not fetch UPSC-Star data: HTTP ${response.status}`);
  const data = await response.json();
  const rows = [];
  for (const bucket of Object.keys(data)) {
    for (const row of data[bucket] ?? []) {
      rows.push({
        bucket,
        id: Number(row.Id),
        paper: String(row.Paper),
        year: Number(row.Year),
        question: String(row.Question ?? "").trim(),
        wordLimit: Number(row.WordLimit ?? 0),
        marks: Number(row.Marks ?? 0),
      });
    }
  }
  return rows.filter((row) => row.question && row.year);
}

function toQuestionRow(row, topics) {
  return {
    id: `upsc-star-mains-${slug(row.paper)}-${row.year}-${String(row.id).padStart(3, "0")}`,
    topic_key: matchTopic(row, topics),
    question_text: row.question,
    question_type: questionType(row.marks),
    year: row.year,
    source: SOURCE,
    difficulty: row.marks >= 15 ? 4 : 3,
    model_answer: null,
    tags: [row.paper, String(row.year), `${row.marks} marks`, `${row.wordLimit} words`],
    source_label: SOURCE_LABEL,
    is_official: true,
  };
}

function questionType(marks) {
  if (marks >= 125) return "essay";
  if (marks >= 15) return "mains_15";
  return "mains_10";
}

function matchTopic(row, topics) {
  const subject = PAPER_TO_SUBJECT[row.paper] ?? "";
  const subjectTopics = topics.filter((topic) => topic.subject === subject);
  if (!subjectTopics.length) return topics[0]?.key ?? null;

  const haystack = normalize(`${row.question} ${row.paper}`);
  const scored = subjectTopics
    .map((topic) => ({ topic, score: scoreTopic(topic, haystack) }))
    .sort((a, b) => b.score - a.score);

  if (scored[0]?.score > 0) return scored[0].topic.key;

  for (const [hint, terms] of FALLBACK_TOPIC_HINTS[row.paper] ?? []) {
    if (!terms.some((term) => haystack.includes(term))) continue;
    const match = subjectTopics.find((topic) => normalize(`${topic.key} ${topic.title} ${topic.parent_key}`).includes(hint));
    if (match) return match.key;
  }

  return subjectTopics[0].key;
}

function scoreTopic(topic, haystack) {
  const topicText = normalize(`${topic.key} ${topic.title} ${topic.parent_key}`);
  const tokens = new Set(topicText.split(/\s+/).filter((token) => token.length >= 4 && !STOPWORDS.has(token)));
  let score = 0;
  for (const token of tokens) {
    if (haystack.includes(token)) score += token.length > 7 ? 2 : 1;
  }
  if (haystack.includes(normalize(topic.title))) score += 8;
  return score;
}

async function insertQuestions(questionRows) {
  let inserted = 0;
  let failed = 0;
  for (let index = 0; index < questionRows.length; index += 100) {
    const chunk = questionRows.slice(index, index + 100);
    const { error } = await supabase.from("questions").upsert(chunk, { onConflict: "id" });
    if (!error) {
      inserted += chunk.length;
      continue;
    }

    const legacyChunk = chunk.map(({ source_label, is_official, ...row }) => row);
    const legacy = await supabase.from("questions").upsert(legacyChunk, { onConflict: "id" });
    if (legacy.error) {
      failed += chunk.length;
      console.error(`Failed chunk ${index}-${index + chunk.length - 1}: ${legacy.error.message}`);
    } else {
      inserted += chunk.length;
    }
  }
  return { inserted, failed };
}

function groupCount(rows, getKey) {
  return rows.reduce((acc, row) => {
    const key = getKey(row) ?? "unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function normalize(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

const STOPWORDS = new Set([
  "with",
  "from",
  "that",
  "this",
  "what",
  "which",
  "india",
  "indian",
  "explain",
  "discuss",
  "examine",
  "evaluate",
  "comment",
  "answer",
  "words",
  "paper",
  "topic",
  "definition",
  "current",
  "affairs",
]);
