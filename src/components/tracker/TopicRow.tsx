"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import type { Topic, TopicStatus } from "@/types";

const statuses: { value: TopicStatus; label: string; className: string }[] = [
  { value: "not_started", label: "Not Started", className: "bg-slate-100 text-slate-700" },
  { value: "in_progress", label: "In Progress", className: "bg-amber-100 text-amber-700" },
  { value: "completed", label: "Completed", className: "bg-green-100 text-green-700" },
  { value: "needs_revision", label: "Needs Revision", className: "bg-red-100 text-red-700" },
];

export function TopicRow({ topic, status, onChange }: { topic: Topic; status: TopicStatus; onChange: (status: TopicStatus) => void }) {
  return (
    <div className="flex flex-col gap-3 border-t border-[#e2e8f0] py-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h4 className="font-semibold text-[#1a2744]">{topic.title}</h4>
        {topic.parent ? <p className="mt-1 text-xs uppercase tracking-[0.08em] text-[#64748b]">{topic.parent.replaceAll("_", " ")}</p> : null}
        <Link href={`/study/${topic.key}`} className="mt-2 inline-flex min-h-9 items-center gap-2 rounded-full bg-orange-50 px-3 text-xs font-black text-[#f97316]">
          <BookOpen className="h-3.5 w-3.5" /> Study this topic
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        {statuses.map((item) => (
          <button
            key={item.value}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
              status === item.value ? item.className : "bg-white text-slate-500 ring-1 ring-[#e2e8f0] hover:bg-slate-50"
            }`}
            onClick={() => onChange(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
