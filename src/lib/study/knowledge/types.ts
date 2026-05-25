/** Shape of curated knowledge for a single UPSC topic. */
export interface TopicKnowledge {
  key: string;
  title: string;
  subject: string;
  /** Simple analogy a 13-year-old would understand. */
  analogy: string;
  /** 200-400 word beginner-friendly explanation. */
  easyExplanation: string;
  /** 800-1500 word full study notes with headers, facts, dates, articles. */
  fullNotes: string;
  /** 8-15 key terms with short memorisable definitions. */
  conciseNotes: Array<{ term: string; definition: string }>;
  /** 8-10 last-night revision bullets – the most exam-worthy facts. */
  revisionBullets: string[];
  /** Supreme Court cases relevant for UPSC. */
  cases: Array<{ name: string; point: string }>;
  /** Government schemes, missions, reports, committees. */
  schemes: Array<{ name: string; point: string }>;
  /** Constitutional articles, acts, or provisions. */
  articles: string[];
  /** Key facts: dates, numbers, institutions. */
  keyFacts: string[];
  /** Common UPSC traps for Prelims. */
  prelimsTraps: string[];
  /** Mains answer angles and frameworks. */
  mainsAngles: string[];
  /** 6 branches for the visual mindmap. */
  mindmapBranches: string[];
  /** Related topic keys for cross-linking. */
  relatedTopics: string[];
}
