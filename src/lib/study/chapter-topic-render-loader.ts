import fs from "node:fs";
import path from "node:path";
import type { ChapterTopic } from "@/lib/types/ncert-types";
import { getChapterTopic, type ChapterTopicRecord } from "@/lib/study/ncert-master-index";

const LOCAL_CHAPTER_DIRS = [
  path.join(process.cwd(), "src", "data", "chapters"),
  path.join(process.cwd(), "data", "study", "textbook-first", "chapters"),
];

export function resolveChapterTopicRoute(subject: string, classLevel: string, chapter: string) {
  const cleanSubject = cleanSegment(subject);
  const cleanClass = cleanSegment(classLevel);
  const cleanChapter = cleanSegment(chapter);
  const candidates = [
    `${cleanSubject}_${cleanClass}_${cleanChapter}`,
    `${cleanSubject}_${cleanClass}_ch${cleanChapter.replace(/^ch/i, "")}`,
    cleanChapter,
  ];

  for (const candidate of candidates) {
    const local = loadLocalChapterTopic(candidate);
    if (local) return local;
    const scaffold = getChapterTopic(candidate);
    if (scaffold) return chapterRecordToChapterTopic(scaffold);
  }

  return null;
}

export function loadLocalChapterTopic(key: string): ChapterTopic | null {
  for (const dir of LOCAL_CHAPTER_DIRS) {
    const filePath = path.join(dir, `${key}.json`);
    if (!fs.existsSync(filePath)) continue;
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as ChapterTopic;
    return parsed;
  }
  return null;
}

export function chapterRecordToChapterTopic(record: ChapterTopicRecord): ChapterTopic {
  return {
    key: record.key,
    title: record.title,
    source: record.source,
    subject: record.subject,
    paper: record.paper,
    upsc_weightage: record.upsc_weightage,
    pyq_count: record.pyq_count,
    concepts: record.concepts,
    concise_notes: record.concise_notes,
    revision_bullets: record.revision_bullets,
    mcqs: record.mcqs,
    mains_framework: record.mains_framework,
    related_chapters: record.related_chapters,
  };
}

function cleanSegment(segment: string) {
  return decodeURIComponent(segment).trim().replaceAll("-", "_").replace(/\s+/g, "_").toLowerCase();
}
