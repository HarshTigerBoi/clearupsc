import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "./script-env.mjs";

const { url, serviceKey } = requireSupabaseEnv();
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
const ncertLibrary = loadNcertLibrary();

const topics = await fetchAllTopics("key,title,subject,ncert_refs,structured_notes");

const missingTopics = [];
const mappedCounts = {};
const updates = [];

for (const topic of topics) {
  const refs = refsForTopic(topic);
  if (!refs.length) {
    missingTopics.push(topic.key);
  }
  updates.push({ key: topic.key, refs });
  mappedCounts[topic.key] = refs.length;
}

let processed = 0;
for (const batch of chunks(updates, 25)) {
  await Promise.all(
    batch.map(async (item) => {
      const updatePayload = { ncert_refs: item.refs };
      const { error: updateError } = await supabase.from("topics").update(updatePayload).eq("key", item.key);
      if (updateError) {
        const { error: fallbackError } = await supabase.from("topics").update({ ncert_refs: item.refs }).eq("key", item.key);
        if (fallbackError) throw fallbackError;
      }
      processed += 1;
    }),
  );
}

const report = {
  processed,
  missingNcertRefs: missingTopics.length,
  missingTopics,
  totalTopics: topics.length,
  ncertChaptersAvailable: ncertLibrary.length,
  mappedCounts,
};
writeReport("ncert-library-report.json", report);
console.log(JSON.stringify(report, null, 2));

function refsForTopic(topic) {
  const direct = ncertLibrary.filter((chapter) => chapter.topicKeys.includes(topic.key));
  if (direct.length) return direct;
  const coverage = normalizeCoverage(topic.structured_notes);
  const lower = `${topic.key} ${topic.title} ${topic.subject} ${coverage.join(" ")}`.toLowerCase();
  const scored = ncertLibrary
    .map((chapter) => ({
      chapter,
      score: [...chapter.topicKeys, chapter.book, chapter.chapter, chapter.subject].reduce((sum, key) => {
        const words = String(key).toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 3);
        return sum + words.filter((word) => lower.includes(word)).length;
      }, 0),
    }))
    .filter((item) => item.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((item) => item.chapter);
  return scored;
}

function normalizeCoverage(notes) {
  const parsed = typeof notes === "string" ? safeJson(notes) : notes;
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.ncert_coverage)) return [];
  return parsed.ncert_coverage.filter((item) => typeof item === "string");
}

function safeJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function loadNcertLibrary() {
  const source = readFileSync(join(process.cwd(), "src", "lib", "study", "ncert.ts"), "utf8");
  const match = source.match(/export const NCERT_LIBRARY[^=]*=\s*\[([\s\S]*?)\];/);
  if (!match) throw new Error("Could not read NCERT_LIBRARY from src/lib/study/ncert.ts");
  return Function(`return [${match[1]}];`)();
}

function chunks(items, size) {
  const output = [];
  for (let index = 0; index < items.length; index += size) output.push(items.slice(index, index + size));
  return output;
}

async function fetchAllTopics(select) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from("topics").select(select).order("key", { ascending: true }).range(from, from + 999);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

function writeReport(name, report) {
  const dir = join(process.cwd(), "data", "content-reports");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, name), `${JSON.stringify({ ...report, generatedAt: new Date().toISOString() }, null, 2)}\n`);
}
