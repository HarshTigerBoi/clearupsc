import { createClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { requireSupabaseEnv } from "./script-env.mjs";

const { url, serviceKey } = requireSupabaseEnv();
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const topics = await fetchAllTopics("key,title,subject,govt_sources");

const missingTopics = [];
const updates = [];
for (const topic of topics) {
  const sources = sourcesFor(topic.subject, topic.title);
  if (!sources.length) {
    missingTopics.push(topic.key);
  }
  updates.push({ key: topic.key, sources });
}

let processed = 0;
for (const batch of chunks(updates, 25)) {
  await Promise.all(
    batch.map(async (item) => {
      const { error: updateError } = await supabase.from("topics").update({ govt_sources: item.sources }).eq("key", item.key);
      if (updateError) throw updateError;
      processed += 1;
    }),
  );
}

const report = { processed, missingGovernmentSources: missingTopics.length, missingTopics, totalTopics: topics.length };
writeReport("government-sources-report.json", report);
console.log(JSON.stringify(report, null, 2));

function sourcesFor(subject, title) {
  const lower = `${subject} ${title}`.toLowerCase();
  const sources = [
    { name: "PIB", url: "https://pib.gov.in/", type: "Government releases and schemes" },
    { name: "PRS India", url: "https://prsindia.org/", type: "Bills, Acts and policy briefs" },
  ];
  if (lower.includes("environment") || lower.includes("ecology") || lower.includes("climate")) sources.push({ name: "MoEFCC", url: "https://moef.gov.in/", type: "Environment reports and notifications" });
  if (lower.includes("economy") || lower.includes("budget") || lower.includes("inflation") || lower.includes("bank")) sources.push({ name: "Economic Survey", url: "https://www.indiabudget.gov.in/economicsurvey/", type: "Economy data and analysis" });
  if (lower.includes("polity") || lower.includes("constitution") || lower.includes("rights") || lower.includes("judiciary")) sources.push({ name: "Supreme Court of India", url: "https://www.sci.gov.in/", type: "Judgments and institutional updates" });
  if (lower.includes("international") || lower.includes("foreign") || lower.includes("diplomacy")) sources.push({ name: "MEA", url: "https://www.mea.gov.in/", type: "Foreign policy source" });
  return sources;
}

function writeReport(name, report) {
  const dir = join(process.cwd(), "data", "content-reports");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, name), `${JSON.stringify({ ...report, generatedAt: new Date().toISOString() }, null, 2)}\n`);
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
