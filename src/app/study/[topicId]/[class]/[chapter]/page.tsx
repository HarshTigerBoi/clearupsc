import Link from "next/link";
import ProductShell from "@/components/product/ProductShell";

interface ChapterRoutePageProps {
  params: {
    topicId: string;
    class: string;
    chapter: string;
  };
}

function labelFromSegment(segment: string) {
  return decodeURIComponent(segment).replaceAll("-", " ").replaceAll("_", " ");
}

export default function ChapterRoutePage({ params }: ChapterRoutePageProps) {
  const classLevel = params.class;
  const routeLabel = `${labelFromSegment(params.topicId)} / ${labelFromSegment(classLevel)} / ${labelFromSegment(params.chapter)}`;

  return (
    <ProductShell>
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">NCERT Chapter Route</p>
          <h1 className="mt-3 text-3xl font-black text-[#1a2744]">{routeLabel}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">Source decode pending.</p>
          <div className="mt-6 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-700 sm:grid-cols-3">
            <div>
              <p className="font-black text-slate-900">Subject</p>
              <p className="mt-1">{labelFromSegment(params.topicId)}</p>
            </div>
            <div>
              <p className="font-black text-slate-900">Class</p>
              <p className="mt-1">{labelFromSegment(classLevel)}</p>
            </div>
            <div>
              <p className="font-black text-slate-900">Chapter</p>
              <p className="mt-1">{labelFromSegment(params.chapter)}</p>
            </div>
          </div>
          <Link href="/study" className="mt-6 inline-flex min-h-11 items-center rounded-md bg-[#1a2744] px-4 text-sm font-black text-white">
            Back to Study
          </Link>
        </div>
      </main>
    </ProductShell>
  );
}
