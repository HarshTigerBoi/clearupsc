import { createClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { requireSupabaseEnv } from "./script-env.mjs";

const { url, serviceKey } = requireSupabaseEnv();
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const overrides = new Map([
  ["gs2_polity_fundamental_rights", "Fundamental_rights_in_India"],
  ["gs2_polity_constitution", "Constitution_of_India"],
  ["gs2_polity_federalism", "Federalism_in_India"],
  ["gs3_economy_inflation", "Inflation"],
  ["gs3_environment_biodiversity", "Biodiversity"],
  ["gs1_history_freedom_struggle", "Indian_independence_movement"],
  ["gs1_geography_monsoon", "Monsoon_of_South_Asia"],
]);

const topics = await fetchAllTopics("key,title,wiki_slug");

let processed = 0;
let missing = 0;
const missingTopics = [];
const updates = [];
for (const topic of topics) {
  const slug = overrides.get(topic.key) ?? slugify(topic.title);
  if (!slug) {
    missing += 1;
    missingTopics.push(topic.key);
    continue;
  }
  updates.push({ key: topic.key, slug });
}

for (const batch of chunks(updates, 50)) {
  await Promise.all(
    batch.map(async (item) => {
      const { error: updateError } = await supabase.from("topics").update({ wiki_slug: item.slug }).eq("key", item.key);
      if (updateError) throw updateError;
      processed += 1;
    }),
  );
}

const report = { processed, missingWikiSlugs: missing, missingTopics, totalTopics: topics.length };
writeReport("wiki-slugs-report.json", report);
console.log(JSON.stringify(report, null, 2));

function slugify(title) {
  return String(title ?? "")
    .replace(/[()[\],:;?]/g, "")
    .replace(/&/g, "and")
    .trim()
    .replace(/\s+/g, "_");
}

function writeReport(name, report) {
  const dir = join(process.cwd(), "data", "content-reports");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, name), `${JSON.stringify({ ...report, generatedAt: new Date().toISOString() }, null, 2)}\n`);
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

function chunks(items, size) {
  const output = [];
  for (let index = 0; index < items.length; index += size) output.push(items.slice(index, index + size));
  return output;
}
