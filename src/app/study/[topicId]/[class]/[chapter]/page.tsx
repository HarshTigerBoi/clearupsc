import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductShell from "@/components/product/ProductShell";
import ChapterTopicRenderEngine from "@/components/study/ChapterTopicRenderEngine";
import { resolveChapterTopicRoute } from "@/lib/study/chapter-topic-render-loader";

interface ChapterRoutePageProps {
  params: {
    topicId: string;
    class: string;
    chapter: string;
  };
}

function loadChapter(params: ChapterRoutePageProps["params"]) {
  return resolveChapterTopicRoute(params.topicId, params.class, params.chapter);
}

export function generateMetadata({ params }: ChapterRoutePageProps): Metadata {
  const chapter = loadChapter(params);
  if (!chapter) {
    return {
      title: "NCERT Chapter | ClearUPSC",
      description: "ClearUPSC NCERT chapter study page.",
    };
  }

  return {
    title: `${chapter.title} | NCERT Chapter | ClearUPSC`,
    description: `Study ${chapter.title} from ${chapter.source.book}, Chapter ${chapter.source.chapter}.`,
  };
}

export default function ChapterRoutePage({ params }: ChapterRoutePageProps) {
  const chapter = loadChapter(params);
  if (!chapter) notFound();

  return (
    <ProductShell>
      <ChapterTopicRenderEngine chapter={chapter} />
    </ProductShell>
  );
}
