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

      if (processed % 100 === 0) {
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

  const notes = parseNotes(topic.structured_notes);
  const title = clean(topic.title);
  const subject = clean(topic.subject || "UPSC");
  const pack = factualPackFor(topic);
  const concise = uniquePairs([
    ...pack.concise.map(([term, definition]) => ({ term, definition })),
    ...realConcise(notes),
  ]).slice(0, 12);
  const bullets = uniqueStrings([...pack.bullets, ...realBullets(notes)]).slice(0, 10);
  const anchors = uniquePairs([
    ...pack.anchors.map(([term, definition]) => ({ term, definition })),
    ...realAnchors(notes),
  ]);

  const usableConcise = concise.length >= 4 ? concise : fallbackConcise(subject);
  const usableBullets = bullets.length >= 4 ? bullets : fallbackBullets(subject);
  const questions = [];

  const first = usableConcise[0];
  questions.push(
    buildQuestion(topic, 1, {
      text: `With reference to ${title}, which of the following correctly describes "${first.term}"?`,
      correct: first.definition,
      distractors: distractorDefinitions(usableConcise, first.term, subject),
      explanation: `"${first.term}" is correctly described as: ${first.definition}`,
      trap: "Term-definition mismatch",
    }),
  );

  const second = usableConcise[1] ?? usableConcise[0];
  questions.push(
    buildQuestion(topic, 2, {
      text: `In the context of ${title}, the description "${second.definition}" refers to which term?`,
      correct: second.term,
      distractors: distractorTerms(usableConcise, second.term, subject),
      explanation: `The description points to ${second.term}. Other options refer to different institutions, concepts or provisions.`,
      trap: "Concept identification",
    }),
  );

  const correctFact = usableBullets[0];
  questions.push(
    buildQuestion(topic, 3, {
      text: `Which of the following statements about ${title} is correct?`,
      correct: correctFact,
      distractors: wrongFacts(correctFact, usableBullets, subject),
      explanation: `The correct factual statement is: ${correctFact}`,
      trap: "Factual reversal",
    }),
  );

  const third = usableConcise[2] ?? usableConcise[0];
  questions.push(
    buildQuestion(topic, 4, {
      text: `Which of the following pairs is correctly matched with reference to ${title}?`,
      correct: `${third.term} - ${third.definition}`,
      distractors: mismatchedPairs(usableConcise, third.term, subject),
      explanation: `${third.term} is correctly matched with its actual definition. The other options mismatch terms with unrelated descriptions.`,
      trap: "Incorrectly matched pair",
    }),
  );

  const anchor = anchors[0] ?? usableConcise[3] ?? usableConcise[0];
  questions.push(
    buildQuestion(topic, 5, {
      text: `Which of the following is most directly associated with ${title}?`,
      correct: anchor.term,
      distractors: anchorDistractors(anchor.term, subject, usableConcise),
      explanation: `${anchor.term} is directly associated with ${title}. ${anchor.definition}`,
      trap: "Institution/source confusion",
    }),
  );

  return questions.slice(0, QUESTIONS_PER_TOPIC);
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
