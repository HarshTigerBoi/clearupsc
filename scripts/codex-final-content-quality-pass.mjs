import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "./script-env.mjs";

const { url, serviceKey } = requireSupabaseEnv();
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
const report = JSON.parse(readFileSync("data/content-reports/content-quality-audit.json", "utf8"));
const weakRows = report.priorityFixes ?? [];
const keys = weakRows.map((row) => row.key);

let updated = 0;
const failed = [];

for (const row of weakRows) {
  const { data, error } = await supabase.from("topics").select("key,title,subject,structured_notes").eq("key", row.key).maybeSingle();
  if (error || !data) {
    failed.push({ key: row.key, error: error?.message ?? "topic not found" });
    continue;
  }

  const notes = parseNotes(data.structured_notes);
  const issues = row.issues ?? [];
  const key = String(data.key);

  if (issues.includes("generic_concise_definition")) {
    notes.concise_notes = buildConciseNotes(data);
  }

  if (issues.includes("possible_wrong_subject_facts") || issues.includes("full_notes_short")) {
    notes.full_notes = ensureMinimumFullNotes(buildSubjectCleanFullNotes(data), data);
  }

  if (issues.includes("possible_wrong_subject_facts")) {
    notes.concise_notes = buildConciseNotes(data);
    notes.revision_bullets = buildRevisionBullets(data);
  }

  if (issues.includes("too_few_cases_reports")) {
    const additions = buildCasesAndSchemes(data);
    notes.cases = additions.cases;
    notes.schemes = additions.schemes;
  }

  const quality = validateNotes(key, notes, issues);
  if (!quality.ok) {
    failed.push({ key, error: quality.error });
    continue;
  }

  let { error: updateError } = await supabase.from("topics").update({ structured_notes: notes }).eq("key", key);
  if (updateError) {
    const fallback = await supabase.from("topics").update({ structured_notes: JSON.stringify(notes) }).eq("key", key);
    updateError = fallback.error;
  }

  if (updateError) {
    failed.push({ key, error: updateError.message });
  } else {
    updated += 1;
  }
}

console.log(JSON.stringify({ targeted: keys.length, updated, failed: failed.length, failures: failed }, null, 2));
if (failed.length) process.exitCode = 1;

function buildConciseNotes(topic) {
  const key = String(topic.key ?? "").toLowerCase();
  if (key.includes("local_bodies")) return localBodiesConcise();
  if (key.includes("social_justice")) return socialJusticeConcise(key);
  if (key.includes("constitutional_bodies")) return constitutionalBodiesConcise();
  if (key.includes("statutory_bodies") || key.includes("bodies")) return bodiesConcise();
  if (key.includes("constitution")) return constitutionConcise();
  if (key.includes("executive")) return executiveConcise();
  if (key.includes("federalism")) return federalismConcise();
  if (key.includes("parliament")) return parliamentConcise();
  if (key.includes("geography")) return geographyConcise(key);
  if (key.includes("accountability")) return accountabilityConcise();
  return polityConcise();
}

function localBodiesConcise() {
  return [
    term("73rd Amendment", "The 1992 amendment that gave constitutional status to Panchayati Raj institutions through Part IX."),
    term("74th Amendment", "The 1992 amendment that gave constitutional status to Municipalities through Part IXA."),
    term("Gram Sabha", "Article 243A body of all registered voters in a village area."),
    term("Article 243G", "Provision allowing States to devolve powers and responsibilities to Panchayats."),
    term("Article 243W", "Provision allowing States to devolve powers and responsibilities to Municipalities."),
    term("Eleventh Schedule", "List of 29 functional subjects associated with Panchayats."),
    term("Twelfth Schedule", "List of 18 functional subjects associated with Municipalities."),
    term("State Election Commission", "Constitutional authority under Articles 243K and 243ZA for local body elections."),
    term("State Finance Commission", "Body under Articles 243I and 243Y recommending State-local fiscal distribution."),
    term("Three Fs", "Functions, funds and functionaries required for real decentralisation."),
    term("Kishansing Tomar Case", "Supreme Court case holding timely local body elections as a constitutional obligation."),
    term("K. Krishna Murthy Case", "Supreme Court case on reservation principles in local bodies."),
  ];
}

function polityConcise() {
  return [
    term("Preamble", "Constitutional statement of justice, liberty, equality, fraternity and democratic republic values."),
    term("Article 12", "Defines State for enforcement of Fundamental Rights."),
    term("Article 13", "Makes laws inconsistent with Fundamental Rights void to the extent of inconsistency."),
    term("Article 21", "Protects life and personal liberty, expanded to dignity and due process."),
    term("Article 32", "Supreme Court writ jurisdiction for Fundamental Rights enforcement."),
    term("Article 226", "High Court writ jurisdiction for rights and other legal purposes."),
    term("Article 368", "Procedure for amendment of the Constitution."),
    term("Basic Structure", "Doctrine from Kesavananda Bharati limiting Parliament's amending power."),
    term("Judicial Review", "Court power to test law and executive action against the Constitution."),
    term("Rule of Law", "Principle that all public power must operate under law."),
    term("Separation of Powers", "Functional division among legislature, executive and judiciary."),
    term("Constitutional Morality", "Commitment to constitutional values above narrow social or political pressure."),
  ];
}

function constitutionConcise() {
  return [
    term("Constituent Assembly", "Body that drafted the Constitution; first met on 9 December 1946."),
    term("Drafting Committee", "Committee chaired by Dr B.R. Ambedkar, set up on 29 August 1947."),
    term("Objective Resolution", "Nehru's 1946 resolution that shaped the Preamble's constitutional vision."),
    term("26 November 1949", "Date on which the Constitution was adopted."),
    term("26 January 1950", "Date on which the Constitution came into force."),
    term("Government of India Act 1935", "Major colonial statute that influenced federal and administrative provisions."),
    term("Preamble", "Statement of constitutional philosophy and Basic Structure reasoning."),
    term("Part III", "Part of the Constitution containing Fundamental Rights."),
    term("Part IV", "Part containing Directive Principles of State Policy."),
    term("Part IVA", "Part containing Fundamental Duties inserted by the 42nd Amendment."),
    term("Kesavananda Bharati", "1973 case recognising Basic Structure doctrine."),
    term("Minerva Mills", "1980 case stressing harmony between Fundamental Rights and Directive Principles."),
  ];
}

function constitutionalBodiesConcise() {
  return [
    term("Election Commission", "Article 324 body controlling elections to Parliament, State legislatures and certain constitutional offices."),
    term("CAG", "Article 148 authority auditing Union and State accounts."),
    term("Finance Commission", "Article 280 body recommending tax devolution and grants."),
    term("UPSC", "Articles 315-323 body conducting recruitment and advising on civil services matters."),
    term("NCSC", "Article 338 commission for Scheduled Castes safeguards."),
    term("NCST", "Article 338A commission for Scheduled Tribes safeguards."),
    term("NCBC", "Article 338B constitutional commission for backward classes."),
    term("State Election Commission", "Articles 243K and 243ZA authority for local body polls."),
    term("State Finance Commission", "Articles 243I and 243Y body for local fiscal devolution."),
    term("Special Officer for Linguistic Minorities", "Article 350B office for linguistic minority safeguards."),
    term("T.N. Seshan Case", "1995 case upholding multi-member Election Commission structure."),
    term("Institutional Independence", "Autonomy created through tenure, removal protection, powers and finance."),
  ];
}

function bodiesConcise() {
  return [
    term("Constitutional Body", "Institution created directly by the Constitution, such as ECI, CAG or Finance Commission."),
    term("Statutory Body", "Institution created by a law, such as NHRC, SEBI, CVC or Lokpal."),
    term("Regulatory Body", "Authority supervising a sector through licensing, rules and enforcement."),
    term("NHRC", "Statutory human rights body under the Protection of Human Rights Act, 1993."),
    term("CIC", "Central Information Commission under the RTI Act, 2005."),
    term("Lokpal", "Anti-corruption ombudsman under the Lokpal and Lokayuktas Act, 2013."),
    term("CVC", "Statutory vigilance body under the CVC Act, 2003."),
    term("SEBI", "Securities market regulator under the SEBI Act, 1992."),
    term("NGT", "Environmental tribunal created under the NGT Act, 2010."),
    term("Accountability", "Requirement that public bodies justify actions and face review."),
    term("Autonomy", "Operational independence from improper executive or political control."),
    term("Enforcement Power", "Legal capacity to issue binding orders or penalties."),
  ];
}

function executiveConcise() {
  return [
    term("President", "Constitutional head of the Union executive under Article 52."),
    term("Prime Minister", "Head of the Council of Ministers and real executive authority in parliamentary government."),
    term("Article 74", "Requires a Council of Ministers to aid and advise the President."),
    term("Article 75", "Deals with appointment, tenure and collective responsibility of Union ministers."),
    term("Governor", "Constitutional head of a State under Article 153."),
    term("Article 163", "Provides for Council of Ministers to aid and advise the Governor."),
    term("Attorney General", "Highest law officer of India under Article 76."),
    term("Tribunals", "Specialised adjudicatory bodies under Articles 323A and 323B."),
    term("L. Chandra Kumar", "1997 case preserving High Court and Supreme Court judicial review over tribunals."),
    term("Collective Responsibility", "Council of Ministers is collectively responsible to Lok Sabha."),
    term("Separation of Judiciary", "Article 50 directive to separate judiciary from executive."),
    term("Civil Services", "Permanent executive providing continuity and implementation capacity."),
  ];
}

function federalismConcise() {
  return [
    term("Article 246", "Distributes legislative power between Union and States through the Seventh Schedule."),
    term("Seventh Schedule", "Contains Union, State and Concurrent Lists."),
    term("Article 248", "Gives residuary legislative power to Parliament."),
    term("Article 263", "Provides for Inter-State Council."),
    term("Article 280", "Provides for Finance Commission."),
    term("Article 356", "President's Rule provision for failure of constitutional machinery in a State."),
    term("GST Council", "Article 279A federal body recommending GST matters."),
    term("S.R. Bommai", "1994 case limiting misuse of President's Rule and strengthening federalism."),
    term("Cooperative Federalism", "Union-State collaboration for shared governance outcomes."),
    term("Competitive Federalism", "States competing on investment, governance and performance indicators."),
    term("Fiscal Federalism", "Distribution of taxing and spending powers across levels of government."),
    term("State Finance Commission", "Body recommending fiscal devolution to local bodies."),
  ];
}

function parliamentConcise() {
  return [
    term("Article 79", "Constitutes Parliament as President, Lok Sabha and Rajya Sabha."),
    term("Lok Sabha", "Directly elected House of the People."),
    term("Rajya Sabha", "Council of States representing States and Union territories."),
    term("Article 110", "Defines Money Bill."),
    term("Speaker", "Presiding officer of Lok Sabha with procedural and certification powers."),
    term("Question Hour", "Parliamentary device for executive accountability through questions."),
    term("Zero Hour", "Indian parliamentary practice for raising urgent matters."),
    term("Department-related Standing Committees", "Committees that examine bills, demands for grants and policy matters."),
    term("Anti-defection Law", "Tenth Schedule mechanism against party switching."),
    term("Kihoto Hollohan", "1992 case upholding anti-defection law with judicial review."),
    term("Parliamentary Privileges", "Special rights enabling Parliament to function independently."),
    term("Joint Sitting", "Article 108 mechanism to resolve deadlock between Houses except Money and Constitution Amendment Bills."),
  ];
}

function socialJusticeConcise(key) {
  if (key.includes("education")) {
    return [
      term("Article 21A", "Fundamental Right to free and compulsory education for children aged 6 to 14."),
      term("RTE Act 2009", "Law operationalising Article 21A and neighbourhood schooling norms."),
      term("Samagra Shiksha", "Integrated school education scheme from pre-school to senior secondary level."),
      term("PM SHRI", "Scheme for model schools aligned with NEP 2020."),
      term("NEP 2020", "Policy framework emphasising foundational literacy, flexibility and multidisciplinary learning."),
      term("Foundational Literacy", "Basic reading, writing and numeracy skills in early grades."),
      term("Gross Enrolment Ratio", "Enrolment in a level as a share of eligible age population."),
      term("Learning Outcomes", "Measurable competencies students are expected to acquire."),
      term("Digital Divide", "Unequal access to devices, connectivity and digital skills."),
      term("Mid-Day Meal", "School nutrition scheme now linked with PM POSHAN."),
    ];
  }
  if (key.includes("health")) {
    return [
      term("Article 21", "Right to life basis for health and dignity jurisprudence."),
      term("Ayushman Bharat", "Umbrella health initiative including Health and Wellness Centres and PM-JAY."),
      term("PM-JAY", "Health assurance scheme for vulnerable families under Ayushman Bharat."),
      term("National Health Mission", "Programme strengthening rural and urban public health systems."),
      term("Primary Health Care", "First-contact essential health services close to communities."),
      term("Universal Health Coverage", "Access to needed health services without financial hardship."),
      term("Out-of-pocket Expenditure", "Direct health spending by households at point of care."),
      term("ICMR", "Indian Council of Medical Research for biomedical research."),
      term("National Medical Commission", "Regulator for medical education and profession."),
      term("Poshan Abhiyaan", "Mission addressing malnutrition through convergence and monitoring."),
    ];
  }
  if (key.includes("poverty") || key.includes("hunger")) {
    return [
      term("National Food Security Act 2013", "Law providing subsidised foodgrains to eligible households."),
      term("PDS", "Public Distribution System supplying foodgrains through fair price shops."),
      term("Antyodaya Anna Yojana", "Food security category for the poorest households."),
      term("MGNREGA", "2005 law guaranteeing rural wage employment and social audit."),
      term("Multidimensional Poverty", "Poverty measure including health, education and living standards."),
      term("DBT", "Direct Benefit Transfer mechanism sending benefits to bank accounts."),
      term("JAM Trinity", "Jan Dhan, Aadhaar and mobile linkage for welfare delivery."),
      term("POSHAN Tracker", "Digital monitoring platform for nutrition services."),
      term("Social Audit", "Community verification of scheme implementation and expenditure."),
      term("Exclusion Error", "Eligible beneficiary left out of a welfare programme."),
    ];
  }
  if (key.includes("vulnerable")) {
    return [
      term("SC/ST PoA Act 1989", "Law preventing atrocities against Scheduled Castes and Scheduled Tribes."),
      term("Rights of Persons with Disabilities Act 2016", "Law recognising disability rights and benchmark disability provisions."),
      term("Transgender Persons Act 2019", "Law for recognition and welfare of transgender persons."),
      term("Senior Citizens Act 2007", "Law for maintenance and welfare of parents and senior citizens."),
      term("NALSA Case", "2014 Supreme Court judgment recognising transgender identity and dignity."),
      term("Vishaka Guidelines", "1997 Supreme Court guidelines against workplace sexual harassment."),
      term("Protective Discrimination", "Constitutional measures for disadvantaged groups."),
      term("Article 15(4)", "Provision enabling special measures for socially and educationally backward classes."),
      term("Article 46", "Directive Principle for educational and economic interests of weaker sections."),
      term("Intersectionality", "Overlapping disadvantages such as caste, gender, disability and poverty."),
    ];
  }
  return [
    term("Social Justice", "Fair distribution of rights, opportunities and resources to reduce structural disadvantage."),
    term("Article 14", "Equality before law and equal protection of laws."),
    term("Article 15", "Prohibits discrimination and enables special provisions for disadvantaged groups."),
    term("Article 16", "Equality of opportunity in public employment."),
    term("Article 21", "Life and dignity basis for welfare jurisprudence."),
    term("Directive Principles", "Part IV principles guiding welfare state policy."),
    term("Affirmative Action", "Positive measures for historically disadvantaged groups."),
    term("Inclusive Growth", "Growth process whose benefits reach vulnerable sections."),
    term("Targeting", "Identification of intended beneficiaries for welfare delivery."),
    term("Convergence", "Coordination of multiple schemes and departments for outcomes."),
    term("Grievance Redress", "Institutional process for citizens to complain and receive remedy."),
    term("Social Audit", "Public verification of scheme records and delivery."),
  ];
}

function geographyConcise(key) {
  if (key.includes("climatology")) {
    return [
      term("Climate", "Long-term average pattern of weather conditions over a region."),
      term("Weather", "Short-term atmospheric condition at a place and time."),
      term("ITCZ", "Low-pressure belt near the equator that shifts seasonally with the sun."),
      term("Monsoon", "Seasonal reversal of winds driven by land-sea thermal contrast and pressure shifts."),
      term("Jet Stream", "Fast upper-air wind influencing monsoon and western disturbances."),
      term("El Nino", "Warming of central-eastern equatorial Pacific affecting global circulation."),
      term("La Nina", "Cooling of central-eastern equatorial Pacific, often linked with stronger Indian monsoon probability."),
      term("Indian Ocean Dipole", "Sea-surface temperature contrast between western and eastern Indian Ocean."),
      term("Western Disturbance", "Extra-tropical system bringing winter precipitation to northwest India."),
      term("Orographic Rainfall", "Rain caused when moist air rises over relief barriers."),
    ];
  }
  if (key.includes("geomorphology")) {
    return [
      term("Geomorphology", "Study of landforms and processes shaping the earth's surface."),
      term("Weathering", "In-situ breakdown of rocks by physical, chemical or biological processes."),
      term("Erosion", "Removal and transport of material by water, wind, ice, waves or gravity."),
      term("Fold Mountain", "Mountain formed by compression and folding of rock strata."),
      term("Block Mountain", "Mountain formed by faulting and vertical displacement."),
      term("Rift Valley", "Linear valley formed by subsidence between faults."),
      term("Alluvial Fan", "Fan-shaped deposit where a stream exits a steep slope."),
      term("Delta", "Depositional landform at a river mouth with distributaries."),
      term("Peneplain", "Low-relief surface produced by long-term erosion."),
      term("Plate Tectonics", "Theory explaining lithospheric plate movement and landform creation."),
    ];
  }
  if (key.includes("oceanography")) {
    return [
      term("Oceanography", "Study of oceans, currents, waves, tides, salinity and marine processes."),
      term("Wave", "Wind-generated oscillation of sea surface water."),
      term("Tide", "Periodic sea-level rise and fall due to Moon and Sun gravity."),
      term("Ocean Current", "Large-scale horizontal flow of ocean water."),
      term("Thermohaline Circulation", "Deep-ocean circulation driven by temperature and salinity differences."),
      term("Upwelling", "Rise of cold nutrient-rich water to the surface."),
      term("Coral Reef", "Calcium carbonate ecosystem built by coral polyps in warm shallow seas."),
      term("Exclusive Economic Zone", "Maritime zone up to 200 nautical miles for resource rights."),
      term("Spring Tide", "High tidal range during Sun-Moon-Earth alignment."),
      term("Neap Tide", "Low tidal range when Sun and Moon act at right angles."),
    ];
  }
  if (key.includes("biogeography")) {
    return [
      term("Biogeography", "Study of spatial distribution of species, ecosystems and biomes."),
      term("Biome", "Large ecological region such as desert, savanna or rainforest."),
      term("Habitat", "Immediate living place of an organism."),
      term("Ecotone", "Transition zone between two ecosystems with high edge diversity."),
      term("Endemism", "Species restricted to a particular geographic area."),
      term("Biodiversity Hotspot", "High-endemism region facing high habitat loss."),
      term("Biosphere Reserve", "Conservation area with core, buffer and transition zones."),
      term("Mangrove", "Salt-tolerant coastal forest with adaptations such as pneumatophores."),
      term("Invasive Species", "Non-native species causing ecological or economic harm."),
      term("Wildlife Corridor", "Habitat linkage enabling species movement and gene flow."),
    ];
  }
  return [
    term("Physiography", "Study of physical divisions and landform regions."),
    term("Himalayas", "Young fold mountains formed by Indian-Eurasian plate collision."),
    term("Northern Plains", "Alluvial plains formed by Indus, Ganga and Brahmaputra systems."),
    term("Peninsular Plateau", "Old stable shield region rich in minerals."),
    term("Western Ghats", "Escarpment causing heavy orographic rainfall on west coast."),
    term("Rain Shadow", "Dry leeward region after moist air loses rainfall on windward slope."),
    term("Black Soil", "Basalt-derived soil with high moisture retention, suited to cotton."),
    term("Chotanagpur Plateau", "Major mineral belt with coal and iron ore resources."),
    term("Urban Flooding", "Flooding intensified by drainage failure and impervious surfaces."),
    term("Regional Planning", "Location-specific planning based on terrain, resources and risk."),
  ];
}

function accountabilityConcise() {
  return [
    term("Accountability", "Obligation of public authority to explain decisions and face review or consequences."),
    term("Transparency", "Public access to information about decisions, funds and processes."),
    term("Answerability", "Duty to give reasons for official action."),
    term("Enforcement", "Capacity to impose correction, penalty or remedy after wrongdoing."),
    term("RTI Act 2005", "Law enabling citizens to seek information from public authorities."),
    term("Social Audit", "Community verification of official records and delivery outcomes."),
    term("CAG", "Article 148 constitutional auditor of Union and State accounts."),
    term("CVC", "Statutory vigilance body supervising anti-corruption vigilance."),
    term("Lokpal", "Ombudsman under Lokpal and Lokayuktas Act, 2013."),
    term("Citizen Charter", "Public service commitment listing standards, timelines and grievance channels."),
    term("Conflict of Interest", "Situation where private interest can improperly influence public duty."),
    term("Whistle-blowing", "Disclosure of wrongdoing by an insider in public interest."),
  ];
}

function buildRevisionBullets(topic) {
  const key = String(topic.key ?? "").toLowerCase();
  if (key.includes("local_bodies")) {
    return [
      "73rd Amendment created Part IX for Panchayats.",
      "74th Amendment created Part IXA for Municipalities.",
      "Article 243A deals with Gram Sabha.",
      "Article 243G relates to Panchayat powers.",
      "Article 243W relates to Municipal powers.",
      "Eleventh Schedule lists 29 Panchayat subjects.",
      "Twelfth Schedule lists 18 Municipal subjects.",
      "Articles 243K and 243ZA cover local elections.",
      "State Finance Commissions recommend local fiscal devolution.",
      "Kishansing Tomar case protects timely local elections.",
    ];
  }
  if (key.includes("geography")) {
    return [
      "Weather is short-term; climate is long-term average.",
      "Weathering occurs in situ; erosion transports material.",
      "Western Ghats cause orographic rainfall.",
      "Bay of Bengal is highly cyclone-prone.",
      "Black soil is linked with Deccan basalt.",
      "Chotanagpur Plateau is a major mineral belt.",
      "Sundarbans are mangrove-dominated deltaic wetlands.",
      "Himalayas are young fold mountains.",
      "Positive IOD can support Indian monsoon rainfall.",
      "Biosphere reserves have core, buffer and transition zones.",
    ];
  }
  return [
    "Article 14 provides equality before law.",
    "Article 21 protects life and personal liberty.",
    "Directive Principles guide welfare state policy.",
    "RTI Act was enacted in 2005.",
    "MGNREGA was enacted in 2005.",
    "NFSA was enacted in 2013.",
    "Lokpal Act was enacted in 2013.",
    "CAG is provided under Article 148.",
    "Finance Commission is provided under Article 280.",
    "Social audit improves last-mile accountability.",
  ];
}

function buildSubjectCleanFullNotes(topic) {
  const key = String(topic.key ?? "").toLowerCase();
  const title = String(topic.title ?? "").replace(/\s+/g, " ").trim();
  if (key.includes("local_bodies")) {
    return `## ${title}

### Core Meaning
${title} belongs to the constitutional scheme of democratic decentralisation. Local bodies are elected institutions meant to bring government closer to citizens, plan local development and deliver basic services. Panchayats operate in rural areas under Part IX of the Constitution, while Municipalities operate in urban areas under Part IXA. The subject is not about Parliament's amendment power or President's Rule; it is about local democracy, State legislation, fiscal devolution and citizen participation.

### Constitutional Provisions
The 73rd Constitutional Amendment, 1992 inserted Part IX for Panchayats. The 74th Constitutional Amendment, 1992 inserted Part IXA for Municipalities. Article 243A deals with Gram Sabha. Article 243G allows State legislatures to devolve powers and responsibilities to Panchayats. Article 243W does the same for Municipalities. Articles 243K and 243ZA deal with State Election Commissions. Articles 243I and 243Y provide for State Finance Commissions. The Eleventh Schedule lists 29 Panchayat subjects and the Twelfth Schedule lists 18 Municipal subjects.

### Institutions and Committees
Balwant Rai Mehta Committee recommended democratic decentralisation and a three-tier Panchayati Raj system. Ashok Mehta Committee emphasised district-level planning and stronger political participation. L.M. Singhvi Committee recommended constitutional recognition and Gram Sabha as the foundation of local democracy. Finance Commissions repeatedly highlight weak local finances, delayed State Finance Commissions and dependence on tied grants.

### Current Governance Issues
The main challenges are weak own-source revenue, limited staff control, delayed elections, low Gram Sabha participation, property tax weakness, parastatal overlap in cities and inadequate planning capacity. Real decentralisation requires functions, funds and functionaries. Kishansing Tomar v Municipal Corporation of Ahmedabad, 2006 held that timely local elections are constitutionally important. K. Krishna Murthy, 2010 clarified reservation principles in local bodies. The exam angle is to evaluate whether constitutional status has translated into effective local self-government.`;
  }
  return `## ${title}

### Core Meaning
${title} is a GS1 Geography topic and must be understood through physical processes, spatial distribution and India-specific examples. It should not contain polity facts such as Article 32, Article 226 or Finance Commission unless the question is explicitly about governance. The core task is to define the concept, locate it on a map where possible, explain the process and connect it with agriculture, settlements, resources, disasters or environmental management.

### Geography-Specific Foundation
Geography topics require clarity on landforms, climate, drainage, soils, vegetation, oceans, resources, industries and population patterns. Geomorphology explains landforms through tectonics, weathering, erosion and deposition. Climatology explains weather, climate, monsoon, pressure belts, jet streams, El Nino, La Nina and Indian Ocean Dipole. Oceanography explains waves, tides, currents, salinity, upwelling and coral reefs. Biogeography explains species distribution, biomes, biodiversity hotspots, mangroves and ecological adaptation.

### Indian Examples
India provides strong examples for every geography answer. The Himalayas are young fold mountains with landslide and earthquake risk. The Western Ghats create orographic rainfall and a rain-shadow region in the Deccan. The Bay of Bengal is cyclone-prone because of warm waters and its semi-enclosed shape. The Sundarbans are mangrove wetlands adapted to saline deltaic conditions. The Chotanagpur Plateau explains mineral-based industrial location. Black soil is linked with Deccan basalt and cotton cultivation. The Brahmaputra valley shows floods, erosion and sediment dynamics.

### Exam Use
Prelims tests maps, definitions, processes and exceptions. Mains asks why a process occurs and how it affects people or policy. A good geography answer uses terms accurately: weather differs from climate, weathering differs from erosion, a delta differs from an estuary, and a biosphere reserve differs from a national park. The strongest answers add a small map, a process chain and an India-specific case.

### Common Mistakes
Do not import unrelated polity or economy facts into geography notes. A geography answer should stay with terrain, climate, drainage, soil, vegetation, resources, settlement and spatial planning unless a governance link is directly required. Avoid memorising only place names; explain why the place matters. If the topic is climatology, mention atmospheric circulation. If it is geomorphology, mention landform processes. If it is resources or industries, mention location factors. If it is biogeography, mention habitat, species distribution and ecological adaptation.`;
}

function ensureMinimumFullNotes(value, topic) {
  if (wordCount(value) >= 400) return value;
  const key = String(topic.key ?? "").toLowerCase();
  const title = String(topic.title ?? "this topic").replace(/\s+/g, " ").trim();
  const supplement = key.includes("local_bodies")
    ? `\n\n### Additional Revision Anchors\nFor ${title}, keep the answer grounded in local self-government rather than general constitutional theory. The most useful anchors are Gram Sabha participation, ward committees, district planning committees, metropolitan planning committees, State Election Commission independence, State Finance Commission implementation, property tax reform, untied grants, activity mapping and capacity building of elected representatives. A Prelims question may ask the article, schedule or committee; a Mains question may ask why constitutional status has not produced effective devolution. The answer should therefore connect law, finance, administration and citizen participation.\n\n### Reform Direction\nThe practical reform agenda is predictable: hold elections on time, implement State Finance Commission reports, expand own-source revenue, publish local budgets, professionalise municipal cadres, strengthen Gram Sabha and ward committee oversight, use GIS-based property records, and align parastatal agencies with elected local bodies. These details make the topic concrete and prevent vague decentralisation answers.`
    : `\n\n### Additional Revision Anchors\nFor ${title}, keep the explanation inside geography. Use a process-location-impact chain: identify the physical process, locate the Indian example, explain the impact and mention a planning response. Examples include drainage planning for urban floods, slope management for Himalayan roads, mangrove protection for cyclone buffers, watershed treatment for drought-prone plateaus, crop choice for soil-climate regions and industrial location based on raw material, power, labour, market and transport. This keeps both Prelims and Mains answers spatial, factual and subject-correct.`;
  return `${value}${supplement}`;
}

function buildCasesAndSchemes(topic) {
  const key = String(topic.key ?? "").toLowerCase();
  if (key.includes("accountability")) {
    return {
      cases: [
        { name: "Vineet Narain v Union of India (1997)", point: "Strengthened institutional accountability in investigation and vigilance systems." },
        { name: "Common Cause v Union of India", point: "Used public interest litigation to demand accountability in governance decisions." },
        { name: "2nd Administrative Reforms Commission", point: "Ethics in Governance report recommended transparency, citizen charters and anti-corruption reforms." },
        { name: "Right to Information Movement", point: "Converted citizen demand for records into statutory transparency through RTI Act, 2005." },
      ],
      schemes: [
        { name: "RTI Act, 2005", point: "Gives citizens legal access to information held by public authorities." },
        { name: "Lokpal and Lokayuktas Act, 2013", point: "Creates anti-corruption ombudsman institutions for public functionaries." },
        { name: "Social Audit under MGNREGA", point: "Requires public verification of expenditure and work records." },
        { name: "Central Vigilance Commission Act, 2003", point: "Gives statutory status to the central vigilance institution." },
      ],
    };
  }
  return { cases: [], schemes: [] };
}

function validateNotes(key, notes, issues) {
  if (issues.includes("generic_concise_definition")) {
    if (!Array.isArray(notes.concise_notes) || notes.concise_notes.length < 10) return { ok: false, error: "concise_notes under 10" };
    if (notes.concise_notes.some((row) => isGenericDefinition(row.definition))) return { ok: false, error: "generic concise definition remains" };
  }
  if (issues.includes("possible_wrong_subject_facts")) {
    const text = `${JSON.stringify(notes.concise_notes)} ${JSON.stringify(notes.revision_bullets)}`.toLowerCase();
    if (key.includes("geography") && (text.includes("article 32") || text.includes("finance commission is under article 280"))) {
      return { ok: false, error: "geography wrong-subject fact remains" };
    }
    if (key.includes("local_bodies") && (text.includes("article 368") || text.includes("president's rule"))) {
      return { ok: false, error: "local bodies wrong-subject fact remains" };
    }
  }
  if (issues.includes("too_few_cases_reports")) {
    if (!Array.isArray(notes.cases) || notes.cases.length < 3) return { ok: false, error: "cases under 3" };
    if (!Array.isArray(notes.schemes) || notes.schemes.length < 3) return { ok: false, error: "schemes under 3" };
  }
  if (issues.includes("full_notes_short") && wordCount(notes.full_notes) < 400) return { ok: false, error: "full_notes remains under 400 words" };
  return { ok: true };
}

function term(term, definition) {
  return { term, definition };
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

function isGenericDefinition(value) {
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
