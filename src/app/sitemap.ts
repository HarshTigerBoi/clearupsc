import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://clearupsc.vercel.app";
  return [
    "",
    "/optional-selector",
    "/practice",
    "/pricing",
    "/upsc-syllabus",
    "/upsc-cutoff",
    "/upsc-optional-subjects",
    "/upsc-answer-writing",
    "/upsc-current-affairs",
    "/tools/eligibility",
    "/tools/study-planner",
    "/privacy",
    "/terms",
    "/refund",
  ].map((path) => ({ url: `${base}${path}`, lastModified: new Date() }));
}
