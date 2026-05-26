// Textbook-first source architecture. Do not place generated lesson prose here.

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
}

export interface MainsFramework {
  framework_type:
    | "geography_physical"
    | "geography_human"
    | "history_ancient_medieval"
    | "history_modern"
    | "polity"
    | "economy"
    | "environment"
    | "ethics"
    | "essay"
    | "pending_source_decode";
  structure: string[];
  pyq_examples: Array<{
    year: number;
    question_summary: string;
    source_trace: string;
  }>;
  source_trace: string;
}

export type DecodeStatus = "pending_source_decode" | "in_review" | "source_verified";
export type SourceKind = "ncert" | "public_domain";
export type PriorityBand = 1 | 2 | 3 | 4;

export interface PublicDomainSourceTrace {
  source_name: string;
  source_url: string;
  section_or_page: string;
  source_type:
    | "government_website"
    | "government_report"
    | "court_judgment"
    | "international_public_domain"
    | "official_statistics";
}

export type ChapterTopicRecord = ChapterTopic & {
  decode_status: DecodeStatus;
  source_kind: SourceKind;
  source_status?: "official_chapter_pdf_verified" | "official_book_source_verified_page_range_pending";
  priority_band: PriorityBand;
  maps_to_topics: string[];
  legacy_topic_keys: string[];
  public_domain_sources?: PublicDomainSourceTrace[];
};

export const ALLOWED_PUBLIC_DOMAIN_SOURCE_HOSTS = [
  "pib.gov.in",
  "india.gov.in",
  "legislative.gov.in",
  "sci.gov.in",
  "indiabudget.gov.in",
  "publicationsdivision.nic.in",
  "darpg.gov.in",
  "niti.gov.in",
  "fsi.nic.in",
  "un.org",
  "ipcc.ch",
  "worldbank.org",
  "who.int",
  "rbi.org.in",
  "mea.gov.in",
  "moef.gov.in",
] as const;

export const BANNED_MCQ_PATTERNS = [
  "Which term means",
  "Which definition is correct",
  "is best described as",
  "Which is associated with",
] as const;

export const KILL_PHRASES = [
  "is best understood through the concrete syllabus area",
  "a map location, an article number, a law",
  "constitutional values, inclusion, and accountability",
  "definition, institutions, and current reforms",
] as const;

export const SHORT_THINK_OF_TEMPLATE = /\bThink of\s+[^.?!]{1,80}\s+like\b/i;

const pendingMainsFramework = (frameworkType: MainsFramework["framework_type"], structure: string[], sourceTrace: string): MainsFramework => ({
  framework_type: frameworkType,
  structure,
  pyq_examples: [],
  source_trace: sourceTrace,
});

const ncertChapter = (topic: Omit<ChapterTopicRecord, "decode_status" | "source_kind" | "concepts" | "concise_notes" | "revision_bullets" | "mcqs">): ChapterTopicRecord => ({
  ...topic,
  decode_status: "pending_source_decode",
  source_kind: "ncert",
  source_status: topic.source_status ?? "official_chapter_pdf_verified",
  concepts: [],
  concise_notes: [],
  revision_bullets: [],
  mcqs: [],
});

const CORE_NCERT_CHAPTER_TOPICS: ChapterTopicRecord[] = [
  ncertChapter({
    key: "gs1_geo_class11_phys_ch01_geography_as_discipline",
    title: "Geography as a Discipline",
    source: {
      book: "NCERT Class 11 Fundamentals of Physical Geography",
      chapter: 1,
      chapter_title: "Geography as a Discipline",
      pdf_url: "https://ncert.nic.in/textbook/pdf/kegy201.pdf",
      page_range: "1-8",
    },
    subject: "GS1 Geography",
    paper: "both",
    upsc_weightage: 3,
    pyq_count: 0,
    mains_framework: pendingMainsFramework("geography_human", ["Pattern", "Cause", "Regional variation", "Data", "Government intervention", "Evaluation"], "NCERT Class 11 Fundamentals of Physical Geography, Chapter 1"),
    related_chapters: ["gs1_geo_class11_phys_ch02_origin_evolution_earth"],
    priority_band: 3,
    maps_to_topics: ["gs1_geography", "gs1_geography_physical"],
    legacy_topic_keys: ["gs1_geography", "gs1_geography_physical"],
  }),
  ncertChapter({
    key: "gs1_geo_class11_phys_ch02_origin_evolution_earth",
    title: "The Origin and Evolution of the Earth",
    source: {
      book: "NCERT Class 11 Fundamentals of Physical Geography",
      chapter: 2,
      chapter_title: "The Origin and Evolution of the Earth",
      pdf_url: "https://ncert.nic.in/textbook/pdf/kegy202.pdf",
      page_range: "9-18",
    },
    subject: "GS1 Geography",
    paper: "both",
    upsc_weightage: 4,
    pyq_count: 0,
    mains_framework: pendingMainsFramework("geography_physical", ["Process", "Mechanism", "Indian location", "Map reference", "Human impact", "Current challenge"], "NCERT Class 11 Fundamentals of Physical Geography, Chapter 2"),
    related_chapters: ["gs1_geo_class11_phys_ch03_interior_of_earth"],
    priority_band: 1,
    maps_to_topics: ["gs1_geography_physical", "gs1_geography_earth"],
    legacy_topic_keys: ["gs1_geography_physical"],
  }),
  ncertChapter({
    key: "gs1_geo_class11_phys_ch03_interior_of_earth",
    title: "Interior of the Earth",
    source: {
      book: "NCERT Class 11 Fundamentals of Physical Geography",
      chapter: 3,
      chapter_title: "Interior of the Earth",
      pdf_url: "https://ncert.nic.in/textbook/pdf/kegy203.pdf",
      page_range: "19-27",
    },
    subject: "GS1 Geography",
    paper: "both",
    upsc_weightage: 5,
    pyq_count: 0,
    mains_framework: pendingMainsFramework("geography_physical", ["Process", "Mechanism", "Indian location", "Map reference", "Human impact", "Current challenge"], "NCERT Class 11 Fundamentals of Physical Geography, Chapter 3"),
    related_chapters: ["gs1_geo_class11_phys_ch04_distribution_oceans_continents"],
    priority_band: 1,
    maps_to_topics: ["gs1_geography_physical", "gs1_geography_geomorphology"],
    legacy_topic_keys: ["gs1_geography_geomorphology"],
  }),
  ncertChapter({
    key: "gs1_geo_class11_phys_ch04_distribution_oceans_continents",
    title: "Distribution of Oceans and Continents",
    source: {
      book: "NCERT Class 11 Fundamentals of Physical Geography",
      chapter: 4,
      chapter_title: "Distribution of Oceans and Continents",
      pdf_url: "https://ncert.nic.in/textbook/pdf/kegy204.pdf",
      page_range: "28-42",
    },
    subject: "GS1 Geography",
    paper: "both",
    upsc_weightage: 5,
    pyq_count: 0,
    mains_framework: pendingMainsFramework("geography_physical", ["Process", "Mechanism", "Indian location", "Map reference", "Human impact", "Current challenge"], "NCERT Class 11 Fundamentals of Physical Geography, Chapter 4"),
    related_chapters: ["gs1_geo_class11_phys_ch03_interior_of_earth", "gs1_geo_class11_phys_ch06_geomorphic_processes"],
    priority_band: 1,
    maps_to_topics: ["gs1_geography_plate_tectonics", "gs1_geography_earthquakes", "gs1_geography_physical"],
    legacy_topic_keys: ["gs1_geography_physical", "gs1_geography_geomorphology"],
  }),
  ncertChapter({
    key: "gs1_geo_class11_phys_ch05_minerals_and_rocks",
    title: "Minerals and Rocks",
    source: {
      book: "NCERT Class 11 Fundamentals of Physical Geography",
      chapter: 5,
      chapter_title: "Minerals and Rocks",
      pdf_url: "https://ncert.nic.in/textbook/pdf/kegy205.pdf",
      page_range: "43-56",
    },
    subject: "GS1 Geography",
    paper: "both",
    upsc_weightage: 4,
    pyq_count: 0,
    mains_framework: pendingMainsFramework("geography_physical", ["Process", "Mechanism", "Indian location", "Map reference", "Human impact", "Current challenge"], "NCERT Class 11 Fundamentals of Physical Geography, Chapter 5"),
    related_chapters: ["gs1_geo_class11_phys_ch06_geomorphic_processes"],
    priority_band: 1,
    maps_to_topics: ["gs1_geography_physical", "gs1_geography_resources"],
    legacy_topic_keys: ["gs1_geography_resources"],
  }),
  ncertChapter({
    key: "gs1_geo_class11_phys_ch06_geomorphic_processes",
    title: "Geomorphic Processes",
    source: {
      book: "NCERT Class 11 Fundamentals of Physical Geography",
      chapter: 6,
      chapter_title: "Geomorphic Processes",
      pdf_url: "https://ncert.nic.in/textbook/pdf/kegy206.pdf",
      page_range: "57-70",
    },
    subject: "GS1 Geography",
    paper: "both",
    upsc_weightage: 5,
    pyq_count: 0,
    mains_framework: pendingMainsFramework("geography_physical", ["Process", "Mechanism", "Indian location", "Map reference", "Human impact", "Current challenge"], "NCERT Class 11 Fundamentals of Physical Geography, Chapter 6"),
    related_chapters: ["gs1_geo_class11_phys_ch07_landforms_evolution"],
    priority_band: 1,
    maps_to_topics: ["gs1_geography_geomorphology", "gs1_geography_physical"],
    legacy_topic_keys: ["gs1_geography_geomorphology", "gs1_geography_physical"],
  }),
  ncertChapter({
    key: "gs1_geo_class11_phys_ch07_landforms_evolution",
    title: "Landforms and their Evolution",
    source: {
      book: "NCERT Class 11 Fundamentals of Physical Geography",
      chapter: 7,
      chapter_title: "Landforms and their Evolution",
      pdf_url: "https://ncert.nic.in/textbook/pdf/kegy207.pdf",
      page_range: "71-88",
    },
    subject: "GS1 Geography",
    paper: "both",
    upsc_weightage: 5,
    pyq_count: 0,
    mains_framework: pendingMainsFramework("geography_physical", ["Process", "Mechanism", "Indian location", "Map reference", "Human impact", "Current challenge"], "NCERT Class 11 Fundamentals of Physical Geography, Chapter 7"),
    related_chapters: ["gs1_geo_class11_phys_ch06_geomorphic_processes"],
    priority_band: 1,
    maps_to_topics: ["gs1_geography_geomorphology", "gs1_geography_physical"],
    legacy_topic_keys: ["gs1_geography_geomorphology"],
  }),
  ncertChapter({
    key: "gs1_geo_class11_india_ch01_location",
    title: "India: Location",
    source: {
      book: "NCERT Class 11 India Physical Environment",
      chapter: 1,
      chapter_title: "India: Location",
      pdf_url: "https://ncert.nic.in/textbook/pdf/kegy101.pdf",
      page_range: "1-8",
    },
    subject: "GS1 Geography",
    paper: "both",
    upsc_weightage: 4,
    pyq_count: 0,
    mains_framework: pendingMainsFramework("geography_physical", ["Process", "Mechanism", "Indian location", "Map reference", "Human impact", "Current challenge"], "NCERT Class 11 India Physical Environment, Chapter 1"),
    related_chapters: ["gs1_geo_class11_india_ch02_structure_physiography"],
    priority_band: 1,
    maps_to_topics: ["gs1_geography_india", "gs1_geography_indian_geography"],
    legacy_topic_keys: ["gs1_geography_india", "gs1_geography_indian_geography"],
  }),
  ncertChapter({
    key: "gs1_geo_class11_india_ch02_structure_physiography",
    title: "Structure and Physiography",
    source: {
      book: "NCERT Class 11 India Physical Environment",
      chapter: 2,
      chapter_title: "Structure and Physiography",
      pdf_url: "https://ncert.nic.in/textbook/pdf/kegy102.pdf",
      page_range: "9-24",
    },
    subject: "GS1 Geography",
    paper: "both",
    upsc_weightage: 5,
    pyq_count: 0,
    mains_framework: pendingMainsFramework("geography_physical", ["Process", "Mechanism", "Indian location", "Map reference", "Human impact", "Current challenge"], "NCERT Class 11 India Physical Environment, Chapter 2"),
    related_chapters: ["gs1_geo_class11_india_ch03_drainage_system"],
    priority_band: 1,
    maps_to_topics: ["gs1_geography_india", "gs1_geography_indian_geography"],
    legacy_topic_keys: ["gs1_geography_indian_geography"],
  }),
  ncertChapter({
    key: "gs1_geo_class11_india_ch03_drainage_system",
    title: "Drainage System",
    source: {
      book: "NCERT Class 11 India Physical Environment",
      chapter: 3,
      chapter_title: "Drainage System",
      pdf_url: "https://ncert.nic.in/textbook/pdf/kegy103.pdf",
      page_range: "25-38",
    },
    subject: "GS1 Geography",
    paper: "both",
    upsc_weightage: 5,
    pyq_count: 0,
    mains_framework: pendingMainsFramework("geography_physical", ["Process", "Mechanism", "Indian location", "Map reference", "Human impact", "Current challenge"], "NCERT Class 11 India Physical Environment, Chapter 3"),
    related_chapters: ["gs1_geo_class11_india_ch04_climate"],
    priority_band: 1,
    maps_to_topics: ["gs1_geography_rivers", "gs1_geography_india"],
    legacy_topic_keys: ["gs1_geography_rivers", "gs1_geography_indian_geography"],
  }),
  ncertChapter({
    key: "gs2_polity_class11_constitution_ch01_why_and_how",
    title: "Constitution: Why and How?",
    source: {
      book: "NCERT Class 11 Indian Constitution at Work",
      chapter: 1,
      chapter_title: "Constitution: Why and How?",
      pdf_url: "https://ncert.nic.in/textbook/pdf/keps201.pdf",
      page_range: "1-24",
    },
    subject: "GS2 Polity",
    paper: "both",
    upsc_weightage: 5,
    pyq_count: 0,
    mains_framework: pendingMainsFramework("polity", ["Article/Institution", "Constitutional provision", "Constituent Assembly debate", "SC interpretation", "Amendment history", "Current controversy", "Comparative", "Reform suggestion"], "NCERT Class 11 Indian Constitution at Work, Chapter 1"),
    related_chapters: ["gs2_polity_class11_constitution_ch02_rights"],
    priority_band: 1,
    maps_to_topics: ["gs2_polity_constitution", "gs2_polity_preamble"],
    legacy_topic_keys: ["gs2_polity_constitution", "gs2_polity_preamble"],
  }),
  ncertChapter({
    key: "gs2_polity_class11_constitution_ch02_rights",
    title: "Rights in the Indian Constitution",
    source: {
      book: "NCERT Class 11 Indian Constitution at Work",
      chapter: 2,
      chapter_title: "Rights in the Indian Constitution",
      pdf_url: "https://ncert.nic.in/textbook/pdf/keps202.pdf",
      page_range: "25-46",
    },
    subject: "GS2 Polity",
    paper: "both",
    upsc_weightage: 5,
    pyq_count: 0,
    mains_framework: pendingMainsFramework("polity", ["Article/Institution", "Constitutional provision", "Constituent Assembly debate", "SC interpretation", "Amendment history", "Current controversy", "Comparative", "Reform suggestion"], "NCERT Class 11 Indian Constitution at Work, Chapter 2"),
    related_chapters: ["gs2_polity_class11_constitution_ch05_legislature", "gs2_polity_class11_constitution_ch06_judiciary"],
    priority_band: 1,
    maps_to_topics: ["gs2_polity_fundamental_rights", "gs2_polity_constitution"],
    legacy_topic_keys: ["gs2_polity_fundamental_rights", "gs2_polity_constitution"],
  }),
  ncertChapter({
    key: "gs2_polity_class11_constitution_ch07_federalism",
    title: "Federalism",
    source: {
      book: "NCERT Class 11 Indian Constitution at Work",
      chapter: 7,
      chapter_title: "Federalism",
      pdf_url: "https://ncert.nic.in/textbook/pdf/keps207.pdf",
      page_range: "167-190",
    },
    subject: "GS2 Polity",
    paper: "both",
    upsc_weightage: 5,
    pyq_count: 0,
    mains_framework: pendingMainsFramework("polity", ["Article/Institution", "Constitutional provision", "Constituent Assembly debate", "SC interpretation", "Amendment history", "Current controversy", "Comparative", "Reform suggestion"], "NCERT Class 11 Indian Constitution at Work, Chapter 7"),
    related_chapters: ["gs2_polity_class11_constitution_ch08_local_governments"],
    priority_band: 1,
    maps_to_topics: ["gs2_polity_federalism"],
    legacy_topic_keys: ["gs2_polity_federalism"],
  }),
  ncertChapter({
    key: "gs3_economy_class12_macro_ch02_money_and_banking",
    title: "Money and Banking",
    source: {
      book: "NCERT Class 12 Introductory Macroeconomics",
      chapter: 2,
      chapter_title: "Money and Banking",
      pdf_url: "https://ncert.nic.in/textbook/pdf/leec102.pdf",
      page_range: "29-52",
    },
    subject: "GS3 Economy",
    paper: "both",
    upsc_weightage: 5,
    pyq_count: 0,
    mains_framework: pendingMainsFramework("economy", ["Define concept", "Mechanism", "Indian data", "Government policy/scheme", "Trade-off analysis", "Way forward"], "NCERT Class 12 Introductory Macroeconomics, Chapter 2"),
    related_chapters: ["gs3_economy_class12_macro_ch05_government_budget"],
    priority_band: 1,
    maps_to_topics: ["gs3_economy_banking", "gs3_economy_monetary_policy"],
    legacy_topic_keys: ["gs3_economy_banking", "gs3_economy_monetary_policy"],
  }),
  ncertChapter({
    key: "gs3_environment_class12_biology_ch15_biodiversity_conservation",
    title: "Biodiversity and Conservation",
    source: {
      book: "NCERT Class 12 Biology",
      chapter: 15,
      chapter_title: "Biodiversity and Conservation",
      pdf_url: "https://ncert.nic.in/textbook/pdf/lebo115.pdf",
      page_range: "258-278",
    },
    subject: "GS3 Environment",
    paper: "both",
    upsc_weightage: 5,
    pyq_count: 0,
    mains_framework: pendingMainsFramework("environment", ["Ecological concept", "India-specific biodiversity/geography", "Legal framework", "International convention", "Challenges", "Government measures", "Evaluation"], "NCERT Class 12 Biology, Chapter 15"),
    related_chapters: ["gs3_environment_class12_biology_ch14_ecosystem"],
    priority_band: 1,
    maps_to_topics: ["gs3_environment_biodiversity", "gs3_environment_conservation"],
    legacy_topic_keys: ["gs3_environment_biodiversity", "gs3_environment_conservation"],
  }),
];

type BookScaffold = {
  keyPrefix: string;
  book: string;
  sourceUrl: string;
  subject: string;
  paper: ChapterTopic["paper"];
  frameworkType: MainsFramework["framework_type"];
  frameworkStructure: readonly string[];
  upscWeightage: ChapterTopic["upsc_weightage"];
  priorityBand: PriorityBand;
  mapsToTopics: string[];
  legacyTopicKeys: string[];
  chapters: string[];
};

const FRAMEWORKS = {
  geographyPhysical: ["Process", "Mechanism", "Indian location", "Map reference", "Human impact", "Current challenge"],
  geographyHuman: ["Pattern", "Cause", "Regional variation", "Census/data", "Government intervention", "Evaluation"],
  historyAncientMedieval: ["Context", "Features", "Society/Economy/Polity", "Cultural contribution", "Legacy", "Historiographical debate"],
  historyModern: ["Background", "Causes", "Key events", "Significance", "Legacy", "Comparison with similar movements"],
  polity: ["Article/Institution", "Constitutional provision", "Constituent Assembly debate", "SC interpretation", "Amendment history", "Current controversy", "Comparative", "Reform suggestion"],
  economy: ["Define concept", "Mechanism", "Indian data", "Government policy/scheme", "Trade-off analysis", "Way forward"],
  environment: ["Ecological concept", "India-specific biodiversity/geography", "Legal framework", "International convention", "Challenges", "Government measures", "Evaluation"],
  ethics: ["Identify stakeholders", "List ethical issues", "Apply ethical theories", "List options", "Evaluate each option", "Recommend with justification"],
} as const;

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function scaffoldBook(book: BookScaffold): ChapterTopicRecord[] {
  return book.chapters.map((chapterTitle, index) =>
    ncertChapter({
      key: `${book.keyPrefix}_ch${String(index + 1).padStart(2, "0")}_${slugify(chapterTitle)}`,
      title: chapterTitle,
      source: {
        book: book.book,
        chapter: index + 1,
        chapter_title: chapterTitle,
        pdf_url: book.sourceUrl,
        page_range: "pending source extraction",
      },
      subject: book.subject,
      paper: book.paper,
      upsc_weightage: book.upscWeightage,
      pyq_count: 0,
      mains_framework: pendingMainsFramework(book.frameworkType, [...book.frameworkStructure], `${book.book}, Chapter ${index + 1}`),
      related_chapters: [],
      priority_band: book.priorityBand,
      maps_to_topics: book.mapsToTopics,
      legacy_topic_keys: book.legacyTopicKeys,
      source_status: "official_book_source_verified_page_range_pending",
    }),
  );
}

const ADDITIONAL_BOOK_SCAFFOLDS: BookScaffold[] = [
  {
    keyPrefix: "gs1_hist_class6_our_pasts_i",
    book: "NCERT Class 6 Our Pasts I",
    sourceUrl: "https://ncert.nic.in/textbook.php?fess1=0-12",
    subject: "GS1 History",
    paper: "both",
    frameworkType: "history_ancient_medieval",
    frameworkStructure: FRAMEWORKS.historyAncientMedieval,
    upscWeightage: 3,
    priorityBand: 3,
    mapsToTopics: ["gs1_history_ancient"],
    legacyTopicKeys: ["gs1_history_ancient"],
    chapters: ["What Where How and When", "On The Trail of the Earliest People", "From Gathering to Growing Food", "In the Earliest Cities", "What Books and Burials Tell Us", "Kingdoms Kings and an Early Republic", "New Questions and Ideas", "Ashoka the Emperor", "Vital Villages Thriving Towns", "Traders Kings and Pilgrims", "New Empires and Kingdoms", "Buildings Paintings and Books"],
  },
  {
    keyPrefix: "gs1_hist_class7_our_pasts_ii",
    book: "NCERT Class 7 Our Pasts II",
    sourceUrl: "https://ncert.nic.in/textbook.php?gess1=0-10",
    subject: "GS1 History",
    paper: "both",
    frameworkType: "history_ancient_medieval",
    frameworkStructure: FRAMEWORKS.historyAncientMedieval,
    upscWeightage: 3,
    priorityBand: 3,
    mapsToTopics: ["gs1_history_medieval"],
    legacyTopicKeys: ["gs1_history_medieval"],
    chapters: ["Tracing Changes Through a Thousand Years", "New Kings and Kingdoms", "The Delhi Sultans", "The Mughal Empire", "Rulers and Buildings", "Towns Traders and Craftspersons", "Tribes Nomads and Settled Communities", "Devotional Paths to the Divine", "The Making of Regional Cultures", "Eighteenth Century Political Formations"],
  },
  {
    keyPrefix: "gs1_hist_class8_our_pasts_iii",
    book: "NCERT Class 8 Our Pasts III",
    sourceUrl: "https://ncert.nic.in/textbook.php?hess1=0-10",
    subject: "GS1 History",
    paper: "both",
    frameworkType: "history_modern",
    frameworkStructure: FRAMEWORKS.historyModern,
    upscWeightage: 4,
    priorityBand: 2,
    mapsToTopics: ["gs1_history_modern"],
    legacyTopicKeys: ["gs1_history_modern"],
    chapters: ["How When and Where", "From Trade to Territory", "Ruling the Countryside", "Tribals Dikus and the Vision of a Golden Age", "When People Rebel 1857", "Weavers Iron Smelters and Factory Owners", "Civilising the Native Educating the Nation", "Women Caste and Reform", "The Making of the National Movement 1870s-1947", "India After Independence"],
  },
  {
    keyPrefix: "gs1_hist_class9_contemporary_world_i",
    book: "NCERT Class 9 India and the Contemporary World I",
    sourceUrl: "https://ncert.nic.in/textbook.php?iess1=0-5",
    subject: "GS1 History",
    paper: "mains",
    frameworkType: "history_modern",
    frameworkStructure: FRAMEWORKS.historyModern,
    upscWeightage: 2,
    priorityBand: 4,
    mapsToTopics: ["gs1_history_world"],
    legacyTopicKeys: ["gs1_history_world"],
    chapters: ["French Revolution", "Socialism in Europe and Russian Revolution", "Nazism and the Rise of Hitler", "Forest Society and Colonialism", "Pastoralists in the Modern World"],
  },
  {
    keyPrefix: "gs1_hist_class10_contemporary_world_ii",
    book: "NCERT Class 10 India and the Contemporary World II",
    sourceUrl: "https://ncert.nic.in/textbook.php?jess1=0-5",
    subject: "GS1 History",
    paper: "mains",
    frameworkType: "history_modern",
    frameworkStructure: FRAMEWORKS.historyModern,
    upscWeightage: 2,
    priorityBand: 4,
    mapsToTopics: ["gs1_history_world", "gs1_history_modern"],
    legacyTopicKeys: ["gs1_history_world", "gs1_history_modern"],
    chapters: ["Rise of Nationalism in Europe", "Nationalism in India", "The Making of a Global World", "The Age of Industrialisation", "Print Culture and the Modern World"],
  },
  {
    keyPrefix: "gs1_hist_class11_themes_world_history",
    book: "NCERT Class 11 Themes in World History",
    sourceUrl: "https://ncert.nic.in/textbook.php?kehs1=0-7",
    subject: "GS1 History",
    paper: "mains",
    frameworkType: "history_modern",
    frameworkStructure: FRAMEWORKS.historyModern,
    upscWeightage: 3,
    priorityBand: 3,
    mapsToTopics: ["gs1_history_world"],
    legacyTopicKeys: ["gs1_history_world"],
    chapters: ["Writing and City Life", "An Empire Across Three Continents", "Nomadic Empires", "The Three Orders", "Changing Cultural Traditions", "Displacing Indigenous Peoples", "Paths to Modernisation"],
  },
  {
    keyPrefix: "gs1_hist_class12_indian_history_i",
    book: "NCERT Class 12 Themes in Indian History I",
    sourceUrl: "https://ncert.nic.in/textbook.php?lehs1=0-4",
    subject: "GS1 History",
    paper: "both",
    frameworkType: "history_ancient_medieval",
    frameworkStructure: FRAMEWORKS.historyAncientMedieval,
    upscWeightage: 4,
    priorityBand: 3,
    mapsToTopics: ["gs1_history_ancient"],
    legacyTopicKeys: ["gs1_history_ancient"],
    chapters: ["Bricks Beads and Bones", "Kings Farmers and Towns", "Kinship Caste and Class", "Thinkers Beliefs and Buildings"],
  },
  {
    keyPrefix: "gs1_hist_class12_indian_history_ii",
    book: "NCERT Class 12 Themes in Indian History II",
    sourceUrl: "https://ncert.nic.in/textbook.php?lehs2=0-5",
    subject: "GS1 History",
    paper: "both",
    frameworkType: "history_ancient_medieval",
    frameworkStructure: FRAMEWORKS.historyAncientMedieval,
    upscWeightage: 3,
    priorityBand: 3,
    mapsToTopics: ["gs1_history_medieval"],
    legacyTopicKeys: ["gs1_history_medieval"],
    chapters: ["Through the Eyes of Travellers", "Bhakti Sufi Traditions", "An Imperial Capital Vijayanagara", "Peasants Zamindars and the State", "The Mughal Courts"],
  },
  {
    keyPrefix: "gs1_hist_class12_indian_history_iii",
    book: "NCERT Class 12 Themes in Indian History III",
    sourceUrl: "https://ncert.nic.in/textbook.php?lehs3=0-4",
    subject: "GS1 History",
    paper: "both",
    frameworkType: "history_modern",
    frameworkStructure: FRAMEWORKS.historyModern,
    upscWeightage: 4,
    priorityBand: 2,
    mapsToTopics: ["gs1_history_modern"],
    legacyTopicKeys: ["gs1_history_modern"],
    chapters: ["Colonialism and the Countryside", "Rebels and the Raj 1857", "Mahatma Gandhi and the Nationalist Movement", "Framing the Constitution"],
  },
  {
    keyPrefix: "gs1_geo_class6_earth_habitat",
    book: "NCERT Class 6 The Earth Our Habitat",
    sourceUrl: "https://ncert.nic.in/textbook.php?fess2=0-6",
    subject: "GS1 Geography",
    paper: "both",
    frameworkType: "geography_physical",
    frameworkStructure: FRAMEWORKS.geographyPhysical,
    upscWeightage: 2,
    priorityBand: 4,
    mapsToTopics: ["gs1_geography"],
    legacyTopicKeys: ["gs1_geography"],
    chapters: ["The Earth in the Solar System", "Globe Latitudes and Longitudes", "Motions of the Earth", "Maps", "Major Domains of the Earth", "Major Landforms of the Earth", "Our Country India", "India Climate Vegetation and Wildlife"],
  },
  {
    keyPrefix: "gs1_geo_class7_our_environment",
    book: "NCERT Class 7 Our Environment",
    sourceUrl: "https://ncert.nic.in/textbook.php?gess2=0-9",
    subject: "GS1 Geography",
    paper: "both",
    frameworkType: "geography_physical",
    frameworkStructure: FRAMEWORKS.geographyPhysical,
    upscWeightage: 2,
    priorityBand: 4,
    mapsToTopics: ["gs1_geography", "gs3_environment"],
    legacyTopicKeys: ["gs1_geography", "gs3_environment"],
    chapters: ["Environment", "Inside Our Earth", "Our Changing Earth", "Air", "Water", "Natural Vegetation and Wildlife", "Human Environment Settlement Transport and Communication", "Human Environment Interactions The Tropical and Subtropical Region", "Life in the Deserts"],
  },
  {
    keyPrefix: "gs1_geo_class8_resources_development",
    book: "NCERT Class 8 Resources and Development",
    sourceUrl: "https://ncert.nic.in/textbook.php?hess3=0-6",
    subject: "GS1 Geography",
    paper: "both",
    frameworkType: "geography_human",
    frameworkStructure: FRAMEWORKS.geographyHuman,
    upscWeightage: 3,
    priorityBand: 4,
    mapsToTopics: ["gs1_geography_resources", "gs3_environment"],
    legacyTopicKeys: ["gs1_geography_resources", "gs3_environment"],
    chapters: ["Resources", "Land Soil Water Natural Vegetation and Wildlife Resources", "Mineral and Power Resources", "Agriculture", "Industries", "Human Resources"],
  },
  {
    keyPrefix: "gs1_geo_class9_contemporary_india_i",
    book: "NCERT Class 9 Contemporary India I",
    sourceUrl: "https://ncert.nic.in/textbook.php?iess3=0-6",
    subject: "GS1 Geography",
    paper: "both",
    frameworkType: "geography_physical",
    frameworkStructure: FRAMEWORKS.geographyPhysical,
    upscWeightage: 4,
    priorityBand: 3,
    mapsToTopics: ["gs1_geography_indian_geography"],
    legacyTopicKeys: ["gs1_geography_indian_geography", "gs1_geography"],
    chapters: ["India Size and Location", "Physical Features of India", "Drainage", "Climate", "Natural Vegetation and Wildlife", "Population"],
  },
  {
    keyPrefix: "gs1_geo_class10_contemporary_india_ii",
    book: "NCERT Class 10 Contemporary India II",
    sourceUrl: "https://ncert.nic.in/textbook.php?jess3=0-7",
    subject: "GS1 Geography",
    paper: "both",
    frameworkType: "geography_human",
    frameworkStructure: FRAMEWORKS.geographyHuman,
    upscWeightage: 4,
    priorityBand: 3,
    mapsToTopics: ["gs1_geography_resources", "gs1_geography_indian_geography"],
    legacyTopicKeys: ["gs1_geography_resources", "gs1_geography_indian_geography"],
    chapters: ["Resources and Development", "Forest and Wildlife Resources", "Water Resources", "Agriculture", "Minerals and Energy Resources", "Manufacturing Industries", "Lifelines of National Economy"],
  },
  {
    keyPrefix: "gs1_geo_class11_phys",
    book: "NCERT Class 11 Fundamentals of Physical Geography",
    sourceUrl: "https://ncert.nic.in/textbook.php?kegy2=0-14",
    subject: "GS1 Geography",
    paper: "both",
    frameworkType: "geography_physical",
    frameworkStructure: FRAMEWORKS.geographyPhysical,
    upscWeightage: 5,
    priorityBand: 1,
    mapsToTopics: ["gs1_geography_physical"],
    legacyTopicKeys: ["gs1_geography", "gs1_geography_physical"],
    chapters: ["Geography as a Discipline", "The Origin and Evolution of Earth", "Interior of the Earth", "Distribution of Oceans and Continents", "Minerals and Rocks", "Geomorphic Processes", "Landforms and their Evolution", "Composition and Structure of Atmosphere", "Solar Radiation Heat Balance and Temperature", "Atmospheric Circulation and Weather Systems", "Water in the Atmosphere", "World Climate and Climate Change", "Water Oceans", "Movements of Ocean Water", "Life on Earth", "Biodiversity and Conservation"],
  },
  {
    keyPrefix: "gs1_geo_class11_india",
    book: "NCERT Class 11 India Physical Environment",
    sourceUrl: "https://ncert.nic.in/textbook.php?kegy1=0-6",
    subject: "GS1 Geography",
    paper: "both",
    frameworkType: "geography_physical",
    frameworkStructure: FRAMEWORKS.geographyPhysical,
    upscWeightage: 5,
    priorityBand: 1,
    mapsToTopics: ["gs1_geography_indian_geography"],
    legacyTopicKeys: ["gs1_geography_indian_geography", "gs1_geography"],
    chapters: ["India Location", "Structure and Physiography", "Drainage System", "Climate", "Natural Vegetation", "Soils", "Natural Hazards and Disasters"],
  },
  {
    keyPrefix: "gs1_geo_class12_human",
    book: "NCERT Class 12 Fundamentals of Human Geography",
    sourceUrl: "https://ncert.nic.in/textbook.php?legy1=0-9",
    subject: "GS1 Geography",
    paper: "both",
    frameworkType: "geography_human",
    frameworkStructure: FRAMEWORKS.geographyHuman,
    upscWeightage: 3,
    priorityBand: 3,
    mapsToTopics: ["gs1_geography_human"],
    legacyTopicKeys: ["gs1_geography"],
    chapters: ["Human Geography Nature and Scope", "World Population Distribution Density and Growth", "Population Composition", "Human Development", "Primary Activities", "Secondary Activities", "Tertiary and Quaternary Activities", "Transport and Communication", "International Trade"],
  },
  {
    keyPrefix: "gs1_geo_class12_india_people_economy",
    book: "NCERT Class 12 India People and Economy",
    sourceUrl: "https://ncert.nic.in/textbook.php?legy2=0-12",
    subject: "GS1 Geography",
    paper: "both",
    frameworkType: "geography_human",
    frameworkStructure: FRAMEWORKS.geographyHuman,
    upscWeightage: 4,
    priorityBand: 2,
    mapsToTopics: ["gs1_geography_indian_geography", "gs1_geography_resources"],
    legacyTopicKeys: ["gs1_geography_indian_geography"],
    chapters: ["Population Distribution Density Growth and Composition", "Migration", "Human Development", "Human Settlements", "Land Resources and Agriculture", "Water Resources", "Mineral and Energy Resources", "Manufacturing Industries", "Planning and Sustainable Development", "Transport and Communication", "International Trade", "Geographical Perspective on Selected Issues and Problems"],
  },
  {
    keyPrefix: "gs2_polity_class6_social_political_life_i",
    book: "NCERT Class 6 Social and Political Life I",
    sourceUrl: "https://ncert.nic.in/textbook.php?fess3=0-9",
    subject: "GS2 Polity",
    paper: "both",
    frameworkType: "polity",
    frameworkStructure: FRAMEWORKS.polity,
    upscWeightage: 1,
    priorityBand: 4,
    mapsToTopics: ["gs2_polity_democracy", "gs2_governance"],
    legacyTopicKeys: ["gs2_polity_democracy", "gs2_governance"],
    chapters: ["Understanding Diversity", "Diversity and Discrimination", "What is Government", "Key Elements of a Democratic Government", "Panchayati Raj", "Rural Administration", "Urban Administration", "Rural Livelihoods", "Urban Livelihoods"],
  },
  {
    keyPrefix: "gs2_polity_class7_social_political_life_ii",
    book: "NCERT Class 7 Social and Political Life II",
    sourceUrl: "https://ncert.nic.in/textbook.php?gess3=0-9",
    subject: "GS2 Polity",
    paper: "both",
    frameworkType: "polity",
    frameworkStructure: FRAMEWORKS.polity,
    upscWeightage: 1,
    priorityBand: 4,
    mapsToTopics: ["gs2_polity_democracy", "gs2_governance"],
    legacyTopicKeys: ["gs2_polity_democracy", "gs2_governance"],
    chapters: ["On Equality", "Role of the Government in Health", "How the State Government Works", "Growing up as Boys and Girls", "Women Change the World", "Understanding Media", "Markets Around Us", "A Shirt in the Market", "Struggles for Equality"],
  },
  {
    keyPrefix: "gs2_polity_class8_social_political_life_iii",
    book: "NCERT Class 8 Social and Political Life III",
    sourceUrl: "https://ncert.nic.in/textbook.php?hess2=0-8",
    subject: "GS2 Polity",
    paper: "both",
    frameworkType: "polity",
    frameworkStructure: FRAMEWORKS.polity,
    upscWeightage: 2,
    priorityBand: 4,
    mapsToTopics: ["gs2_polity_constitution", "gs2_governance"],
    legacyTopicKeys: ["gs2_polity_constitution", "gs2_governance"],
    chapters: ["The Indian Constitution", "Understanding Secularism", "Parliament and the Making of Laws", "Judiciary", "Understanding Marginalisation", "Confronting Marginalisation", "Public Facilities", "Law and Social Justice"],
  },
  {
    keyPrefix: "gs2_polity_class9_democratic_politics_i",
    book: "NCERT Class 9 Democratic Politics I",
    sourceUrl: "https://ncert.nic.in/textbook.php?iess4=0-5",
    subject: "GS2 Polity",
    paper: "both",
    frameworkType: "polity",
    frameworkStructure: FRAMEWORKS.polity,
    upscWeightage: 3,
    priorityBand: 4,
    mapsToTopics: ["gs2_polity_democracy"],
    legacyTopicKeys: ["gs2_polity_democracy"],
    chapters: ["What is Democracy Why Democracy", "Constitutional Design", "Electoral Politics", "Working of Institutions", "Democratic Rights"],
  },
  {
    keyPrefix: "gs2_polity_class10_democratic_politics_ii",
    book: "NCERT Class 10 Democratic Politics II",
    sourceUrl: "https://ncert.nic.in/textbook.php?jess4=0-8",
    subject: "GS2 Polity",
    paper: "both",
    frameworkType: "polity",
    frameworkStructure: FRAMEWORKS.polity,
    upscWeightage: 3,
    priorityBand: 4,
    mapsToTopics: ["gs2_polity_federalism", "gs2_polity_democracy"],
    legacyTopicKeys: ["gs2_polity_federalism", "gs2_polity_democracy"],
    chapters: ["Power Sharing", "Federalism", "Democracy and Diversity", "Gender Religion and Caste", "Popular Struggles and Movements", "Political Parties", "Outcomes of Democracy", "Challenges to Democracy"],
  },
  {
    keyPrefix: "gs2_polity_class11_constitution",
    book: "NCERT Class 11 Indian Constitution at Work",
    sourceUrl: "https://ncert.nic.in/textbook.php?keps2=0-10",
    subject: "GS2 Polity",
    paper: "both",
    frameworkType: "polity",
    frameworkStructure: FRAMEWORKS.polity,
    upscWeightage: 5,
    priorityBand: 1,
    mapsToTopics: ["gs2_polity_constitution"],
    legacyTopicKeys: ["gs2_polity_constitution"],
    chapters: ["Constitution Why and How", "Rights in the Indian Constitution", "Election and Representation", "Executive", "Legislature", "Judiciary", "Federalism", "Local Governments", "Constitution as a Living Document", "The Philosophy of the Constitution"],
  },
  {
    keyPrefix: "gs2_polity_class11_theory",
    book: "NCERT Class 11 Political Theory",
    sourceUrl: "https://ncert.nic.in/textbook.php?keps1=0-10",
    subject: "GS2 Polity",
    paper: "mains",
    frameworkType: "polity",
    frameworkStructure: FRAMEWORKS.polity,
    upscWeightage: 3,
    priorityBand: 3,
    mapsToTopics: ["gs2_polity_theory"],
    legacyTopicKeys: ["gs2_polity"],
    chapters: ["Political Theory an Introduction", "Freedom", "Equality", "Social Justice", "Rights", "Citizenship", "Nationalism", "Secularism", "Peace", "Development"],
  },
  {
    keyPrefix: "gs2_ir_class12_world_politics",
    book: "NCERT Class 12 Contemporary World Politics",
    sourceUrl: "https://ncert.nic.in/textbook.php?leps1=0-9",
    subject: "GS2 International Relations",
    paper: "mains",
    frameworkType: "polity",
    frameworkStructure: FRAMEWORKS.polity,
    upscWeightage: 3,
    priorityBand: 3,
    mapsToTopics: ["gs2_international_relations"],
    legacyTopicKeys: ["gs2_international_relations"],
    chapters: ["Cold War Era", "Disintegration of USSR", "US Hegemony", "Alternative Centres of Power", "South Asia", "International Organisations", "Security in the Contemporary World", "Environment and Natural Resources", "Globalisation"],
  },
  {
    keyPrefix: "gs1_post_independence_class12_politics_india",
    book: "NCERT Class 12 Politics in India since Independence",
    sourceUrl: "https://ncert.nic.in/textbook.php?leps2=0-8",
    subject: "GS1 History",
    paper: "both",
    frameworkType: "history_modern",
    frameworkStructure: FRAMEWORKS.historyModern,
    upscWeightage: 4,
    priorityBand: 2,
    mapsToTopics: ["gs1_history_post_independence", "gs2_polity"],
    legacyTopicKeys: ["gs1_history_post_independence", "gs2_polity"],
    chapters: ["Challenges of Nation Building", "Era of One Party Dominance", "Politics of Planned Development", "India's External Relations", "Challenges to and Restoration of Congress System", "Rise of Popular Movements", "Regional Aspirations", "Recent Developments in Indian Politics"],
  },
  {
    keyPrefix: "gs3_economy_class9_economics",
    book: "NCERT Class 9 Economics",
    sourceUrl: "https://ncert.nic.in/textbook.php?iess2=0-4",
    subject: "GS3 Economy",
    paper: "both",
    frameworkType: "economy",
    frameworkStructure: FRAMEWORKS.economy,
    upscWeightage: 2,
    priorityBand: 4,
    mapsToTopics: ["gs3_economy"],
    legacyTopicKeys: ["gs3_economy"],
    chapters: ["The Story of Village Palampur", "People as Resource", "Poverty as a Challenge", "Food Security in India"],
  },
  {
    keyPrefix: "gs3_economy_class10_development",
    book: "NCERT Class 10 Understanding Economic Development",
    sourceUrl: "https://ncert.nic.in/textbook.php?jess2=0-5",
    subject: "GS3 Economy",
    paper: "both",
    frameworkType: "economy",
    frameworkStructure: FRAMEWORKS.economy,
    upscWeightage: 3,
    priorityBand: 4,
    mapsToTopics: ["gs3_economy"],
    legacyTopicKeys: ["gs3_economy"],
    chapters: ["Development", "Sectors of the Indian Economy", "Money and Credit", "Globalisation and the Indian Economy", "Consumer Rights"],
  },
  {
    keyPrefix: "gs3_economy_class11_indian_development",
    book: "NCERT Class 11 Indian Economic Development",
    sourceUrl: "https://ncert.nic.in/textbook.php?keec1=0-10",
    subject: "GS3 Economy",
    paper: "both",
    frameworkType: "economy",
    frameworkStructure: FRAMEWORKS.economy,
    upscWeightage: 5,
    priorityBand: 1,
    mapsToTopics: ["gs3_economy"],
    legacyTopicKeys: ["gs3_economy"],
    chapters: ["Indian Economy on the Eve of Independence", "Indian Economy 1950-1990", "Liberalisation Privatisation and Globalisation", "Poverty", "Human Capital Formation", "Rural Development", "Employment", "Infrastructure", "Environment and Sustainable Development", "Comparative Development Experiences India and Neighbours"],
  },
  {
    keyPrefix: "gs3_economy_class12_macro",
    book: "NCERT Class 12 Introductory Macroeconomics",
    sourceUrl: "https://ncert.nic.in/textbook.php?leec1=0-6",
    subject: "GS3 Economy",
    paper: "both",
    frameworkType: "economy",
    frameworkStructure: FRAMEWORKS.economy,
    upscWeightage: 5,
    priorityBand: 1,
    mapsToTopics: ["gs3_economy"],
    legacyTopicKeys: ["gs3_economy"],
    chapters: ["National Income Accounting", "Money and Banking", "Determination of Income and Employment", "Government Budget and the Economy", "Balance of Payments"],
  },
  {
    keyPrefix: "gs3_economy_class12_micro",
    book: "NCERT Class 12 Introductory Microeconomics",
    sourceUrl: "https://ncert.nic.in/textbook.php?leec2=0-5",
    subject: "GS3 Economy",
    paper: "prelims",
    frameworkType: "economy",
    frameworkStructure: FRAMEWORKS.economy,
    upscWeightage: 2,
    priorityBand: 4,
    mapsToTopics: ["gs3_economy"],
    legacyTopicKeys: ["gs3_economy"],
    chapters: ["Introduction", "Consumer Behaviour", "Production and Costs", "Theory of the Firm", "Market Equilibrium"],
  },
  {
    keyPrefix: "gs3_sci_class6_science",
    book: "NCERT Class 6 Science",
    sourceUrl: "https://ncert.nic.in/textbook.php?fesc1=0-16",
    subject: "GS3 Science and Technology",
    paper: "prelims",
    frameworkType: "environment",
    frameworkStructure: FRAMEWORKS.environment,
    upscWeightage: 1,
    priorityBand: 4,
    mapsToTopics: ["gs3_science_tech", "gs3_environment"],
    legacyTopicKeys: ["gs3_science_tech", "gs3_environment"],
    chapters: ["Food Where Does It Come From", "Components of Food", "Fibre to Fabric", "Sorting Materials into Groups", "Separation of Substances", "Changes Around Us", "Getting to Know Plants", "Body Movements", "The Living Organisms and Their Surroundings", "Motion and Measurement of Distances", "Light Shadows and Reflections", "Electricity and Circuits", "Fun with Magnets", "Water", "Air Around Us", "Garbage In Garbage Out"],
  },
  {
    keyPrefix: "gs3_sci_class7_science",
    book: "NCERT Class 7 Science",
    sourceUrl: "https://ncert.nic.in/textbook.php?gesc1=0-18",
    subject: "GS3 Science and Technology",
    paper: "prelims",
    frameworkType: "environment",
    frameworkStructure: FRAMEWORKS.environment,
    upscWeightage: 1,
    priorityBand: 4,
    mapsToTopics: ["gs3_science_tech", "gs3_environment"],
    legacyTopicKeys: ["gs3_science_tech", "gs3_environment"],
    chapters: ["Nutrition in Plants", "Nutrition in Animals", "Fibre to Fabric", "Heat", "Acids Bases and Salts", "Physical and Chemical Changes", "Weather Climate and Adaptations of Animals to Climate", "Winds Storms and Cyclones", "Soil", "Respiration in Organisms", "Transportation in Animals and Plants", "Reproduction in Plants", "Motion and Time", "Electric Current and Its Effects", "Light", "Water A Precious Resource", "Forests Our Lifeline", "Wastewater Story"],
  },
  {
    keyPrefix: "gs3_sci_class8_science",
    book: "NCERT Class 8 Science",
    sourceUrl: "https://ncert.nic.in/textbook.php?hesc1=0-18",
    subject: "GS3 Science and Technology",
    paper: "prelims",
    frameworkType: "environment",
    frameworkStructure: FRAMEWORKS.environment,
    upscWeightage: 2,
    priorityBand: 4,
    mapsToTopics: ["gs3_science_tech", "gs3_environment"],
    legacyTopicKeys: ["gs3_science_tech", "gs3_environment"],
    chapters: ["Crop Production and Management", "Microorganisms Friend and Foe", "Synthetic Fibres and Plastics", "Materials Metals and Non-Metals", "Coal and Petroleum", "Combustion and Flame", "Conservation of Plants and Animals", "Cell Structure and Functions", "Reproduction in Animals", "Reaching the Age of Adolescence", "Force and Pressure", "Friction", "Sound", "Chemical Effects of Electric Current", "Some Natural Phenomena", "Light", "Stars and the Solar System", "Pollution of Air and Water"],
  },
  {
    keyPrefix: "gs3_sci_class9_science",
    book: "NCERT Class 9 Science",
    sourceUrl: "https://ncert.nic.in/textbook.php?iesc1=0-15",
    subject: "GS3 Science and Technology",
    paper: "prelims",
    frameworkType: "environment",
    frameworkStructure: FRAMEWORKS.environment,
    upscWeightage: 2,
    priorityBand: 4,
    mapsToTopics: ["gs3_science_tech", "gs3_environment"],
    legacyTopicKeys: ["gs3_science_tech", "gs3_environment"],
    chapters: ["Matter in Our Surroundings", "Is Matter Around Us Pure", "Atoms and Molecules", "Structure of the Atom", "The Fundamental Unit of Life", "Tissues", "Diversity in Living Organisms", "Motion", "Force and Laws of Motion", "Gravitation", "Work and Energy", "Sound", "Why Do We Fall Ill", "Natural Resources", "Improvement in Food Resources"],
  },
  {
    keyPrefix: "gs3_sci_class10_science",
    book: "NCERT Class 10 Science",
    sourceUrl: "https://ncert.nic.in/textbook.php?jesc1=0-16",
    subject: "GS3 Science and Technology",
    paper: "prelims",
    frameworkType: "environment",
    frameworkStructure: FRAMEWORKS.environment,
    upscWeightage: 3,
    priorityBand: 4,
    mapsToTopics: ["gs3_science_tech", "gs3_environment"],
    legacyTopicKeys: ["gs3_science_tech", "gs3_environment"],
    chapters: ["Chemical Reactions and Equations", "Acids Bases and Salts", "Metals and Non-Metals", "Carbon and Its Compounds", "Periodic Classification of Elements", "Life Processes", "Control and Coordination", "How Do Organisms Reproduce", "Heredity and Evolution", "Light Reflection and Refraction", "The Human Eye and the Colourful World", "Electricity", "Magnetic Effects of Electric Current", "Sources of Energy", "Our Environment", "Management of Natural Resources"],
  },
  {
    keyPrefix: "gs3_sci_class11_physics",
    book: "NCERT Class 11 Physics",
    sourceUrl: "https://ncert.nic.in/textbook.php?keph1=0-15",
    subject: "GS3 Science and Technology",
    paper: "prelims",
    frameworkType: "environment",
    frameworkStructure: FRAMEWORKS.environment,
    upscWeightage: 2,
    priorityBand: 4,
    mapsToTopics: ["gs3_science_tech", "gs3_energy"],
    legacyTopicKeys: ["gs3_science_tech", "gs3_energy"],
    chapters: ["Physical World", "Units and Measurements", "Motion in a Straight Line", "Motion in a Plane", "Laws of Motion", "Work Energy and Power", "System of Particles and Rotational Motion", "Gravitation", "Mechanical Properties of Solids", "Mechanical Properties of Fluids", "Thermal Properties of Matter", "Thermodynamics", "Kinetic Theory", "Oscillations", "Waves"],
  },
  {
    keyPrefix: "gs3_sci_class12_physics",
    book: "NCERT Class 12 Physics",
    sourceUrl: "https://ncert.nic.in/textbook.php?leph1=0-14",
    subject: "GS3 Science and Technology",
    paper: "prelims",
    frameworkType: "environment",
    frameworkStructure: FRAMEWORKS.environment,
    upscWeightage: 3,
    priorityBand: 4,
    mapsToTopics: ["gs3_science_tech", "gs3_energy"],
    legacyTopicKeys: ["gs3_science_tech", "gs3_energy"],
    chapters: ["Electric Charges and Fields", "Electrostatic Potential and Capacitance", "Current Electricity", "Moving Charges and Magnetism", "Magnetism and Matter", "Electromagnetic Induction", "Alternating Current", "Electromagnetic Waves", "Ray Optics and Optical Instruments", "Wave Optics", "Dual Nature of Radiation and Matter", "Atoms", "Nuclei", "Semiconductor Electronics Materials Devices and Simple Circuits"],
  },
  {
    keyPrefix: "gs3_sci_class11_chemistry",
    book: "NCERT Class 11 Chemistry",
    sourceUrl: "https://ncert.nic.in/textbook.php?kech1=0-14",
    subject: "GS3 Science and Technology",
    paper: "prelims",
    frameworkType: "environment",
    frameworkStructure: FRAMEWORKS.environment,
    upscWeightage: 2,
    priorityBand: 4,
    mapsToTopics: ["gs3_science_tech", "gs3_environment"],
    legacyTopicKeys: ["gs3_science_tech", "gs3_environment"],
    chapters: ["Some Basic Concepts of Chemistry", "Structure of Atom", "Classification of Elements and Periodicity in Properties", "Chemical Bonding and Molecular Structure", "States of Matter", "Thermodynamics", "Equilibrium", "Redox Reactions", "Hydrogen", "The s-Block Elements", "The p-Block Elements", "Organic Chemistry Some Basic Principles and Techniques", "Hydrocarbons", "Environmental Chemistry"],
  },
  {
    keyPrefix: "gs3_sci_class12_chemistry",
    book: "NCERT Class 12 Chemistry",
    sourceUrl: "https://ncert.nic.in/textbook.php?lech1=0-10",
    subject: "GS3 Science and Technology",
    paper: "prelims",
    frameworkType: "environment",
    frameworkStructure: FRAMEWORKS.environment,
    upscWeightage: 2,
    priorityBand: 4,
    mapsToTopics: ["gs3_science_tech", "gs3_environment"],
    legacyTopicKeys: ["gs3_science_tech", "gs3_environment"],
    chapters: ["Solutions", "Electrochemistry", "Chemical Kinetics", "The d and f Block Elements", "Coordination Compounds", "Haloalkanes and Haloarenes", "Alcohols Phenols and Ethers", "Aldehydes Ketones and Carboxylic Acids", "Amines", "Biomolecules"],
  },
  {
    keyPrefix: "gs3_env_class12_biology",
    book: "NCERT Class 12 Biology",
    sourceUrl: "https://ncert.nic.in/textbook.php?lebo1=0-16",
    subject: "GS3 Environment",
    paper: "both",
    frameworkType: "environment",
    frameworkStructure: FRAMEWORKS.environment,
    upscWeightage: 5,
    priorityBand: 1,
    mapsToTopics: ["gs3_environment"],
    legacyTopicKeys: ["gs3_environment"],
    chapters: ["Reproduction in Organisms", "Sexual Reproduction in Plants", "Human Reproduction", "Reproductive Health", "Principles of Inheritance", "Molecular Basis of Inheritance", "Human Health and Disease", "Microbes in Human Welfare", "Biotechnology Principles and Processes", "Biotechnology and its Applications", "Organisms and Populations", "Ecosystem", "Biodiversity and Conservation", "Environmental Issues"],
  },
  {
    keyPrefix: "gs3_env_class11_biology",
    book: "NCERT Class 11 Biology",
    sourceUrl: "https://ncert.nic.in/textbook.php?kebo1=0-22",
    subject: "GS3 Environment",
    paper: "both",
    frameworkType: "environment",
    frameworkStructure: FRAMEWORKS.environment,
    upscWeightage: 4,
    priorityBand: 4,
    mapsToTopics: ["gs3_environment", "gs3_science_tech"],
    legacyTopicKeys: ["gs3_environment", "gs3_science_tech"],
    chapters: ["The Living World", "Biological Classification", "Plant Kingdom", "Animal Kingdom", "Morphology of Flowering Plants", "Anatomy of Flowering Plants", "Structural Organisation in Animals", "Cell The Unit of Life", "Biomolecules", "Cell Cycle and Cell Division", "Transport in Plants", "Mineral Nutrition", "Photosynthesis in Higher Plants", "Respiration in Plants", "Plant Growth and Development", "Digestion and Absorption", "Breathing and Exchange of Gases", "Body Fluids and Circulation", "Excretory Products and Their Elimination", "Locomotion and Movement", "Neural Control and Coordination", "Chemical Coordination and Integration"],
  },
  {
    keyPrefix: "gs3_sci_class11_chemistry_selected",
    book: "NCERT Class 11 Chemistry",
    sourceUrl: "https://ncert.nic.in/textbook.php?kech1=0-14",
    subject: "GS3 Science and Technology",
    paper: "prelims",
    frameworkType: "environment",
    frameworkStructure: FRAMEWORKS.environment,
    upscWeightage: 2,
    priorityBand: 4,
    mapsToTopics: ["gs3_environment", "gs3_science_tech"],
    legacyTopicKeys: ["gs3_environment", "gs3_science_tech"],
    chapters: ["Environmental Chemistry"],
  },
  {
    keyPrefix: "gs3_sci_class12_chemistry_selected",
    book: "NCERT Class 12 Chemistry",
    sourceUrl: "https://ncert.nic.in/textbook.php?lech2=0-7",
    subject: "GS3 Science and Technology",
    paper: "prelims",
    frameworkType: "environment",
    frameworkStructure: FRAMEWORKS.environment,
    upscWeightage: 2,
    priorityBand: 4,
    mapsToTopics: ["gs3_environment", "gs3_science_tech"],
    legacyTopicKeys: ["gs3_environment", "gs3_science_tech"],
    chapters: ["Chemistry in Everyday Life"],
  },
  {
    keyPrefix: "gs3_sci_class11_physics_selected",
    book: "NCERT Class 11 Physics",
    sourceUrl: "https://ncert.nic.in/textbook.php?keph1=0-15",
    subject: "GS3 Science and Technology",
    paper: "prelims",
    frameworkType: "environment",
    frameworkStructure: FRAMEWORKS.environment,
    upscWeightage: 2,
    priorityBand: 4,
    mapsToTopics: ["gs3_science_tech", "gs3_energy"],
    legacyTopicKeys: ["gs3_science_tech", "gs3_energy"],
    chapters: ["Work Energy and Power", "Thermodynamics", "Kinetic Theory"],
  },
  {
    keyPrefix: "gs3_sci_class12_physics_selected",
    book: "NCERT Class 12 Physics",
    sourceUrl: "https://ncert.nic.in/textbook.php?leph2=0-9",
    subject: "GS3 Science and Technology",
    paper: "prelims",
    frameworkType: "environment",
    frameworkStructure: FRAMEWORKS.environment,
    upscWeightage: 3,
    priorityBand: 4,
    mapsToTopics: ["gs3_science_tech", "gs3_energy"],
    legacyTopicKeys: ["gs3_science_tech", "gs3_energy"],
    chapters: ["Atoms", "Nuclei", "Semiconductor Electronics Materials Devices and Simple Circuits"],
  },
  {
    keyPrefix: "gs1_society_class11_introducing_sociology",
    book: "NCERT Class 11 Introducing Sociology",
    sourceUrl: "https://ncert.nic.in/textbook.php?kesy1=0-5",
    subject: "GS1 Society",
    paper: "mains",
    frameworkType: "geography_human",
    frameworkStructure: FRAMEWORKS.geographyHuman,
    upscWeightage: 3,
    priorityBand: 4,
    mapsToTopics: ["gs1_society"],
    legacyTopicKeys: ["gs1_society"],
    chapters: ["Sociology and Society", "Terms Concepts and Their Use in Sociology", "Understanding Social Institutions", "Culture and Socialisation", "Doing Sociology Research Methods"],
  },
  {
    keyPrefix: "gs1_society_class11_understanding_society",
    book: "NCERT Class 11 Understanding Society",
    sourceUrl: "https://ncert.nic.in/textbook.php?kesy2=0-5",
    subject: "GS1 Society",
    paper: "mains",
    frameworkType: "geography_human",
    frameworkStructure: FRAMEWORKS.geographyHuman,
    upscWeightage: 3,
    priorityBand: 4,
    mapsToTopics: ["gs1_society"],
    legacyTopicKeys: ["gs1_society"],
    chapters: ["Social Structure Stratification and Social Processes", "Social Change and Social Order in Rural and Urban Society", "Environment and Society", "Introducing Western Sociologists", "Indian Sociologists"],
  },
  {
    keyPrefix: "gs1_society_class12_indian_society",
    book: "NCERT Class 12 Indian Society",
    sourceUrl: "https://ncert.nic.in/textbook.php?lesy1=0-7",
    subject: "GS1 Society",
    paper: "mains",
    frameworkType: "geography_human",
    frameworkStructure: FRAMEWORKS.geographyHuman,
    upscWeightage: 4,
    priorityBand: 2,
    mapsToTopics: ["gs1_society"],
    legacyTopicKeys: ["gs1_society"],
    chapters: ["Introducing Indian Society", "The Demographic Structure", "Social Institutions Continuity and Change", "The Market as a Social Institution", "Patterns of Social Inequality and Exclusion", "The Challenges of Cultural Diversity", "Suggestions for Project Work"],
  },
  {
    keyPrefix: "gs1_society_class12_social_change",
    book: "NCERT Class 12 Social Change and Development in India",
    sourceUrl: "https://ncert.nic.in/textbook.php?lesy2=0-8",
    subject: "GS1 Society",
    paper: "mains",
    frameworkType: "geography_human",
    frameworkStructure: FRAMEWORKS.geographyHuman,
    upscWeightage: 3,
    priorityBand: 3,
    mapsToTopics: ["gs1_society"],
    legacyTopicKeys: ["gs1_society"],
    chapters: ["Structural Change", "Cultural Change", "The Story of Indian Democracy", "Change and Development in Rural Society", "Change and Development in Industrial Society", "Globalisation and Social Change", "Mass Media and Communications", "Social Movements"],
  },
  {
    keyPrefix: "gs1_art_class11_indian_art",
    book: "NCERT Class 11 An Introduction to Indian Art",
    sourceUrl: "https://ncert.nic.in/textbook.php?kefa1=0-8",
    subject: "GS1 Art and Culture",
    paper: "both",
    frameworkType: "history_ancient_medieval",
    frameworkStructure: FRAMEWORKS.historyAncientMedieval,
    upscWeightage: 4,
    priorityBand: 4,
    mapsToTopics: ["gs1_art_culture", "gs1_history_ancient", "gs1_history_medieval"],
    legacyTopicKeys: ["gs1_art_culture"],
    chapters: ["Prehistoric Rock Paintings", "Arts of the Indus Valley", "Arts of the Mauryan Period", "Post-Mauryan Trends in Indian Art and Architecture", "Later Mural Traditions", "Temple Architecture and Sculpture", "Indian Bronze Sculpture", "Some Aspects of Indo-Islamic Architecture"],
  },
  {
    keyPrefix: "gs1_art_class11_living_craft_traditions",
    book: "NCERT Class 11 Living Craft Traditions of India",
    sourceUrl: "https://ncert.nic.in/textbook.php?kefa2=0-9",
    subject: "GS1 Art and Culture",
    paper: "both",
    frameworkType: "history_ancient_medieval",
    frameworkStructure: FRAMEWORKS.historyAncientMedieval,
    upscWeightage: 3,
    priorityBand: 4,
    mapsToTopics: ["gs1_art_culture"],
    legacyTopicKeys: ["gs1_art_culture"],
    chapters: ["Introduction to Living Craft Traditions", "Crafts and Craftspersons Materials Tools and Techniques", "Craft Traditions of India Past Present and Future", "Crafts Bazaars and Markets", "Crafts and Community", "Crafts Environment and Sustainability", "Design and Development in Crafts", "Documentation and Research in Crafts", "Project Work in Craft Traditions"],
  },
];

const ADDITIONAL_NCERT_CHAPTER_TOPICS = ADDITIONAL_BOOK_SCAFFOLDS.flatMap(scaffoldBook);

function sourceIdentity(topic: ChapterTopicRecord) {
  return `${topic.source.book.toLowerCase()}::${topic.source.chapter}`;
}

function dedupeChapterTopics(topics: ChapterTopicRecord[]) {
  const seenKeys = new Set<string>();
  const seenSources = new Set<string>();
  const deduped: ChapterTopicRecord[] = [];
  for (const topic of topics) {
    const sourceId = sourceIdentity(topic);
    if (seenKeys.has(topic.key) || seenSources.has(sourceId)) continue;
    seenKeys.add(topic.key);
    seenSources.add(sourceId);
    deduped.push(topic);
  }
  return deduped;
}

export const NCERT_CHAPTER_TOPICS: ChapterTopicRecord[] = dedupeChapterTopics([
  ...CORE_NCERT_CHAPTER_TOPICS,
  ...ADDITIONAL_NCERT_CHAPTER_TOPICS,
]);

export const CHAPTER_TOPIC_BY_KEY = Object.fromEntries(NCERT_CHAPTER_TOPICS.map((topic) => [topic.key, topic])) as Record<string, ChapterTopicRecord>;

export const LEGACY_TOPIC_REDIRECTS: Record<string, string> = {
  gs1_geography: "gs1_geo_class11_phys_ch01_geography_as_discipline",
  gs1_geography_physical: "gs1_geo_class11_phys_ch01_geography_as_discipline",
  gs1_geography_geomorphology: "gs1_geo_class11_phys_ch06_geomorphic_processes",
  gs1_geography_indian_geography: "gs1_geo_class11_india_ch01_location",
  gs1_geography_rivers: "gs1_geo_class11_india_ch03_drainage_system",
  gs2_polity_constitution: "gs2_polity_class11_constitution_ch01_why_and_how",
  gs2_polity_fundamental_rights: "gs2_polity_class11_constitution_ch02_rights",
  gs2_polity_federalism: "gs2_polity_class11_constitution_ch07_federalism",
  gs3_economy_banking: "gs3_economy_class12_macro_ch02_money_and_banking",
  gs3_economy_monetary_policy: "gs3_economy_class12_macro_ch02_money_and_banking",
  gs3_environment_biodiversity: "gs3_environment_class12_biology_ch15_biodiversity_conservation",
  gs3_environment_conservation: "gs3_environment_class12_biology_ch15_biodiversity_conservation",
};

export function getChapterTopic(topicKey: string) {
  return CHAPTER_TOPIC_BY_KEY[topicKey] ?? null;
}

export function getLegacyChapterRedirect(topicKey: string) {
  return LEGACY_TOPIC_REDIRECTS[topicKey] ?? null;
}

export function getChapterNavigation(topicKey: string) {
  const index = NCERT_CHAPTER_TOPICS.findIndex((topic) => topic.key === topicKey);
  return {
    prev: index > 0 ? NCERT_CHAPTER_TOPICS[index - 1] : null,
    next: index >= 0 && index < NCERT_CHAPTER_TOPICS.length - 1 ? NCERT_CHAPTER_TOPICS[index + 1] : null,
  };
}

export function isChapterTopicKey(topicKey: string) {
  return Boolean(getChapterTopic(topicKey));
}

export function hasBannedMcqPattern(questionText: string) {
  const normalized = questionText.toLowerCase();
  return BANNED_MCQ_PATTERNS.some((pattern) => normalized.includes(pattern.toLowerCase()));
}

export function validateMcq(mcq: UPSCPatternMCQ) {
  const errors: string[] = [];
  if (mcq.options.length !== 4) errors.push("MCQ must have exactly 4 options.");
  if (!Number.isInteger(mcq.correct_answer) || mcq.correct_answer < 0 || mcq.correct_answer > 3) errors.push("MCQ correct_answer must be an index from 0 to 3.");
  if (!mcq.source_trace.trim()) errors.push("MCQ requires source_trace.");
  if (!mcq.trap_explanation.trim()) errors.push("MCQ requires trap_explanation.");
  if (!mcq.approach_technique.trim()) errors.push("MCQ requires approach_technique.");
  if (!mcq.concepts_tested.length) errors.push("MCQ requires concepts_tested.");
  if (hasBannedMcqPattern(mcq.question_text)) errors.push("MCQ uses a banned school-quiz pattern.");
  return errors;
}

export function conceptHasSourceTrace(concept: ConceptDecode) {
  const contentHasMarker = /\[(NCERT|Source|PIB|PRS|Economic Survey|RBI|Budget|MoEFCC|MEA)[^\]]+\]/i.test(concept.textbook_content);
  const pyqsTrace = concept.pyq_connections.every((pyq) => pyq.ncert_line_that_answers.trim().length > 0);
  return Boolean(concept.ncert_page.trim() && contentHasMarker && pyqsTrace);
}
