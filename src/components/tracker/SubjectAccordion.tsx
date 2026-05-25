"use client";

import { ChevronDown } from "lucide-react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ProgressBar } from "./ProgressBar";
import { TopicRow } from "./TopicRow";
import type { Topic, TopicStatus } from "@/types";

export function SubjectAccordion({
  subject,
  topics,
  statuses,
  progress,
  onStatusChange,
}: {
  subject: string;
  topics: Topic[];
  statuses: Record<string, TopicStatus>;
  progress: number;
  onStatusChange: (topicKey: string, status: TopicStatus) => void;
}) {
  return (
    <AccordionItem value={subject} className="rounded-xl border border-[#e2e8f0] bg-white px-5 shadow-sm">
      <AccordionTrigger className="flex w-full items-center justify-between gap-4 py-5 text-left">
        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold text-[#1a2744]">{subject}</h2>
            <span className="text-sm font-bold text-[#f97316]">{Math.round(progress)}%</span>
          </div>
          <div className="mt-3"><ProgressBar value={progress} /></div>
          <p className="mt-2 text-xs text-[#64748b]">{topics.length} topics</p>
        </div>
        <ChevronDown className="shrink-0 text-[#64748b]" size={20} />
      </AccordionTrigger>
      <AccordionContent>
        {topics.map((topic) => (
          <TopicRow key={topic.key} topic={topic} status={statuses[topic.key] ?? "not_started"} onChange={(status) => onStatusChange(topic.key, status)} />
        ))}
      </AccordionContent>
    </AccordionItem>
  );
}
