import type { Metadata } from "next";
import { SeoArticle } from "@/components/layout/SeoArticle";

export const metadata: Metadata = { title: "UPSC Cutoff - Historical Cutoff Trend", description: "UPSC cutoff trend guide with preparation meaning for aspirants." };

export default function UpscCutoffPage() {
  return (
    <SeoArticle eyebrow="Cutoff" title="UPSC cutoff: use it as a benchmark, not fear" description="Cutoffs help you set mock-test targets and understand the margin of safety needed before Prelims.">
      <table><tbody><tr><th>Stage</th><th>Preparation meaning</th></tr><tr><td>Prelims</td><td>Build a mock-test buffer above the recent general-category cutoff trend.</td></tr><tr><td>Mains</td><td>Consistency across GS, Essay and Optional matters more than one brilliant paper.</td></tr><tr><td>Interview</td><td>DAF clarity and calm answers can convert a written-score advantage into rank.</td></tr></tbody></table>
      <p>Use ClearUPSC mock analytics to track whether your estimated score has a safety buffer.</p>
    </SeoArticle>
  );
}
