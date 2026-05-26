import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const MOCK_COUNT = 10;
const MOCK_SIZE = 100;
const PAGE_SIZE = 1000;

const DISTRIBUTION = [
  ["History", 15],
  ["Geography", 10],
  ["Polity", 15],
  ["Economy", 15],
  ["Environment", 10],
  ["Science & Tech", 10],
  ["Current Affairs", 15],
  ["CSAT/General", 10],
];

function loadLocalEnv() {
  const envPath = join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

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

async function fetchAll(table, select, queryBuilder = (query) => query) {
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const to = from + PAGE_SIZE - 1;
    const query = queryBuilder(supabase.from(table).select(select).range(from, to));
    const { data, error } = await query;
    if (error) throw new Error(`${table} fetch failed: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return rows;
}

function topicLineage(topic, topicByKey) {
  const parts = [];
  const seen = new Set();
  let current = topic;

  while (current && !seen.has(current.key)) {
    seen.add(current.key);
    parts.push(current.key, current.subject ?? "", current.title ?? "");
    current = current.parent_key ? topicByKey.get(current.parent_key) : null;
  }

  return parts.join(" ").toLowerCase();
}

function includesAny(text, words) {
  return words.some((word) => text.includes(word));
}

function classifyTopic(topic, topicByKey) {
  if (!topic) return "CSAT/General";

  const context = topicLineage(topic, topicByKey);
  const subject = (topic.subject ?? "").toUpperCase();

  if (includesAny(context, ["csat", "comprehension", "reasoning", "numeracy", "aptitude", "decision making", "data interpretation"])) {
    return "CSAT/General";
  }

  if (includesAny(context, ["climate", "environment", "ecology", "biodiversity", "wildlife", "pollution", "conservation", "forest", "wetland", "biosphere", "disaster", "ndma"])) {
    return "Environment";
  }

  if (includesAny(context, ["science", "technology", "space", "isro", "satellite", "biotech", "biotechnology", "defence", "cyber", "nuclear", "ai", "artificial intelligence", "robotics", "health", "disease", "nanotechnology"])) {
    return "Science & Tech";
  }

  if (includesAny(context, ["economy", "economic", "budget", "fiscal", "monetary", "inflation", "banking", "rbi", "gdp", "growth", "planning", "industry", "infrastructure", "agriculture", "msp", "pds", "food processing", "land reforms"])) {
    return "Economy";
  }

  if (includesAny(context, ["polity", "constitution", "judiciary", "parliament", "federalism", "local bod", "panchayat", "municipal", "fundamental right", "dpsp", "president", "governor", "election", "emergency", "amendment", "citizenship"])) {
    return "Polity";
  }

  if (includesAny(context, ["geography", "physical", "climate", "monsoon", "river", "soil", "mineral", "ocean", "mountain", "plateau", "map", "resource distribution"])) {
    return "Geography";
  }

  if (includesAny(context, ["history", "ancient", "medieval", "modern", "freedom", "national movement", "art", "culture", "heritage", "sangam", "maury", "gupta", "mughal", "bhakti", "sufi"])) {
    return "History";
  }

  if (includesAny(context, ["current", "governance", "scheme", "welfare", "social justice", "international", "relations", "ir", "treaty", "bilateral", "multilateral", "security", "internal security", "society", "women", "population", "urbanization", "poverty", "education"])) {
    return "Current Affairs";
  }

  if (subject.includes("GS1")) return "History";
  if (subject.includes("GS2")) return "Polity";
  if (subject.includes("GS3")) return "Economy";
  if (subject.includes("GS4")) return "CSAT/General";
  return "Current Affairs";
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededShuffle(rows, salt) {
  return [...rows].sort((left, right) => {
    const leftHash = hashString(`${salt}:${left.id}`);
    const rightHash = hashString(`${salt}:${right.id}`);
    return leftHash - rightHash;
  });
}

function takeUnused(queue, count, usedIds) {
  const picked = [];
  while (queue.length && picked.length < count) {
    const candidate = queue.shift();
    if (!usedIds.has(candidate.id)) {
      picked.push(candidate);
      usedIds.add(candidate.id);
    }
  }
  return picked;
}

async function deleteExistingGeneratedMocks() {
  const { data, error } = await supabase
    .from("mock_tests")
    .select("id,title")
    .like("title", "ClearUPSC Full Mock Test%");

  if (error) throw new Error(`Existing mock lookup failed: ${error.message}`);
  const ids = (data ?? []).map((row) => row.id);
  if (!ids.length) return 0;

  const { error: mappingError } = await supabase.from("mock_test_questions").delete().in("mock_test_id", ids);
  if (mappingError) throw new Error(`Existing mock mappings delete failed: ${mappingError.message}`);

  const { error: mockError } = await supabase.from("mock_tests").delete().in("id", ids);
  if (mockError) throw new Error(`Existing mock tests delete failed: ${mockError.message}`);

  return ids.length;
}

async function main() {
  const topics = await fetchAll("topics", "key,subject,title,parent_key");
  const topicByKey = new Map(topics.map((topic) => [topic.key, topic]));

  const questions = await fetchAll(
    "questions",
    "id,topic_key,question_type",
    (query) => query.eq("question_type", "mcq").order("id", { ascending: true }),
  );

  const byBucket = Object.fromEntries(DISTRIBUTION.map(([bucket]) => [bucket, []]));
  let unclassified = 0;

  for (const question of questions) {
    const topic = topicByKey.get(question.topic_key);
    const bucket = classifyTopic(topic, topicByKey);
    if (!byBucket[bucket]) {
      unclassified += 1;
      byBucket["CSAT/General"].push(question);
    } else {
      byBucket[bucket].push(question);
    }
  }

  console.log("Available MCQs by mock bucket:");
  for (const [bucket, requiredPerMock] of DISTRIBUTION) {
    const required = requiredPerMock * MOCK_COUNT;
    const available = byBucket[bucket].length;
    console.log(`- ${bucket}: ${available} available / ${required} needed`);
    if (available < required) {
      throw new Error(`Not enough ${bucket} questions: ${available} available, ${required} needed.`);
    }
  }
  if (unclassified) console.log(`Unclassified fallback questions: ${unclassified}`);

  const deletedMocks = await deleteExistingGeneratedMocks();
  if (deletedMocks) console.log(`Deleted ${deletedMocks} existing ClearUPSC generated mocks before rebuilding.`);

  const queues = Object.fromEntries(
    Object.entries(byBucket).map(([bucket, bucketQuestions]) => [bucket, seededShuffle(bucketQuestions, bucket)]),
  );

  const usedIds = new Set();
  let mocksCreated = 0;
  let questionsMapped = 0;

  for (let mockNumber = 1; mockNumber <= MOCK_COUNT; mockNumber += 1) {
    const selected = [];
    for (const [bucket, count] of DISTRIBUTION) {
      const picked = takeUnused(queues[bucket], count, usedIds);
      if (picked.length !== count) {
        throw new Error(`Mock ${mockNumber}: only picked ${picked.length}/${count} for ${bucket}.`);
      }
      selected.push(...picked.map((question) => ({ ...question, bucket })));
    }

    const ordered = seededShuffle(selected, `mock-${mockNumber}`).slice(0, MOCK_SIZE);
    if (ordered.length !== MOCK_SIZE) {
      throw new Error(`Mock ${mockNumber}: selected ${ordered.length}/${MOCK_SIZE} questions.`);
    }

    const { data: mock, error: mockError } = await supabase
      .from("mock_tests")
      .insert({
        title: `ClearUPSC Full Mock Test ${mockNumber}`,
        description: "100-question full Prelims simulation",
        test_type: "prelims_full",
        duration_minutes: 120,
        total_questions: MOCK_SIZE,
        total_marks: 200,
        is_active: true,
      })
      .select("id")
      .single();

    if (mockError) throw new Error(`Mock ${mockNumber} insert failed: ${mockError.message}`);

    const mappings = ordered.map((question, index) => ({
      mock_test_id: mock.id,
      question_id: question.id,
      question_order: index + 1,
    }));

    const { error: mappingError } = await supabase.from("mock_test_questions").insert(mappings);
    if (mappingError) throw new Error(`Mock ${mockNumber} mappings insert failed: ${mappingError.message}`);

    mocksCreated += 1;
    questionsMapped += mappings.length;
    console.log(`[mock ${mockNumber}/${MOCK_COUNT}] mapped ${mappings.length} questions`);
  }

  console.log(`Done. Mocks created: ${mocksCreated}. Questions mapped: ${questionsMapped}. Unique questions used: ${usedIds.size}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
