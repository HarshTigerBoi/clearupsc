"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import ProductShell from "@/components/product/ProductShell";

interface NoteRow { id: string; title: string; content: string; tags: string[]; topic_key?: string; updated_at: string }

export default function NotesPage() {
  const client = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const notesQuery = useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      const response = await fetch("/api/notes");
      if (!response.ok) throw new Error("Notes unavailable");
      return (await response.json()) as { notes: NoteRow[] };
    },
  });
  const [localNotes, setLocalNotes] = useState<NoteRow[]>([]);
  useEffect(() => {
    const saved = window.localStorage.getItem("clearupsc_local_notes");
    if (saved) setLocalNotes(JSON.parse(saved) as NoteRow[]);
  }, []);
  const save = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, content, tags: [] }) });
      if (!response.ok) throw new Error("Could not save note");
    },
    onSuccess: () => {
      setTitle("");
      setContent("");
      client.invalidateQueries({ queryKey: ["notes"] });
    },
    onError: () => {
      const note: NoteRow = { id: `local-${Date.now()}`, title, content, tags: [], updated_at: new Date().toISOString() };
      const next = [note, ...localNotes];
      setLocalNotes(next);
      window.localStorage.setItem("clearupsc_local_notes", JSON.stringify(next));
      setTitle("");
      setContent("");
    },
  });
  const notes = notesQuery.data?.notes?.length ? notesQuery.data.notes : localNotes;

  return (
    <ProductShell>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader eyebrow="Notes" title="Consolidated notes linked to your syllabus." description="Make short, searchable notes instead of collecting disconnected PDFs." />
        <div className="mt-6 grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="font-black text-[#1a2744]">All notes</h2>
            <div className="mt-4 space-y-3">
              {notes.map((note) => (
                <article key={note.id} className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-black text-slate-900">{note.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">{note.content}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black text-[#1a2744]">New note</h2>
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Note title" className="mt-4 min-h-12 w-full rounded-2xl border border-slate-200 px-4 font-bold outline-none focus:border-[#f97316]" />
            <textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="Write crisp points, examples, diagrams to remember..." className="mt-4 min-h-72 w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-[#f97316]" />
            <button disabled={!title || !content || save.isPending} onClick={() => save.mutate()} className="mt-4 min-h-12 rounded-full bg-[#f97316] px-5 font-black text-white disabled:opacity-50">Save note</button>
            <p className="mt-3 text-xs text-slate-500">If Supabase notes table is not migrated yet, notes are saved locally in this browser.</p>
          </div>
        </div>
      </section>
    </ProductShell>
  );
}
