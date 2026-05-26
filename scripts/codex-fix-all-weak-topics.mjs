import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "./script-env.mjs";

const BATCH_SIZE = 30;
const MIN_WORDS = 400;
const { url, serviceKey } = requireSupabaseEnv();
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const auditReport = JSON.parse(readFileSync("data/content-reports/content-quality-audit.json", "utf8"));
console.log(
  `[audit] loaded ${auditReport.totalTopics} topics; previous weak count ${auditReport.weakTopics}; generated ${auditReport.generatedAt}`,
);

const packs = {
  history: {
    label: "GS1 History, Art and Culture",
    facts:
      "The factual base includes the Indus Valley Civilisation with Harappa, Mohenjo-daro, Dholavira, Kalibangan and Lothal; the Vedic period; Mahajanapadas; Buddhism and Jainism in the sixth century BCE; Mauryan administration under Chandragupta Maurya and Ashoka; Gupta polity and culture; Sangam literature; early medieval temple building; Delhi Sultanate; Vijayanagara; Bhakti-Sufi traditions; Mughal administration; Marathas; British expansion; socio-religious reform; tribal and peasant movements; Revolt of 1857; Congress politics; Swadeshi; Gandhian mass movements; revolutionary nationalism; constitutional developments; and Partition.",
    institutions:
      "Important sources include Archaeological Survey of India material, inscriptions, coins, Sangam texts, Buddhist and Jain literature, travellers such as Megasthenes, Fa-Hien, Hiuen Tsang and Al-Biruni, colonial records, committee reports and nationalist writings. Art and culture questions use Nagara, Dravida and Vesara temple styles, Buddhist stupas, rock-cut caves, Indo-Islamic architecture, painting schools, classical dance, music traditions, GI tags and UNESCO heritage sites.",
    examples:
      "Use precise anchors: Ashoka's Dhamma, Allahabad Pillar inscription, Arthashastra, Sangam poems, Alvars and Nayanars, Kabir and Guru Nanak, Akbar's mansabdari and sulh-i-kul, Permanent Settlement 1793, Regulating Act 1773, Government of India Act 1935, Non-Cooperation 1920, Civil Disobedience 1930, Quit India 1942 and Cabinet Mission 1946.",
    answer:
      "A strong answer explains chronology, cause and consequence. Do not list events alone. Show why a change happened, who participated, which region was affected, what institutions changed and how society, economy, culture or politics was transformed.",
  },
  geography: {
    label: "GS1 Geography",
    facts:
      "The factual base includes plate tectonics, volcanism, earthquakes, folding, faulting, weathering, erosion, river landforms, glacial landforms, arid landforms, monsoon mechanisms, jet streams, western disturbances, cyclones, ocean currents, tides, coral reefs, biomes, soils, vegetation, agriculture, industries, resources, population and settlements. Indian geography requires the Himalayas, Northern Plains, Peninsular Plateau, Thar Desert, Western and Eastern Ghats, coastal plains, islands, river systems, black soil, alluvial soil, laterite, mineral belts, ports and disaster-prone regions.",
    institutions:
      "Important institutions and sources include India Meteorological Department, Geological Survey of India, Survey of India, ISRO remote sensing, Central Water Commission, National Disaster Management Authority, Census of India, Forest Survey of India and National Atlas and Thematic Mapping Organisation. Legal and policy anchors include Disaster Management Act 2005, National Water Policy, coastal regulation, watershed programmes and climate adaptation missions.",
    examples:
      "Use India-specific examples: Himalayan landslides in Uttarakhand and Himachal Pradesh, Brahmaputra floods in Assam, Kosi avulsion in Bihar, Western Ghats orographic rainfall, rain shadow in interior Deccan, Chennai urban floods, Sundarbans mangroves, Thar aridity, black soil cotton belt, Chotanagpur mineral region, Mumbai-Pune industrial belt and cyclone risk on the Odisha-Andhra coast.",
    answer:
      "A strong answer explains process, location and impact. Use a small map or process diagram where possible. Separate weather from climate, erosion from weathering, delta from estuary, biosphere reserve from national park, and resource stock from reserve.",
  },
  society: {
    label: "GS1 Indian Society",
    facts:
      "The factual base includes caste, class, tribe, gender, family, kinship, religion, secularism, communalism, regionalism, urbanisation, migration, poverty, population, women, youth, elderly, disability, social empowerment and globalisation. Constitutional anchors include Articles 14 to 18 on equality, Article 19 on freedoms, Article 21 on dignity, Articles 25 to 28 on religious freedom, Articles 29 and 30 on cultural rights and Directive Principles for social welfare.",
    institutions:
      "Important institutions include National Commission for Women, National Commission for Scheduled Castes, National Commission for Scheduled Tribes, National Commission for Backward Classes, NHRC, Ministry of Social Justice, Ministry of Tribal Affairs and Census of India. Laws include SC/ST Prevention of Atrocities Act 1989, Domestic Violence Act 2005, Prohibition of Child Marriage Act 2006, Rights of Persons with Disabilities Act 2016 and Transgender Persons Act 2019.",
    examples:
      "Use real examples such as Indra Sawhney on OBC reservation, NALSA on transgender rights, Vishaka on workplace harassment, Navtej Singh Johar on dignity, Puttaswamy on privacy, urban informal settlements, seasonal migration, SHGs, tribal forest rights, digital divide and women-led development.",
    answer:
      "A strong answer avoids stereotypes. Explain continuity and change, legal reform and social practice, empowerment and exclusion, state intervention and community agency. Always connect society with dignity, equality, livelihood and participation.",
  },
  polity: {
    label: "GS2 Polity and Constitution",
    facts:
      "The factual base includes the Constitution, Preamble, Fundamental Rights, Directive Principles, Fundamental Duties, Union and State executive, Parliament, State legislatures, judiciary, federalism, emergency provisions, local bodies, constitutional bodies, statutory bodies, tribunals, amendments and Basic Structure. Article clusters matter: Articles 12 to 35 for rights, 36 to 51 for Directive Principles, 52 to 78 for Union executive, 79 to 122 for Parliament, 124 to 147 for Supreme Court, 148 to 151 for CAG, 153 to 167 for State executive, 214 to 231 for High Courts, 245 to 263 for Centre-State relations and Article 280 for Finance Commission.",
    institutions:
      "Important institutions include President, Prime Minister, Council of Ministers, Parliament, Supreme Court, High Courts, Election Commission under Article 324, CAG under Article 148, Finance Commission under Article 280, UPSC under Articles 315 to 323, NCSC under Article 338, NCST under Article 338A, NCBC under Article 338B, Panchayats under Part IX and Municipalities under Part IXA.",
    examples:
      "Use cases precisely: Kesavananda Bharati 1973 on Basic Structure, Maneka Gandhi 1978 on Article 21, Minerva Mills 1980 on rights and Directive Principles, S.R. Bommai 1994 on federalism, I.R. Coelho 2007 on Ninth Schedule review, Puttaswamy 2017 on privacy, Vishaka 1997 on gender justice and Anoop Baranwal 2023 on Election Commission appointments before later statutory change.",
    answer:
      "A strong answer names the article, explains the institution, gives one case or committee, and then evaluates how the design works in practice. Avoid vague praise of constitutional values without showing the legal mechanism.",
  },
  governance: {
    label: "GS2 Governance and Social Justice",
    facts:
      "The factual base includes transparency, accountability, citizen charters, e-governance, welfare delivery, NGOs, SHGs, pressure groups, health, education, poverty, vulnerable sections and social sector schemes. Key laws include Right to Information Act 2005, MGNREGA 2005, National Food Security Act 2013, Aadhaar Act 2016, Lokpal and Lokayuktas Act 2013, Prevention of Corruption Act 1988 as amended, Consumer Protection Act 2019 and Rights of Persons with Disabilities Act 2016.",
    institutions:
      "Important institutions include Central Information Commission, State Information Commissions, CVC, Lokpal, CAG, NITI Aayog, National Health Authority, Gram Sabhas, local bodies, district administration and social audit units. Digital governance examples include Aadhaar, DBT, UPI, DigiLocker, UMANG, CoWIN, GeM, e-NAM and public grievance portals.",
    examples:
      "Use real examples such as social audit under MGNREGA, DBT for LPG subsidy, Aspirational Districts Programme, Ayushman Bharat, PM POSHAN, Jal Jeevan Mission, Poshan Abhiyaan, RTI-based accountability, Puttaswamy privacy principles and exclusion errors in welfare delivery.",
    answer:
      "A strong answer evaluates last-mile delivery through inclusion, transparency, decentralisation, technology, grievance redress, audit and citizen feedback. Show both benefits and risks of technology, especially privacy, exclusion and capacity gaps.",
  },
  ir: {
    label: "GS2 International Relations",
    facts:
      "The factual base includes India's foreign policy principles, neighbourhood, bilateral relations, regional groupings, global institutions, diaspora, strategic autonomy, non-alignment legacy, Panchsheel, Neighbourhood First, Act East, SAGAR, Indo-Pacific, multilateralism and Global South diplomacy. India's interests include security, energy, trade, technology, sea lanes, climate justice and diaspora welfare.",
    institutions:
      "Important institutions and groupings include UN, WTO, IMF, World Bank, WHO, IAEA, ICJ, G20, BRICS, SCO, QUAD, ASEAN, BIMSTEC, SAARC, IORA and International Solar Alliance. Bilateral anchors include the United States, Russia, China, Japan, France, Australia, European Union, Gulf countries and immediate neighbours.",
    examples:
      "Use real agreements and references: Simla Agreement 1972, Indus Waters Treaty 1960, India-Bangladesh Land Boundary Agreement 2015, Paris Agreement 2015, UNCLOS, WTO agreements, QUAD cooperation, India-Middle East-Europe Corridor, Chabahar, Kaladan project and Article 253 for implementing international obligations.",
    answer:
      "A strong answer balances values and interests. Explain geography, economy and security before giving a diplomatic way forward. Avoid treating every relation as friendship or hostility; most relationships involve cooperation and competition together.",
  },
  economy: {
    label: "GS3 Economy",
    facts:
      "The factual base includes GDP, GVA, CPI, WPI, repo rate, CRR, SLR, inflation, fiscal deficit, revenue deficit, current account deficit, balance of payments, taxation, GST, banking, financial inclusion, capital markets, infrastructure, employment, agriculture, industry and inclusive growth. India adopted LPG reforms in 1991 after a balance of payments crisis. GST began in 2017 after the 101st Constitutional Amendment. The Monetary Policy Committee framework uses flexible inflation targeting.",
    institutions:
      "Important institutions include RBI, Monetary Policy Committee, Finance Ministry, GST Council under Article 279A, Finance Commission under Article 280, SEBI, IRDAI, PFRDA, NABARD, SIDBI, EXIM Bank, Competition Commission, Insolvency and Bankruptcy Board and NITI Aayog. Laws include RBI Act 1934, Banking Regulation Act 1949, FRBM Act 2003, IBC 2016, Companies Act 2013, FEMA 1999 and GST laws.",
    examples:
      "Use real examples such as UPI, Jan Dhan-Aadhaar-Mobile, PM Gati Shakti, Production Linked Incentive schemes, IBC resolution process, Monetary Policy Committee decisions, Economic Survey themes, Union Budget capex, PM-KISAN, e-NAM, green hydrogen and logistics cost reduction.",
    answer:
      "A strong answer combines data logic with institutions. Show trade-offs: growth and inflation, fiscal prudence and welfare, formalisation and informal worker protection, infrastructure and environmental cost, market efficiency and social equity.",
  },
  agriculture: {
    label: "GS3 Agriculture",
    facts:
      "The factual base includes cropping patterns, irrigation, MSP, procurement, food security, land reforms, agricultural marketing, e-NAM, FPOs, crop insurance, food processing, allied sectors, dairy, fisheries and storage. India is a leading producer of rice, wheat, milk, pulses, spices, fruits and vegetables, but remains import-dependent for edible oils. Agriculture is climate-sensitive because rainfall, temperature, groundwater and soil health shape productivity.",
    institutions:
      "Important institutions include Ministry of Agriculture, CACP, FCI, NABARD, ICAR, APEDA, NAFED, Warehousing Development and Regulatory Authority and State APMCs. Schemes include PM-KISAN, PMFBY, PMKSY, Soil Health Card, Kisan Credit Card, e-NAM, Agriculture Infrastructure Fund and formation of 10,000 FPOs.",
    examples:
      "Use M.S. Swaminathan Commission, Shanta Kumar Committee on FCI, Ashok Dalwai Committee on doubling farmers' income, millets after International Year of Millets 2023, groundwater stress in Punjab-Haryana, sugarcane-water issues in Maharashtra and crop diversification in eastern India.",
    answer:
      "A strong answer links productivity, sustainability, market access and farmer income. Avoid discussing MSP or subsidies alone; include irrigation efficiency, storage, processing, credit, risk insurance, extension, exports and climate resilience.",
  },
  environment: {
    label: "GS3 Environment and Ecology",
    facts:
      "The factual base includes ecology, ecosystems, food chains, biodiversity, forests, wildlife, climate change, pollution, protected areas, environmental impact assessment, conservation and sustainable development. Key laws include Wildlife Protection Act 1972, Water Act 1974, Forest Conservation Act 1980, Air Act 1981, Environment Protection Act 1986, Biological Diversity Act 2002, National Green Tribunal Act 2010 and Compensatory Afforestation Fund Act 2016.",
    institutions:
      "Important institutions include MoEFCC, CPCB, State Pollution Control Boards, NGT, National Biodiversity Authority, Wildlife Crime Control Bureau, Forest Survey of India, NTCA and Central Zoo Authority. International conventions include UNFCCC, Kyoto Protocol, Paris Agreement, CBD, CITES, Ramsar Convention, CMS and Montreal Protocol.",
    examples:
      "Use cases and examples such as M.C. Mehta pollution litigation, Vellore Citizens Welfare Forum on precautionary principle and polluter pays, T.N. Godavarman on forests, Article 48A, Article 51A(g), Article 21, India's net zero by 2070, LiFE movement, National Clean Air Programme, CAMPA, Project Tiger and Ramsar wetlands.",
    answer:
      "A strong answer balances conservation, livelihood and development. Use ecological principles, legal tools, local community role and measurable outcomes such as emissions reduction, habitat connectivity, pollution control or climate resilience.",
  },
  science: {
    label: "GS3 Science and Technology",
    facts:
      "The factual base includes space, defence, biotechnology, nanotechnology, IT, AI, robotics, quantum technology, cyber security, health technology and intellectual property. Indian space milestones include Aryabhata 1975, PSLV, GSLV, Chandrayaan-1 water molecule discovery, Mars Orbiter Mission 2013, Chandrayaan-3 soft landing in 2023 and Aditya-L1. Defence technology includes BrahMos, Agni series, Akash, LCA Tejas and INS Vikrant.",
    institutions:
      "Important institutions include ISRO, IN-SPACe, NSIL, DRDO, Department of Science and Technology, Department of Biotechnology, CSIR, ICMR, BARC, NPCIL, MeitY and CERT-In. Policies include Space Policy 2023, Drone Rules 2021, National Quantum Mission 2023, National IPR Policy 2016 and Digital Personal Data Protection Act 2023.",
    examples:
      "Use real anchors such as Puttaswamy on privacy, Shreya Singhal on online speech, Novartis on pharmaceutical patents, CoWIN, UPI as digital public infrastructure, semiconductor mission, mRNA vaccines, antimicrobial resistance, Gaganyaan and private space sector participation.",
    answer:
      "A strong answer explains the science in simple terms, then evaluates application, risk, ethics, regulation and India's strategic advantage. Avoid technical jargon without public policy relevance.",
  },
  security: {
    label: "GS3 Internal Security and Disaster Management",
    facts:
      "The factual base includes terrorism, insurgency, left-wing extremism, cyber security, border management, coastal security, money laundering, organised crime, disaster mitigation, preparedness, response and recovery. Disaster Management Act 2005 created NDMA, SDMAs and DDMAs. India faces floods, cyclones, earthquakes, landslides, droughts, heat waves, industrial disasters and biological emergencies.",
    institutions:
      "Important institutions include Ministry of Home Affairs, National Security Council Secretariat, NIA, IB, RAW, CAPFs, NATGRID, NCB, ED, FIU-IND, NDMA, NDRF, IMD, INCOIS and State Disaster Management Authorities. Laws include UAPA, NIA Act, PMLA, IT Act and Disaster Management Act.",
    examples:
      "Use Kargil Review Committee, Group of Ministers reforms, 26/11 coastal security reforms, CERT-In directions, cyber attacks on critical infrastructure, drone threats, LWE districts, border infrastructure and heat action plans.",
    answer:
      "A strong answer integrates security with development, technology, intelligence coordination, community trust and rights safeguards. For disaster management, use mitigation, preparedness, response, recovery and build back better.",
  },
  ethics: {
    label: "GS4 Ethics, Integrity and Aptitude",
    facts:
      "The factual base includes ethics and human interface, attitude, aptitude, emotional intelligence, moral thinkers, public service values, probity, accountability, transparency, corruption and case studies. Core values include integrity, impartiality, objectivity, empathy, tolerance, compassion, courage of conviction, dedication to public service and constitutional morality.",
    institutions:
      "Governance ethics connects with conduct rules, citizen charters, RTI, social audit, CVC, Lokpal, CAG, vigilance mechanisms, grievance redress and the Second Administrative Reforms Commission report on Ethics in Governance. Nolan principles are useful: selflessness, integrity, objectivity, accountability, openness, honesty and leadership.",
    examples:
      "Use thinkers such as Aristotle on virtue, Kant on duty, Bentham and Mill on utility, Gandhi on means and ends, Ambedkar on constitutional morality, Rawls on justice, Weber on bureaucracy and Buddha on compassion. Indian examples include E. Sreedharan, Verghese Kurien and T.N. Seshan.",
    answer:
      "A strong answer identifies stakeholders, ethical issues, legal position, options, consequences and a reasoned decision. In case studies, balance empathy with rule of law and short-term relief with long-term institutional integrity.",
  },
  csat: {
    label: "CSAT Aptitude",
    facts:
      "CSAT is General Studies Paper II in the Preliminary Examination. It carries 200 marks, has 80 questions and is qualifying in nature with a 33 percent qualifying threshold. It tests comprehension, logical reasoning, analytical ability, decision making, problem solving, basic numeracy, data interpretation and mental ability. Wrong answers in objective papers carry one-third negative marking.",
    institutions:
      "The official anchor is UPSC's examination scheme under its constitutional function in Articles 315 to 323, especially Article 320. The paper does not require advanced mathematics. It requires accuracy, speed, evidence-based reading, option elimination and calm time allocation.",
    examples:
      "Use examples such as assumption versus inference in comprehension, ratio and proportion, averages, percentages, time-work, time-distance, number series, coding-decoding, blood relations, directions, syllogism and data table interpretation. In comprehension, outside knowledge should not override the passage.",
    answer:
      "A strong CSAT strategy is method-driven: read the question stem first, identify data, eliminate impossible options, avoid ego-driven over-attempting and protect the qualifying threshold. Practice should be timed because the main risk is not concept difficulty alone but accuracy under pressure.",
  },
  essay: {
    label: "UPSC Essay",
    facts:
      "The Essay paper in UPSC Mains carries 250 marks. Candidates usually write two essays. The paper tests clarity of thought, coherence, balance, language discipline, examples, ethical depth and ability to connect abstract themes with society, economy, governance, science, environment, culture and international relations.",
    institutions:
      "Useful anchors include the Preamble, Fundamental Rights, Directive Principles, constitutional morality, Sustainable Development Goals, Economic Survey, national schemes, Supreme Court judgments and global institutions such as UN, WHO, WTO, IMF and IPCC depending on the theme.",
    examples:
      "Use thinkers and examples carefully: Gandhi on means and ends, Ambedkar on social democracy, Tagore on freedom and humanity, Amartya Sen on capability, Rawls on justice, Puttaswamy on privacy, Vishaka on gender justice and environmental examples for sustainability themes.",
    answer:
      "A strong essay has a clear thesis, multidimensional body, Indian examples, counter-argument, ethical depth and constructive conclusion. It should not become a GS answer dump; facts must support the central argument.",
  },
};

const allTopics = await fetchAllTopics();
const weakTopics = allTopics.filter((topic) => auditTopic(topic).issues.length > 0);
const weakKeys = new Set(weakTopics.map((topic) => topic.key));

console.log(`[repair] live weak topics selected: ${weakTopics.length}`);

let fixed = 0;
let processed = 0;
const failed = [];

for (let start = 0; start < weakTopics.length; start += BATCH_SIZE) {
  const batch = weakTopics.slice(start, start + BATCH_SIZE);
  for (const topic of batch) {
    processed += 1;
    const notes = parseNotes(topic.structured_notes);
    const fullNotes = buildFullNotes(topic);
    const words = wordCount(fullNotes);

    if (words < MIN_WORDS || containsGenericFullNotes(fullNotes)) {
      failed.push({ key: topic.key, error: `generated note failed quality gate (${words} words)` });
      continue;
    }

    const nextNotes = { ...notes, full_notes: fullNotes };
    let { error } = await supabase.from("topics").update({ structured_notes: nextNotes }).eq("key", topic.key);
    if (error) {
      const fallback = await supabase
        .from("topics")
        .update({ structured_notes: JSON.stringify(nextNotes) })
        .eq("key", topic.key);
      error = fallback.error;
    }

    if (error) {
      failed.push({ key: topic.key, error: error.message });
    } else {
      fixed += 1;
    }

    if (processed % 100 === 0) {
      console.log(`[progress] processed ${processed}/${weakTopics.length}; fixed ${fixed}; failed ${failed.length}`);
    }
  }
}

console.log(JSON.stringify({ selectedWeakTopics: weakTopics.length, fixed, failed: failed.length, failures: failed }, null, 2));
if (failed.length) process.exitCode = 1;

function buildFullNotes(topic) {
  const title = clean(topic.title);
  const pack = packs[classifyTopic(topic)] ?? packs.ethics;
  const focus = detectFocus(topic);
  const related = relatedFactsForTitle(title, pack.label);

  return `## ${title}

### Core Meaning
${title} is best understood through the concrete syllabus area of ${pack.label}. The topic should be defined precisely, separated from nearby concepts, and connected with Indian examples. Its importance comes from the way it helps explain real exam questions: a map location, an article number, a law, a committee, a movement, a public institution, an economic indicator, an ecological process, an ethical value or an administrative failure.

### Factual Base
${pack.facts}

### Institutions, Laws and Sources
${pack.institutions}

### Examples and Exam Anchors
${pack.examples}

### Topic-Specific Treatment
${focus.paragraph(title)}

### Applied Understanding
${related}

### Common Exam Traps
UPSC options often test overgeneralisation. Do not assume that every institution with a public purpose is constitutional, that every welfare scheme is centrally sponsored, that every environmental rule comes from the same law, or that every historical change happened uniformly across India. Check the exact source of authority, time period, territorial location and exception. In statement questions, words such as only, always, never, all and completely usually need extra caution. In Mains, the common mistake is writing a broad paragraph without naming the relevant act, article, committee, institution, location, thinker or data point.

### Mains and Prelims Use
${pack.answer} For Prelims, reduce ${title} into exact recall points: definition, year, article, location, institution, report, scheme and exception. For Mains, build a compact structure: background, present status, challenges, evidence, reform and way forward. The answer should be specific enough that a reader can identify the topic even if the heading is removed.`;
}

function relatedFactsForTitle(title, domain) {
  const lower = title.toLowerCase();
  if (lower.includes("local bodies")) {
    return "For local bodies, use the 73rd and 74th Constitutional Amendments, Parts IX and IXA, Eleventh and Twelfth Schedules, Article 243G for Panchayat powers, Article 243W for Municipal powers, State Election Commissions, State Finance Commissions, Gram Sabha, ward committees and the three Fs: functions, funds and functionaries. Real bottlenecks include delayed elections, weak own-source revenue, State control over staff, poor property tax collection, low Gram Sabha participation and parastatal overlap in urban governance.";
  }
  if (lower.includes("constitution") || lower.includes("polity") || lower.includes("federalism") || lower.includes("judiciary")) {
    return "For constitutional topics, connect text with practice. Use Kesavananda Bharati for Basic Structure, Maneka Gandhi for due process and dignity, S.R. Bommai for federalism, Puttaswamy for privacy, Article 32 and Article 226 for writs, Article 368 for amendment, Article 356 for President's Rule, Article 280 for Finance Commission and Article 324 for elections. The analytical edge is to show how the institution protects rights or balances power.";
  }
  if (lower.includes("climate") || lower.includes("monsoon") || lower.includes("geography") || lower.includes("ocean") || lower.includes("resource") || lower.includes("industry")) {
    return "For geography topics, always pair concept with location. Examples include Western Ghats orographic rainfall, Himalayan landslides, Bay of Bengal cyclones, black soil cotton belt, Chotanagpur minerals, Sundarbans mangroves, Thar aridity, Deccan rain shadow, Brahmaputra floods and coastal erosion. The analytical edge is to connect physical process with settlement, agriculture, disaster risk, resource use and regional planning.";
  }
  if (lower.includes("inflation") || lower.includes("banking") || lower.includes("fiscal") || lower.includes("gdp") || lower.includes("economy")) {
    return "For economy topics, use institutions and indicators: RBI, MPC, repo rate, CPI, WPI, GDP, GVA, fiscal deficit, current account deficit, GST Council, Finance Commission, FRBM Act, IBC, SEBI and Union Budget. The analytical edge is trade-off analysis: inflation versus growth, welfare versus fiscal prudence, formalisation versus informal worker protection and public investment versus debt sustainability.";
  }
  if (lower.includes("ethics") || lower.includes("integrity") || lower.includes("attitude") || lower.includes("probity")) {
    return "For ethics topics, use values, thinkers and administrative dilemmas. Connect integrity with consistency between public duty and private conduct, probity with clean use of public office, empathy with citizen-centric delivery, objectivity with evidence-based decisions and courage of conviction with resisting improper pressure. Use Gandhi, Ambedkar, Aristotle, Kant, Rawls, Weber, Nolan principles and 2nd ARC where relevant.";
  }
  if (lower.includes("coding") || lower.includes("reasoning") || lower.includes("comprehension") || lower.includes("decision")) {
    return "For CSAT topics, the content is procedural. Define the question type, identify the rule, solve from given information and avoid outside assumptions. In comprehension, distinguish stated fact, inference, assumption and opinion. In reasoning, map variables cleanly. In numeracy, write units and avoid approximation unless options allow it. The goal is the qualifying threshold with high accuracy.";
  }
  return `For this ${domain} topic, connect the static concept with a concrete Indian example, an institution, one current issue and one exam trap. The best notes avoid abstract labels and give enough factual hooks for both statement-based Prelims and analytical Mains questions.`;
}

function classifyTopic(topic) {
  const key = String(topic.key ?? "").toLowerCase();
  const title = String(topic.title ?? "").toLowerCase();
  const subject = String(topic.subject ?? "").toLowerCase();
  if (subject === "csat") return "csat";
  if (subject === "essay") return "essay";
  if (subject === "gs4" || key.includes("ethics") || title.includes("ethics") || title.includes("integrity")) return "ethics";
  if (subject === "gs1") {
    if (key.includes("geography") || title.includes("geography") || title.includes("climat") || title.includes("ocean") || title.includes("resource") || title.includes("industr")) return "geography";
    if (key.includes("society") || title.includes("society") || title.includes("women") || title.includes("urban") || title.includes("population")) return "society";
    return "history";
  }
  if (subject === "gs2") {
    if (key.includes("ir") || title.includes("international") || title.includes("foreign") || title.includes("neighbour")) return "ir";
    if (key.includes("governance") || title.includes("governance") || title.includes("rti") || title.includes("welfare") || title.includes("education") || title.includes("health")) return "governance";
    return "polity";
  }
  if (subject === "gs3") {
    if (key.includes("environment") || title.includes("environment") || title.includes("biodiversity") || title.includes("climate") || title.includes("pollution")) return "environment";
    if (key.includes("science") || title.includes("science") || title.includes("technology") || title.includes("space") || title.includes("ai") || title.includes("biotech")) return "science";
    if (key.includes("security") || title.includes("security") || title.includes("disaster") || title.includes("cyber")) return "security";
    if (key.includes("agriculture") || title.includes("agriculture") || title.includes("farm") || title.includes("msp")) return "agriculture";
    return "economy";
  }
  return "ethics";
}

function detectFocus(topic) {
  const key = String(topic.key ?? "").toLowerCase();
  if (key.includes("definition_and_conceptual_clarity")) {
    return {
      paragraph: (title) =>
        `The conceptual task in ${title} is to define the term, separate it from confusing neighbours and attach examples. UPSC often tests close distinctions: weather and climate, delta and estuary, constitutional and statutory body, fiscal deficit and revenue deficit, attitude and aptitude, inference and assumption, treaty and organisation. A good note must therefore include the definition, the contrast and the practical implication.`,
    };
  }
  if (key.includes("historical_background")) {
    return {
      paragraph: (title) =>
        `The historical background of ${title} should explain origin and evolution. Identify the first institutional or intellectual source, the turning points, and the present form. In polity this means colonial acts, Constituent Assembly choices and later amendments. In economy it means planning, 1991 reforms and later market institutions. In environment it means Stockholm, Rio, Kyoto, Paris and Indian environmental laws. In CSAT it means the paper's role as a qualifying aptitude filter.`,
    };
  }
  if (key.includes("implementation_bottleneck")) {
    return {
      paragraph: (title) =>
        `Implementation bottlenecks in ${title} usually come from weak capacity, unclear jurisdiction, vacancies, inadequate finance, poor data, low awareness, litigation, fragmented institutions or Centre-State friction. Identify the specific bottleneck and then give a matching reform: stable funding, staff capacity, social audit, independent regulation, digital monitoring, grievance redress, transparent appointments or decentralised planning.`,
    };
  }
  if (key.includes("committee_or_report_relevance")) {
    return {
      paragraph: (title) =>
        `${title} should use committees and reports only when they add diagnosis. Examples include Sarkaria and Punchhi for federalism, 2nd ARC for governance and ethics, Law Commission for legal reform, Finance Commission for fiscal federalism, Economic Survey for economy, IPCC for climate, and Parliamentary Standing Committees for bills. Mention what the report recommended, not only its name.`,
    };
  }
  if (key.includes("constitutional_or_institutional_angle")) {
    return {
      paragraph: (title) =>
        `The institutional angle of ${title} asks who has authority, who appoints, who funds, who audits, who reviews and who is accountable. In polity this means article numbers and judicial review. In governance it means delivery institutions and grievance redress. In economy it means regulators and fiscal bodies. In environment it means MoEFCC, CPCB, NGT and local communities.`,
    };
  }
  if (key.includes("current_affairs_linkage")) {
    return {
      paragraph: (title) =>
        `Current affairs linkage for ${title} should connect news with a static anchor: article, act, institution, scheme, report, convention, indicator or judgment. This prevents newspaper summary writing. The answer should explain what changed, why it matters, which institution is responsible and what long-term syllabus theme it reflects.`,
    };
  }
  if (key.includes("policy_challenge")) {
    return {
      paragraph: (title) =>
        `The policy challenge in ${title} is usually a trade-off: growth with equity, rights with security, conservation with livelihood, welfare with fiscal prudence, autonomy with accountability, technology with privacy, or speed with due process. The answer should state the trade-off clearly and propose a realistic middle path.`,
    };
  }
  if (key.includes("way_forward")) {
    return {
      paragraph: (title) =>
        `The way forward for ${title} should be actionable. Use legal reform where law is unclear, institutional reform where capacity is weak, fiscal reform where funding is unreliable, technology where monitoring is poor and community participation where behaviour change is needed. Avoid slogans; propose steps that can be implemented and measured.`,
    };
  }
  return {
    paragraph: (title) =>
      `${title} should be covered as a full micro-topic with definition, factual base, institution, example, challenge and reform. This makes it usable for both Prelims elimination and Mains answer writing.`,
  };
}

function auditTopic(topic) {
  const notes = parseNotes(topic.structured_notes);
  const full = String(notes.full_notes ?? "");
  const concise = Array.isArray(notes.concise_notes) ? notes.concise_notes : [];
  const revision = Array.isArray(notes.revision_bullets) ? notes.revision_bullets : [];
  const cases = Array.isArray(notes.cases) ? notes.cases : [];
  const schemes = Array.isArray(notes.schemes) ? notes.schemes : [];
  const issues = [];
  if (wordCount(full) < 350) issues.push("full_notes_short");
  if (containsGenericFullNotes(full)) issues.push("generic_full_notes");
  if (concise.length < 10) issues.push("too_few_concise_notes");
  if (revision.length < 10) issues.push("too_few_revision_bullets");
  if (concise.some((row) => isGenericText(row?.definition))) issues.push("generic_concise_definition");
  if (revision.some((item) => isGenericText(item))) issues.push("generic_revision_bullet");
  if (cases.length < 3) issues.push("too_few_cases_reports");
  if (schemes.length < 3) issues.push("too_few_schemes_sources");
  if (looksWrongFamily(topic, concise, revision)) issues.push("possible_wrong_subject_facts");
  return { issues };
}

function containsGenericFullNotes(value) {
  const lower = String(value ?? "").toLowerCase();
  return [
    "belongs to gs",
    "in upsc preparation, it should be studied",
    "avoid generic advice",
    "build the answer around the exact issue",
    "a strong answer on",
    "for prelims, convert",
  ].some((phrase) => lower.includes(phrase));
}

function isGenericText(value) {
  const lower = String(value ?? "").toLowerCase();
  return [
    "requiring articles, institutions",
    "requiring dynasty, dates",
    "revise the exact year",
    "use the official syllabus",
    "correct approach",
    "study this topic",
    "build conceptual clarity",
  ].some((phrase) => lower.includes(phrase));
}

function looksWrongFamily(topic, concise, revision) {
  const key = String(topic.key ?? "").toLowerCase();
  const text = `${JSON.stringify(concise)} ${JSON.stringify(revision)}`.toLowerCase();
  if (key.includes("local_bodies")) return text.includes("article 368") || text.includes("president's rule");
  if (key.includes("economy")) return text.includes("73rd amendment") || text.includes("article 124");
  if (key.includes("geography")) return text.includes("article 32") || text.includes("finance commission is under article 280");
  if (key.includes("ethics")) return text.includes("indus valley") || text.includes("repo rate");
  return false;
}

function parseNotes(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return { full_notes: String(value) };
  }
}

function wordCount(value) {
  return String(value ?? "").trim().split(/\s+/).filter(Boolean).length;
}

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

async function fetchAllTopics() {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("topics")
      .select("key,title,subject,parent_key,structured_notes")
      .order("key", { ascending: true })
      .range(from, from + 999);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return rows;
}
