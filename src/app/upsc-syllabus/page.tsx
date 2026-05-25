import type { Metadata } from "next";
import { SeoArticle } from "@/components/layout/SeoArticle";

export const metadata: Metadata = {
  title: "UPSC Syllabus 2026 - GS1, GS2, GS3, GS4, CSAT and Essay",
  description: "Structured UPSC CSE syllabus for Prelims and Mains with GS papers, CSAT, Essay and study links.",
};

export default function UpscSyllabusPage() {
  return (
    <SeoArticle eyebrow="UPSC Syllabus" title="UPSC Syllabus 2026: the full map" description="A clean syllabus guide for GS, CSAT and Essay, written for aspirants who want structure before studying.">
      <h2>Prelims</h2>
      <p>Prelims has GS Paper I and CSAT. GS needs static knowledge plus current affairs. CSAT is qualifying but must be practised because comprehension and reasoning can surprise even strong students.</p>
      <h2>Mains GS Papers</h2>
      <table><tbody><tr><td>GS1</td><td>History, society and geography.</td></tr><tr><td>GS2</td><td>Polity, governance, social justice and international relations.</td></tr><tr><td>GS3</td><td>Economy, agriculture, science, environment and internal security.</td></tr><tr><td>GS4</td><td>Ethics, integrity, aptitude and case studies.</td></tr></tbody></table>
      <h2>How to study</h2>
      <p>Pick one topic, read one source, practise questions, add weak facts to flashcards, then mark the topic status. ClearUPSC is built around this loop.</p>
    </SeoArticle>
  );
}
