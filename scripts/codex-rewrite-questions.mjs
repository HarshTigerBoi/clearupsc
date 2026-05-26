import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const BATCH_SIZE = 20;
const QUESTIONS_PER_TOPIC = 5;

loadLocalEnv();

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const LETTERS = ["A", "B", "C", "D"];

const subjectDistractors = {
  CSAT: {
    terms: ["Article 356", "GST Council", "Finance Commission", "Paris Agreement", "Basic Structure"],
    facts: ["CSAT Paper II carries 300 marks.", "CSAT has no qualifying threshold.", "CSAT wrong answers carry no penalty."],
  },
  Essay: {
    terms: ["Repo Rate", "Article 131", "CITES", "Panchsheel", "HCF"],
    facts: ["Essay paper carries 100 marks.", "Essay is part of Prelims.", "Essay requires only factual listing."],
  },
  GS1: {
    terms: ["Article 279A", "Repo Rate", "Lokpal Act", "QUAD", "Aditya-L1"],
    facts: ["Rigveda is the youngest Veda.", "Harappan cities were primarily Iron Age settlements.", "Census in India is conducted every five years."],
  },
  GS2: {
    terms: ["Black Soil", "Repo Rate", "Paris Agreement", "Aryabhata satellite", "HCF"],
    facts: ["Article 32 is not enforceable in courts.", "Finance Commission is a statutory body.", "The 73rd Amendment created GST Council."],
  },
  GS3: {
    terms: ["Article 32", "Sangam Literature", "Vishaka Guidelines", "SAARC", "Tone"],
    facts: ["GST was launched in 1991.", "RBI was established in 1950.", "Paris Agreement was adopted in 1986."],
  },
  GS4: {
    terms: ["Repo Rate", "Indus Waters Treaty", "Article 131", "Black Soil", "PSLV"],
    facts: ["Integrity means acting only when supervised.", "Probity means political favouritism.", "Nolan principles are Indian constitutional articles."],
  },
};

const factualPacks = {
  constitution: {
    concise: [
      ["Preamble", "Introductory statement declaring India sovereign, socialist, secular, democratic and republic."],
      ["Article 12", "Defines State for enforcement of Fundamental Rights."],
      ["Article 13", "Invalidates laws inconsistent with Fundamental Rights."],
      ["Article 32", "Right to constitutional remedies before the Supreme Court."],
      ["Article 368", "Procedure for constitutional amendment."],
      ["Basic Structure", "Kesavananda Bharati doctrine limiting Parliament's amending power."],
    ],
    bullets: ["Constitution was adopted on 26 November 1949.", "Constitution came into force on 26 January 1950.", "42nd Amendment added socialist, secular and integrity.", "44th Amendment removed Right to Property from Part III.", "Basic Structure doctrine came in 1973."],
    anchors: [["Kesavananda Bharati v State of Kerala (1973)", "Established Basic Structure doctrine."], ["Minerva Mills v Union of India (1980)", "Protected balance between Fundamental Rights and DPSPs."]],
  },
  judiciary: {
    concise: [
      ["Supreme Court", "Apex court of India under Articles 124-147."],
      ["Original Jurisdiction", "Article 131 jurisdiction in Centre-State and inter-State disputes."],
      ["Writ Jurisdiction", "Article 32 jurisdiction to enforce Fundamental Rights."],
      ["Special Leave Petition", "Article 136 discretionary appellate power."],
      ["Judicial Review", "Court power to strike down unconstitutional laws; part of Basic Structure."],
      ["Collegium System", "Judicial appointments system evolved through the Three Judges Cases."],
    ],
    bullets: ["Article 124 establishes Supreme Court.", "SC judges retire at 65 years.", "HC judges retire at 62 years.", "Article 32 is itself a Fundamental Right.", "NJAC was struck down in 2015."],
    anchors: [["Kesavananda Bharati v State of Kerala (1973)", "Basic Structure doctrine."], ["L. Chandra Kumar v Union of India (1997)", "Judicial review over tribunals is Basic Structure."]],
  },
  local_bodies: {
    concise: [
      ["73rd Amendment Act, 1992", "Inserted Part IX and Eleventh Schedule for Panchayats."],
      ["74th Amendment Act, 1992", "Inserted Part IXA and Twelfth Schedule for Municipalities."],
      ["Article 243G", "Powers, authority and responsibilities of Panchayats."],
      ["Article 243W", "Powers, authority and responsibilities of Municipalities."],
      ["State Election Commission", "Conducts Panchayat and Municipal elections under Articles 243K and 243ZA."],
      ["State Finance Commission", "Recommends finances for local bodies under Articles 243I and 243Y."],
    ],
    bullets: ["Part IX covers Panchayats.", "Part IXA covers Municipalities.", "Eleventh Schedule has 29 subjects.", "Twelfth Schedule has 18 subjects.", "Local body term is five years."],
    anchors: [["Balwant Rai Mehta Committee (1957)", "Recommended democratic decentralisation and three-tier Panchayati Raj."], ["L.M. Singhvi Committee (1986)", "Recommended constitutional recognition for Panchayats."]],
  },
  federalism: {
    concise: [
      ["Seventh Schedule", "Divides subjects into Union, State and Concurrent Lists."],
      ["Article 246", "Distributes legislative powers between Union and States."],
      ["Article 263", "Provides for Inter-State Council."],
      ["Article 280", "Provides for Finance Commission."],
      ["GST Council", "Article 279A body for GST-related recommendations."],
      ["Article 356", "President's Rule on failure of constitutional machinery in a State."],
    ],
    bullets: ["India has a federal system with unitary bias.", "Finance Commission is under Article 280.", "GST Council is under Article 279A.", "S.R. Bommai limited misuse of Article 356.", "Residuary powers lie with Parliament."],
    anchors: [["S.R. Bommai v Union of India (1994)", "Restricted arbitrary President's Rule."], ["Sarkaria Commission (1983)", "Reviewed Centre-State relations."]],
  },
  parliament: {
    concise: [
      ["Article 79", "Constitutes Parliament with President, Lok Sabha and Rajya Sabha."],
      ["Lok Sabha", "House of the People with members directly elected from territorial constituencies."],
      ["Rajya Sabha", "Council of States and permanent House not subject to dissolution."],
      ["Money Bill", "Article 110 bill dealing only with specified financial matters."],
      ["Anti-Defection Law", "Tenth Schedule law against political defections."],
      ["Parliamentary Privileges", "Special rights and immunities of Parliament and its members."],
    ],
    bullets: ["Article 79 defines Parliament.", "Money Bill is defined in Article 110.", "Rajya Sabha is a permanent House.", "Tenth Schedule was added by 52nd Amendment.", "Speaker decides Money Bill certification."],
    anchors: [["Kihoto Hollohan v Zachillhu (1992)", "Upheld Tenth Schedule with judicial review."], ["Raja Ram Pal v Lok Sabha (2007)", "Recognised judicial review over parliamentary privileges."]],
  },
  executive: {
    concise: [
      ["Article 52", "Provides that there shall be a President of India."],
      ["Article 74", "Council of Ministers aids and advises the President."],
      ["Article 75", "Deals with appointment and responsibility of Prime Minister and ministers."],
      ["Collective Responsibility", "Council of Ministers is collectively responsible to Lok Sabha."],
      ["Governor", "State executive head under Article 153."],
      ["Ordinance Power", "President's Article 123 and Governor's Article 213 legislative power during recess."],
    ],
    bullets: ["President is elected indirectly.", "Council of Ministers is collectively responsible to Lok Sabha.", "Article 123 covers President's ordinance power.", "Article 153 provides Governor.", "Prime Minister is appointed by President."],
    anchors: [["Shamsher Singh v State of Punjab (1974)", "President and Governor normally act on ministerial advice."], ["Nabam Rebia v Deputy Speaker (2016)", "Limited Governor's discretion in Assembly matters."]],
  },
  governance: {
    concise: [
      ["RTI Act 2005", "Law giving citizens access to information from public authorities."],
      ["Central Information Commission", "Appeal and complaint body under RTI Act for Union public authorities."],
      ["Lokpal Act 2013", "Anti-corruption ombudsman law for specified public functionaries."],
      ["Citizen Charter", "Public document declaring service standards and grievance redress."],
      ["Social Audit", "Community verification of public works and welfare delivery."],
      ["DBT", "Direct Benefit Transfer of subsidies or benefits to bank accounts."],
    ],
    bullets: ["RTI Act was enacted in 2005.", "Lokpal Act was enacted in 2013.", "MGNREGA mandates social audit.", "DBT uses JAM architecture.", "Citizen charters are service-delivery tools."],
    anchors: [["Vineet Narain v Union of India (1997)", "Strengthened investigative independence and accountability."], ["PUCL Right to Food case", "Linked welfare delivery with Article 21."]],
  },
  ir: {
    concise: [
      ["Panchsheel", "Five principles of peaceful coexistence articulated in 1954."],
      ["Strategic Autonomy", "India's ability to make independent foreign policy choices."],
      ["Indus Waters Treaty 1960", "India-Pakistan river water treaty brokered by World Bank."],
      ["QUAD", "Grouping of India, United States, Japan and Australia."],
      ["UNCLOS", "UN Convention governing law of the sea and maritime rights."],
      ["International Solar Alliance", "India-France initiative for solar cooperation."],
    ],
    bullets: ["Indus Waters Treaty was signed in 1960.", "Simla Agreement was signed in 1972.", "Land Boundary Agreement with Bangladesh was operationalised in 2015.", "QUAD has India, US, Japan and Australia.", "Article 253 supports treaty implementation laws."],
    anchors: [["Simla Agreement (1972)", "Framework for India-Pakistan bilateral resolution."], ["Paris Agreement (2015)", "Global climate agreement under UNFCCC."]],
  },
  economy: {
    concise: [
      ["GDP", "Market value of final goods and services produced within a country."],
      ["GVA", "Value of output minus intermediate consumption."],
      ["Fiscal Deficit", "Government borrowing requirement when expenditure exceeds receipts excluding borrowings."],
      ["CPI", "Consumer Price Index used for inflation targeting in India."],
      ["Repo Rate", "Rate at which RBI lends to banks against eligible securities."],
      ["GST Council", "Article 279A constitutional body for GST recommendations."],
    ],
    bullets: ["LPG reforms began in 1991.", "GST launched on 1 July 2017.", "RBI was established in 1935.", "RBI was nationalised in 1949.", "Inflation target is 4 percent plus or minus 2 percent."],
    anchors: [["Urjit Patel Committee", "Recommended CPI-based inflation targeting."], ["N.K. Singh Committee", "Reviewed FRBM framework."]],
  },
  agriculture: {
    concise: [
      ["MSP", "Minimum Support Price announced by government for selected crops."],
      ["CACP", "Commission recommending MSP to government."],
      ["PM-KISAN", "Income support scheme providing Rs 6000 per year to eligible farmer families."],
      ["PMFBY", "Crop insurance scheme launched in 2016."],
      ["e-NAM", "Electronic National Agriculture Market platform."],
      ["FPO", "Farmer Producer Organisation for collective bargaining and marketing."],
    ],
    bullets: ["MSP is announced for 23 crops.", "PMFBY was launched in 2016.", "PM-KISAN gives Rs 6000 per year.", "Agriculture is a State List subject.", "Swaminathan Commission recommended C2 plus 50 percent MSP."],
    anchors: [["M.S. Swaminathan Commission", "Recommended MSP at C2 plus 50 percent."], ["Shanta Kumar Committee", "Recommended FCI and PDS reforms."]],
  },
  environment: {
    concise: [
      ["Environment Protection Act 1986", "Umbrella environmental law enacted after Bhopal disaster."],
      ["Forest Conservation Act 1980", "Regulates diversion of forest land for non-forest purposes."],
      ["Wildlife Protection Act 1972", "Provides legal protection to wild animals, birds and plants."],
      ["NGT Act 2010", "Created National Green Tribunal for environmental adjudication."],
      ["Paris Agreement 2015", "Climate agreement under UNFCCC to limit global warming."],
      ["CBD", "Convention on Biological Diversity adopted at Rio Earth Summit 1992."],
    ],
    bullets: ["Wildlife Protection Act was enacted in 1972.", "Environment Protection Act was enacted in 1986.", "NGT Act was enacted in 2010.", "Paris Agreement was adopted in 2015.", "CBD emerged from Rio Summit 1992."],
    anchors: [["Vellore Citizens Welfare Forum v Union of India (1996)", "Accepted precautionary principle and polluter pays principle."], ["M.C. Mehta cases", "Expanded Indian environmental jurisprudence."]],
  },
  science: {
    concise: [
      ["ISRO", "India's national space agency under Department of Space."],
      ["Chandrayaan-3", "ISRO mission that achieved lunar soft landing in 2023."],
      ["Aditya-L1", "India's first solar observatory mission."],
      ["Gaganyaan", "India's human spaceflight programme."],
      ["Biotechnology", "Use of biological systems for products, medicine and agriculture."],
      ["Digital Personal Data Protection Act 2023", "Indian law governing personal data processing."],
    ],
    bullets: ["Chandrayaan-3 landed in 2023.", "Aryabhata satellite was launched in 1975.", "Aditya-L1 studies the Sun.", "Gaganyaan is India's human spaceflight programme.", "DPDP Act was enacted in 2023."],
    anchors: [["National Quantum Mission", "Mission to build quantum technology capacity."], ["Anusandhan National Research Foundation Act 2023", "Creates framework to fund research and innovation."]],
  },
  security: {
    concise: [
      ["UAPA 1967", "Law for prevention of unlawful activities and terrorism-related offences."],
      ["NIA Act 2008", "Created National Investigation Agency."],
      ["FATF", "Global body setting standards against money laundering and terror financing."],
      ["Left Wing Extremism", "Internal security challenge linked to Maoist violence."],
      ["Cyber Security", "Protection of networks, data and systems from digital threats."],
      ["Disaster Management Act 2005", "Law creating NDMA, SDMAs and DDMAs."],
    ],
    bullets: ["NIA Act was enacted in 2008.", "UAPA was enacted in 1967.", "Disaster Management Act was enacted in 2005.", "FATF monitors terror financing risks.", "Article 355 concerns Union duty to protect States."],
    anchors: [["Kargil Review Committee", "Reviewed national security after Kargil conflict."], ["National Cyber Security Policy 2013", "Policy framework for cyber security."]],
  },
  history_ancient: {
    concise: [
      ["Indus Valley Civilization", "Bronze Age urban civilization c. 2600-1900 BCE."],
      ["Great Bath", "Ritual bathing structure found at Mohenjo-daro."],
      ["Rigveda", "Oldest Veda of early Vedic tradition."],
      ["Mahajanapadas", "Sixteen major states around 6th century BCE."],
      ["Buddhism", "Religion founded by Gautama Buddha based on Four Noble Truths."],
      ["Mauryan Empire", "Empire founded by Chandragupta Maurya."],
    ],
    bullets: ["Mature Harappan phase is c. 2600-1900 BCE.", "Rigveda is the oldest Veda.", "Buddha taught Four Noble Truths.", "Mahavira was the 24th Tirthankara.", "Ashoka's Kalinga War was around 261 BCE."],
    anchors: [["Arthashastra", "Kautilya's text on statecraft."], ["Allahabad Prashasti", "Praises Samudragupta."]],
  },
  history_modern: {
    concise: [
      ["Regulating Act 1773", "First major British parliamentary control over Company administration."],
      ["Revolt of 1857", "Major uprising beginning at Meerut against Company rule."],
      ["Indian National Congress", "Founded in 1885 as platform for nationalist politics."],
      ["Swadeshi Movement", "Movement after Bengal Partition 1905 promoting boycott and indigenous goods."],
      ["Non-Cooperation Movement", "Gandhian mass movement launched in 1920."],
      ["Quit India Movement", "Movement launched on 8 August 1942 demanding British withdrawal."],
    ],
    bullets: ["INC was founded in 1885.", "Bengal was partitioned in 1905.", "Jallianwala Bagh massacre occurred in 1919.", "Dandi March began in 1930.", "Quit India Movement began in 1942."],
    anchors: [["Government of India Act 1935", "Provided provincial autonomy and federal scheme."], ["Cabinet Mission Plan 1946", "Proposed Constituent Assembly framework."]],
  },
  geography: {
    concise: [
      ["Plate Tectonics", "Theory explaining movement of lithospheric plates."],
      ["Monsoon", "Seasonal reversal of winds causing major rainfall in India."],
      ["Western Ghats", "Mountain chain parallel to India's western coast."],
      ["Alluvial Soil", "Fertile soil deposited by rivers, dominant in northern plains."],
      ["Himalayas", "Young fold mountains formed by Indian-Eurasian plate collision."],
      ["IMD", "India Meteorological Department responsible for weather and monsoon forecasts."],
    ],
    bullets: ["Himalayas are young fold mountains.", "Western Ghats are older than Himalayas.", "Alluvial soil dominates northern plains.", "IMD issues monsoon forecasts.", "El Nino can weaken Indian monsoon."],
    anchors: [["Disaster Management Act 2005", "Created disaster management institutional framework."], ["Cauvery Water Disputes Tribunal", "Important river water dispute mechanism."]],
  },
  society: {
    concise: [
      ["Article 14", "Equality before law and equal protection of laws."],
      ["Article 15", "Prohibits discrimination on specified grounds."],
      ["Article 17", "Abolishes untouchability."],
      ["SC/ST Act 1989", "Law preventing atrocities against Scheduled Castes and Scheduled Tribes."],
      ["NALSA Judgment 2014", "Recognised transgender persons' rights and self-identification."],
      ["Census 2011", "Latest completed Census of India."],
    ],
    bullets: ["Article 17 abolishes untouchability.", "SC/ST Act was enacted in 1989.", "NALSA judgment came in 2014.", "Census 2011 is latest completed Census.", "Vishaka guidelines came in 1997."],
    anchors: [["Indra Sawhney v Union of India (1992)", "OBC reservation and 50 percent ceiling."], ["Vishaka v State of Rajasthan (1997)", "Workplace sexual harassment guidelines."]],
  },
  ethics: {
    concise: [
      ["Integrity", "Consistency between values, words and actions."],
      ["Probity", "Uprightness and honesty in public office."],
      ["Objectivity", "Decision-making based on evidence and public interest."],
      ["Accountability", "Obligation to explain and accept responsibility for decisions."],
      ["Emotional Intelligence", "Ability to understand and manage emotions in self and others."],
      ["Nolan Principles", "Seven principles of public life from the United Kingdom."],
    ],
    bullets: ["2nd ARC reported on Ethics in Governance.", "Nolan principles are seven public-life principles.", "Probity means uprightness in public office.", "Integrity requires consistency in action.", "Conflict of interest must be disclosed and managed."],
    anchors: [["2nd ARC Fourth Report", "Ethics in Governance report."], ["Gandhian Talisman", "Ethical test focused on weakest person."]],
  },
  csat: {
    concise: [
      ["CSAT Paper II", "UPSC Prelims qualifying paper carrying 200 marks."],
      ["Qualifying Mark", "Minimum 33 percent marks required in CSAT."],
      ["Negative Marking", "One-third penalty for wrong objective answers."],
      ["Inference", "Conclusion that follows from given information."],
      ["Assumption", "Unstated premise necessary for an argument."],
      ["Average", "Sum of observations divided by number of observations."],
    ],
    bullets: ["CSAT Paper II carries 200 marks.", "CSAT has 80 questions.", "Qualifying standard is 33 percent.", "Wrong answers carry one-third penalty.", "Inference must follow from passage evidence."],
    anchors: [["Article 320", "Constitutional provision connected with PSC examination functions."], ["UPSC Notification", "Official source for exam pattern and qualifying rules."]],
  },
};

async function main() {
  let offset = 0;
  let processed = 0;
  const generated = [];

  while (true) {
    const { data: topics, error } = await supabase
      .from("topics")
      .select("key,title,subject,structured_notes")
      .order("key", { ascending: true })
      .range(offset, offset + BATCH_SIZE - 1);

    if (error) throw error;
    if (!topics?.length) break;

    for (const topic of topics) {
      processed += 1;
      generated.push(...makeQuestions(topic));

      if (processed % 200 === 0) {
        console.log(`[progress] generated questions for ${processed} topics (${generated.length} questions)`);
      }
    }

    offset += BATCH_SIZE;
  }

  console.log(`Generated ${generated.length} questions. Clearing old questions and options...`);
  await clearQuestionBank();

  const questionRows = generated.map(({ options, ...question }) => question);
  const optionRows = generated.flatMap((question) =>
    question.options.map((option) => ({
      question_id: question.id,
      option_label: option.label,
      option_text: option.text,
      is_correct: option.isCorrect,
    })),
  );

  let insertedQuestions = 0;
  for (let i = 0; i < questionRows.length; i += 200) {
    const chunk = questionRows.slice(i, i + 200);
    const { error } = await supabase.from("questions").insert(chunk);
    if (error) throw error;
    insertedQuestions += chunk.length;
    if (insertedQuestions % 1000 === 0 || insertedQuestions === questionRows.length) {
      console.log(`[insert] questions ${insertedQuestions}/${questionRows.length}`);
    }
  }

  let insertedOptions = 0;
  for (let i = 0; i < optionRows.length; i += 800) {
    const chunk = optionRows.slice(i, i + 800);
    const { error } = await supabase.from("question_options").insert(chunk);
    if (error) throw error;
    insertedOptions += chunk.length;
    if (insertedOptions % 4000 === 0 || insertedOptions === optionRows.length) {
      console.log(`[insert] options ${insertedOptions}/${optionRows.length}`);
    }
  }

  console.log(
    JSON.stringify(
      {
        processed,
        insertedQuestions,
        insertedOptions,
        expectedQuestions: processed * QUESTIONS_PER_TOPIC,
        failed: 0,
        failedTopics: [],
      },
      null,
      2,
    ),
  );
}

async function clearQuestionBank() {
  const { error: optionError } = await supabase.from("question_options").delete().not("id", "is", null);
  if (optionError) throw optionError;
  const { error: questionError } = await supabase.from("questions").delete().not("id", "is", null);
  if (questionError) throw questionError;
}

function makeQuestions(topic) {
  if (topic.key === "gs2_polity_local_bodies") return localBodiesQuestions(topic);
  if (topic.key === "gs3_economy_basics") return economyBasicsQuestions(topic);

  return questionBlueprintsFor(topic).map((row, index) => buildQuestion(topic, index + 1, row));
}

function factualPackFor(topic) {
  const key = String(topic.key ?? "").toLowerCase();
  const title = String(topic.title ?? "").toLowerCase();
  const subject = String(topic.subject ?? "").toLowerCase();

  if (subject === "csat") return factualPacks.csat;
  if (subject === "essay") return factualPacks.ethics;
  if (subject === "gs4" || key.includes("ethics") || key.includes("case_studies")) return factualPacks.ethics;

  if (subject === "gs1") {
    if (key.includes("geography") || title.includes("geography") || title.includes("climate") || title.includes("river") || title.includes("soil") || title.includes("monsoon")) return factualPacks.geography;
    if (key.includes("society") || title.includes("society") || title.includes("women") || title.includes("population") || title.includes("urban") || title.includes("communal") || title.includes("regional")) return factualPacks.society;
    if (key.includes("ancient")) return factualPacks.history_ancient;
    return factualPacks.history_modern;
  }

  if (subject === "gs2") {
    if (key.includes("local_bodies")) return factualPacks.local_bodies;
    if (key.includes("judiciary")) return factualPacks.judiciary;
    if (key.includes("federalism")) return factualPacks.federalism;
    if (key.includes("parliament")) return factualPacks.parliament;
    if (key.includes("executive")) return factualPacks.executive;
    if (key.includes("governance") || key.includes("rti") || key.includes("social_justice") || title.includes("health") || title.includes("education") || title.includes("welfare")) return factualPacks.governance;
    if (key.includes("ir") || title.includes("international") || title.includes("bilateral") || title.includes("foreign") || title.includes("neighbour")) return factualPacks.ir;
    return factualPacks.constitution;
  }

  if (subject === "gs3") {
    if (key.includes("agriculture") || title.includes("agriculture") || title.includes("food") || title.includes("msp") || title.includes("farm")) return factualPacks.agriculture;
    if (key.includes("environment") || title.includes("environment") || title.includes("climate") || title.includes("biodiversity") || title.includes("pollution") || title.includes("forest")) return factualPacks.environment;
    if (key.includes("science") || title.includes("technology") || title.includes("space") || title.includes("isro") || title.includes("biotech") || title.includes("ai")) return factualPacks.science;
    if (key.includes("security") || title.includes("security") || title.includes("terror") || title.includes("cyber") || title.includes("disaster")) return factualPacks.security;
    return factualPacks.economy;
  }

  return factualPacks.ethics;
}

function localBodiesQuestions(topic) {
  const rows = [
    {
      text: "Under which constitutional amendment were Panchayati Raj institutions given constitutional status?",
      correct: "73rd Constitutional Amendment Act, 1992",
      distractors: ["42nd Constitutional Amendment Act, 1976", "74th Constitutional Amendment Act, 1992", "86th Constitutional Amendment Act, 2002"],
      explanation: "The 73rd Constitutional Amendment Act, 1992 inserted Part IX and gave constitutional status to Panchayats.",
      trap: "Amendment confusion",
    },
    {
      text: "Article 243G of the Constitution relates to which of the following?",
      correct: "Powers, authority and responsibilities of Panchayats",
      distractors: ["Powers of Municipalities", "Elections to Panchayats", "State Finance Commission for Panchayats"],
      explanation: "Article 243G deals with powers, authority and responsibilities of Panchayats, including matters in the Eleventh Schedule.",
      trap: "Article mismatch",
    },
    {
      text: "Which Schedule of the Constitution lists 29 subjects that may be devolved to Panchayats?",
      correct: "Eleventh Schedule",
      distractors: ["Seventh Schedule", "Tenth Schedule", "Twelfth Schedule"],
      explanation: "The Eleventh Schedule, added by the 73rd Amendment, contains 29 subjects for Panchayats.",
      trap: "Schedule confusion",
    },
    {
      text: "Which constitutional amendment gave constitutional status to Municipalities?",
      correct: "74th Constitutional Amendment Act, 1992",
      distractors: ["73rd Constitutional Amendment Act, 1992", "61st Constitutional Amendment Act, 1988", "97th Constitutional Amendment Act, 2011"],
      explanation: "The 74th Constitutional Amendment Act, 1992 inserted Part IXA and gave constitutional status to Municipalities.",
      trap: "Panchayat-municipality confusion",
    },
    {
      text: "State Finance Commissions for local bodies are provided under which articles?",
      correct: "Articles 243I and 243Y",
      distractors: ["Articles 280 and 281", "Articles 324 and 329", "Articles 124 and 217"],
      explanation: "Article 243I relates to State Finance Commission for Panchayats and Article 243Y applies it to Municipalities.",
      trap: "Institutional article mismatch",
    },
  ];
  return rows.map((row, index) => buildQuestion(topic, index + 1, row));
}

function economyBasicsQuestions(topic) {
  const rows = [
    {
      text: "Which of the following best defines GDP?",
      correct: "Total market value of all final goods and services produced within a country in a given period",
      distractors: [
        "Total value added by all sectors before adding net product taxes",
        "Total government revenue collected from taxes and non-tax sources",
        "Total value of goods and services exported minus imported",
      ],
      explanation: "GDP measures final goods and services produced within a country. GVA measures value added by sectors, while trade balance compares exports and imports.",
      trap: "Indicator-definition trap",
    },
    {
      text: "Which institution is responsible for setting India's policy repo rate?",
      correct: "Monetary Policy Committee",
      distractors: ["Finance Commission", "GST Council", "NITI Aayog"],
      explanation: "The Monetary Policy Committee of RBI decides the policy repo rate. Finance Commission handles fiscal transfers, GST Council handles GST recommendations, and NITI Aayog is a policy think tank.",
      trap: "Institution-function trap",
    },
    {
      text: "The GST Council is established under which constitutional provision?",
      correct: "Article 279A",
      distractors: ["Article 280", "Article 112", "Article 324"],
      explanation: "Article 279A provides for the GST Council. Article 280 relates to Finance Commission, Article 112 to Union Budget, and Article 324 to Election Commission.",
      trap: "Article-number trap",
    },
    {
      text: "Which of the following correctly describes Fiscal Deficit?",
      correct: "Total expenditure minus total receipts excluding borrowings",
      distractors: [
        "Revenue expenditure minus revenue receipts",
        "Total imports minus total exports",
        "Money supply growth minus inflation rate",
      ],
      explanation: "Fiscal Deficit shows the government's total borrowing requirement. Revenue deficit is limited to the revenue account, while import-export gap is current or trade account related.",
      trap: "Deficit-concept trap",
    },
    {
      text: "Which of the following pairs is correctly matched?",
      correct: "FRBM Act, 2003 - Fiscal discipline and deficit management",
      distractors: [
        "IBC, 2016 - Consumer price inflation targeting",
        "GST Council - Monetary policy rate setting",
        "NITI Aayog - Constitutional tax devolution body",
      ],
      explanation: "FRBM Act focuses on fiscal discipline. IBC deals with insolvency, GST Council with GST recommendations, and NITI Aayog is not a constitutional tax devolution body.",
      trap: "Institution-law matching trap",
    },
  ];
  return rows.map((row, index) => buildQuestion(topic, index + 1, row));
}

function questionBlueprintsFor(topic) {
  const pack = factualQuestionPacks[classifyQuestionPack(topic)] ?? factualQuestionPacks.ethics;
  return pack.map((row) => ({
    ...row,
    text: row.text.replaceAll("{title}", clean(topic.title)),
  }));
}

const factualQuestionPacks = {
  constitution: [
    {
      text: "Which part of the Constitution contains Fundamental Rights?",
      correct: "Part III",
      distractors: ["Part IV", "Part IVA", "Part V"],
      explanation: "Fundamental Rights are placed in Part III of the Constitution. Part IV contains Directive Principles, Part IVA contains Fundamental Duties, and Part V deals with the Union.",
      trap: "Constitution part trap",
    },
    {
      text: "Which Article gives the right to constitutional remedies before the Supreme Court?",
      correct: "Article 32",
      distractors: ["Article 14", "Article 19", "Article 21"],
      explanation: "Article 32 allows direct movement of the Supreme Court for enforcement of Fundamental Rights. Articles 14, 19 and 21 are substantive Fundamental Rights.",
      trap: "Article-number trap",
    },
    {
      text: "The Basic Structure doctrine was propounded in which case?",
      correct: "Kesavananda Bharati v State of Kerala (1973)",
      distractors: ["Golaknath v State of Punjab (1967)", "Minerva Mills v Union of India (1980)", "I.R. Coelho v State of Tamil Nadu (2007)"],
      explanation: "Kesavananda Bharati (1973) held that Parliament may amend the Constitution but cannot destroy its Basic Structure.",
      trap: "Landmark-case trap",
    },
    {
      text: "Which amendment added the words socialist, secular and integrity to the Preamble?",
      correct: "42nd Amendment Act, 1976",
      distractors: ["24th Amendment Act, 1971", "44th Amendment Act, 1978", "86th Amendment Act, 2002"],
      explanation: "The 42nd Amendment Act, 1976 added socialist, secular and integrity to the Preamble.",
      trap: "Amendment trap",
    },
    {
      text: "Which Article lays down the procedure for amendment of the Constitution?",
      correct: "Article 368",
      distractors: ["Article 13", "Article 32", "Article 356"],
      explanation: "Article 368 provides the procedure for constitutional amendment. Article 13 concerns laws inconsistent with Fundamental Rights.",
      trap: "Article-function trap",
    },
  ],
  judiciary: [
    {
      text: "Which Articles deal with the Supreme Court of India?",
      correct: "Articles 124-147",
      distractors: ["Articles 52-78", "Articles 79-122", "Articles 214-231"],
      explanation: "Articles 124 to 147 deal with the Supreme Court. Articles 214 to 231 deal with High Courts.",
      trap: "Article-range trap",
    },
    {
      text: "Original jurisdiction of the Supreme Court in Centre-State disputes is provided by which Article?",
      correct: "Article 131",
      distractors: ["Article 32", "Article 136", "Article 143"],
      explanation: "Article 131 gives the Supreme Court exclusive original jurisdiction in specified disputes involving the Union and States.",
      trap: "Jurisdiction article trap",
    },
    {
      text: "Special Leave Petition power of the Supreme Court is under which Article?",
      correct: "Article 136",
      distractors: ["Article 131", "Article 137", "Article 143"],
      explanation: "Article 136 gives the Supreme Court discretionary Special Leave Petition power.",
      trap: "Jurisdiction article trap",
    },
    {
      text: "Which case struck down the NJAC as violating Basic Structure?",
      correct: "Supreme Court Advocates-on-Record Association v Union of India (2015)",
      distractors: ["S.P. Gupta v Union of India (1981)", "Second Judges Case (1993)", "Presidential Reference (1998)"],
      explanation: "The 2015 NJAC judgment struck down the 99th Amendment and NJAC Act, preserving judicial primacy in appointments.",
      trap: "Judges cases trap",
    },
    {
      text: "What is the retirement age of a Supreme Court judge?",
      correct: "65 years",
      distractors: ["60 years", "62 years", "70 years"],
      explanation: "Supreme Court judges retire at 65 years. High Court judges retire at 62 years.",
      trap: "Age-limit trap",
    },
  ],
  local_bodies: [
    {
      text: "Which amendment gave constitutional status to Panchayati Raj Institutions?",
      correct: "73rd Amendment Act, 1992",
      distractors: ["42nd Amendment Act, 1976", "44th Amendment Act, 1978", "74th Amendment Act, 1992"],
      explanation: "The 73rd Amendment inserted Part IX and the Eleventh Schedule for Panchayats.",
      trap: "Amendment trap",
    },
    {
      text: "Which amendment gave constitutional status to Municipalities?",
      correct: "74th Amendment Act, 1992",
      distractors: ["73rd Amendment Act, 1992", "86th Amendment Act, 2002", "97th Amendment Act, 2011"],
      explanation: "The 74th Amendment inserted Part IXA and the Twelfth Schedule for Municipalities.",
      trap: "Amendment trap",
    },
    {
      text: "Article 243G relates to which of the following?",
      correct: "Powers, authority and responsibilities of Panchayats",
      distractors: ["Reservation of seats in Panchayats", "State Election Commission for Panchayats", "Duration of Panchayats"],
      explanation: "Article 243G enables State Legislatures to devolve powers and responsibilities to Panchayats.",
      trap: "Article-function trap",
    },
    {
      text: "Which Schedule lists 29 subjects for Panchayats?",
      correct: "Eleventh Schedule",
      distractors: ["Seventh Schedule", "Tenth Schedule", "Twelfth Schedule"],
      explanation: "The Eleventh Schedule contains 29 subjects for Panchayats. The Twelfth Schedule has 18 municipal subjects.",
      trap: "Schedule trap",
    },
    {
      text: "Who conducts elections to Panchayats and Municipalities?",
      correct: "State Election Commission",
      distractors: ["Election Commission of India", "State Finance Commission", "District Planning Committee"],
      explanation: "State Election Commissions conduct local body elections under Articles 243K and 243ZA.",
      trap: "Institution-function trap",
    },
  ],
  federalism: [
    {
      text: "Which Schedule divides subjects into Union, State and Concurrent Lists?",
      correct: "Seventh Schedule",
      distractors: ["Fifth Schedule", "Sixth Schedule", "Tenth Schedule"],
      explanation: "The Seventh Schedule distributes legislative subjects across Union, State and Concurrent Lists.",
      trap: "Schedule trap",
    },
    {
      text: "Finance Commission is provided under which Article?",
      correct: "Article 280",
      distractors: ["Article 263", "Article 279A", "Article 324"],
      explanation: "Article 280 provides for the Finance Commission. Article 279A provides for the GST Council.",
      trap: "Article-number trap",
    },
    {
      text: "Which case is known for limiting arbitrary use of President's Rule?",
      correct: "S.R. Bommai v Union of India (1994)",
      distractors: ["Kesavananda Bharati v State of Kerala (1973)", "Minerva Mills v Union of India (1980)", "I.R. Coelho v State of Tamil Nadu (2007)"],
      explanation: "S.R. Bommai strengthened federalism by allowing judicial review of Article 356 proclamations.",
      trap: "Federalism case trap",
    },
    {
      text: "GST Council is provided under which Article?",
      correct: "Article 279A",
      distractors: ["Article 246", "Article 263", "Article 280"],
      explanation: "Article 279A creates the GST Council. Article 280 creates the Finance Commission.",
      trap: "Fiscal federalism article trap",
    },
    {
      text: "In India, residuary legislative powers are vested in which authority?",
      correct: "Parliament",
      distractors: ["State Legislatures", "Inter-State Council", "Finance Commission"],
      explanation: "Unlike some federations, India gives residuary legislative powers to Parliament.",
      trap: "Federal feature trap",
    },
  ],
  parliament: [
    {
      text: "Article 79 of the Constitution deals with which institution?",
      correct: "Parliament",
      distractors: ["Supreme Court", "Election Commission", "Finance Commission"],
      explanation: "Article 79 provides that Parliament consists of the President and two Houses.",
      trap: "Article-institution trap",
    },
    {
      text: "A Money Bill is defined under which Article?",
      correct: "Article 110",
      distractors: ["Article 108", "Article 111", "Article 112"],
      explanation: "Article 110 defines Money Bill. Article 112 deals with the Annual Financial Statement.",
      trap: "Parliamentary article trap",
    },
    {
      text: "Anti-defection provisions are contained in which Schedule?",
      correct: "Tenth Schedule",
      distractors: ["Seventh Schedule", "Eighth Schedule", "Ninth Schedule"],
      explanation: "The Tenth Schedule contains anti-defection provisions added by the 52nd Amendment.",
      trap: "Schedule trap",
    },
    {
      text: "Which House of Parliament is not subject to dissolution?",
      correct: "Rajya Sabha",
      distractors: ["Lok Sabha", "Vidhan Sabha", "Municipal Council"],
      explanation: "Rajya Sabha is a permanent House, while Lok Sabha can be dissolved.",
      trap: "House-feature trap",
    },
    {
      text: "Who certifies a Bill as a Money Bill in Lok Sabha?",
      correct: "Speaker of Lok Sabha",
      distractors: ["President of India", "Chairman of Rajya Sabha", "Finance Minister"],
      explanation: "The Speaker of Lok Sabha certifies whether a Bill is a Money Bill.",
      trap: "Authority trap",
    },
  ],
  executive: [
    {
      text: "Article 52 provides for which office?",
      correct: "President of India",
      distractors: ["Vice-President of India", "Prime Minister of India", "Governor of a State"],
      explanation: "Article 52 says there shall be a President of India.",
      trap: "Article-office trap",
    },
    {
      text: "The Council of Ministers aids and advises the President under which Article?",
      correct: "Article 74",
      distractors: ["Article 72", "Article 75", "Article 78"],
      explanation: "Article 74 provides for the Council of Ministers to aid and advise the President.",
      trap: "Executive article trap",
    },
    {
      text: "President's ordinance-making power is under which Article?",
      correct: "Article 123",
      distractors: ["Article 110", "Article 111", "Article 213"],
      explanation: "Article 123 gives ordinance power to the President. Article 213 gives similar power to Governors.",
      trap: "Ordinance article trap",
    },
    {
      text: "Governor of a State is provided under which Article?",
      correct: "Article 153",
      distractors: ["Article 123", "Article 163", "Article 213"],
      explanation: "Article 153 provides that there shall be a Governor for each State.",
      trap: "State executive article trap",
    },
    {
      text: "The Council of Ministers at the Union level is collectively responsible to whom?",
      correct: "Lok Sabha",
      distractors: ["Rajya Sabha", "President", "Supreme Court"],
      explanation: "Article 75 makes the Council of Ministers collectively responsible to the Lok Sabha.",
      trap: "Responsibility trap",
    },
  ],
  governance: [
    {
      text: "The Right to Information Act was enacted in which year?",
      correct: "2005",
      distractors: ["2002", "2009", "2013"],
      explanation: "The RTI Act was enacted in 2005 to promote transparency and citizen access to information.",
      trap: "Year trap",
    },
    {
      text: "Which body hears second appeals under the RTI Act for Union public authorities?",
      correct: "Central Information Commission",
      distractors: ["Central Vigilance Commission", "Lokpal", "National Human Rights Commission"],
      explanation: "The Central Information Commission hears RTI appeals and complaints for Union public authorities.",
      trap: "Institution-function trap",
    },
    {
      text: "The Lokpal and Lokayuktas Act was enacted in which year?",
      correct: "2013",
      distractors: ["2005", "2010", "2018"],
      explanation: "The Lokpal and Lokayuktas Act, 2013 created the anti-corruption ombudsman framework.",
      trap: "Year trap",
    },
    {
      text: "Social audit is most directly associated with which welfare law?",
      correct: "MGNREGA, 2005",
      distractors: ["RTI Act, 2005", "Aadhaar Act, 2016", "Consumer Protection Act, 2019"],
      explanation: "MGNREGA mandates social audit through Gram Sabha-linked accountability mechanisms.",
      trap: "Law-tool trap",
    },
    {
      text: "Which platform is primarily used for government e-market procurement?",
      correct: "GeM",
      distractors: ["DigiLocker", "UMANG", "CoWIN"],
      explanation: "Government e-Marketplace, or GeM, is used for public procurement. DigiLocker stores documents, UMANG integrates services, and CoWIN managed vaccination.",
      trap: "Digital platform trap",
    },
  ],
  ir: [
    {
      text: "The Panchsheel principles were articulated in which year?",
      correct: "1954",
      distractors: ["1947", "1962", "1971"],
      explanation: "Panchsheel, the five principles of peaceful coexistence, was articulated in 1954.",
      trap: "Year trap",
    },
    {
      text: "The Indus Waters Treaty was signed in which year?",
      correct: "1960",
      distractors: ["1954", "1972", "1996"],
      explanation: "The Indus Waters Treaty between India and Pakistan was signed in 1960 with World Bank involvement.",
      trap: "Treaty year trap",
    },
    {
      text: "Which grouping consists of India, United States, Japan and Australia?",
      correct: "QUAD",
      distractors: ["BRICS", "SCO", "BIMSTEC"],
      explanation: "QUAD consists of India, United States, Japan and Australia.",
      trap: "Grouping membership trap",
    },
    {
      text: "Which agreement is associated with India-Pakistan bilateral resolution after the 1971 war?",
      correct: "Simla Agreement, 1972",
      distractors: ["Tashkent Agreement, 1966", "Lahore Declaration, 1999", "Indus Waters Treaty, 1960"],
      explanation: "The Simla Agreement, 1972 followed the 1971 war and is a key India-Pakistan bilateral framework.",
      trap: "Agreement trap",
    },
    {
      text: "Which Article enables Parliament to make laws for implementing international agreements?",
      correct: "Article 253",
      distractors: ["Article 246", "Article 263", "Article 280"],
      explanation: "Article 253 empowers Parliament to legislate for implementing international treaties and agreements.",
      trap: "Article trap",
    },
  ],
  economy: [
    {
      text: "Which of the following best defines GDP?",
      correct: "Total market value of final goods and services produced within a country in a given period",
      distractors: ["Value of output minus intermediate consumption", "Government expenditure minus government receipts", "Exports minus imports of goods and services"],
      explanation: "GDP measures final output produced within a country's domestic territory in a given period.",
      trap: "Indicator-definition trap",
    },
    {
      text: "Which body sets India's policy repo rate?",
      correct: "Monetary Policy Committee",
      distractors: ["Finance Commission", "GST Council", "NITI Aayog"],
      explanation: "The Monetary Policy Committee of RBI sets the policy repo rate under India's inflation-targeting framework.",
      trap: "Institution-function trap",
    },
    {
      text: "GST was launched in India on which date?",
      correct: "1 July 2017",
      distractors: ["1 April 1991", "1 January 2005", "1 July 2020"],
      explanation: "GST was launched on 1 July 2017 after the 101st Constitutional Amendment.",
      trap: "Date trap",
    },
    {
      text: "Which Act is associated with fiscal discipline and deficit management?",
      correct: "FRBM Act, 2003",
      distractors: ["IBC, 2016", "RBI Act, 1934", "FEMA, 1999"],
      explanation: "The Fiscal Responsibility and Budget Management Act, 2003 aims at fiscal discipline and deficit management.",
      trap: "Act-purpose trap",
    },
    {
      text: "NITI Aayog replaced which institution in 2015?",
      correct: "Planning Commission",
      distractors: ["Finance Commission", "National Development Council", "Competition Commission of India"],
      explanation: "NITI Aayog replaced the Planning Commission in 2015 as a policy think tank.",
      trap: "Institution replacement trap",
    },
  ],
  agriculture: [
    {
      text: "Which body recommends Minimum Support Prices to the Government of India?",
      correct: "CACP",
      distractors: ["FCI", "NABARD", "APEDA"],
      explanation: "The Commission for Agricultural Costs and Prices recommends MSPs; the government announces them.",
      trap: "Institution-function trap",
    },
    {
      text: "PMFBY was launched in which year?",
      correct: "2016",
      distractors: ["2005", "2014", "2019"],
      explanation: "Pradhan Mantri Fasal Bima Yojana was launched in 2016 as a crop insurance scheme.",
      trap: "Scheme year trap",
    },
    {
      text: "PM-KISAN provides how much annual income support to eligible farmer families?",
      correct: "Rs 6000",
      distractors: ["Rs 2000", "Rs 10000", "Rs 12000"],
      explanation: "PM-KISAN provides Rs 6000 per year in three instalments to eligible farmer families.",
      trap: "Scheme amount trap",
    },
    {
      text: "Agriculture is placed in which list of the Seventh Schedule?",
      correct: "State List",
      distractors: ["Union List", "Concurrent List", "Residuary List"],
      explanation: "Agriculture is primarily a State List subject, though trade in foodstuffs has concurrent aspects.",
      trap: "Federal list trap",
    },
    {
      text: "Which committee recommended MSP at C2 plus 50 percent?",
      correct: "M.S. Swaminathan Commission",
      distractors: ["Shanta Kumar Committee", "Ashok Dalwai Committee", "Narasimham Committee"],
      explanation: "The National Commission on Farmers chaired by M.S. Swaminathan recommended MSP at C2 plus 50 percent.",
      trap: "Committee recommendation trap",
    },
  ],
  environment: [
    {
      text: "The Environment Protection Act was enacted in which year?",
      correct: "1986",
      distractors: ["1972", "1980", "2010"],
      explanation: "The Environment Protection Act, 1986 is an umbrella environmental law enacted after the Bhopal disaster.",
      trap: "Environmental law year trap",
    },
    {
      text: "Which Act created the National Green Tribunal?",
      correct: "NGT Act, 2010",
      distractors: ["Environment Protection Act, 1986", "Forest Conservation Act, 1980", "Wildlife Protection Act, 1972"],
      explanation: "The National Green Tribunal Act, 2010 created the NGT for environmental adjudication.",
      trap: "Act-institution trap",
    },
    {
      text: "The Paris Agreement was adopted in which year?",
      correct: "2015",
      distractors: ["1992", "1997", "2010"],
      explanation: "The Paris Agreement was adopted in 2015 under the UNFCCC framework.",
      trap: "Climate agreement year trap",
    },
    {
      text: "Which convention emerged from the Rio Earth Summit, 1992?",
      correct: "Convention on Biological Diversity",
      distractors: ["Montreal Protocol", "Ramsar Convention", "Stockholm Convention"],
      explanation: "The Convention on Biological Diversity was opened for signature at the Rio Earth Summit in 1992.",
      trap: "Convention trap",
    },
    {
      text: "Which case is associated with precautionary principle and polluter pays principle in India?",
      correct: "Vellore Citizens Welfare Forum v Union of India (1996)",
      distractors: ["M.C. Mehta v Union of India (Oleum Gas Leak)", "T.N. Godavarman v Union of India", "Subhash Kumar v State of Bihar"],
      explanation: "Vellore Citizens Welfare Forum accepted sustainable development, precautionary principle and polluter pays principle in Indian law.",
      trap: "Environmental case trap",
    },
  ],
  science: [
    {
      text: "Which mission achieved India's soft landing near the Moon's south polar region in 2023?",
      correct: "Chandrayaan-3",
      distractors: ["Chandrayaan-1", "Chandrayaan-2", "Mangalyaan"],
      explanation: "Chandrayaan-3 achieved India's lunar soft landing in 2023.",
      trap: "Space mission trap",
    },
    {
      text: "India's first solar observatory mission is called what?",
      correct: "Aditya-L1",
      distractors: ["AstroSat", "Mangalyaan", "RISAT-2B"],
      explanation: "Aditya-L1 is India's first solar observatory mission.",
      trap: "Space mission trap",
    },
    {
      text: "Aryabhata, India's first satellite, was launched in which year?",
      correct: "1975",
      distractors: ["1969", "1980", "1984"],
      explanation: "Aryabhata, India's first satellite, was launched in 1975.",
      trap: "Space chronology trap",
    },
    {
      text: "Which law governs personal data processing in India?",
      correct: "Digital Personal Data Protection Act, 2023",
      distractors: ["Information Technology Act, 2000", "Telegraph Act, 1885", "Aadhaar Act, 2016"],
      explanation: "The Digital Personal Data Protection Act, 2023 is India's dedicated personal data protection law.",
      trap: "Technology law trap",
    },
    {
      text: "Gaganyaan is associated with which field?",
      correct: "Human spaceflight",
      distractors: ["Solar observation", "Deep ocean mining", "Nuclear fusion research"],
      explanation: "Gaganyaan is India's human spaceflight programme.",
      trap: "Mission-purpose trap",
    },
  ],
  security: [
    {
      text: "The National Investigation Agency was created under which Act?",
      correct: "NIA Act, 2008",
      distractors: ["UAPA, 1967", "Official Secrets Act, 1923", "Disaster Management Act, 2005"],
      explanation: "The National Investigation Agency was created under the NIA Act, 2008.",
      trap: "Security law trap",
    },
    {
      text: "UAPA was originally enacted in which year?",
      correct: "1967",
      distractors: ["1955", "1985", "2008"],
      explanation: "The Unlawful Activities (Prevention) Act was enacted in 1967.",
      trap: "Law year trap",
    },
    {
      text: "Which global body sets standards against money laundering and terror financing?",
      correct: "FATF",
      distractors: ["Interpol", "UNHRC", "IAEA"],
      explanation: "The Financial Action Task Force sets global standards for anti-money laundering and counter-terror financing.",
      trap: "Institution-function trap",
    },
    {
      text: "The Disaster Management Act was enacted in which year?",
      correct: "2005",
      distractors: ["1999", "2008", "2013"],
      explanation: "The Disaster Management Act, 2005 created the NDMA, SDMAs and DDMAs.",
      trap: "Act year trap",
    },
    {
      text: "Which Article refers to the Union's duty to protect States against external aggression and internal disturbance?",
      correct: "Article 355",
      distractors: ["Article 352", "Article 356", "Article 360"],
      explanation: "Article 355 imposes a duty on the Union to protect States against external aggression and internal disturbance.",
      trap: "Emergency article trap",
    },
  ],
  history_ancient: [
    {
      text: "The Mature Harappan phase is generally dated to which period?",
      correct: "c. 2600-1900 BCE",
      distractors: ["c. 1500-1000 BCE", "c. 600-300 BCE", "c. 320-550 CE"],
      explanation: "The Mature Harappan or urban phase is generally dated to c. 2600-1900 BCE.",
      trap: "Chronology trap",
    },
    {
      text: "The Great Bath was discovered at which Harappan site?",
      correct: "Mohenjo-daro",
      distractors: ["Harappa", "Lothal", "Dholavira"],
      explanation: "The Great Bath is a major structure at Mohenjo-daro.",
      trap: "Site-feature trap",
    },
    {
      text: "Which is considered the oldest Veda?",
      correct: "Rigveda",
      distractors: ["Yajurveda", "Samaveda", "Atharvaveda"],
      explanation: "Rigveda is considered the oldest Veda.",
      trap: "Text chronology trap",
    },
    {
      text: "Mahavira is traditionally regarded as which Tirthankara of Jainism?",
      correct: "24th",
      distractors: ["1st", "12th", "23rd"],
      explanation: "Mahavira is regarded as the 24th Tirthankara of Jainism.",
      trap: "Religious tradition trap",
    },
    {
      text: "Arthashastra is associated with which thinker?",
      correct: "Kautilya",
      distractors: ["Patanjali", "Kalidasa", "Banabhatta"],
      explanation: "Arthashastra is associated with Kautilya or Chanakya, adviser to Chandragupta Maurya.",
      trap: "Text-author trap",
    },
  ],
  history_modern: [
    {
      text: "Indian National Congress was founded in which year?",
      correct: "1885",
      distractors: ["1857", "1905", "1916"],
      explanation: "The Indian National Congress was founded in 1885.",
      trap: "Movement chronology trap",
    },
    {
      text: "Bengal was partitioned by Lord Curzon in which year?",
      correct: "1905",
      distractors: ["1892", "1909", "1919"],
      explanation: "The Partition of Bengal was announced in 1905 and triggered the Swadeshi Movement.",
      trap: "Chronology trap",
    },
    {
      text: "The Jallianwala Bagh massacre occurred in which year?",
      correct: "1919",
      distractors: ["1905", "1916", "1922"],
      explanation: "The Jallianwala Bagh massacre occurred on 13 April 1919.",
      trap: "Event year trap",
    },
    {
      text: "The Dandi March was launched in which year?",
      correct: "1930",
      distractors: ["1920", "1928", "1942"],
      explanation: "Gandhi launched the Dandi March in 1930 as part of the Civil Disobedience Movement.",
      trap: "Movement year trap",
    },
    {
      text: "The Quit India Movement was launched in which year?",
      correct: "1942",
      distractors: ["1930", "1935", "1946"],
      explanation: "The Quit India Movement was launched in August 1942.",
      trap: "Movement year trap",
    },
  ],
  geography: [
    {
      text: "Plate tectonics explains which of the following?",
      correct: "Movement of lithospheric plates",
      distractors: ["Seasonal reversal of winds", "Daily sea-land breeze circulation", "Formation of black cotton soil"],
      explanation: "Plate tectonics explains the movement of lithospheric plates and associated earthquakes, volcanoes and mountains.",
      trap: "Physical process trap",
    },
    {
      text: "The Indian monsoon is primarily associated with which phenomenon?",
      correct: "Seasonal reversal of winds",
      distractors: ["Permanent planetary winds only", "Ocean salinity inversion", "Tidal oscillation"],
      explanation: "The monsoon is marked by seasonal reversal of winds and seasonal rainfall.",
      trap: "Climatology concept trap",
    },
    {
      text: "Which soil is dominant in the northern plains of India?",
      correct: "Alluvial soil",
      distractors: ["Black soil", "Laterite soil", "Arid soil"],
      explanation: "Alluvial soil deposited by rivers dominates the Indo-Gangetic plains.",
      trap: "Soil-region trap",
    },
    {
      text: "Which organisation issues official weather and monsoon forecasts in India?",
      correct: "India Meteorological Department",
      distractors: ["Geological Survey of India", "Survey of India", "Central Water Commission"],
      explanation: "The India Meteorological Department is responsible for weather and monsoon forecasts.",
      trap: "Institution-function trap",
    },
    {
      text: "The Himalayas are best described as which type of mountains?",
      correct: "Young fold mountains",
      distractors: ["Block mountains", "Residual mountains", "Volcanic mountains"],
      explanation: "The Himalayas are young fold mountains formed by the collision of Indian and Eurasian plates.",
      trap: "Landform trap",
    },
  ],
  society: [
    {
      text: "Which Article abolishes untouchability?",
      correct: "Article 17",
      distractors: ["Article 14", "Article 15", "Article 16"],
      explanation: "Article 17 abolishes untouchability and forbids its practice in any form.",
      trap: "Rights article trap",
    },
    {
      text: "The SC/ST Prevention of Atrocities Act was enacted in which year?",
      correct: "1989",
      distractors: ["1955", "1976", "2005"],
      explanation: "The SC/ST Prevention of Atrocities Act was enacted in 1989.",
      trap: "Social justice law year trap",
    },
    {
      text: "Which judgment recognised transgender persons' right to self-identification?",
      correct: "NALSA v Union of India (2014)",
      distractors: ["Indra Sawhney v Union of India (1992)", "Vishaka v State of Rajasthan (1997)", "Navtej Singh Johar v Union of India (2018)"],
      explanation: "NALSA (2014) recognised transgender persons' rights and self-identification.",
      trap: "Rights case trap",
    },
    {
      text: "The latest completed Census of India is which one?",
      correct: "Census 2011",
      distractors: ["Census 2001", "Census 2021", "Census 2024"],
      explanation: "Census 2011 is the latest completed Census; the next Census has been delayed.",
      trap: "Data source trap",
    },
    {
      text: "Which case laid down guidelines against workplace sexual harassment before the 2013 law?",
      correct: "Vishaka v State of Rajasthan (1997)",
      distractors: ["Shayara Bano v Union of India (2017)", "Joseph Shine v Union of India (2018)", "Puttaswamy v Union of India (2017)"],
      explanation: "Vishaka (1997) laid down workplace sexual harassment guidelines until Parliament enacted legislation.",
      trap: "Gender justice case trap",
    },
  ],
  ethics: [
    {
      text: "Which term means consistency between values, words and actions?",
      correct: "Integrity",
      distractors: ["Empathy", "Objectivity", "Accountability"],
      explanation: "Integrity means consistency between values, words and actions.",
      trap: "Ethics definition trap",
    },
    {
      text: "Probity in governance most directly means which of the following?",
      correct: "Uprightness and honesty in public office",
      distractors: ["Emotional persuasion of citizens", "Strict secrecy in all decisions", "Maximising personal discretion"],
      explanation: "Probity means uprightness, honesty and ethical conduct in public office.",
      trap: "Ethics concept trap",
    },
    {
      text: "The Nolan Principles are associated with which country?",
      correct: "United Kingdom",
      distractors: ["India", "United States", "France"],
      explanation: "The Nolan Principles are seven principles of public life from the United Kingdom.",
      trap: "Thinker/report source trap",
    },
    {
      text: "Which report of the 2nd ARC is associated with Ethics in Governance?",
      correct: "Fourth Report",
      distractors: ["First Report", "Sixth Report", "Twelfth Report"],
      explanation: "The 2nd ARC Fourth Report is titled Ethics in Governance.",
      trap: "Report-number trap",
    },
    {
      text: "Conflict of interest in public service is best handled by which approach?",
      correct: "Disclosure, recusal and transparent decision-making",
      distractors: ["Concealment until a complaint is filed", "Personal judgement without disclosure", "Delegating only after benefit is received"],
      explanation: "Conflict of interest should be handled through disclosure, recusal where needed, and transparent procedures.",
      trap: "Case-study action trap",
    },
  ],
  csat: [
    {
      text: "CSAT Paper II in UPSC Prelims carries how many marks?",
      correct: "200 marks",
      distractors: ["100 marks", "250 marks", "300 marks"],
      explanation: "CSAT Paper II carries 200 marks and is qualifying in nature.",
      trap: "Exam-pattern trap",
    },
    {
      text: "What is the minimum qualifying standard in CSAT Paper II?",
      correct: "33 percent",
      distractors: ["25 percent", "40 percent", "50 percent"],
      explanation: "UPSC requires candidates to score at least 33 percent in CSAT Paper II.",
      trap: "Exam-pattern trap",
    },
    {
      text: "A valid inference in a CSAT passage must be based on what?",
      correct: "Information stated or necessarily implied in the passage",
      distractors: ["Outside factual knowledge", "The reader's personal opinion", "The most extreme option"],
      explanation: "CSAT inference questions must be answered from passage evidence, not outside assumptions.",
      trap: "Comprehension trap",
    },
    {
      text: "If a worker completes a job in x days, one day's work is represented as what?",
      correct: "1/x",
      distractors: ["x/100", "x/2", "100/x"],
      explanation: "In time and work, a worker finishing a job in x days completes 1/x of the work in one day.",
      trap: "Formula trap",
    },
    {
      text: "To convert speed from km/h to m/s, multiply by which factor?",
      correct: "5/18",
      distractors: ["18/5", "1000/60", "60/1000"],
      explanation: "Speed in km/h is converted to m/s by multiplying by 5/18.",
      trap: "Unit conversion trap",
    },
  ],
};

function classifyQuestionPack(topic) {
  const key = String(topic.key ?? "").toLowerCase();
  const title = String(topic.title ?? "").toLowerCase();
  const subject = String(topic.subject ?? "").toLowerCase();

  if (subject === "csat") return "csat";
  if (subject === "essay") return "ethics";
  if (subject === "gs4" || key.includes("ethics") || key.includes("case_studies")) return "ethics";
  if (subject === "gs1") {
    if (key.includes("geography") || title.includes("geography") || title.includes("climate") || title.includes("river") || title.includes("soil") || title.includes("monsoon")) return "geography";
    if (key.includes("society") || title.includes("society") || title.includes("women") || title.includes("population") || title.includes("urban") || title.includes("communal") || title.includes("regional")) return "society";
    if (key.includes("ancient")) return "history_ancient";
    return "history_modern";
  }
  if (subject === "gs2") {
    if (key.includes("local_bodies")) return "local_bodies";
    if (key.includes("judiciary")) return "judiciary";
    if (key.includes("federalism")) return "federalism";
    if (key.includes("parliament")) return "parliament";
    if (key.includes("executive")) return "executive";
    if (key.includes("governance") || key.includes("rti") || key.includes("social_justice") || title.includes("health") || title.includes("education") || title.includes("welfare")) return "governance";
    if (key.includes("ir") || title.includes("international") || title.includes("bilateral") || title.includes("foreign") || title.includes("neighbour")) return "ir";
    return "constitution";
  }
  if (subject === "gs3") {
    if (key.includes("agriculture") || title.includes("agriculture") || title.includes("food") || title.includes("msp") || title.includes("farm")) return "agriculture";
    if (key.includes("environment") || title.includes("environment") || title.includes("climate") || title.includes("biodiversity") || title.includes("pollution") || title.includes("forest")) return "environment";
    if (key.includes("science") || title.includes("technology") || title.includes("space") || title.includes("isro") || title.includes("biotech") || title.includes("ai")) return "science";
    if (key.includes("security") || title.includes("security") || title.includes("terror") || title.includes("cyber") || title.includes("disaster")) return "security";
    return "economy";
  }
  return "ethics";
}

function buildQuestion(topic, slot, input) {
  const correctLabel = LETTERS[(hash(`${topic.key}:${slot}`) % 4 + 4) % 4];
  const options = placeCorrect(input.correct, input.distractors, correctLabel);
  const id = `codex_rewrite_mcq_${topic.key}_${String(slot).padStart(2, "0")}`.replace(/[^a-zA-Z0-9_-]/g, "_");

  return {
    id,
    topic_key: topic.key,
    question_text: input.text,
    question_type: "mcq",
    year: null,
    source: "ClearUPSC Pattern",
    difficulty: 3,
    model_answer: input.explanation,
    tags: [topic.subject, "ClearUPSC Pattern", input.trap].filter(Boolean),
    explanation: input.explanation,
    source_label: "ClearUPSC Pattern",
    trap_type: input.trap,
    options,
  };
}

function placeCorrect(correctText, distractors, correctLabel) {
  const cleanDistractors = uniqueStrings(distractors).filter((item) => item !== correctText).slice(0, 3);
  while (cleanDistractors.length < 3) cleanDistractors.push(`None of the above statement correctly describes ${correctText}`);
  const options = [];
  let d = 0;
  for (const label of LETTERS) {
    if (label === correctLabel) {
      options.push({ label, text: correctText, isCorrect: true });
    } else {
      options.push({ label, text: cleanDistractors[d], isCorrect: false });
      d += 1;
    }
  }
  return options;
}

function realConcise(notes) {
  return uniquePairs(
    (Array.isArray(notes.concise_notes) ? notes.concise_notes : [])
      .map((row) => ({ term: row.term, definition: row.definition }))
      .filter((row) => row.term && row.definition)
      .filter((row) => !/study|prepare|theme requiring|tested through|UPSC-ready/i.test(`${row.term} ${row.definition}`)),
  );
}

function realBullets(notes) {
  return uniqueStrings(Array.isArray(notes.revision_bullets) ? notes.revision_bullets : []).filter(
    (item) => !/study|prepare|revise|framework|answer/i.test(item),
  );
}

function realAnchors(notes) {
  const cases = Array.isArray(notes.cases) ? notes.cases : [];
  const schemes = Array.isArray(notes.schemes) ? notes.schemes : [];
  return uniquePairs([
    ...cases.map((row) => ({ term: row.name, definition: row.point ?? row.note ?? "" })),
    ...schemes.map((row) => ({ term: row.name, definition: row.point ?? row.note ?? "" })),
  ]).filter((row) => row.term && row.definition);
}

function distractorDefinitions(concise, correctTerm, subject) {
  return [
    ...concise.filter((row) => row.term !== correctTerm).map((row) => row.definition),
    ...fallbackConcise(subject).map((row) => row.definition),
  ];
}

function distractorTerms(concise, correctTerm, subject) {
  return [...concise.filter((row) => row.term !== correctTerm).map((row) => row.term), ...subjectDistractorsFor(subject).terms];
}

function wrongFacts(correctFact, bullets, subject) {
  const mutated = mutateFact(correctFact);
  return uniqueStrings([mutated, ...subjectDistractorsFor(subject).facts, ...bullets.filter((item) => item !== correctFact).map(mutateFact)]).slice(0, 3);
}

function mismatchedPairs(concise, correctTerm, subject) {
  const rows = concise.filter((row) => row.term !== correctTerm);
  const pairs = [];
  for (let i = 0; i < rows.length - 1; i += 1) pairs.push(`${rows[i].term} - ${rows[i + 1].definition}`);
  return [...pairs, ...fallbackConcise(subject).slice(0, 3).map((row) => `${row.term} - ${mutateFact(row.definition)}`)];
}

function anchorDistractors(correctTerm, subject, concise) {
  return uniqueStrings([
    ...subjectDistractorsFor(subject).terms,
    ...concise.map((row) => row.term),
  ]).filter((term) => term !== correctTerm).slice(0, 3);
}

function mutateFact(fact) {
  const replacements = [
    [/73rd/g, "74th"],
    [/74th/g, "73rd"],
    [/1992/g, "1976"],
    [/1973/g, "1993"],
    [/1981/g, "1998"],
    [/1993/g, "1981"],
    [/1998/g, "2015"],
    [/2015/g, "1992"],
    [/Article 32/g, "Article 31"],
    [/Article 131/g, "Article 143"],
    [/Article 136/g, "Article 129"],
    [/Article 280/g, "Article 279A"],
    [/4 percent/g, "8 percent"],
    [/33 percent/g, "50 percent"],
    [/65/g, "62"],
    [/62/g, "60"],
  ];
  for (const [pattern, replacement] of replacements) {
    if (pattern.test(fact)) return fact.replace(pattern, replacement);
  }
  if (/ is /i.test(fact)) return fact.replace(/ is /i, " is not ");
  if (/ was /i.test(fact)) return fact.replace(/ was /i, " was not ");
  if (/ under /i.test(fact)) return fact.replace(/ under /i, " unrelated to ");
  return `It is incorrect that ${fact.charAt(0).toLowerCase()}${fact.slice(1)}`;
}

function fallbackConcise(subject) {
  const map = {
    CSAT: [
      { term: "CSAT Paper II", definition: "UPSC Prelims qualifying paper carrying 200 marks." },
      { term: "Negative Marking", definition: "One-third penalty for wrong objective answers." },
      { term: "Article 320", definition: "Constitutional provision connected with UPSC examination functions." },
      { term: "Inference", definition: "Conclusion that follows from given passage or statements." },
    ],
    Essay: [
      { term: "Essay Paper", definition: "UPSC Mains paper carrying 250 marks." },
      { term: "Preamble", definition: "Constitutional source of justice, liberty, equality and fraternity." },
      { term: "Constitutional Morality", definition: "Respect for constitutional values in public life." },
      { term: "Gandhian Talisman", definition: "Ethical test focused on the poorest and weakest person." },
    ],
    GS1: [
      { term: "Indus Valley Civilization", definition: "Bronze Age urban civilization c. 2600-1900 BCE." },
      { term: "Monsoon", definition: "Seasonal reversal of winds over the Indian subcontinent." },
      { term: "Article 17", definition: "Abolishes untouchability." },
      { term: "Census 2011", definition: "Latest completed Census of India." },
    ],
    GS2: [
      { term: "Article 32", definition: "Right to constitutional remedies before the Supreme Court." },
      { term: "Article 280", definition: "Constitutional provision for Finance Commission." },
      { term: "RTI Act 2005", definition: "Law giving citizens access to information from public authorities." },
      { term: "Panchsheel", definition: "Five principles of peaceful coexistence articulated in 1954." },
    ],
    GS3: [
      { term: "GDP", definition: "Market value of final goods and services produced in a country." },
      { term: "CPI", definition: "Consumer Price Index used for inflation targeting." },
      { term: "Environment Protection Act 1986", definition: "Umbrella environmental law enacted after Bhopal disaster." },
      { term: "Chandrayaan-3", definition: "ISRO mission that soft-landed on Moon in 2023." },
    ],
    GS4: [
      { term: "Integrity", definition: "Consistency between values, words and actions." },
      { term: "Probity", definition: "Uprightness and honesty in public office." },
      { term: "Nolan Principles", definition: "Seven principles of public life from the UK." },
      { term: "2nd ARC", definition: "Commission that reported on Ethics in Governance." },
    ],
  };
  return map[subject] ?? map.GS4;
}

function fallbackBullets(subject) {
  return {
    CSAT: ["CSAT Paper II carries 200 marks.", "CSAT qualifying standard is 33 percent.", "Wrong answers carry one-third penalty."],
    Essay: ["Essay paper carries 250 marks.", "Preamble gives justice, liberty, equality and fraternity.", "Ambedkar stressed constitutional morality."],
    GS1: ["Mature Harappan phase is c. 2600-1900 BCE.", "Census 2011 is latest completed census.", "Rigveda is the oldest Veda."],
    GS2: ["Article 32 is a Fundamental Right.", "Finance Commission is under Article 280.", "RTI Act was enacted in 2005."],
    GS3: ["GST launched on 1 July 2017.", "RBI was established in 1935.", "Environment Protection Act was enacted in 1986."],
    GS4: ["Integrity means consistency between values and action.", "Probity means uprightness in public office.", "2nd ARC reported on Ethics in Governance."],
  }[subject] ?? ["Integrity means consistency between values and action.", "Probity means uprightness in public office.", "2nd ARC reported on Ethics in Governance."];
}

function subjectDistractorsFor(subject) {
  return subjectDistractors[subject] ?? subjectDistractors.GS4;
}

function parseNotes(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  if (typeof value !== "string") return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function uniquePairs(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const term = clean(item.term);
    const definition = clean(item.definition);
    if (!term || !definition) continue;
    const key = `${term.toLowerCase()}|${definition.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ term, definition });
  }
  return out;
}

function uniqueStrings(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const value = clean(item);
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

function hash(value) {
  let total = 0;
  for (const char of String(value)) total = (total * 31 + char.charCodeAt(0)) | 0;
  return Math.abs(total);
}

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function loadLocalEnv() {
  try {
    const env = readFileSync(".env.local", "utf8");
    for (const line of env.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index === -1) continue;
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
      process.env[key] ??= value;
    }
  } catch {}
}

await main();
