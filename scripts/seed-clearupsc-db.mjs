import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const content = readFileSync(path, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^"|"$/g, "");
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env.vercel");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const papers = {
  GS1: {
    stage: "both",
    areas: {
      History: ["Ancient India", "Medieval India", "Modern India", "Freedom Struggle", "Post Independence", "World History", "Art and Culture"],
      Society: ["Salient features", "Diversity", "Women", "Population", "Urbanisation", "Globalisation", "Communalism", "Regionalism", "Secularism"],
      Geography: ["Geomorphology", "Climatology", "Oceanography", "Biogeography", "Indian Geography", "World Geography", "Resources", "Industries"],
    },
  },
  GS2: {
    stage: "both",
    areas: {
      Polity: ["Constitution", "Federalism", "Parliament", "Executive", "Judiciary", "Local bodies", "Constitutional bodies", "Statutory bodies"],
      Governance: ["Transparency", "Accountability", "RTI", "Citizen charter", "E-governance", "Civil services", "NGOs", "Pressure groups"],
      "Social Justice": ["Health", "Education", "Poverty", "Hunger", "Welfare schemes", "Vulnerable sections", "Human resources"],
      IR: ["Neighbourhood", "Global groupings", "India diaspora", "Bilateral relations", "International institutions", "Indian foreign policy"],
    },
  },
  GS3: {
    stage: "both",
    areas: {
      Economy: ["Planning", "Inclusive growth", "Budgeting", "Banking", "Inflation", "Infrastructure", "Investment", "Employment"],
      Agriculture: ["Cropping patterns", "Irrigation", "MSP", "PDS", "Food processing", "Land reforms", "Farm subsidies"],
      "Science and Tech": ["Space", "IT", "Biotechnology", "Nanotechnology", "Robotics", "Defence tech", "Digital public infrastructure"],
      Environment: ["Ecology", "Biodiversity", "Climate change", "Pollution", "Conservation", "Disaster management", "Environmental governance"],
      Security: ["Internal security", "Border management", "Cyber security", "Left wing extremism", "Terrorism", "Money laundering"],
    },
  },
  GS4: {
    stage: "mains",
    areas: {
      Ethics: ["Ethics basics", "Human values", "Attitude", "Aptitude", "Emotional intelligence", "Probity", "Accountability", "Thinkers"],
      "Case Studies": ["Administrative dilemma", "Corruption dilemma", "Public service delivery", "Conflict of interest", "Resource allocation", "Whistleblowing"],
    },
  },
  CSAT: {
    stage: "prelims",
    areas: {
      Comprehension: ["Reading comprehension", "Inference", "Main idea", "Tone", "Assumption"],
      Reasoning: ["Syllogism", "Arrangements", "Puzzles", "Coding", "Directions", "Blood relation", "Decision making"],
      Numeracy: ["Percentages", "Ratio", "Average", "Time work", "Time speed", "Number system", "Data interpretation"],
    },
  },
  Essay: {
    stage: "mains",
    areas: {
      Themes: ["Governance", "Society", "Economy", "Technology", "Environment", "Ethics", "Philosophy", "International relations"],
    },
  },
};

const angles = [
  "definition and conceptual clarity",
  "constitutional or institutional angle",
  "historical background",
  "current affairs linkage",
  "policy challenge",
  "committee or report relevance",
  "implementation bottleneck",
  "way forward",
];

function key(parts) {
  return parts.join("_").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function buildTopics() {
  const topics = [];
  for (const [paper, paperConfig] of Object.entries(papers)) {
    for (const [area, subtopics] of Object.entries(paperConfig.areas)) {
      const areaKey = key([paper, area]);
      topics.push({ key: areaKey, subject: paper, parent_key: null, title: area, exam_stage: paperConfig.stage, upsc_weightage: 4 });
      for (const subtopic of subtopics) {
        const subKey = key([paper, area, subtopic]);
        topics.push({ key: subKey, subject: paper, parent_key: areaKey, title: subtopic, exam_stage: paperConfig.stage, upsc_weightage: 3 });
        for (const angle of angles) {
          topics.push({
            key: key([paper, area, subtopic, angle]),
            subject: paper,
            parent_key: subKey,
            title: `${subtopic}: ${angle}`,
            exam_stage: paperConfig.stage,
            upsc_weightage: angle.includes("current") || angle.includes("policy") ? 5 : 2,
          });
        }
      }
    }
  }
  return topics;
}

function buildQuestions(topics) {
  const subjects = ["History", "Polity", "Geography", "Economy", "Environment", "Science"];
  return Array.from({ length: 3000 }, (_, index) => {
    const topic = topics[index % topics.length];
    const subject = subjects[index % subjects.length];
    return {
      id: `seed_mcq_${String(index + 1).padStart(3, "0")}`,
      topic_key: topic.key,
      question_text: `Practice question ${index + 1}: Which statement best captures ${topic.title} for UPSC preparation?`,
      question_type: "mcq",
      year: 2014 + (index % 12),
      source: "seed_practice",
      difficulty: 3,
      model_answer: "Correct approach: build conceptual clarity, link to syllabus, add examples and revise through practice.",
      tags: [subject, "practice"],
      correct: ["A", "B", "C", "D"][index % 4],
      optionTexts: [
        `${topic.title} should be understood with definition, context and examples.`,
        `${topic.title} is only useful for interview and can be skipped for Prelims.`,
        `${topic.title} has no connection with current affairs or policy analysis.`,
        `${topic.title} should be memorised without linking it to syllabus demand.`,
      ],
    };
  });
}

async function upsertChunk(table, rows, options = {}) {
  for (let index = 0; index < rows.length; index += 100) {
    const chunk = rows.slice(index, index + 100);
    const { error } = await supabase.from(table).upsert(chunk, options);
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

async function insertMissingMockTests() {
  const rows = [
    ...Array.from({ length: 10 }).map((_, index) => ({ title: `Full Length Prelims Mock ${index + 1}`, test_type: "prelims_full", duration_minutes: 120, total_marks: 200, is_active: true })),
    ...["Polity", "Economy", "Geography", "History", "Environment", "Science and Tech", "Current Affairs"].flatMap((subject) =>
      Array.from({ length: subject === "Current Affairs" ? 2 : 3 }).map((_, index) => ({ title: `${subject} Sectional Test ${index + 1}`, test_type: "prelims_sectional", duration_minutes: 35, total_marks: 60, is_active: true })),
    ),
    ...Array.from({ length: 5 }).map((_, index) => ({ title: `CSAT Mock Test ${index + 1}`, test_type: "prelims_sectional", duration_minutes: 120, total_marks: 200, is_active: true })),
  ];

  for (const row of rows) {
    const { data, error: readError } = await supabase.from("mock_tests").select("id").eq("title", row.title).limit(1);
    if (readError) throw new Error(`mock_tests read: ${readError.message}`);
    if (data.length === 0) {
      const { error } = await supabase.from("mock_tests").insert(row);
      if (error) throw new Error(`mock_tests insert: ${error.message}`);
    }
  }
}

async function main() {
  const topics = buildTopics();
  const questions = buildQuestions(topics);
  const options = questions.flatMap((question) =>
    question.optionTexts.map((option_text, optionIndex) => {
      const option_label = ["A", "B", "C", "D"][optionIndex];
      return {
        question_id: question.id,
        option_label,
        option_text,
        is_correct: option_label === question.correct,
      };
    }),
  );
  const questionRows = questions.map(({ correct, optionTexts, ...question }) => question);

  await upsertChunk("topics", topics, { onConflict: "key" });
  await upsertChunk("questions", questionRows, { onConflict: "id" });
  await upsertChunk("question_options", options, { onConflict: "question_id,option_label" });
  await insertMissingMockTests();
  await upsertChunk(
    "current_affairs",
    [
      {
        date: new Date().toISOString().slice(0, 10),
        title: "Heat action plans and urban governance",
        summary: "Indian cities use heat action plans to coordinate health alerts, water supply, labour safety and public communication during heat waves.",
        tags: ["GS2", "GS3", "Disaster Management"],
        upsc_relevance: "Useful for climate adaptation, urban local bodies, health capacity and vulnerable workers.",
      },
      {
        date: new Date(Date.now() - 86_400_000).toISOString().slice(0, 10),
        title: "Semiconductor manufacturing incentives",
        summary: "India's chip ecosystem depends on fabrication, design talent, reliable power, clean water, supply-chain depth and predictable incentives.",
        tags: ["GS3", "Economy", "Science and Tech"],
        upsc_relevance: "Useful for industrial policy, strategic autonomy, electronics imports and employment questions.",
      },
      {
        date: new Date(Date.now() - 172_800_000).toISOString().slice(0, 10),
        title: "Wetland restoration and flood buffering",
        summary: "Wetlands store excess rainwater, recharge groundwater, support biodiversity and reduce urban flood intensity when protected from encroachment.",
        tags: ["Environment", "Geography"],
        upsc_relevance: "Connect Ramsar sites, ecosystem services, urban planning and climate resilience.",
      },
    ],
    { onConflict: "date,title" },
  );

  const checks = await Promise.all(
    ["topics", "questions", "question_options", "mock_tests", "current_affairs"].map(async (table) => {
      const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
      if (error) throw new Error(`${table} count: ${error.message}`);
      return `${table}: ${count}`;
    }),
  );
  console.log(`Seed complete.\n${checks.join("\n")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
