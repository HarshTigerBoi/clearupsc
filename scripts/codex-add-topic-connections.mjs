import { createClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "./script-env.mjs";

const { url, serviceKey } = requireSupabaseEnv();
const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BATCH_SIZE = 50;

async function main() {
  const topics = await fetchAllTopics();
  const topicByKey = new Map(topics.map((topic) => [topic.key, topic]));
  let updated = 0;
  let failed = 0;
  const failures = [];

  for (let index = 0; index < topics.length; index += BATCH_SIZE) {
    const batch = topics.slice(index, index + BATCH_SIZE);
    for (const topic of batch) {
      try {
        const notes = parseNotes(topic.structured_notes);
        notes.connected_topics = pickConnections(topic, topics, topicByKey);
        const { error } = await supabase
          .from("topics")
          .update({ structured_notes: JSON.stringify(notes) })
          .eq("key", topic.key);
        if (error) throw error;
        updated += 1;
      } catch (error) {
        failed += 1;
        failures.push({ key: topic.key, error: error.message });
      }
    }
    console.log(`[batch ${Math.floor(index / BATCH_SIZE) + 1}] updated ${updated}/${topics.length}; failed ${failed}`);
  }

  console.log(JSON.stringify({ topics: topics.length, updated, failed, failures }, null, 2));
}

async function fetchAllTopics() {
  const rows = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("topics")
      .select("key,title,subject,parent_key,upsc_weightage,structured_notes")
      .order("key", { ascending: true })
      .range(from, from + 999);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
    from += 1000;
  }
  return rows;
}

function pickConnections(topic, topics) {
  const scored = topics
    .filter((candidate) => candidate.key !== topic.key)
    .map((candidate) => ({ key: candidate.key, score: scoreConnection(topic, candidate) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.key.localeCompare(b.key));

  const picked = [];
  for (const row of scored) {
    if (!picked.includes(row.key)) picked.push(row.key);
    if (picked.length === 3) break;
  }
  if (picked.length < 3) {
    for (const candidate of topics) {
      if (candidate.key === topic.key || picked.includes(candidate.key)) continue;
      picked.push(candidate.key);
      if (picked.length === 3) break;
    }
  }
  return picked.slice(0, 3);
}

function scoreConnection(topic, candidate) {
  const topicSubject = subjectBucket(topic);
  const candidateSubject = subjectBucket(candidate);
  const topicTokens = tokens(`${topic.key} ${topic.title} ${topic.parent_key ?? ""}`);
  const candidateTokens = tokens(`${candidate.key} ${candidate.title} ${candidate.parent_key ?? ""}`);
  let score = 0;

  if (topic.subject === candidate.subject) score += 24;
  if (topicSubject === candidateSubject) score += 18;
  if (topic.parent_key && topic.parent_key === candidate.parent_key) score += 35;
  if (candidate.parent_key === topic.key || topic.parent_key === candidate.key) score += 45;
  score += overlapCount(topicTokens, candidateTokens) * 9;
  score += crossSubjectScore(topicSubject, candidateSubject);
  score += Math.min(Number(candidate.upsc_weightage ?? 0), 5);

  return score;
}

function crossSubjectScore(a, b) {
  if (a === b) return 0;
  const pairs = [
    ["GS3_ENV", "GS1_GEO"],
    ["GS3_ENV", "GS3_SCI"],
    ["GS3_ECO", "GS2_POLITY"],
    ["GS3_ECO", "GS2_GOV"],
    ["GS2_GOV", "GS4_ETHICS"],
    ["GS2_POLITY", "GS4_ETHICS"],
    ["GS2_IR", "GS3_ECO"],
    ["GS1_HISTORY", "GS2_POLITY"],
    ["GS1_GEO", "GS3_ECO"],
    ["GS1_SOC", "GS2_GOV"],
  ];
  return pairs.some(([left, right]) => (left === a && right === b) || (left === b && right === a)) ? 14 : 0;
}

function subjectBucket(topic) {
  const raw = `${topic.subject ?? ""} ${topic.key ?? ""} ${topic.title ?? ""}`.toLowerCase();
  if (raw.includes("csat")) return "CSAT";
  if (raw.includes("essay")) return "ESSAY";
  if (raw.includes("ethics") || raw.includes("gs4")) return "GS4_ETHICS";
  if (raw.includes("environment") || raw.includes("ecology") || raw.includes("climate")) return "GS3_ENV";
  if (raw.includes("science") || raw.includes("technology") || raw.includes("disaster") || raw.includes("security")) return "GS3_SCI";
  if (raw.includes("economy") || raw.includes("agriculture") || raw.includes("bank") || raw.includes("budget")) return "GS3_ECO";
  if (raw.includes("ir") || raw.includes("international") || raw.includes("foreign")) return "GS2_IR";
  if (raw.includes("governance") || raw.includes("scheme") || raw.includes("welfare")) return "GS2_GOV";
  if (raw.includes("polity") || raw.includes("constitution") || raw.includes("rights")) return "GS2_POLITY";
  if (raw.includes("geography") || raw.includes("climatology") || raw.includes("oceanography")) return "GS1_GEO";
  if (raw.includes("society") || raw.includes("social")) return "GS1_SOC";
  if (raw.includes("history") || raw.includes("culture")) return "GS1_HISTORY";
  return String(topic.subject ?? "GENERAL").toUpperCase();
}

function tokens(value) {
  return new Set(
    String(value)
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 2)
      .filter((token) => !["and", "the", "for", "with", "topic", "definition", "conceptual", "clarity"].includes(token)),
  );
}

function overlapCount(left, right) {
  let count = 0;
  for (const token of left) if (right.has(token)) count += 1;
  return count;
}

function parseNotes(value) {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return { full_notes: value };
    }
  }
  return value && typeof value === "object" ? { ...value } : {};
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
