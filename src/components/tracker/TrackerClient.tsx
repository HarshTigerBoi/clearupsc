"use client";

import { useMemo, useState } from "react";
import { Accordion } from "@/components/ui/accordion";
import { ProgressBar } from "./ProgressBar";
import { SubjectAccordion } from "./SubjectAccordion";
import { createClient } from "@/lib/supabase/client";
import type { Topic, TopicProgressRecord, TopicStatus } from "@/types";

const subjects = ["GS1", "GS2", "GS3", "GS4", "CSAT", "Essay"] as const;
const completedStatuses: TopicStatus[] = ["done", "completed"];

export function TrackerClient({ userId, topics, progress }: { userId: string | null; topics: Topic[]; progress: TopicProgressRecord[] }) {
  const [statuses, setStatuses] = useState<Record<string, TopicStatus>>(() => {
    if (typeof window !== "undefined" && !userId) {
      const saved = window.localStorage.getItem("clearupsc_guest_topic_progress");
      if (saved) return JSON.parse(saved) as Record<string, TopicStatus>;
    }
    return Object.fromEntries(progress.map((item) => [item.topic_key, item.status]));
  });
  const [error, setError] = useState("");

  const overall = useMemo(() => {
    const done = topics.filter((topic) => completedStatuses.includes(statuses[topic.key] ?? "not_started")).length;
    return Math.round((done / Math.max(1, topics.length)) * 100);
  }, [statuses, topics]);

  async function updateStatus(topicKey: string, status: TopicStatus) {
    setError("");
    const previous = statuses[topicKey] ?? "not_started";
    const nextStatuses = { ...statuses, [topicKey]: status };
    setStatuses(nextStatuses);

    if (!userId) {
      window.localStorage.setItem("clearupsc_guest_topic_progress", JSON.stringify(nextStatuses));
      return;
    }

    const supabase = createClient();
    const { error: upsertError } = await supabase.from("topic_progress").upsert({
      user_id: userId,
      topic_key: topicKey,
      status,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,topic_key" });

    if (upsertError) {
      setStatuses((current) => ({ ...current, [topicKey]: previous }));
      setError("Could not save progress. Check Supabase table and RLS setup.");
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-xl bg-[#1a2744] p-6 text-white">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-orange-300">Syllabus Tracker</p>
        <h1 className="mt-3 text-3xl font-extrabold">Your Syllabus Progress</h1>
        <div className="mt-5">
          <div className="mb-2 flex justify-between text-sm font-bold">
            <span>Overall completion</span>
            <span>{overall}%</span>
          </div>
          <ProgressBar value={overall} />
        </div>
      </div>
      {error ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p> : null}
      <Accordion type="multiple" className="mt-6 space-y-4">
        {subjects.map((subject) => {
          const subjectTopics = topics.filter((topic) => topic.subject === subject);
          const done = subjectTopics.filter((topic) => completedStatuses.includes(statuses[topic.key] ?? "not_started")).length;
          const subjectProgress = (done / Math.max(1, subjectTopics.length)) * 100;
          return (
            <SubjectAccordion
              key={subject}
              subject={subject}
              topics={subjectTopics}
              statuses={statuses}
              progress={subjectProgress}
              onStatusChange={updateStatus}
            />
          );
        })}
      </Accordion>
    </div>
  );
}
