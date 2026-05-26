// Each topic is now chapter-based, not subject-based
export interface ChapterTopic {
  // Identity
  key: string;                    // e.g., "gs1_geo_c11_phys_ch04"
  title: string;                  // "Distribution of Oceans and Continents"

  // Source tracing (THE KEY DIFFERENCE)
  source: {
    book: string;                 // "NCERT Class 11 Fundamentals of Physical Geography"
    chapter: number;              // 4
    chapter_title: string;        // "Distribution of Oceans and Continents"
    pdf_url: string;              // "https://ncert.nic.in/textbook/pdf/kege104.pdf"
    page_range: string;           // "28-42"
  };

  // UPSC metadata
  subject: string;                // "GS1 Geography"
  paper: "prelims" | "mains" | "both";
  upsc_weightage: 1 | 2 | 3 | 4 | 5;
  pyq_count: number;             // How many PYQs trace to this chapter

  // The 4-layer decode for each concept
  concepts: ConceptDecode[];

  // Chapter-level data
  concise_notes: ConciseNote[];
  revision_bullets: string[];
  mcqs: UPSCPatternMCQ[];
  mains_framework: MainsFramework;
  related_chapters: string[];     // Other chapter keys this connects to
}

export interface ConceptDecode {
  concept_name: string;           // "Continental Drift Theory"
  ncert_page: string;             // "28-30"

  // Layer 1: Simple explanation with mechanism-based analogy
  simple_explanation: string;     // >=150 words, explains mechanism

  // Layer 2: Textbook-grade content with full detail
  textbook_content: string;       // >=500 words, all facts with source markers

  // Layer 3: PYQ connections
  pyq_connections: {
    year: number;
    paper: string;
    question_summary: string;
    ncert_line_that_answers: string;
  }[];

  // Layer 4: Quick recall
  recall_card: {
    term: string;
    definition: string;           // <=30 words, precise
    key_fact: string;
    upsc_trap: string;
  };
}

export interface UPSCPatternMCQ {
  question_text: string;
  options: string[];              // Always 4 options
  correct_answer: number;         // 0-3 index

  // MANDATORY fields (the old MCQs didn't have these)
  pattern: "statement" | "match" | "not_type" | "arrange" | "assertion_reason";
  source_trace: string;           // "NCERT Class 11 Phys Geo, Ch 4, pg 31"
  trap_explanation: string;       // Why the wrong option looks correct
  approach_technique: string;     // How to solve in 90 seconds
  difficulty_level: 1 | 2 | 3 | 4 | 5;
  concepts_tested: string[];      // Which concepts from the chapter
}

export interface ConciseNote {
  term: string;
  definition: string;
  source_trace?: string;
}

export interface MainsFramework {
  structure: string[];
  source_trace: string;
}
