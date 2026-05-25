import { createClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "./script-env.mjs";

const { url, serviceKey } = requireSupabaseEnv();
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const topicKey = "gs2_polity_local_bodies";

const structuredNotes = {
  analogy: {
    heading: "Think of it this way",
    body: "Think of local bodies like neighbourhood governments: Delhi can make national rules, but the streetlight, drain, ration list, village road and ward sanitation need a government close enough to see the problem.",
  },
  full_notes: `## Local Bodies: Panchayats and Municipalities

### 1. Meaning and Constitutional Status
Local bodies are institutions of local self-government. In rural areas they are Panchayati Raj Institutions (PRIs), and in urban areas they are Municipalities. They matter because democracy is incomplete if citizens vote only for Parliament and State Assemblies but have no meaningful say over village roads, sanitation, water supply, street lighting, primary health, local markets, land-use planning and welfare delivery. The Constitution originally mentioned village panchayats only as a Directive Principle in Article 40, which asks the State to organise village panchayats and give them powers needed for self-government. This was not enforceable, so local governments remained dependent on State political will.

The real constitutional change came through the 73rd and 74th Constitutional Amendment Acts, both enacted in 1992 and brought into force in 1993. The 73rd Amendment inserted Part IX, Articles 243 to 243O, and the Eleventh Schedule with 29 subjects for Panchayats. The 74th Amendment inserted Part IXA, Articles 243P to 243ZG, and the Twelfth Schedule with 18 subjects for Municipalities. UPSC repeatedly tests this distinction: Panchayats are rural local bodies under Part IX; Municipalities are urban local bodies under Part IXA.

### 2. Panchayati Raj: Part IX
Article 243B provides for Panchayats at the village, intermediate and district levels, though the intermediate level may be omitted in States with population below 20 lakh. Article 243C deals with composition, Article 243D provides reservation of seats for Scheduled Castes, Scheduled Tribes and not less than one-third of seats for women, including chairperson posts. Many States now provide 50 percent reservation for women, but the constitutional minimum is one-third. Article 243E fixes a five-year term. If a Panchayat is dissolved early, elections must be held within six months. Article 243G empowers State Legislatures to devolve powers and responsibilities to Panchayats for economic development and social justice, including matters in the Eleventh Schedule. Article 243H deals with taxation powers and funds, Article 243I provides for State Finance Commission every five years, and Article 243K provides for State Election Commission to conduct Panchayat elections.

The Eleventh Schedule includes agriculture, land improvement, minor irrigation, animal husbandry, fisheries, rural housing, drinking water, roads, poverty alleviation programmes, education, health, women and child development, social welfare and public distribution system. But these are enabling subjects: actual devolution depends on State laws, funds, functionaries and administrative capacity.

### 3. Municipalities: Part IXA
Article 243Q provides three types of urban local bodies: Nagar Panchayat for transitional areas, Municipal Council for smaller urban areas and Municipal Corporation for larger urban areas. Article 243R deals with composition, Article 243S provides for Ward Committees in municipalities with population of 3 lakh or more, Article 243T provides reservation for SCs, STs and not less than one-third seats for women, Article 243U fixes a five-year term, Article 243W enables devolution of powers over Twelfth Schedule subjects, Article 243X covers taxation and funds, Article 243Y provides for State Finance Commission for municipalities, and Article 243ZA gives State Election Commission power over municipal elections.

The Twelfth Schedule covers urban planning, land-use regulation, roads and bridges, water supply, public health, sanitation, fire services, urban forestry, slum improvement, urban poverty alleviation, parks, burial grounds, cattle pounds, vital statistics and public amenities. Metropolitan Planning Committees under Article 243ZE and District Planning Committees under Article 243ZD connect local plans with district and metropolitan development planning.

### 4. Committees and Evolution
The Balwant Rai Mehta Committee (1957) recommended democratic decentralisation and a three-tier Panchayati Raj system. The Ashok Mehta Committee (1978) recommended a stronger two-tier structure with district as the key planning unit. G.V.K. Rao Committee stressed district-level planning, and L.M. Singhvi Committee recommended constitutional recognition for Panchayats. These reports explain why constitutional amendments became necessary.

### 5. Current Challenges and Reforms
The biggest problem is the three Fs: functions, funds and functionaries. Many States have not fully devolved the Eleventh and Twelfth Schedule subjects. Local bodies often depend on State grants, have weak own-source revenue, shortage of technical staff, delayed elections, parallel bodies for schemes, poor audit, capacity gaps and elite capture. Gram Sabhas are meant to provide direct democracy, social audit and beneficiary selection, but participation varies. Urban local bodies face faster pressures: migration, waste management, water scarcity, pollution, informal settlements, climate resilience and property tax reform.

Reforms should include predictable fiscal transfers through State Finance Commissions, timely elections by State Election Commissions, activity mapping of subjects, stronger Gram Sabhas and Ward Committees, professional municipal cadres, property tax reform, transparent budgeting, social audit, e-governance, participatory planning, and climate-resilient urban services. For Mains, write local bodies as the base of cooperative federalism and participatory democracy, not just as an administrative chapter.`,
  concise_notes: [
    { term: "Article 40", definition: "Directive Principle asking the State to organise village panchayats as units of self-government." },
    { term: "73rd Amendment Act, 1992", definition: "Inserted Part IX, Articles 243-243O and Eleventh Schedule for Panchayats." },
    { term: "74th Amendment Act, 1992", definition: "Inserted Part IXA, Articles 243P-243ZG and Twelfth Schedule for Municipalities." },
    { term: "Article 243B", definition: "Provides for constitution of Panchayats at village, intermediate and district levels." },
    { term: "Article 243D", definition: "Provides reservation in Panchayats for SCs, STs and at least one-third seats for women." },
    { term: "Article 243G", definition: "Enables State Legislatures to devolve powers to Panchayats for economic development and social justice." },
    { term: "Article 243I", definition: "Provides for State Finance Commission every five years for Panchayat finances." },
    { term: "Article 243K", definition: "Vests superintendence and control of Panchayat elections in State Election Commission." },
    { term: "Article 243Q", definition: "Provides for Nagar Panchayat, Municipal Council and Municipal Corporation." },
    { term: "Article 243W", definition: "Enables devolution of powers to Municipalities for Twelfth Schedule functions." },
    { term: "Eleventh Schedule", definition: "Lists 29 subjects that may be devolved to Panchayats." },
    { term: "Twelfth Schedule", definition: "Lists 18 subjects that may be devolved to Municipalities." },
    { term: "Gram Sabha", definition: "Body of registered voters in a village Panchayat area; foundation of direct local democracy." },
    { term: "State Election Commission", definition: "Constitutional authority conducting Panchayat and Municipal elections under Articles 243K and 243ZA." },
    { term: "State Finance Commission", definition: "Constitutional body recommending resource sharing between State and local bodies." },
  ],
  revision_bullets: [
    "Article 40 originally mentioned village panchayats.",
    "73rd Amendment constitutionalised Panchayats.",
    "74th Amendment constitutionalised Municipalities.",
    "Part IX covers Panchayats.",
    "Part IXA covers Municipalities.",
    "Eleventh Schedule has 29 subjects.",
    "Twelfth Schedule has 18 subjects.",
    "Local body term is five years.",
    "State Finance Commission is every five years.",
    "State Election Commission conducts local elections.",
  ],
  mindmap: {
    center: "Local Bodies",
    branches: [
      "Article 40 and decentralisation",
      "73rd Amendment: Panchayats",
      "74th Amendment: Municipalities",
      "Gram Sabha and Ward Committees",
      "State Finance and Election Commissions",
      "Functions, funds and functionaries",
    ],
  },
  cases: [
    { name: "Balwant Rai Mehta Committee (1957)", note: "Recommended democratic decentralisation and three-tier Panchayati Raj." },
    { name: "Ashok Mehta Committee (1978)", note: "Recommended stronger Panchayati Raj with district as key planning unit." },
    { name: "L.M. Singhvi Committee (1986)", note: "Recommended constitutional recognition for Panchayats and Gram Sabha strengthening." },
    { name: "K. Krishna Murthy v Union of India (2010)", note: "Upheld reservations in local bodies while discussing limits and empirical basis." },
    { name: "Rajendra Singh Rana v Swami Prasad Maurya (2007)", note: "Relevant to democratic accountability and anti-defection principles in representative institutions." },
  ],
  schemes: [
    { name: "Rashtriya Gram Swaraj Abhiyan", note: "Capacity-building programme for Panchayati Raj Institutions." },
    { name: "15th Finance Commission Local Body Grants", note: "Provided tied and untied grants for rural and urban local bodies." },
    { name: "Smart Cities Mission", note: "Urban renewal programme linked with municipal capacity and service delivery." },
    { name: "AMRUT", note: "Mission for urban water supply, sewerage, drainage and green spaces." },
    { name: "MGNREGA Social Audit", note: "Uses Gram Sabha-linked accountability for rural works." },
  ],
  ncert_coverage: [
    "Class 6 Social and Political Life: Panchayati Raj",
    "Class 6 Social and Political Life: Urban Administration",
    "Class 10 Democratic Politics: Federalism",
    "Class 11 Indian Constitution at Work: Local Governments",
  ],
  prelims_traps: [
    "73rd Amendment is Panchayats; 74th Amendment is Municipalities.",
    "Article 243G is enabling; actual devolution depends on State law.",
    "One-third women's reservation is constitutional minimum, not maximum.",
    "State Election Commission conducts local elections, not Election Commission of India.",
    "Eleventh Schedule has 29 subjects; Twelfth Schedule has 18 subjects.",
  ],
  mains_angles: [
    "GS2: Local bodies and the unfinished devolution of functions, funds and functionaries.",
    "GS2: Gram Sabha and Ward Committees as tools of participatory democracy.",
    "GS2: Urban local bodies and climate-resilient city governance.",
    "GS2: State Finance Commissions and fiscal decentralisation.",
  ],
};

const questions = [
  {
    id: "local_bodies_gold_01",
    question_text: "Under which constitutional amendment were Panchayati Raj Institutions given constitutional status?",
    explanation: "The 73rd Constitutional Amendment Act, 1992 inserted Part IX and the Eleventh Schedule for Panchayats. The 74th Amendment deals with Municipalities, not Panchayats.",
    options: [["A", "42nd Amendment", false], ["B", "73rd Amendment", true], ["C", "74th Amendment", false], ["D", "86th Amendment", false]],
  },
  {
    id: "local_bodies_gold_02",
    question_text: "Article 243G of the Constitution primarily relates to which of the following?",
    explanation: "Article 243G enables State Legislatures to devolve powers and responsibilities to Panchayats for economic development and social justice. It is linked to Eleventh Schedule functions.",
    options: [["A", "Powers and authority of Panchayats", true], ["B", "Election Commission of India", false], ["C", "Emergency provisions", false], ["D", "Composition of Rajya Sabha", false]],
  },
  {
    id: "local_bodies_gold_03",
    question_text: "Which schedule of the Constitution lists subjects that may be devolved to Municipalities?",
    explanation: "The Twelfth Schedule was added by the 74th Amendment and lists 18 municipal subjects. The Eleventh Schedule lists 29 Panchayat subjects.",
    options: [["A", "Eighth Schedule", false], ["B", "Ninth Schedule", false], ["C", "Eleventh Schedule", false], ["D", "Twelfth Schedule", true]],
  },
  {
    id: "local_bodies_gold_04",
    question_text: "Which constitutional authority conducts elections to Panchayats and Municipalities?",
    explanation: "State Election Commissions conduct local body elections under Articles 243K and 243ZA. The Election Commission of India conducts elections to Parliament, State Legislatures, President and Vice-President.",
    options: [["A", "Election Commission of India", false], ["B", "State Election Commission", true], ["C", "Finance Commission of India", false], ["D", "District Planning Committee", false]],
  },
  {
    id: "local_bodies_gold_05",
    question_text: "Which of the following is the constitutional minimum reservation for women in Panchayats?",
    explanation: "Article 243D provides that not less than one-third of total seats and chairperson offices in Panchayats shall be reserved for women. Several States provide 50 percent, but one-third is the constitutional minimum.",
    options: [["A", "One-tenth", false], ["B", "One-fourth", false], ["C", "One-third", true], ["D", "Two-thirds", false]],
  },
];

const { data: topic, error: topicError } = await supabase
  .from("topics")
  .select("structured_notes")
  .eq("key", topicKey)
  .single();
if (topicError) throw topicError;

const existing = typeof topic.structured_notes === "string" ? JSON.parse(topic.structured_notes) : topic.structured_notes ?? {};
const nextNotes = { ...existing, ...structuredNotes };

let { error: updateError } = await supabase
  .from("topics")
  .update({ structured_notes: nextNotes, content_quality: "publish_ready" })
  .eq("key", topicKey);
if (updateError) {
  const fallback = await supabase
    .from("topics")
    .update({ structured_notes: JSON.stringify(nextNotes) })
    .eq("key", topicKey);
  updateError = fallback.error;
}
if (updateError) throw updateError;

const { data: oldQuestions, error: oldError } = await supabase.from("questions").select("id").eq("topic_key", topicKey);
if (oldError) throw oldError;
const oldIds = (oldQuestions ?? []).map((row) => row.id);
if (oldIds.length) {
  const { error: optionsError } = await supabase.from("question_options").delete().in("question_id", oldIds);
  if (optionsError) throw optionsError;
  const { error: questionsError } = await supabase.from("questions").delete().in("id", oldIds);
  if (questionsError) throw questionsError;
}

const questionRows = questions.map((question) => ({
  id: question.id,
  topic_key: topicKey,
  question_text: question.question_text,
  question_type: "mcq",
  year: null,
  source: "ClearUPSC Pattern",
  difficulty: 3,
  tags: ["GS2", "Polity", "Local Bodies"],
  explanation: question.explanation,
  source_label: "ClearUPSC Pattern",
  trap_type: "Constitutional amendment/article trap",
}));
const optionRows = questions.flatMap((question) =>
  question.options.map(([label, text, isCorrect]) => ({
    question_id: question.id,
    option_label: label,
    option_text: text,
    is_correct: isCorrect,
  })),
);

const { error: insertQuestionsError } = await supabase.from("questions").insert(questionRows);
if (insertQuestionsError) throw insertQuestionsError;
const { error: insertOptionsError } = await supabase.from("question_options").insert(optionRows);
if (insertOptionsError) throw insertOptionsError;

console.log(JSON.stringify({ topic: topicKey, updatedNotes: true, deletedQuestions: oldIds.length, insertedQuestions: questions.length, insertedOptions: optionRows.length }, null, 2));
