import { createClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "./script-env.mjs";

const BATCH_SIZE = 50;

const { url, serviceKey } = requireSupabaseEnv();
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

function normalizeNotes(raw) {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  if (typeof raw !== "string") return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function removeBoilerplateSections(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const kept = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const isBoilerplateHeading =
      /^###\s+How To Write It In Mains\s*$/i.test(line.trim()) ||
      /^###\s+Prelims And Revision Pointers\s*$/i.test(line.trim());

    if (!isBoilerplateHeading) {
      kept.push(line);
      continue;
    }

    index += 1;
    while (index < lines.length && !/^#{1,3}\s+/.test(lines[index].trim())) {
      index += 1;
    }
    index -= 1;
  }

  return kept.join("\n");
}

function removeParagraphsContaining(markdown, phrases) {
  const blocks = markdown.replace(/\r\n/g, "\n").split(/\n{2,}/);
  const kept = blocks.filter((block) => {
    const lower = block.toLowerCase();
    return !phrases.some((phrase) => lower.includes(phrase.toLowerCase()));
  });

  return kept.join("\n\n");
}

function cleanFullNotes(fullNotes) {
  if (typeof fullNotes !== "string" || !fullNotes.trim()) return fullNotes;

  let cleaned = fullNotes;
  cleaned = removeBoilerplateSections(cleaned);
  cleaned = removeParagraphsContaining(cleaned, [
    "avoid generic advice",
    "Topic-Specific Focus: Complete Topic Coverage",
  ]);

  return cleaned
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function fetchBatch(offset) {
  const { data, error } = await supabase
    .from("topics")
    .select("key, structured_notes")
    .order("key", { ascending: true })
    .range(offset, offset + BATCH_SIZE - 1);

  if (error) throw error;
  return data ?? [];
}

let offset = 0;
let scanned = 0;
let cleanedCount = 0;
let skippedCount = 0;
let failedCount = 0;
const failedTopics = [];

while (true) {
  const topics = await fetchBatch(offset);
  if (topics.length === 0) break;

  for (const topic of topics) {
    scanned += 1;

    try {
      const notes = normalizeNotes(topic.structured_notes);
      if (!notes || typeof notes.full_notes !== "string") {
        skippedCount += 1;
        continue;
      }

      const cleanedFullNotes = cleanFullNotes(notes.full_notes);
      if (cleanedFullNotes === notes.full_notes) {
        skippedCount += 1;
        continue;
      }

      const updatedNotes = { ...notes, full_notes: cleanedFullNotes };
      const { error } = await supabase
        .from("topics")
        .update({ structured_notes: updatedNotes })
        .eq("key", topic.key);

      if (error) throw error;
      cleanedCount += 1;
    } catch (error) {
      failedCount += 1;
      failedTopics.push(topic.key);
      console.warn(`[skip] ${topic.key}: ${error.message}`);
    }
  }

  console.log(
    `[progress] scanned ${scanned}; cleaned ${cleanedCount}; skipped ${skippedCount}; failed ${failedCount}`
  );

  offset += BATCH_SIZE;
}

console.log(
  JSON.stringify(
    {
      scanned,
      cleaned: cleanedCount,
      skipped: skippedCount,
      failed: failedCount,
      failedTopics,
    },
    null,
    2
  )
);
