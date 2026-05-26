import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import vm from "node:vm";
import { createClient } from "@supabase/supabase-js";
import ts from "typescript";
import { requireSupabaseEnv } from "./script-env.mjs";

const require = createRequire(import.meta.url);
const repoRoot = process.cwd();
const indexPath = path.join(repoRoot, "src", "lib", "study", "ncert-master-index.ts");
const reportPath = path.join(repoRoot, "data", "content-reports", "textbook-first-topic-links.json");

function loadMasterIndex() {
  const source = fs.readFileSync(indexPath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(transpiled, { module, exports: module.exports, require, console }, { filename: indexPath });
  return module.exports;
}

function normalizeRefs(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function tokens(value) {
  return new Set(
    String(value ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9_ ]+/g, " ")
      .split(/[\s_]+/)
      .filter((token) => token.length >= 4)
      .filter((token) => !["class", "chapter", "ncert", "source", "textbook", "introduction"].includes(token)),
  );
}

function scoreTopic(chapter, topic) {
  const chapterTokens = tokens(`${chapter.key} ${chapter.title} ${chapter.source.book} ${chapter.source.chapter_title} ${chapter.maps_to_topics.join(" ")}`);
  const topicTokens = tokens(`${topic.key} ${topic.title} ${topic.subject}`);
  let score = chapter.subject.split(" ")[0] === String(topic.subject) ? 3 : 0;
  for (const token of chapterTokens) {
    if (topicTokens.has(token)) score += 2;
    else if (String(topic.key).toLowerCase().includes(token)) score += 1;
  }
  return score;
}

function decodedRef(chapter) {
  return {
    classLevel: chapter.source.book.match(/Class\s+\d+/)?.[0] ?? "NCERT",
    subject: chapter.subject,
    gsPaper: chapter.subject.split(" ")[0],
    book: chapter.source.book,
    chapter: `Chapter ${chapter.source.chapter}: ${chapter.source.chapter_title}`,
    url: `/study/${chapter.key}`,
    officialUrl: chapter.source.pdf_url,
    decodedChapterKey: chapter.key,
    sourceType: "textbook_decoded_chapter",
  };
}

async function updateTopicRefs(supabase, topicKey, refs) {
  const objectUpdate = await supabase.from("topics").update({ ncert_refs: refs }).eq("key", topicKey);
  if (!objectUpdate.error) return;
  const stringUpdate = await supabase.from("topics").update({ ncert_refs: JSON.stringify(refs) }).eq("key", topicKey);
  if (stringUpdate.error) throw stringUpdate.error;
}

const { NCERT_CHAPTER_TOPICS } = loadMasterIndex();
const chapterByKey = new Map(NCERT_CHAPTER_TOPICS.map((chapter) => [chapter.key, chapter]));
const { url, serviceKey } = requireSupabaseEnv();
const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

const { data: decodedRows, error: decodedError } = await supabase
  .from("topics")
  .select("key,title,subject,content_quality")
  .in("content_quality", ["textbook_decoded", "textbook_verified"])
  .order("key", { ascending: true });
if (decodedError) throw decodedError;

const topicRows = [];
for (let from = 0; ; from += 1000) {
  const { data, error: topicError } = await supabase
    .from("topics")
    .select("key,title,subject,ncert_refs,content_quality")
    .order("key", { ascending: true })
    .range(from, from + 999);
  if (topicError) throw topicError;
  topicRows.push(...(data ?? []));
  if (!data || data.length < 1000) break;
}

const targetTopics = (topicRows ?? [])
  .filter((row) => row.content_quality !== "textbook_decoded" && row.content_quality !== "textbook_verified")
  .map((row) => ({
    key: String(row.key),
    title: String(row.title ?? row.key),
    subject: String(row.subject ?? ""),
    ncert_refs: normalizeRefs(row.ncert_refs),
  }));
const targetByKey = new Map(targetTopics.map((topic) => [topic.key, topic]));
const updates = new Map();
const rows = [];

for (const decoded of decodedRows ?? []) {
  const chapter = chapterByKey.get(String(decoded.key));
  if (!chapter) {
    rows.push({ key: String(decoded.key), status: "missing_master_index" });
    continue;
  }

  const directTargets = chapter.maps_to_topics.filter((key) => targetByKey.has(key));
  let targets = directTargets;
  if (!targets.length) {
    const scored = targetTopics
      .map((topic) => ({ topic, score: scoreTopic(chapter, topic) }))
      .filter((item) => item.score >= 7)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);
    targets = scored.map((item) => item.topic.key);
  }
  if (!targets.length && chapter.key.includes("_physics_")) {
    targets = ["gs3_science_and_tech"];
  }

  if (!targets.length) {
    rows.push({ key: chapter.key, title: chapter.title, status: "no_matching_existing_topic" });
    continue;
  }

  for (const targetKey of targets) {
    if (!updates.has(targetKey)) updates.set(targetKey, []);
    updates.get(targetKey).push(decodedRef(chapter));
  }
  rows.push({ key: chapter.key, title: chapter.title, status: "linked", targets });
}

const updatedTopics = [];
for (const [topicKey, refsToAdd] of updates.entries()) {
  const topic = targetByKey.get(topicKey);
  if (!topic) continue;
  const refs = normalizeRefs(topic.ncert_refs);
  const existingKeys = new Set(refs.map((ref) => ref?.decodedChapterKey).filter(Boolean));
  const nextRefs = [...refs];
  for (const ref of refsToAdd) {
    if (!existingKeys.has(ref.decodedChapterKey)) {
      nextRefs.push(ref);
      existingKeys.add(ref.decodedChapterKey);
    }
  }
  await updateTopicRefs(supabase, topicKey, nextRefs);
  updatedTopics.push({ key: topicKey, title: topic.title, added_refs: nextRefs.length - refs.length, total_refs: nextRefs.length });
}

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(
  reportPath,
  `${JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      decoded_chapters_seen: decodedRows?.length ?? 0,
      decoded_chapters_linked: rows.filter((row) => row.status === "linked").length,
      updated_existing_topics: updatedTopics.length,
      total_links_added: updatedTopics.reduce((sum, topic) => sum + topic.added_refs, 0),
      rows,
      updated_topics: updatedTopics,
    },
    null,
    2,
  )}\n`,
);

console.log(`Decoded chapters seen: ${decodedRows?.length ?? 0}`);
console.log(`Decoded chapters linked: ${rows.filter((row) => row.status === "linked").length}`);
console.log(`Existing topics updated: ${updatedTopics.length}`);
console.log(`Links added: ${updatedTopics.reduce((sum, topic) => sum + topic.added_refs, 0)}`);
console.log(`Report: ${path.relative(repoRoot, reportPath).replaceAll("\\", "/")}`);
