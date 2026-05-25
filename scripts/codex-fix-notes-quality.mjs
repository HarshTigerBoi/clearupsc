import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const BATCH_SIZE = 50;
const MIN_WORDS = 400;

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

const packs = {
  csat: {
    domain: "CSAT aptitude and comprehension",
    realFacts:
      "UPSC Civil Services Preliminary Examination has two papers. General Studies Paper II, commonly called CSAT, carries 200 marks, has 80 questions, is qualifying in nature, and requires 33 percent marks. Wrong objective answers carry one-third negative marking. CSAT tests comprehension, interpersonal and communication skills, logical reasoning, analytical ability, decision making, problem solving, basic numeracy and data interpretation.",
    institutions:
      "The constitutional context is UPSC's examination function under Articles 315 to 323, especially Article 320. CSAT is not about advanced mathematics; it is about accuracy under time pressure. Comprehension questions require passage evidence, not outside knowledge. Numeracy questions require ratios, percentages, averages, time-work, time-distance, number system, data tables and logical elimination.",
    cases:
      "There are no landmark constitutional cases on individual CSAT topics in the way polity has Kesavananda or Maneka Gandhi. The relevant official source is the UPSC examination scheme and annual notification. The important exam principle is that Paper II is only qualifying, but failure to cross the qualifying mark means GS Paper I is not considered for merit.",
    current:
      "The current preparation angle is risk management: candidates often fail not because concepts are impossible, but because they over-attempt, misread options, ignore negative marking, or use outside assumptions in comprehension. A serious course must train evidence reading, option elimination, calculation shortcuts and timed sectional practice.",
  },
  essay: {
    domain: "UPSC essay writing",
    realFacts:
      "The UPSC Civil Services Main Examination includes an Essay paper of 250 marks. Candidates usually write two essays from different sections. The paper tests clarity of thought, coherence, balanced analysis, multidimensional coverage, language discipline and the ability to connect abstract themes with governance, society, ethics, economy, science, environment, culture and international relations.",
    institutions:
      "Essay content draws from the whole General Studies syllabus: Indian society, Constitution, governance, economy, science, environment, ethics and world affairs. A high-quality essay uses examples from the Constitution, Supreme Court judgments, government schemes, social reformers, national movements, reports such as Economic Survey or NCRB where relevant, and global institutions such as UN, WHO, WTO, IMF or IPCC depending on the theme.",
    cases:
      "Useful constitutional anchors include the Preamble, Fundamental Rights, Directive Principles and Fundamental Duties. Cases such as Maneka Gandhi on dignity and procedure, Puttaswamy on privacy, Vishaka on gender justice and Navtej Singh Johar on constitutional morality can enrich essays when used sparingly. Thinkers such as Gandhi, Ambedkar, Tagore, Amartya Sen, Aristotle and John Rawls help frame ethical and philosophical themes.",
    current:
      "Current essay themes often arise from technology, inequality, climate change, democracy, social media, women, youth, education, health, federalism and global uncertainty. The mains angle is not to dump facts; it is to build a thesis, examine both sides, use Indian examples and end with a constructive constitutional vision.",
  },
  history: {
    domain: "GS1 History, art and culture",
    realFacts:
      "History for UPSC includes ancient, medieval and modern India, art and culture, and the freedom struggle. Ancient India requires the Indus Valley Civilization, Vedic period, Mahajanapadas, Buddhism, Jainism, Mauryas, Guptas, Sangam age and regional kingdoms. Medieval India includes Delhi Sultanate, Vijayanagara, Bhakti-Sufi traditions, Mughals, Marathas and regional states. Modern India covers British expansion, socio-religious reform, tribal and peasant movements, Revolt of 1857, Indian National Congress, Gandhian mass movements, revolutionary nationalism, constitutional developments and Partition.",
    institutions:
      "Important sources and institutions include Archaeological Survey of India, epigraphy, numismatics, Sangam literature, Buddhist and Jain texts, foreign accounts of Megasthenes, Fa-Hien, Hiuen Tsang and Al-Biruni, as well as colonial records. For art and culture, candidates must know temple styles such as Nagara, Dravida and Vesara, Buddhist architecture, Indo-Islamic architecture, classical dances, music traditions, painting schools and UNESCO heritage sites.",
    cases:
      "Historical interpretation must be evidence-based. For modern history, real constitutional milestones include the Regulating Act 1773, Pitt's India Act 1784, Charter Acts, Indian Councils Acts 1861, 1892 and 1909, Government of India Acts 1919 and 1935, Cabinet Mission Plan 1946 and Indian Independence Act 1947. Key personalities include Raja Rammohan Roy, Jyotiba Phule, Savitribai Phule, Swami Vivekananda, Gandhi, Ambedkar, Nehru, Patel, Subhas Bose, Bhagat Singh and Annie Besant.",
    current:
      "Current affairs linkage comes through heritage conservation, museum policy, GI tags, cultural diplomacy, textbook debates, tribal heroes, women in the freedom movement and protection of monuments. In mains, history answers should connect chronology with causation: why a movement emerged, who participated, what methods were used, and what changed in society, economy, politics or culture.",
  },
  geography: {
    domain: "GS1 Geography",
    realFacts:
      "Geography for UPSC covers geomorphology, climatology, oceanography, biogeography, Indian physical geography, resources, agriculture, industries, population and urbanisation. Core physical concepts include plate tectonics, volcanism, earthquakes, folding, faulting, weathering, erosion, landforms, monsoon mechanisms, jet streams, cyclones, ocean currents, tides, coral reefs and climatic regions. Indian geography requires the Himalayas, Northern Plains, Peninsular Plateau, Thar Desert, coastal plains, islands, river systems, soils, vegetation, mineral belts and disaster-prone regions.",
    institutions:
      "Key institutions and sources include India Meteorological Department, Geological Survey of India, Survey of India, Central Water Commission, ISRO remote sensing, National Disaster Management Authority, Census of India and National Atlas and Thematic Mapping Organisation. Map-based knowledge matters: Himalayan ranges, passes, west-flowing and east-flowing rivers, Western and Eastern Ghats, mineral regions, industrial corridors, ports, Ramsar sites and cyclone-prone coasts.",
    cases:
      "Geography links with law and policy through disaster management, environment and resource governance. The Disaster Management Act 2005 created NDMA, SDMAs and DDMAs. River water disputes such as Cauvery show the intersection of geography and federalism. Environmental cases like M.C. Mehta matters, Vellore Citizens Welfare Forum on precautionary principle, and Godavarman forest litigation connect physical geography with ecological governance.",
    current:
      "Current issues include changing monsoon behaviour, glacial lake outburst floods, Himalayan instability, urban flooding, groundwater depletion, coastal erosion, heat waves, river interlinking, land degradation, renewable energy corridors and climate adaptation. UPSC expects answers to use diagrams and maps: draw India outline, mark regions, show process arrows and connect physical processes to human outcomes.",
  },
  society: {
    domain: "GS1 Indian society",
    realFacts:
      "Indian society topics include diversity, caste, tribe, class, gender, family, urbanisation, secularism, communalism, regionalism, poverty, population, migration, social empowerment and globalisation. Important constitutional anchors include equality under Articles 14 to 18, freedom under Article 19, life and dignity under Article 21, religious freedom under Articles 25 to 28, cultural and educational rights under Articles 29 and 30, and social justice through Directive Principles.",
    institutions:
      "Real institutions include National Commission for Women, National Commission for Scheduled Castes, National Commission for Scheduled Tribes, National Commission for Backward Classes, National Human Rights Commission, Ministry of Social Justice, Ministry of Tribal Affairs and Census of India. Important laws include Protection of Civil Rights Act 1955, SC/ST Prevention of Atrocities Act 1989, Domestic Violence Act 2005, Child Marriage Prohibition Act 2006, Transgender Persons Act 2019 and Rights of Persons with Disabilities Act 2016.",
    cases:
      "Important cases include Indra Sawhney on OBC reservation and 50 percent ceiling, NALSA on transgender dignity, Navtej Singh Johar on LGBTQ rights, Joseph Shine on gender equality, Vishaka on workplace harassment, Shayara Bano on triple talaq and Puttaswamy on privacy. These cases convert social issues into rights, dignity and constitutional morality arguments.",
    current:
      "Current themes include women-led development, caste census debate, ageing population, migration, gig work, urban informal settlements, tribal rights, digital divide, social media and communal harmony. Mains answers should avoid stereotypes and use sociological balance: continuity and change, empowerment and exclusion, law and social practice, state action and community participation.",
  },
  polity: {
    domain: "GS2 Polity and Constitution",
    realFacts:
      "Polity covers the Constitution, Parliament, executive, judiciary, federalism, local bodies, constitutional bodies, statutory bodies, rights, Directive Principles, amendments and basic structure. The Preamble gives the values of justice, liberty, equality and fraternity. Fundamental Rights are in Part III, Directive Principles in Part IV, Fundamental Duties in Part IVA. Important article clusters include Articles 12 to 35 for rights, 52 to 78 for Union executive, 79 to 122 for Parliament, 124 to 147 for Supreme Court, 148 to 151 for CAG, 153 to 167 for State executive, 214 to 231 for High Courts and 245 to 263 for Centre-State relations.",
    institutions:
      "Key institutions are Parliament, President, Prime Minister and Council of Ministers, Supreme Court, High Courts, Election Commission under Article 324, CAG under Article 148, Finance Commission under Article 280, UPSC under Articles 315 to 323, National Commissions under Articles 338, 338A and 338B, Panchayats under Part IX and Municipalities under Part IXA. The Constitution creates checks and balances through legislative scrutiny, judicial review, federal distribution, independent audit and elections.",
    cases:
      "Essential cases include Kesavananda Bharati on basic structure, Maneka Gandhi on expanded Article 21, Minerva Mills on harmony between rights and Directive Principles, S.R. Bommai on federalism and secularism, I.R. Coelho on Ninth Schedule review, Puttaswamy on privacy, Vishaka on gender justice and Supreme Court Advocates-on-Record cases on judicial appointments. These cases are not decorative; they explain how constitutional text works in real disputes.",
    current:
      "Current GS-II issues include judicial appointments, tribunal independence, anti-defection, Governor's discretion, federal fiscal tensions, election transparency, women's reservation, data protection, parliamentary productivity, criminal law reforms and local body finances. Answers should connect news with constitutional principles: rule of law, separation of powers, accountable executive, cooperative federalism, constitutional morality and citizen rights.",
  },
  governance: {
    domain: "GS2 Governance and social justice",
    realFacts:
      "Governance covers transparency, accountability, e-governance, citizen charters, welfare schemes, pressure groups, NGOs, SHGs, social sector delivery, health, education, poverty and vulnerable sections. Important laws include Right to Information Act 2005, Lokpal and Lokayuktas Act 2013, Prevention of Corruption Act 1988 amended in 2018, Aadhaar Act 2016, Consumer Protection Act 2019, National Food Security Act 2013, MGNREGA 2005 and Rights of Persons with Disabilities Act 2016.",
    institutions:
      "Important institutions include Central Information Commission, State Information Commissions, CVC, CBI, Lokpal, NITI Aayog, National Health Authority, National Commission for Women, NHRC, social justice commissions, District Magistrate system, Gram Sabhas and urban local bodies. Governance also includes digital platforms such as Aadhaar, DBT, UPI, CoWIN, UMANG, DigiLocker, GeM, e-NAM and National Scholarship Portal.",
    cases:
      "Raj Narain and later RTI jurisprudence established the democratic importance of information. Puttaswamy shaped privacy limits for digital governance. Common Cause and Vineet Narain strengthened accountability debates around investigative independence. PUCL right-to-food litigation supported welfare entitlements. Vishaka showed how judicial guidelines can fill governance gaps until legislation is made.",
    current:
      "Current issues include DBT leakage reduction, exclusion errors, data privacy, algorithmic governance, health insurance, learning outcomes, nutrition, social audits, grievance redress, NGO regulation under FCRA, cooperative federalism in welfare schemes and outcome budgeting. A good answer evaluates last-mile delivery through inclusion, transparency, decentralisation, technology, audit and citizen feedback.",
  },
  ir: {
    domain: "GS2 International Relations",
    realFacts:
      "International Relations covers India's foreign policy, neighbourhood, bilateral relations, regional groupings, global institutions, diaspora and effect of global politics on India. Core principles include strategic autonomy, non-alignment legacy, Panchsheel, neighbourhood first, Act East, SAGAR, Indo-Pacific, multilateralism, South-South cooperation and Vasudhaiva Kutumbakam. India's interests include security, energy, trade, technology, maritime routes, diaspora welfare and climate justice.",
    institutions:
      "Important organisations include UN and its organs, WTO, IMF, World Bank, WHO, IAEA, ICJ, G20, BRICS, SCO, QUAD, ASEAN, BIMSTEC, SAARC, IORA and International Solar Alliance. Bilateral priorities include the United States, Russia, China, Japan, France, Australia, EU, Gulf countries and immediate neighbours: Pakistan, Bangladesh, Nepal, Bhutan, Sri Lanka, Maldives, Myanmar and Afghanistan.",
    cases:
      "Treaties and agreements matter more than court cases in IR. Key references include Simla Agreement 1972, Indus Waters Treaty 1960, India-Bangladesh Land Boundary Agreement 2015, Paris Agreement 2015, UNCLOS, WTO agreements, Nuclear Suppliers Group debates, civil nuclear cooperation with the US and border agreements or confidence-building measures with China. Article 253 lets Parliament legislate to implement international obligations.",
    current:
      "Current issues include India-China border tensions, QUAD and Indo-Pacific, Russia-Ukraine war, Israel-Hamas conflict, Red Sea maritime security, supply chain resilience, semiconductor partnerships, climate finance, Global South leadership, G20 outcomes and neighbourhood political instability. A strong answer connects idealism with realism: values matter, but national interest, geography, economic capacity and security threats shape choices.",
  },
  economy: {
    domain: "GS3 Economy",
    realFacts:
      "Economy includes growth, development, planning, budgeting, taxation, inflation, banking, monetary policy, fiscal policy, external sector, infrastructure, agriculture, industry, employment and inclusive growth. Key facts include GDP, GVA, CPI, WPI, fiscal deficit, revenue deficit, current account deficit, forex reserves, tax-to-GDP ratio, repo rate, CRR, SLR and money supply. India adopted LPG reforms in 1991 after a balance of payments crisis and later introduced GST in 2017 through the 101st Constitutional Amendment.",
    institutions:
      "Important institutions include RBI, Monetary Policy Committee, Finance Ministry, GST Council under Article 279A, Finance Commission under Article 280, NITI Aayog, SEBI, IRDAI, PFRDA, Competition Commission, Insolvency and Bankruptcy Board, NABARD, SIDBI and EXIM Bank. Laws include RBI Act 1934, Banking Regulation Act 1949, FRBM Act 2003, IBC 2016, GST laws, Companies Act 2013 and FEMA 1999.",
    cases:
      "Important legal-economic references include Mohit Minerals on GST Council recommendations, Swiss Ribbons on IBC constitutionality, Essar Steel insolvency on Committee of Creditors' commercial wisdom, Vodafone retrospective tax litigation and 2G spectrum allocation cases on natural resources and transparency. Committees include Narasimham banking reforms, Urjit Patel on inflation targeting, Kelkar on tax reforms and N.K. Singh on FRBM review.",
    current:
      "Current economic issues include inflation management, capital expenditure push, fiscal consolidation, unemployment, women labour force participation, manufacturing through PLI schemes, digital public infrastructure, UPI, startup ecosystem, green growth, logistics, external shocks and global supply chains. Mains answers should combine data with analysis: growth versus inclusion, fiscal prudence versus welfare, formalisation versus informal worker protection.",
  },
  agriculture: {
    domain: "GS3 Agriculture",
    realFacts:
      "Agriculture employs a large share of India's workforce but contributes a smaller share of GDP, making productivity and income central concerns. Topics include cropping pattern, irrigation, MSP, procurement, food security, land reforms, e-NAM, FPOs, crop insurance, food processing, storage, allied sectors, dairy, fisheries and agricultural marketing. India is a leading producer of rice, wheat, milk, pulses, spices, fruits and vegetables, but imports a large share of edible oils.",
    institutions:
      "Important institutions include Ministry of Agriculture, CACP, FCI, NABARD, ICAR, APEDA, NAFED, Warehousing Development and Regulatory Authority and State APMCs. Schemes include PM-KISAN, PMFBY, PMKSY, Soil Health Card, Kisan Credit Card, e-NAM, Agriculture Infrastructure Fund, PM Formalisation of Micro Food Processing Enterprises and formation of 10,000 FPOs.",
    cases:
      "Key policy references include M.S. Swaminathan Commission recommendation of MSP at C2 plus 50 percent, Shanta Kumar Committee on FCI and PDS reform, Ashok Dalwai Committee on doubling farmers' income and debates around the repealed Farm Acts 2020. Constitutional anchors include agriculture as a State List subject and Entry 33 of Concurrent List for trade and commerce in foodstuffs.",
    current:
      "Current issues include legal MSP demand, crop diversification, groundwater depletion, millets after International Year of Millets 2023, climate-resilient agriculture, digital agriculture, drones, storage, food processing, farmer producer organisations and agricultural exports. Answers should link productivity, sustainability, market access and farmer income.",
  },
  environment: {
    domain: "GS3 Environment and ecology",
    realFacts:
      "Environment includes ecology, biodiversity, forests, wildlife, climate change, pollution, environmental impact assessment, conservation, protected areas and sustainable development. Key laws include Wildlife Protection Act 1972, Water Act 1974, Forest Conservation Act 1980, Air Act 1981, Environment Protection Act 1986, Biological Diversity Act 2002, National Green Tribunal Act 2010 and Compensatory Afforestation Fund Act 2016.",
    institutions:
      "Important institutions include Ministry of Environment, Forest and Climate Change, Central Pollution Control Board, State Pollution Control Boards, National Green Tribunal, National Biodiversity Authority, Wildlife Crime Control Bureau, Forest Survey of India, NTCA and Central Zoo Authority. Important international conventions include UNFCCC, Kyoto Protocol, Paris Agreement, CBD, CITES, Ramsar Convention, CMS and Montreal Protocol.",
    cases:
      "Landmark cases include M.C. Mehta series on pollution and environmental governance, Vellore Citizens Welfare Forum on precautionary principle and polluter pays, T.N. Godavarman on forest conservation, Subhash Kumar on right to pollution-free water and air under Article 21, and Lafarge case on sustainable development. Constitutional provisions include Article 48A, Article 51A(g) and Article 21.",
    current:
      "Current issues include climate finance, India's NDCs, LiFE movement, net zero by 2070, renewable energy, green hydrogen, air pollution, cheetah reintroduction, wetlands, CAMPA, forest diversion, carbon markets and disaster-climate linkage. Mains answers should balance conservation, livelihood, development and intergenerational equity.",
  },
  science: {
    domain: "GS3 Science and technology",
    realFacts:
      "Science and technology covers space, defence, biotechnology, nanotechnology, IT, AI, robotics, quantum technology, cyber security, health technology and intellectual property. Indian space milestones include Aryabhata 1975, SLV-3, PSLV, GSLV, Chandrayaan-1 discovery of water molecules, Mars Orbiter Mission 2013, Chandrayaan-3 soft landing near the lunar south polar region in 2023 and Aditya-L1 solar mission. Defence technology includes missiles under IGMDP, BrahMos, Agni series, Akash, LCA Tejas and indigenous aircraft carrier INS Vikrant.",
    institutions:
      "Important institutions include ISRO, IN-SPACe, NSIL, DRDO, Department of Science and Technology, Department of Biotechnology, CSIR, ICMR, MeitY, BARC, NPCIL and CERT-In. Key policies include National IPR Policy 2016, Space Policy 2023, Drone Rules 2021, National Quantum Mission 2023 and Digital Personal Data Protection Act 2023 for data governance.",
    cases:
      "Legal anchors include Puttaswamy on privacy and informational self-determination, Shreya Singhal on online speech and Section 66A, and Novartis v Union of India on pharmaceutical patents and Section 3(d). Bioethics connects with ART Act, Surrogacy Act, gene editing debates and biosafety regulation. Cyber issues connect with IT Act 2000 and CERT-In directions.",
    current:
      "Current issues include AI governance, deepfakes, semiconductor mission, 5G and 6G, quantum communication, private space sector, Gaganyaan, small modular reactors, green hydrogen, mRNA vaccines, antimicrobial resistance, biotechnology regulation and cyber resilience. Answers should explain the science simply, then evaluate application, risks, ethics, regulation and India's strategic advantage.",
  },
  security: {
    domain: "GS3 Internal security and disaster management",
    realFacts:
      "Internal security covers terrorism, insurgency, left-wing extremism, border management, cyber security, money laundering, organised crime, coastal security and security agencies. Disaster management covers hazards, vulnerability, mitigation, preparedness, response and recovery. The Disaster Management Act 2005 created NDMA, SDMAs and DDMAs. India faces floods, cyclones, earthquakes, landslides, heat waves, droughts, industrial disasters and biological emergencies.",
    institutions:
      "Important institutions include Ministry of Home Affairs, National Security Council Secretariat, NIA, IB, RAW, CAPFs, NATGRID, NCB, ED, FIU-IND, NDMA, NDRF, IMD, INCOIS and State Disaster Management Authorities. Laws include UAPA, NIA Act, PMLA, IT Act, Disaster Management Act, Epidemic Diseases Act and coastal security frameworks after 26/11.",
    cases:
      "Important references include Kartar Singh on anti-terror laws, Puttaswamy on privacy limits relevant to surveillance, Shreya Singhal on online speech, and disaster jurisprudence around right to life under Article 21. Committees include Kargil Review Committee, Group of Ministers on national security and Second Administrative Reforms Commission report on crisis management.",
    current:
      "Current issues include drones, cyber attacks on critical infrastructure, radicalisation, cryptocurrency laundering, border infrastructure, maritime security, Manipur and ethnic conflict, LWE decline but persistence in core areas, heat action plans, urban flooding and early warning systems. Answers should integrate security with development, technology, community trust and rights safeguards.",
  },
  ethics: {
    domain: "GS4 Ethics, integrity and aptitude",
    realFacts:
      "Ethics in UPSC covers ethics and human interface, attitude, aptitude, emotional intelligence, moral thinkers, public service values, probity, governance, corruption, transparency, accountability and case studies. Core values include integrity, impartiality, objectivity, dedication to public service, empathy, tolerance, compassion, courage of conviction and constitutional morality. Ethics is not only theory; it tests judgment under conflict.",
    institutions:
      "Governance ethics connects with codes of conduct, conduct rules, citizen charters, RTI, social audit, CVC, Lokpal, CAG, parliamentary committees, vigilance systems and grievance redress. The Second Administrative Reforms Commission report on Ethics in Governance is a major source. Nolan principles of public life, though from the UK, are often useful: selflessness, integrity, objectivity, accountability, openness, honesty and leadership.",
    cases:
      "Thinkers include Aristotle on virtue, Kant on duty, Bentham and Mill on utilitarianism, Gandhi on means and ends, Ambedkar on constitutional morality, Rawls on justice, Weber on bureaucracy and Buddha on compassion. Indian examples include E. Sreedharan for integrity in public projects, Verghese Kurien for cooperative leadership and T.N. Seshan for institutional courage.",
    current:
      "Current ethical issues include conflict of interest, political neutrality of civil services, whistle-blower protection, AI ethics, data privacy, environmental ethics, corporate governance, public health choices and disaster allocation dilemmas. A case study answer should identify stakeholders, ethical issues, legal position, options, consequences and a balanced decision with empathy and integrity.",
  },
};

async function main() {
  let offset = 0;
  let processed = 0;
  let updated = 0;
  const failed = [];

  while (true) {
    const { data: topics, error } = await supabase
      .from("topics")
      .select("key,title,subject,parent_key,structured_notes")
      .order("key", { ascending: true })
      .range(offset, offset + BATCH_SIZE - 1);

    if (error) throw error;
    if (!topics?.length) break;

    for (const topic of topics) {
      processed += 1;
      const notes = parseNotes(topic.structured_notes);
      const fullNotes = buildFullNotes(topic);
      const words = wordCount(fullNotes);

      if (words < MIN_WORDS) {
        failed.push({ key: topic.key, error: `Generated ${words} words` });
        continue;
      }

      const nextNotes = { ...notes, full_notes: fullNotes };
      let { error: updateError } = await supabase.from("topics").update({ structured_notes: nextNotes }).eq("key", topic.key);

      if (updateError) {
        const fallback = await supabase
          .from("topics")
          .update({ structured_notes: JSON.stringify(nextNotes) })
          .eq("key", topic.key);
        updateError = fallback.error;
      }

      if (updateError) {
        failed.push({ key: topic.key, error: updateError.message });
      } else {
        updated += 1;
      }

      if (processed % 100 === 0) {
        console.log(`[progress] processed ${processed}; updated ${updated}; failed ${failed.length}`);
      }
    }

    offset += BATCH_SIZE;
  }

  console.log(
    JSON.stringify(
      {
        processed,
        updated,
        failed: failed.length,
        failed_keys: failed,
      },
      null,
      2
    )
  );
}

function buildFullNotes(topic) {
  const pack = packs[classifyTopic(topic)] ?? packs.ethics;
  const focus = detectFocus(topic);
  const title = clean(topic.title);

  return `## ${title}

### Core Meaning
${title} belongs to ${pack.domain}. In UPSC preparation, it should be studied as a factual topic and as an analytical theme. The factual side gives definitions, dates, institutions, laws, schemes, reports and examples. The analytical side asks why the topic matters for India, what problem it solves, what limitations remain, and how it connects with the Constitution, governance, economy, society, environment or security. For this topic, avoid generic advice. Build the answer around the exact issue in the title: ${title}.

### Real UPSC Facts
${pack.realFacts}

### Institutions, Laws, Schemes And Sources
${pack.institutions}

### Cases, Reports, Treaties Or Thinkers
${pack.cases}

### Current Affairs And India-Specific Angle
${pack.current}

### Topic-Specific Focus: ${focus.label}
${focus.paragraph(title, pack)}

### How To Write It In Mains
A strong answer on ${title} should open with a precise definition or constitutional, historical or technical anchor. Then add two to four real facts from the relevant syllabus area, followed by one example from India. Where the topic is polity, mention article numbers and judgments. Where it is governance, mention schemes, acts, delivery gaps and accountability tools. Where it is IR, mention the relevant country, treaty, organisation or strategic interest. Where it is economy, use indicators and institutions. Where it is environment, use laws, conventions, species or ecological principles. Where it is science, explain the technology and then its application, risk and regulation. Where it is ethics, identify values, stakeholders and a principled decision. End with a practical way forward, not a slogan.

### Prelims And Revision Pointers
For prelims, convert ${title} into exact recall points: year, article, act, committee, organisation, location, definition and exception. For mains, prepare a compact framework: background, present status, challenges, reforms and way forward. Do not overclaim facts that are uncertain. When a number changes frequently, such as GDP, inflation, unemployment, forest cover or scheme allocation, use the latest official source during final revision.`;
}

function classifyTopic(topic) {
  const key = topic.key.toLowerCase();
  const title = topic.title.toLowerCase();
  const subject = (topic.subject || "").toLowerCase();

  if (subject === "csat") return "csat";
  if (subject === "essay") return "essay";
  if (subject === "gs4" || key.includes("ethics") || title.includes("ethics") || title.includes("integrity")) return "ethics";

  if (subject === "gs1") {
    if (key.includes("geography") || title.includes("geography") || title.includes("climate") || title.includes("river") || title.includes("soil") || title.includes("monsoon")) return "geography";
    if (key.includes("society") || title.includes("society") || title.includes("social") || title.includes("women") || title.includes("urban") || title.includes("population")) return "society";
    return "history";
  }

  if (subject === "gs2") {
    if (key.includes("ir") || title.includes("international") || title.includes("bilateral") || title.includes("foreign") || title.includes("neighbour")) return "ir";
    if (key.includes("governance") || title.includes("governance") || title.includes("welfare") || title.includes("health") || title.includes("education") || title.includes("scheme") || title.includes("rti")) return "governance";
    return "polity";
  }

  if (subject === "gs3") {
    if (key.includes("environment") || title.includes("environment") || title.includes("biodiversity") || title.includes("climate") || title.includes("pollution") || title.includes("forest")) return "environment";
    if (key.includes("science") || title.includes("science") || title.includes("technology") || title.includes("space") || title.includes("isro") || title.includes("biotech") || title.includes("ai")) return "science";
    if (key.includes("security") || title.includes("security") || title.includes("terror") || title.includes("disaster") || title.includes("cyber")) return "security";
    if (key.includes("agriculture") || title.includes("agriculture") || title.includes("food") || title.includes("msp") || title.includes("farm")) return "agriculture";
    return "economy";
  }

  return "ethics";
}

function detectFocus(topic) {
  const key = topic.key.toLowerCase();
  if (key.includes("committee_or_report_relevance")) {
    return {
      label: "Committee Or Report Relevance",
      paragraph: (title) =>
        `${title} should be linked with authentic reports instead of vague statements. Use committee names only when they explain the issue: Sarkaria and Punchhi for federalism, 2nd ARC for governance and ethics, Law Commission for legal reform, Finance Commission for fiscal issues, Economic Survey for economy, IPCC for climate, Parliamentary Standing Committees for bills and schemes, and NITI Aayog reports for policy implementation. In answers, mention what the report diagnosed and what reform it suggested.`,
    };
  }
  if (key.includes("constitutional_or_institutional_angle")) {
    return {
      label: "Constitutional Or Institutional Angle",
      paragraph: (title) =>
        `${title} must be connected with institutional design. Ask: who has legal authority, who appoints, who funds, who audits, who reviews, and what remedy citizens have. In polity this means articles, courts and accountability; in governance it means grievance redress and transparency; in economy it means regulators and fiscal rules; in environment it means MoEFCC, CPCB, NGT and local communities; in security it means coordination between Union, State and district agencies.`,
    };
  }
  if (key.includes("current_affairs_linkage")) {
    return {
      label: "Current Affairs Linkage",
      paragraph: (title) =>
        `Current affairs for ${title} should be handled through principles, not headlines. Identify the underlying issue: rights, federalism, inflation, technology risk, environmental impact, social justice, treaty obligations, institutional independence or public ethics. Then connect the news to one static source: an article, act, scheme, convention, report, data point or Supreme Court case. This method prevents shallow newspaper summaries.`,
    };
  }
  if (key.includes("definition_and_conceptual_clarity")) {
    return {
      label: "Definition And Conceptual Clarity",
      paragraph: (title) =>
        `For ${title}, define the term in one line, separate it from nearby concepts, and list two examples. UPSC often tests distinctions: GDP and GVA, CPI and WPI, weather and climate, constitutional and statutory body, rights and Directive Principles, biodiversity and wildlife, treaty and organisation, ethics and law, attitude and aptitude, inference and assumption. Conceptual clarity prevents attractive but wrong options.`,
    };
  }
  if (key.includes("historical_background")) {
    return {
      label: "Historical Background",
      paragraph: (title) =>
        `The historical background of ${title} should explain origin and evolution. For history topics, use chronology and causation. For polity, trace colonial constitutional acts and Constituent Assembly choices. For economy, trace planning, 1991 reforms, GST and digital public infrastructure. For environment, trace Stockholm 1972, Rio 1992, Kyoto, Paris and Indian environmental laws. For science, trace India's institutional capacity through ISRO, DRDO, CSIR, DBT and digital missions.`,
    };
  }
  if (key.includes("implementation_bottleneck")) {
    return {
      label: "Implementation Bottleneck",
      paragraph: (title) =>
        `Implementation bottlenecks in ${title} usually arise from weak capacity, poor coordination, unclear jurisdiction, vacancies, finance gaps, lack of data, low citizen awareness, leakages, litigation or Centre-State friction. A good answer should identify which bottleneck matters most and then propose reforms: transparent appointments, better local capacity, digital monitoring, social audit, independent regulation, stable funding and time-bound grievance redress.`,
    };
  }
  if (key.includes("policy_challenge")) {
    return {
      label: "Policy Challenge",
      paragraph: (title) =>
        `The policy challenge in ${title} is balancing competing values. Growth must be balanced with inclusion and sustainability; security with liberty; technology with privacy; judicial independence with accountability; welfare with fiscal prudence; conservation with livelihood; and foreign policy ideals with national interest. UPSC rewards answers that show trade-offs and then offer a realistic middle path.`,
    };
  }
  if (key.includes("way_forward")) {
    return {
      label: "Way Forward",
      paragraph: (title) =>
        `The way forward for ${title} should be actionable. Use legal reform where law is outdated, institutional reform where capacity is weak, fiscal reform where funding is missing, technology where monitoring is poor, and community participation where behaviour change is needed. End with measurable outcomes: faster disposal, better targeting, lower emissions, improved learning, higher productivity, stronger transparency or greater citizen trust.`,
    };
  }
  return {
    label: "Complete Topic Coverage",
    paragraph: (title) =>
      `${title} should be revised as a full UPSC micro-topic. Prepare a one-line definition, five factual anchors, one institutional link, one current example, one challenge and one way forward. This creates a complete answer framework and also produces prelims-ready facts.`,
  };
}

function parseNotes(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  if (typeof value !== "string") return {};
  try {
    return JSON.parse(value);
  } catch {
    return { full_notes: value };
  }
}

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
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
      const value = trimmed
        .slice(index + 1)
        .trim()
        .replace(/^['"]|['"]$/g, "");
      process.env[key] ??= value;
    }
  } catch {}
}

await main();
