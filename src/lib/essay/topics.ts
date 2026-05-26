export type EssayDifficulty = "Easy" | "Medium" | "Hard";

export interface EssayTopic {
  id: string;
  title: string;
  category: string;
  difficulty: EssayDifficulty;
  framework: string[];
  keyPoints: string[];
  wordLimit: number;
  timeLimit: number;
}

const baseFramework = (theme: string) => [
  `Introduction: Define ${theme} through a clear quote, fact, or contemporary context`,
  "Body 1: Historical and constitutional background",
  "Body 2: Current Indian examples with data, schemes, institutions, or judgments",
  "Body 3: Challenges, ethical tensions, and counter-arguments",
  "Conclusion: Balanced way forward with citizen-centric governance",
];

function topic(id: number, title: string, category: string, difficulty: EssayDifficulty, keyPoints: string[]): EssayTopic {
  return {
    id: `essay_${String(id).padStart(3, "0")}`,
    title,
    category,
    difficulty,
    framework: baseFramework(title),
    keyPoints,
    wordLimit: 1000,
    timeLimit: 60,
  };
}

export const ESSAY_TOPICS: EssayTopic[] = [
  topic(1, "Science and Technology as tools of national development", "Science & Technology", "Medium", ["ISRO achievements", "Digital India", "innovation index"]),
  topic(2, "The role of ethics in public life", "Ethics", "Medium", ["probity", "Nolan principles", "2nd ARC"]),
  topic(3, "Climate change and India's development choices", "Environment", "Hard", ["Paris Agreement", "net zero 2070", "climate justice"]),
  topic(4, "Women-led development as India's growth multiplier", "Society", "Medium", ["SHGs", "female LFPR", "Nari Shakti Vandan Adhiniyam"]),
  topic(5, "Federalism in India: cooperation, competition and conflict", "Polity", "Hard", ["GST Council", "Article 263", "Finance Commission"]),
  topic(6, "Education as the foundation of social transformation", "Society", "Medium", ["NEP 2020", "ASER", "digital divide"]),
  topic(7, "Artificial intelligence and the future of governance", "Science & Technology", "Hard", ["DPDP Act", "algorithmic bias", "public service delivery"]),
  topic(8, "The Indian Constitution as a living document", "Polity", "Medium", ["Basic Structure", "Article 368", "judicial review"]),
  topic(9, "Agriculture, sustainability and farmer welfare", "Economy", "Medium", ["MSP", "PM-KISAN", "natural farming"]),
  topic(10, "Urbanisation: opportunity or crisis?", "Geography & Society", "Medium", ["Smart Cities", "AMRUT", "urban floods"]),
  topic(11, "Democracy needs disagreement, not disorder", "Polity", "Hard", ["parliamentary debate", "civil society", "constitutional morality"]),
  topic(12, "Digital India and the new social contract", "Governance", "Medium", ["Aadhaar", "DBT", "digital public infrastructure"]),
  topic(13, "Economic growth without inclusion is incomplete", "Economy", "Medium", ["Gini coefficient", "poverty", "inclusive growth"]),
  topic(14, "India's demographic dividend: promise and pressure", "Society", "Hard", ["skilling", "employment", "ageing"]),
  topic(15, "Judiciary and the balance of constitutional power", "Polity", "Hard", ["Article 32", "collegium", "NJAC"]),
  topic(16, "Water security in twenty-first century India", "Environment", "Medium", ["Jal Jeevan Mission", "groundwater", "river basin management"]),
  topic(17, "The value of compassion in administration", "Ethics", "Easy", ["empathy", "citizen charter", "last-mile delivery"]),
  topic(18, "India's foreign policy in a multipolar world", "International Relations", "Hard", ["strategic autonomy", "QUAD", "Global South"]),
  topic(19, "Migration and the idea of home", "Society", "Medium", ["urban labour", "remittances", "social security"]),
  topic(20, "Public health as public infrastructure", "Governance", "Medium", ["Ayushman Bharat", "primary healthcare", "pandemic preparedness"]),
  topic(21, "Technology cannot replace character", "Ethics", "Medium", ["integrity", "AI ethics", "human judgment"]),
  topic(22, "The future of work in India", "Economy", "Hard", ["gig economy", "skilling", "automation"]),
  topic(23, "Culture is not the past; it is a living resource", "History & Culture", "Medium", ["UNESCO heritage", "soft power", "craft economy"]),
  topic(24, "Security and liberty in a digital republic", "Governance", "Hard", ["privacy", "cybersecurity", "national security"]),
  topic(25, "The village republic in modern India", "Polity", "Medium", ["73rd Amendment", "Gram Sabha", "devolution"]),
  topic(26, "Disaster resilience as development policy", "Environment", "Medium", ["NDMA", "Sendai Framework", "urban planning"]),
  topic(27, "The moral cost of corruption", "Ethics", "Easy", ["Lokpal", "transparency", "trust deficit"]),
  topic(28, "Entrepreneurship and India's aspiration economy", "Economy", "Medium", ["Startup India", "MSME", "credit access"]),
  topic(29, "Media, misinformation and democracy", "Governance", "Hard", ["free speech", "fact-checking", "platform accountability"]),
  topic(30, "Aspirational districts and cooperative governance", "Governance", "Medium", ["NITI Aayog", "data monitoring", "convergence"]),
  topic(31, "The ocean as India's strategic frontier", "Geography & IR", "Hard", ["SAGAR", "IOR", "blue economy"]),
  topic(32, "Social justice beyond reservation", "Society", "Hard", ["capability approach", "education", "health equity"]),
  topic(33, "Indian secularism and constitutional fraternity", "Polity", "Hard", ["Preamble", "Article 25", "S.R. Bommai"]),
  topic(34, "Science without humanity is dangerous", "Ethics", "Medium", ["bioethics", "nuclear technology", "AI governance"]),
  topic(35, "Learning from India's freedom struggle for today's governance", "History", "Medium", ["Gandhian ethics", "constitutionalism", "mass mobilisation"]),
  topic(36, "Fiscal discipline and welfare state responsibilities", "Economy", "Hard", ["FRBM", "subsidies", "capital expenditure"]),
  topic(37, "The politics of climate justice", "Environment", "Hard", ["CBDR", "loss and damage", "energy transition"]),
  topic(38, "Trust is the currency of governance", "Ethics", "Easy", ["transparency", "accountability", "service delivery"]),
  topic(39, "Border management and human security", "Security", "Medium", ["smart fencing", "migration", "development"]),
  topic(40, "The classroom and the Constitution", "Society", "Medium", ["civic education", "fundamental duties", "rights awareness"]),
  topic(41, "India's space programme and national imagination", "Science & Technology", "Medium", ["Chandrayaan", "Gaganyaan", "private space sector"]),
  topic(42, "The challenge of clean energy transition", "Environment", "Hard", ["solar mission", "green hydrogen", "just transition"]),
  topic(43, "Bureaucracy: steel frame or service frame?", "Governance", "Hard", ["civil service reforms", "lateral entry", "mission karmayogi"]),
  topic(44, "Language, identity and national integration", "Society", "Medium", ["Eighth Schedule", "NEP", "linguistic diversity"]),
  topic(45, "Food security in a changing climate", "Economy & Environment", "Hard", ["NFSA", "PDS", "crop diversification"]),
  topic(46, "The ethics of dissent", "Ethics", "Hard", ["civil disobedience", "free speech", "constitutional morality"]),
  topic(47, "India's cities need governance, not only infrastructure", "Governance", "Medium", ["74th Amendment", "municipal finance", "urban planning"]),
  topic(48, "Globalisation and the local community", "Society", "Medium", ["supply chains", "cultural change", "local livelihoods"]),
  topic(49, "The importance of scientific temper in democracy", "Science & Society", "Easy", ["Article 51A(h)", "misinformation", "rationality"]),
  topic(50, "Development should enlarge freedom", "Philosophical", "Hard", ["Amartya Sen", "capabilities", "human development"]),
];

export const ESSAY_CATEGORIES = Array.from(new Set(ESSAY_TOPICS.map((topic) => topic.category))).sort();

