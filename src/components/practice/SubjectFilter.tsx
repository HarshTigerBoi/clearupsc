"use client";

import { cn } from "@/lib/utils";

const subjects = ["All", "GS1", "GS2", "GS3", "GS4", "CSAT", "Essay", "History", "Polity", "Economy", "Environment", "Science", "Ethics"];

export function SubjectFilter({
  selectedSubject,
  onSelect,
}: {
  selectedSubject: string;
  onSelect: (subject: string) => void;
}) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
      {subjects.map((subject) => (
        <button
          key={subject}
          className={cn(
            "min-h-11 shrink-0 rounded-full border px-4 text-sm font-bold transition",
            selectedSubject === subject
              ? "border-[#1a2744] bg-[#1a2744] text-white"
              : "border-[#e2e8f0] bg-white text-slate-700 hover:border-[#f97316] hover:text-[#f97316]",
          )}
          onClick={() => onSelect(subject)}
        >
          {subject}
        </button>
      ))}
    </div>
  );
}
