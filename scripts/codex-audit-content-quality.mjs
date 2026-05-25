import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "./script-env.mjs";

const { url, serviceKey } = requireSupabaseEnv();
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const topics = await fetchAllTopics();
const rows = topics.map(auditTopic);

const weak = rows.filter((row) => row.issues.length);
const byIssue = {};
for (const row of weak) {
  for (const issue of row.issues) byIssue[issue] = (byIssue[issue] ?? 0) + 1;
}

const report = {
  generatedAt: new Date().toISOString(),
  totalTopics: rows.length,
  weakTopics: weak.length,
  strongTopics: rows.length - weak.length,
  byIssue,
  priorityFixes: weak
    .sort((a, b) => b.score - a.score)
    .slice(0, 200)
    .map(({ key, title, subject, score, issues, sample }) => ({ key, title, subject, score, issues, sample })),
};

const dir = join(process.cwd(), "data", "content-reports");
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, "content-quality-audit.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

function auditTopic(topic) {
  const notes = parseNotes(topic.structured_notes);
  const title = String(topic.title ?? "");
  const full = String(notes.full_notes ?? "");
  const concise = Array.isArray(notes.concise_notes) ? notes.concise_notes : [];
  const revision = Array.isArray(notes.revision_bullets) ? notes.revision_bullets : [];
  const cases = Array.isArray(notes.cases) ? notes.cases : [];
  const schemes = Array.isArray(notes.schemes) ? notes.schemes : [];
  const issues = [];

  if (wordCount(full) < 350) issues.push("full_notes_short");
  if (containsGenericFullNotes(full)) issues.push("generic_full_notes");
  if (concise.length < 10) issues.push("too_few_concise_notes");
  if (revision.length < 10) issues.push("too_few_revision_bullets");
  if (concise.some((row) => isGenericText(row?.definition))) issues.push("generic_concise_definition");
  if (revision.some((item) => isGenericText(item))) issues.push("generic_revision_bullet");
  if (cases.length < 3) issues.push("too_few_cases_reports");
  if (schemes.length < 3) issues.push("too_few_schemes_sources");
  if (looksWrongFamily(topic, concise, revision)) issues.push("possible_wrong_subject_facts");

  return {
    key: String(topic.key),
    title,
    subject: String(topic.subject ?? ""),
    score: issues.length,
    issues,
    sample: {
      full_notes: full.replace(/\s+/g, " ").slice(0, 220),
      concise: concise.slice(0, 3),
      revision: revision.slice(0, 3),
    },
  };
}

function containsGenericFullNotes(value) {
  const lower = value.toLowerCase();
  return [
    "belongs to gs",
    "in upsc preparation, it should be studied",
    "avoid generic advice",
    "build the answer around the exact issue",
    "a strong answer on",
    "for prelims, convert",
  ].some((phrase) => lower.includes(phrase));
}

function isGenericText(value) {
  const lower = String(value ?? "").toLowerCase();
  return [
    "requiring articles, institutions",
    "requiring dynasty, dates",
    "revise the exact year",
    "use the official syllabus",
    "correct approach",
    "study this topic",
    "build conceptual clarity",
  ].some((phrase) => lower.includes(phrase));
}

function looksWrongFamily(topic, concise, revision) {
  const key = String(topic.key ?? "").toLowerCase();
  const text = `${JSON.stringify(concise)} ${JSON.stringify(revision)}`.toLowerCase();
  if (key.includes("local_bodies")) return text.includes("article 368") || text.includes("president's rule");
  if (key.includes("economy")) return text.includes("73rd amendment") || text.includes("article 124");
  if (key.includes("geography")) return text.includes("article 32") || text.includes("finance commission is under article 280");
  if (key.includes("ethics")) return text.includes("indus valley") || text.includes("repo rate");
  return false;
}

function wordCount(value) {
  return String(value ?? "").trim().split(/\s+/).filter(Boolean).length;
}

function parseNotes(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return { full_notes: String(value) };
  }
}

async function fetchAllTopics() {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("topics")
      .select("key,title,subject,structured_notes")
      .order("key", { ascending: true })
      .range(from, from + 999);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return rows;
}
