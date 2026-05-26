import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";
import { NCERT_LIBRARY, ncertForTopic } from "@/lib/study/ncert";
import { getChapterNavigation, getChapterTopic, getLegacyChapterRedirect, type ChapterTopicRecord } from "@/lib/study/ncert-master-index";
import { loadTextbookChapterOverlay, mergeTextbookChapterOverlay } from "@/lib/study/textbook-content-overlays";
import { parseStructuredNotes } from "@/lib/study/notes";

interface WikiSummary {
  extract?: string;
  description?: string;
  content_urls?: { desktop?: { page?: string } };
  thumbnail?: { source?: string };
}

export async function GET(_request: NextRequest, { params }: { params: { topicId: string } }) {
  try {
    const redirectKey = getLegacyChapterRedirect(params.topicId);
    if (redirectKey) {
      return fail(`Legacy topic has moved to /study/${redirectKey}.`, 308, { redirectTo: `/study/${redirectKey}` });
    }
    const chapterTopic = getChapterTopic(params.topicId);
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (chapterTopic) {
      const progress = user ? await getProgress(supabase, user.id, chapterTopic.key) : null;
      const overlay = loadTextbookChapterOverlay(chapterTopic.key);
      const chapterWithOverlay = mergeTextbookChapterOverlay(chapterTopic, overlay);
      return ok(buildChapterTopicPayload(chapterWithOverlay, progress));
    }
    const { data: topic, error } = await supabase
      .from("topics")
      .select("*")
      .eq("key", params.topicId)
      .maybeSingle();
    if (error) throw error;
    if (!topic) return fail("Topic not found.", 404);

    const wikiSlug = String(topic.wiki_slug ?? topic.title).replaceAll(" ", "_");
    const wiki = await getCachedWikiSummary(supabase, String(topic.key), wikiSlug);
    const progress = user ? await getProgress(supabase, user.id, String(topic.key)) : null;
    const mcqs = await getTopicMcqs(supabase, String(topic.key));
    const practiceQuestionCount = await getPracticeQuestionCount(supabase, String(topic.key));
    const pyqs = await getTopicPyqs(supabase, String(topic.key), String(topic.subject));
    const notes = topic.structured_notes || defaultStructuredNotes(String(topic.title), String(topic.subject));
    const notesStructured = parseStructuredNotes(notes, { title: String(topic.title), wikiSummary: wiki?.summary ?? null });
    const siblings = await getSiblingTopics(supabase, String(topic.key), String(topic.subject));
    const quizQuestions = buildQuizQuestions(pyqs, mcqs);
    const ncertRefs = normalizeNcertRefs(topic.ncert_refs, String(topic.key));
    const sources = normalizeSources(topic.govt_sources, String(topic.subject), String(topic.title));
    const contentQuality = inferContentQuality(topic.structured_notes, ncertRefs.length);
    return ok({
      topic: { ...topic, content_quality: topic.content_quality ?? contentQuality },
      wiki,
      ncert: ncertForTopic(String(topic.key)),
      notes,
      notesStructured,
      sources,
      progress,
      mcqs,
      pyqs,
      prevTopic: siblings.prev,
      nextTopic: siblings.next,
      readTime: {
        full: "~45 min full study",
        revision: "~8 min revision",
      },
      ncertRefs,
      quizQuestions,
      practiceQuestionCount,
    });
  } catch {
    return fail("Could not load study topic.", 500);
  }
}

function buildChapterTopicPayload(chapter: ChapterTopicRecord, progress: Awaited<ReturnType<typeof getProgress>>) {
  const navigation = getChapterNavigation(chapter.key);
  const ncertRef = {
    classLevel: chapter.source.book.match(/Class\s+\d+/)?.[0] ?? "NCERT",
    subject: chapter.subject,
    gsPaper: chapter.subject.split(" ")[0],
    book: chapter.source.book,
    chapter: `Chapter ${chapter.source.chapter}: ${chapter.source.chapter_title}`,
    url: chapter.source.pdf_url,
  };
  const pendingLine = `Source decode pending for ${chapter.source.book}, Chapter ${chapter.source.chapter}: ${chapter.source.chapter_title}. Open the official NCERT source before studying this chapter.`;
  return {
    topic: {
      key: chapter.key,
      title: chapter.title,
      subject: chapter.subject,
      parent_key: null,
      exam_stage: chapter.paper,
      upsc_weightage: chapter.upsc_weightage,
      content_quality: chapter.decode_status,
      textbook_first: true,
      decode_status: chapter.decode_status,
      source: chapter.source,
      concepts: chapter.concepts,
      mcqs: chapter.mcqs,
      mains_framework: chapter.mains_framework,
      related_chapters: chapter.related_chapters,
      maps_to_topics: chapter.maps_to_topics,
    },
    wiki: null,
    ncert: [ncertRef],
    notes: pendingLine,
    notesStructured: {
      analogy: {
        heading: "Source Decode Pending",
        body: pendingLine,
      },
      full_notes: pendingLine,
      concise_notes: chapter.concise_notes,
      revision_bullets: chapter.revision_bullets,
      mindmap: {
        center: chapter.title,
        branches: chapter.related_chapters.length ? chapter.related_chapters : ["Source", "Concept map", "Decode", "PYQ trace", "MCQs", "Mains"],
      },
      cases: [],
      schemes: [],
      ncert_coverage: [`${chapter.source.book}, Chapter ${chapter.source.chapter}: ${chapter.source.chapter_title}`, `Page range: ${chapter.source.page_range}`],
      prelims_traps: [],
      mains_angles: chapter.mains_framework.structure,
      connected_topics: chapter.related_chapters,
    },
    sources: [
      {
        name: chapter.source.book,
        url: chapter.source.pdf_url,
        type: `Official NCERT source, chapter ${chapter.source.chapter}, pages ${chapter.source.page_range}`,
      },
    ],
    progress,
    mcqs: chapter.mcqs,
    pyqs: [],
    prevTopic: navigation.prev ? { key: navigation.prev.key, title: navigation.prev.title } : null,
    nextTopic: navigation.next ? { key: navigation.next.key, title: navigation.next.title } : null,
    readTime: {
      full: "Pending source decode",
      revision: "Pending source decode",
    },
    ncertRefs: [ncertRef],
    quizQuestions: [],
    practiceQuestionCount: chapter.mcqs.length,
  };
}

async function getProgress(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, topicKey: string) {
  const enriched = await supabase
    .from("topic_progress")
    .select("status,confidence_score,last_studied_at,next_review_at,ease_factor,review_interval_days,review_count")
    .eq("user_id", userId)
    .eq("topic_key", topicKey)
    .maybeSingle();
  if (!enriched.error) return enriched.data ?? null;
  const { data } = await supabase
    .from("topic_progress")
    .select("status,confidence_score,last_studied_at")
    .eq("user_id", userId)
    .eq("topic_key", topicKey)
    .maybeSingle();
  return data ?? null;
}

async function getPracticeQuestionCount(supabase: Awaited<ReturnType<typeof createClient>>, topicKey: string) {
  const enriched = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("question_type", "mcq")
    .eq("topic_key", topicKey);
  if (!enriched.error) return enriched.count ?? 0;

  const legacy = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("topic_key", topicKey);
  return legacy.count ?? 0;
}

async function getTopicMcqs(supabase: Awaited<ReturnType<typeof createClient>>, topicKey: string) {
  const selectWithSource = "id,question_text,year,tags,source_label,trap_type,explanation,question_options(option_label,option_text,is_correct)";
  const selectLegacy = "id,question_text,year,tags,question_options(option_label,option_text,is_correct)";
  const enriched = await supabase
    .from("questions")
    .select(selectWithSource)
    .eq("question_type", "mcq")
    .eq("topic_key", topicKey)
    .order("id", { ascending: true })
    .limit(10);
  let data = enriched.data as Array<Record<string, any>> | null;
  let error = enriched.error;
  if (error) {
    const legacy = await supabase
      .from("questions")
      .select(selectLegacy)
      .eq("question_type", "mcq")
      .eq("topic_key", topicKey)
      .order("id", { ascending: true })
      .limit(10);
    data = legacy.data;
    error = legacy.error;
  }
  if (error) return [];
  return (data ?? []).map((question) => {
    const options = [...(question.question_options ?? [])].sort((a, b) => String(a.option_label).localeCompare(String(b.option_label)));
    const record = question as typeof question & { source_label?: string | null; trap_type?: string | null; explanation?: string | null };
    return {
      id: question.id,
      year: question.year,
      topicKey,
      question: question.question_text,
      options: options.map((option) => ({ label: option.option_label, text: option.option_text })),
      correct: options.find((option) => option.is_correct)?.option_label ?? "A",
      explanation: record.explanation ?? "Use the syllabus concept first, then eliminate extreme statements and mismatched institutions.",
      sourceLabel: record.source_label ?? "UPSC-pattern practice (ClearUPSC original)",
      trapType: record.trap_type ?? "Concept trap",
      relatedTopicKey: topicKey,
    };
  });
}

async function getTopicPyqs(supabase: Awaited<ReturnType<typeof createClient>>, topicKey: string, _subject: string) {
  const { data, error } = await supabase
    .from("pyq_questions")
    .select("id,year,paper,question_text,options,correct_option,explanation,topics,difficulty,source")
    .contains("topics", [topicKey])
    .order("year", { ascending: false })
    .limit(10);
  if (!error && data?.length) return data;
  return [];
}

async function getSiblingTopics(supabase: Awaited<ReturnType<typeof createClient>>, topicKey: string, subject: string) {
  const query = supabase
    .from("topics")
    .select("key,title,subject,parent_key")
    .eq("subject", subject)
    .order("parent_key", { ascending: true })
    .order("title", { ascending: true });
  const { data, error } = await query.limit(200);
  if (error || !data?.length) return { prev: null, next: null };
  const index = data.findIndex((item) => item.key === topicKey);
  return {
    prev: index > 0 ? { key: data[index - 1].key, title: data[index - 1].title } : null,
    next: index >= 0 && index < data.length - 1 ? { key: data[index + 1].key, title: data[index + 1].title } : null,
  };
}

function buildQuizQuestions(pyqs: Awaited<ReturnType<typeof getTopicPyqs>>, mcqs: Awaited<ReturnType<typeof getTopicMcqs>>) {
  const verifiedPyqs = pyqs
    .filter((question) => question.correct_option !== null)
    .map((question) => ({
      id: question.id,
      source: question.source,
      year: question.year,
      question: question.question_text,
      options: normalizeOptions(question.options).map((text, index) => ({ label: String.fromCharCode(65 + index), text })),
      correct: String.fromCharCode(65 + Number(question.correct_option)),
      explanation: question.explanation,
      reviewOnly: false,
      trapType: String(question.source).toLowerCase().includes("official") ? "Official PYQ" : "UPSC pattern",
      relatedStudyUrl: question.topics?.[0] ? `/study/${question.topics[0]}` : null,
    }));
  const practice = mcqs.map((question) => ({
    id: question.id,
    source: question.sourceLabel,
    year: question.year,
    question: question.question,
    options: question.options,
    correct: question.correct,
    explanation: question.explanation,
    reviewOnly: false,
    trapType: question.trapType,
    relatedStudyUrl: `/study/${question.relatedTopicKey ?? question.topicKey}`,
  }));
  const reviewOnly = pyqs
    .filter((question) => question.correct_option === null)
    .map((question) => ({
      id: question.id,
      source: question.source,
      year: question.year,
      question: question.question_text,
      options: normalizeOptions(question.options).map((text, index) => ({ label: String.fromCharCode(65 + index), text })),
      correct: null,
      explanation: question.explanation,
      reviewOnly: true,
      trapType: "Review only",
      relatedStudyUrl: question.topics?.[0] ? `/study/${question.topics[0]}` : null,
    }));
  return [...verifiedPyqs, ...practice, ...reviewOnly].slice(0, 5);
}

function normalizeNcertRefs(value: unknown, topicKey: string) {
  if (Array.isArray(value)) {
    const objectRefs = value.filter(isNcertObject);
    if (objectRefs.length) return objectRefs;
    const labelRefs = value.map((item) => (typeof item === "string" ? item : "")).filter(Boolean);
    if (labelRefs.length) {
      const matched = NCERT_LIBRARY.filter((chapter) => labelRefs.some((label) => label.includes(chapter.book) || label.includes(chapter.chapter)));
      if (matched.length) return matched;
    }
  }
  return ncertForTopic(topicKey);
}

function isNcertObject(value: unknown): value is ReturnType<typeof ncertForTopic>[number] {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.chapter === "string" && typeof record.url === "string";
}

function normalizeSources(value: unknown, subject: string, title: string) {
  if (Array.isArray(value)) {
    const rows = value.filter((item): item is { name: string; url: string; type: string } => {
      if (!item || typeof item !== "object") return false;
      const record = item as Record<string, unknown>;
      return typeof record.name === "string" && typeof record.url === "string" && typeof record.type === "string";
    });
    if (rows.length) return rows;
  }
  return defaultSources(subject, title);
}

function inferContentQuality(notes: unknown, ncertCount: number) {
  if (typeof notes !== "string" || !notes.trim()) return "fallback";
  if (notes.includes("ClearUPSC 13-year-old NCERT Explainer")) return "publish_ready";
  if (notes.includes("Source-grounded ClearUPSC notes")) return "ncert_enriched";
  if (ncertCount > 0) return "human_review_needed";
  return "wiki_seeded";
}

function normalizeOptions(options: unknown) {
  if (!Array.isArray(options)) return [];
  return options.map((option) => String(option));
}

async function getCachedWikiSummary(supabase: Awaited<ReturnType<typeof createClient>>, topicKey: string, wikiSlug: string) {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: cached } = await supabase
      .from("topic_wiki_cache")
      .select("summary,description,image_url,source_url,attribution,fetched_at")
      .eq("topic_key", topicKey)
      .gte("fetched_at", sevenDaysAgo)
      .maybeSingle();
    if (cached) {
      return {
        summary: cached.summary,
        description: cached.description,
        imageUrl: cached.image_url,
        sourceUrl: cached.source_url,
        attribution: cached.attribution,
      };
    }
  } catch {
    // Schema may not be applied yet; live Wikipedia still keeps the page usable.
  }
  const wiki = await fetchWikiSummary(wikiSlug);
  if (wiki) {
    try {
      await supabase.from("topic_wiki_cache").upsert({
        topic_key: topicKey,
        wiki_slug: wikiSlug,
        summary: wiki.summary,
        description: wiki.description,
        image_url: wiki.imageUrl,
        source_url: wiki.sourceUrl,
        attribution: wiki.attribution,
        fetched_at: new Date().toISOString(),
      });
    } catch {
      // Cache writes are best effort.
    }
  }
  return wiki;
}

async function fetchWikiSummary(slug: string) {
  try {
    const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}`, { next: { revalidate: 604800 } });
    if (!response.ok) return null;
    const data = (await response.json()) as WikiSummary;
    return {
      summary: data.extract ?? "",
      description: data.description ?? "",
      imageUrl: data.thumbnail?.source ?? "",
      sourceUrl: data.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(slug)}`,
      attribution: "Source: Wikipedia, CC BY-SA.",
    };
  } catch {
    return null;
  }
}

function defaultStructuredNotes(title: string, subject: string) {
  return [
    `Intro: ${title} is a core ${subject} topic and should be prepared for both factual recall and analytical answer writing.`,
    "Key facts: define the concept, remember constitutional/articles/scheme links where relevant, and connect the topic with current affairs.",
    "Prelims traps: watch for absolute words, incorrect chronology, mismatched institutions, and partially true statements.",
    "Mains angle: write in introduction-body-conclusion format, add examples, and conclude with governance relevance.",
    "Next step: read the NCERT/reference link, attempt MCQs, then create one flashcard for the weakest fact.",
  ].join("\n\n");
}

function defaultSources(subject: string, title: string) {
  const lower = `${subject} ${title}`.toLowerCase();
  const sources = [
    { name: "PIB", url: "https://pib.gov.in/", type: "Government releases and schemes" },
    { name: "PRS India", url: "https://prsindia.org/", type: "Bills, Acts and policy briefs" },
  ];
  if (lower.includes("environment") || lower.includes("ecology") || lower.includes("climate")) {
    sources.push({ name: "MoEFCC", url: "https://moef.gov.in/", type: "Environment reports and notifications" });
  }
  if (lower.includes("economy") || lower.includes("budget") || lower.includes("tax") || lower.includes("bank")) {
    sources.push({ name: "Economic Survey", url: "https://www.indiabudget.gov.in/economicsurvey/", type: "Economy data and analysis" });
  }
  if (lower.includes("international") || lower.includes("ir") || lower.includes("foreign")) {
    sources.push({ name: "MEA", url: "https://www.mea.gov.in/", type: "Foreign policy source" });
  }
  if (lower.includes("judiciary") || lower.includes("rights") || lower.includes("constitution")) {
    sources.push({ name: "Supreme Court of India", url: "https://www.sci.gov.in/", type: "Judgments and institutional updates" });
  }
  return sources;
}
