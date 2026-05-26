import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getChapterTopic, getLegacyChapterRedirect } from "@/lib/study/ncert-master-index";
import StudyTopicClient from "./StudyTopicClient";

type StudyTopicPageProps = { params: { topicId: string } };

async function getTopicMeta(topicId: string) {
  const chapter = getChapterTopic(topicId);
  if (chapter) return chapter.title;
  const redirectKey = getLegacyChapterRedirect(topicId);
  if (redirectKey) return getChapterTopic(redirectKey)?.title ?? topicId.replaceAll("_", " ");
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("topics").select("title").eq("key", topicId).maybeSingle();
    return data?.title ? String(data.title) : topicId.replaceAll("_", " ");
  } catch {
    return topicId.replaceAll("_", " ");
  }
}

export async function generateMetadata({ params }: StudyTopicPageProps): Promise<Metadata> {
  const title = await getTopicMeta(params.topicId);
  const description = `Complete UPSC notes for ${title}. Includes easy explanation, full notes, MCQs, NCERT references, and revision bullets.`;

  return {
    title: `${title} - UPSC Notes | ClearUPSC`,
    description,
    openGraph: {
      title: `${title} - UPSC Notes`,
      description: `Study ${title} for UPSC with ClearUPSC. Free, complete, exam-ready.`,
    },
  };
}

export default function StudyTopicPage({ params }: StudyTopicPageProps) {
  const redirectKey = getLegacyChapterRedirect(params.topicId);
  if (redirectKey) redirect(`/study/${redirectKey}`);
  return <StudyTopicClient params={params} />;
}
