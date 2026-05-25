import type { Metadata } from "next";
import { SeoArticle } from "@/components/layout/SeoArticle";

export const metadata: Metadata = { title: "UPSC Answer Writing Tips - IBC Format with Examples", description: "Learn UPSC Mains answer writing using introduction-body-conclusion structure and examiner-friendly presentation." };

export default function AnswerWritingSeoPage() {
  return (
    <SeoArticle eyebrow="Answer Writing" title="UPSC answer writing: the IBC method" description="Mains answers need structure, relevance and examples. The simplest reliable frame is Introduction, Body and Conclusion.">
      <h2>IBC format</h2>
      <p><strong>Introduction:</strong> define the demand of the question. <strong>Body:</strong> answer in dimensions with examples. <strong>Conclusion:</strong> end with constitutional, governance or ethical direction.</p>
      <h2>Common mistakes</h2>
      <ul><li>Writing notes instead of answering the question.</li><li>No headings or poor flow.</li><li>Too many facts, too little analysis.</li></ul>
    </SeoArticle>
  );
}
