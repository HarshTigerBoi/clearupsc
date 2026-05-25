import type { Metadata } from "next";
import { SeoArticle } from "@/components/layout/SeoArticle";

export const metadata: Metadata = { title: "UPSC Optional Subject Selector - Which Optional is Best?", description: "Guide to choosing a UPSC optional subject based on interest, overlap, background and resources." };

export default function OptionalSubjectsPage() {
  return (
    <SeoArticle eyebrow="Optional" title="How to choose your UPSC optional subject" description="The best optional is not the most popular one. It is the one you can revise deeply and write with confidence.">
      <h2>Four decision filters</h2>
      <ul><li>Interest over 12 months.</li><li>Overlap with GS and Essay.</li><li>Availability of good resources and test series.</li><li>Your background and writing comfort.</li></ul>
      <p>Use the free ClearUPSC optional selector for a structured recommendation.</p>
    </SeoArticle>
  );
}
