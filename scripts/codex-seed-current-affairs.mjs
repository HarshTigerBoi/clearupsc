import { createClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "./script-env.mjs";

const { url, serviceKey } = requireSupabaseEnv();

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const entries = [
  {
    date: "2026-05-25",
    title: "MoSPI PAIMANA portal tracks 1,981 central infrastructure projects",
    summary:
      "The Ministry of Statistics and Programme Implementation said its PAIMANA platform was tracking 1,981 central sector infrastructure projects worth Rs 42.78 lakh crore as of April 2026. The release highlighted project monitoring across 17 ministries and cumulative expenditure of Rs 20.36 lakh crore.",
    source_url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2264967",
    tags: ["GS3", "Infrastructure", "Governance"],
    upsc_relevance: "Useful for questions on infrastructure monitoring, project delays, public expenditure and data-driven governance.",
    category: "economy",
    source: "MoSPI/PIB",
  },
  {
    date: "2026-05-25",
    title: "MoSPI releases TAC report for IIP base year revision to 2022-23",
    summary:
      "MoSPI released the Technical Advisory Committee report on revising the base year of the All-India Index of Industrial Production from 2011-12 to 2022-23. The committee was constituted in September 2024 under Dr Mridul K. Saggar.",
    source_url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2264966",
    tags: ["GS3", "Economy", "Statistics"],
    upsc_relevance: "Important for inflation, industrial growth and national income statistics questions.",
    category: "economy",
    source: "MoSPI/PIB",
  },
  {
    date: "2026-05-25",
    title: "Consumer Affairs examines standard pack sizes for edible oils",
    summary:
      "The Department of Consumer Affairs held consultations with edible oil industry associations representing around 90 percent of the sector. It examined standard pack sizes under the Legal Metrology framework to improve transparency and price comparison.",
    source_url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2265088",
    tags: ["GS2", "Consumer Protection", "Governance"],
    upsc_relevance: "Connects consumer rights, legal metrology and market transparency.",
    category: "polity",
    source: "Consumer Affairs/PIB",
  },
  {
    date: "2026-05-25",
    title: "CSIR-NIScPR and NIAS sign MoU on science communication and S&T policy",
    summary:
      "CSIR-National Institute of Science Communication and Policy Research signed an MoU with the National Institute of Advanced Studies. The collaboration covers science communication, public engagement, S&T policy research, joint projects and capacity-building.",
    source_url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2265195",
    tags: ["GS3", "Science & Tech", "Policy"],
    upsc_relevance: "Relevant for science communication, evidence-based policy and public understanding of science.",
    category: "science",
    source: "CSIR/PIB",
  },
  {
    date: "2026-05-25",
    title: "Education Ministry seeks States' cooperation for NEET UG re-examination amid heatwave",
    summary:
      "The Union Education Minister wrote to Chief Ministers and administrators seeking safe and fair conduct of the NEET UG re-examination scheduled for 21 June 2026. The letter stressed basic facilities at centres in view of severe heatwave conditions.",
    source_url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2265073",
    tags: ["GS2", "Education", "Governance"],
    upsc_relevance: "Useful for exam governance, cooperative federalism and climate-sensitive public service delivery.",
    category: "polity",
    source: "Ministry of Education/PIB",
  },
  {
    date: "2026-05-24",
    title: "UPSC conducts Civil Services Prelims 2026 with real-time face authentication",
    summary:
      "UPSC conducted Civil Services Preliminary Examination 2026 across 2,072 venues in 83 cities. It introduced technological measures including real-time face authentication and said it would release the provisional answer key soon after the examination.",
    source_url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2264794",
    tags: ["GS2", "Institutions", "Governance"],
    upsc_relevance: "Important for transparency, public recruitment reform and digital governance in constitutional bodies.",
    category: "polity",
    source: "UPSC/PIB",
  },
  {
    date: "2026-05-23",
    title: "19th Rozgar Mela distributes more than 51,000 appointment letters",
    summary:
      "The Prime Minister virtually addressed the 19th Rozgar Mela and distributed more than 51,000 appointment letters across 47 locations. Appointments covered departments including Railways, ISRO, Home Affairs, Health, Financial Services and Higher Education.",
    source_url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2264505",
    tags: ["GS2", "Employment", "Governance"],
    upsc_relevance: "Useful for employment generation, public administration capacity and demographic dividend angles.",
    category: "social",
    source: "PIB",
  },
  {
    date: "2026-05-23",
    title: "DPIIT releases operational guidelines for BHAVYA industrial parks scheme",
    summary:
      "DPIIT released detailed guidelines for BHAVYA, a central sector scheme for 100 investment-ready industrial parks with Rs 33,660 crore outlay. The scheme links integrated industrial infrastructure with Make in India and PM Gati Shakti.",
    source_url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2264533",
    tags: ["GS3", "Industry", "Infrastructure"],
    upsc_relevance: "Relevant for industrial corridors, manufacturing competitiveness and logistics-led growth.",
    category: "economy",
    source: "DPIIT/PIB",
  },
  {
    date: "2026-05-23",
    title: "ICAR-CIFRI marks Biodiversity Day with Lower Ganga river ranching drive",
    summary:
      "ICAR-CIFRI organised a river ranching programme in the Lower Ganga under NMCG Phase-III on International Day for Biological Diversity. The drive aimed to support aquatic biodiversity conservation and sustainable riverine fisheries.",
    source_url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2264449",
    tags: ["GS3", "Environment", "Biodiversity"],
    upsc_relevance: "Connects river restoration, biodiversity conservation, fisheries and Namami Gange.",
    category: "environment",
    source: "ICAR-CIFRI/PIB",
  },
  {
    date: "2026-05-22",
    title: "Agni-1 ballistic missile successfully test-launched from Chandipur",
    summary:
      "Short Range Ballistic Missile Agni-1 was successfully test-launched from the Integrated Test Range at Chandipur, Odisha. The launch validated operational and technical parameters and was carried out under the Strategic Forces Command.",
    source_url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2264317",
    tags: ["GS3", "Defence", "Security"],
    upsc_relevance: "Important for strategic deterrence, missile capability and defence technology.",
    category: "science",
    source: "Ministry of Defence/PIB",
  },
  {
    date: "2026-05-22",
    title: "PM Vishwakarma Scheme set for rollout in West Bengal",
    summary:
      "The Ministry of MSME held discussions with West Bengal officials on implementation of PM Vishwakarma. The State had issued notifications for monitoring and district implementation committees to support traditional artisans and craftspeople.",
    source_url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2264346",
    tags: ["GS2", "MSME", "Welfare"],
    upsc_relevance: "Useful for artisan welfare, skill development, informal economy and scheme implementation.",
    category: "social",
    source: "MSME/PIB",
  },
  {
    date: "2026-05-21",
    title: "India and South Korea inaugurate Indian War Memorial in Seoul",
    summary:
      "The Raksha Mantri and South Korea's Minister of Patriots and Veterans Affairs inaugurated the Indian War Memorial at Imjingak Park, Seoul. It commemorates India's 60 Para Field Ambulance and Custodian Force of India contributions during the Korean War.",
    source_url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2263556",
    tags: ["GS2", "International Relations", "Defence"],
    upsc_relevance: "Useful for India-South Korea relations, historical diplomacy and peacekeeping heritage.",
    category: "international",
    source: "Ministry of Defence/PIB",
  },
  {
    date: "2026-05-21",
    title: "Department of Land Resources and ADB explore land governance cooperation",
    summary:
      "The Department of Land Resources met an Asian Development Bank delegation to discuss land records modernisation, land administration and watershed development. The meeting highlighted digital land governance reforms for Viksit Bharat 2047.",
    source_url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2263740",
    tags: ["GS2", "Land Governance", "Rural Development"],
    upsc_relevance: "Relevant for land records, digital governance, watershed management and rural reform.",
    category: "polity",
    source: "Rural Development/PIB",
  },
  {
    date: "2026-05-20",
    title: "Indian Navy launches NGOPV Sanghmitra at GRSE Kolkata",
    summary:
      "Yard 3039 Sanghmitra, a Next Generation Offshore Patrol Vessel, was launched at GRSE Kolkata. The Navy said 11 NGOPVs are being built at GSL Goa and GRSE Kolkata for surveillance, search and rescue, HADR and anti-piracy missions.",
    source_url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2263508",
    tags: ["GS3", "Defence", "Maritime Security"],
    upsc_relevance: "Important for maritime security, indigenous shipbuilding and Aatmanirbhar Bharat.",
    category: "science",
    source: "Ministry of Defence/PIB",
  },
  {
    date: "2026-05-20",
    title: "Eight core industries index released for April 2026",
    summary:
      "The government released the Index of Eight Core Industries for April 2026 with base year 2011-12. The index tracks coal, crude oil, natural gas, refinery products, fertilizers, steel, cement and electricity.",
    source_url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2263287",
    tags: ["GS3", "Economy", "Industry"],
    upsc_relevance: "A recurring Prelims and economy indicator linked to IIP and infrastructure output.",
    category: "economy",
    source: "DPIIT/PIB",
  },
  {
    date: "2026-05-19",
    title: "CAQM invokes Stage-I GRAP across Delhi-NCR as AQI enters Poor category",
    summary:
      "The Commission for Air Quality Management invoked Stage-I of GRAP across NCR after Delhi's daily average AQI rose to 208. The decision followed CPCB data and forecasts by IMD/IITM that air quality would remain poor.",
    source_url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2262966",
    tags: ["GS3", "Environment", "Air Pollution"],
    upsc_relevance: "Important for air pollution governance, CAQM, CPCB and GRAP stages.",
    category: "environment",
    source: "MoEFCC/PIB",
  },
  {
    date: "2026-05-19",
    title: "Jal Shakti Ministry launches State Water Reforms Framework",
    summary:
      "The 14th High-Powered Review Board meeting of the Brahmaputra Board was held in Guwahati. The Union Jal Shakti Minister launched the State Water Reforms Framework to strengthen water governance reforms across States and Union Territories.",
    source_url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2262787",
    tags: ["GS3", "Water", "Governance"],
    upsc_relevance: "Useful for river basin management, federal water governance and disaster-prone Northeast issues.",
    category: "environment",
    source: "Jal Shakti/PIB",
  },
  {
    date: "2026-05-18",
    title: "Goa completes Phase-I Census 2027 House Listing Operations through mobile app",
    summary:
      "Goa completed Census 2027 Phase-I House Listing Operations from 16 April to 15 May 2026 using a dedicated mobile application. The exercise covered houses, households and amenities across urban and rural areas.",
    source_url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2262198",
    tags: ["GS2", "Census", "Digital Governance"],
    upsc_relevance: "Important for census methodology, digital enumeration and evidence-based policy.",
    category: "polity",
    source: "MHA/PIB",
  },
  {
    date: "2026-05-18",
    title: "DST-supported research develops nano-gold thin films for self-powered sensors",
    summary:
      "Researchers developed ultrathin flexible films with nano-gold that can convert small temperature fluctuations into electrical signals. The technology may support wearable electronics, smart photodetectors and low-grade heat harvesters.",
    source_url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2262288",
    tags: ["GS3", "Science & Tech", "Nanotechnology"],
    upsc_relevance: "Relevant for emerging materials, self-powered devices and applied nanotechnology.",
    category: "science",
    source: "DST/PIB",
  },
  {
    date: "2026-05-17",
    title: "India and Netherlands announce Strategic Partnership Roadmap 2026-2030 outcomes",
    summary:
      "The Prime Minister's Netherlands visit outcomes included a Strategic Partnership Roadmap 2026-2030, migration and mobility MoU, critical minerals cooperation, water cooperation and green hydrogen collaboration. Semiconductor cooperation included an MoU between Tata Electronics and ASML.",
    source_url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2261882",
    tags: ["GS2", "International Relations", "Technology"],
    upsc_relevance: "Useful for India-EU ties, critical minerals, green hydrogen, migration and semiconductor diplomacy.",
    category: "international",
    source: "PMO/PIB",
  },
  {
    date: "2026-05-17",
    title: "First Short Haj flight flagged off from Cochin International Airport",
    summary:
      "The first Short Haj flight under Haj 2026 was flagged off from Kochi. The Short Haj Package allows 10,000 pilgrims a reduced stay of about 20 days compared with the regular 40-45 day duration.",
    source_url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2262009",
    tags: ["GS2", "Minorities", "Welfare"],
    upsc_relevance: "Connects minority welfare administration, service delivery and Indian diaspora mobility.",
    category: "social",
    source: "Minority Affairs/PIB",
  },
  {
    date: "2026-05-15",
    title: "India's total exports estimated at US$80.80 billion in April 2026",
    summary:
      "Commerce Ministry data estimated India's merchandise and services exports at US$80.80 billion in April 2026, up 13.59 percent over April 2025. Merchandise exports rose to US$43.56 billion, driven by petroleum products, electronics, engineering goods and pharmaceuticals.",
    source_url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2261383",
    tags: ["GS3", "Economy", "External Sector"],
    upsc_relevance: "Important for trade data, export composition, electronics exports and balance of payments analysis.",
    category: "economy",
    source: "Commerce Ministry/PIB",
  },
  {
    date: "2026-05-15",
    title: "Hindustan Copper records 95 percent jump in PBT in FY 2025-26",
    summary:
      "Hindustan Copper Limited reported profit before tax of Rs 1,232.73 crore in FY 2025-26, a 95 percent increase over FY 2024-25. The CPSE also reported record revenue from operations and higher profit after tax.",
    source_url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2261552",
    tags: ["GS3", "Minerals", "Economy"],
    upsc_relevance: "Useful for critical minerals, CPSE performance and resource security.",
    category: "economy",
    source: "Ministry of Mines/PIB",
  },
  {
    date: "2026-05-14",
    title: "BIRSA 101 workshop highlights India's indigenous CRISPR therapy for sickle cell disease",
    summary:
      "The Ministry of Tribal Affairs, CSIR and IGIB organised a workshop on BIRSA 101, described as India's first indigenous CRISPR-based gene therapy for sickle cell disease. The event was held under Janjatiya Garima Utsav 2026.",
    source_url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2261232",
    tags: ["GS3", "Biotechnology", "Tribal Health"],
    upsc_relevance: "Connects gene therapy, sickle cell disease, tribal health and biotechnology ethics.",
    category: "science",
    source: "Tribal Affairs/PIB",
  },
  {
    date: "2026-05-14",
    title: "BHASHINI and Ayush Ministry sign MoU for multilingual AYUSH services",
    summary:
      "Digital India BHASHINI Division and the Ministry of Ayush signed an MoU to enable multilingual digital capabilities across the AYUSH ecosystem. The collaboration covers translation APIs, voice technologies and all 22 Eighth Schedule languages.",
    source_url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2261568",
    tags: ["GS2", "Digital Governance", "Health"],
    upsc_relevance: "Relevant for language technology, accessible public services and Digital Public Infrastructure.",
    category: "polity",
    source: "MeitY/PIB",
  },
  {
    date: "2026-05-13",
    title: "Cabinet approves Rs 37,500 crore scheme for coal and lignite gasification",
    summary:
      "The Cabinet approved a scheme to promote surface coal and lignite gasification projects with Rs 37,500 crore outlay. It supports the national target of gasifying 100 million tonnes of coal by 2030 and reducing import dependence in LNG, urea, ammonia and methanol.",
    source_url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2260622",
    tags: ["GS3", "Energy", "Economy"],
    upsc_relevance: "Important for energy security, coal transition, import substitution and green industrial policy debates.",
    category: "economy",
    source: "Ministry of Coal/PIB",
  },
  {
    date: "2026-05-13",
    title: "SAMEER and ISRO's ISTRAC sign MoU for deep space high-power systems",
    summary:
      "SAMEER and ISRO Telemetry, Tracking and Command Network signed an MoU to develop high-power systems using indigenous GaN semiconductor technologies for deep space missions. Such systems amplify tele-command signals before transmission to satellites.",
    source_url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2260773",
    tags: ["GS3", "Space", "Semiconductors"],
    upsc_relevance: "Relevant for deep-space missions, strategic electronics and indigenous semiconductor capability.",
    category: "science",
    source: "MeitY/PIB",
  },
  {
    date: "2026-05-09",
    title: "India tests Advanced Agni missile with MIRV system",
    summary:
      "India conducted a successful flight trial of an Advanced Agni missile with Multiple Independently Targeted Re-Entry Vehicle system from Dr APJ Abdul Kalam Island. Telemetry confirmed that mission objectives were met across multiple spatially distributed targets.",
    source_url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2259380",
    tags: ["GS3", "Defence", "Strategic Technology"],
    upsc_relevance: "Important for nuclear deterrence, MIRV technology and India's strategic capability.",
    category: "science",
    source: "Ministry of Defence/PIB",
  },
  {
    date: "2026-05-08",
    title: "DRDO and IAF conduct maiden flight trial of TARA glide weapon",
    summary:
      "DRDO and the Indian Air Force conducted the maiden flight trial of Tactical Advanced Range Augmentation off Odisha. TARA is an indigenous modular range extension kit that converts unguided warheads into precision guided weapons.",
    source_url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2258934",
    tags: ["GS3", "Defence", "Technology"],
    upsc_relevance: "Useful for precision-guided munitions, DRDO systems and defence indigenisation.",
    category: "science",
    source: "Ministry of Defence/PIB",
  },
  {
    date: "2026-05-08",
    title: "Sikkim signs MoU with NIELIT Gangtok for AI Centre of Excellence",
    summary:
      "Sikkim's Department of Information Technology and NIELIT Gangtok signed an MoU to establish an AI Centre of Excellence under the IndiaAI Mission. The centre will support skilling, training, start-ups and AI adoption across sectors.",
    source_url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2259139",
    tags: ["GS3", "AI", "Digital India"],
    upsc_relevance: "Connects IndiaAI Mission, state capacity-building and emerging technology governance.",
    category: "science",
    source: "MeitY/PIB",
  },
  {
    date: "2026-05-07",
    title: "ESIC launches free annual health check-up for insured persons above 40",
    summary:
      "The Labour Ministry launched free annual health check-ups for insured persons above 40 years under ESIC. The programme was linked to the Labour Codes notified in November 2025 and launched simultaneously at 12 locations.",
    source_url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2258702",
    tags: ["GS2", "Labour", "Health"],
    upsc_relevance: "Relevant for labour welfare, social security, preventive healthcare and Labour Codes.",
    category: "social",
    source: "Labour Ministry/PIB",
  },
  {
    date: "2026-05-05",
    title: "Cabinet approves Mission for Cotton Productivity with Rs 5,659.22 crore outlay",
    summary:
      "The Cabinet approved Mission for Cotton Productivity for 2026-27 to 2030-31 with Rs 5,659.22 crore outlay. The mission aims to improve cotton productivity, quality and export competitiveness under the 5F vision.",
    source_url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2258111",
    tags: ["GS3", "Agriculture", "Textiles"],
    upsc_relevance: "Important for agriculture productivity, textile value chain and farmer-industry linkage.",
    category: "economy",
    source: "Cabinet/PIB",
  },
  {
    date: "2026-05-05",
    title: "Cabinet approves ECLGS 5.0 for additional credit during West Asia crisis",
    summary:
      "The Cabinet approved Emergency Credit Line Guarantee Scheme 5.0 to provide credit guarantee coverage through NCGTC. The scheme targets additional credit flow of Rs 2.55 lakh crore, including Rs 5,000 crore for airlines.",
    source_url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2258114",
    tags: ["GS3", "MSME", "Credit"],
    upsc_relevance: "Useful for credit guarantee mechanisms, MSME liquidity and geopolitical shock response.",
    category: "economy",
    source: "Cabinet/PIB",
  },
  {
    date: "2026-05-05",
    title: "Cabinet approves two semiconductor projects under India Semiconductor Mission",
    summary:
      "The Cabinet approved two semiconductor manufacturing projects with cumulative investment of more than Rs 3,900 crore. The projects include a GaN-based Mini/Micro-LED display facility and a semiconductor packaging facility in Gujarat.",
    source_url: "https://www.pib.gov.in/PressReleaseIframePage.aspx?PRID=2258119",
    tags: ["GS3", "Semiconductors", "Manufacturing"],
    upsc_relevance: "Important for India Semiconductor Mission, electronics manufacturing and strategic supply chains.",
    category: "science",
    source: "MeitY/PIB",
  },
  {
    date: "2026-05-04",
    title: "CAQM revokes Stage-I GRAP in NCR after improvement in Delhi AQI",
    summary:
      "CAQM revoked Stage-I GRAP across NCR after Delhi's daily average AQI improved to 88 on 4 May 2026 due to rain and favourable meteorological conditions. Stage-I had earlier been invoked when AQI showed an increasing trend.",
    source_url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2257914",
    tags: ["GS3", "Environment", "Air Pollution"],
    upsc_relevance: "Useful for understanding dynamic air-quality management and GRAP triggers.",
    category: "environment",
    source: "MoEFCC/PIB",
  },
  {
    date: "2026-05-04",
    title: "Bullet train project launches five heavy portal beams over railway tracks in Ahmedabad",
    summary:
      "All five heavy precast-prestressed portal beams were launched over active railway tracks for the Mumbai-Ahmedabad Bullet Train project within 22 days. The heaviest beam weighed about 1,360 MT.",
    source_url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2257831",
    tags: ["GS3", "Infrastructure", "Railways"],
    upsc_relevance: "Relevant for high-speed rail, project execution and transport infrastructure.",
    category: "economy",
    source: "Railways/PIB",
  },
  {
    date: "2026-05-02",
    title: "Raksha Mantri highlights Operation Sindoor as decisive counter-terror action",
    summary:
      "The Raksha Mantri paid tribute to the armed forces at a Shaurya event in New Delhi ahead of the first anniversary of Operation Sindoor. He described the operation as a golden chapter in India's military history and linked it to decisive action against terrorism.",
    source_url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2257574",
    tags: ["GS3", "Security", "Defence"],
    upsc_relevance: "Useful for internal security, counter-terror doctrine and civil-military preparedness.",
    category: "international",
    source: "Ministry of Defence/PIB",
  },
];

if (entries.length < 30) {
  console.error(`Need at least 30 current affairs entries; found ${entries.length}.`);
  process.exit(1);
}

async function upsertEntries(rows) {
  return supabase.from("current_affairs").upsert(rows, { onConflict: "date,title" }).select("id,title,date");
}

let { data, error } = await upsertEntries(entries);

if (error?.code === "PGRST204" && /category|source/.test(error.message)) {
  console.warn("Live current_affairs table is missing category/source columns. Retrying with compatible columns only.");
  const compatibleEntries = entries.map(({ category: _category, source: _source, ...entry }) => entry);
  ({ data, error } = await upsertEntries(compatibleEntries));
}

if (error) {
  console.error(error);
  process.exit(1);
}

const legacyCategoryPatches = [
  {
    title: "Heat action plans and urban governance",
    category: "environment",
    source: "ClearUPSC Current Affairs",
  },
  {
    title: "Semiconductor manufacturing incentives",
    category: "science",
    source: "ClearUPSC Current Affairs",
  },
  {
    title: "Wetland restoration and flood buffering",
    category: "environment",
    source: "ClearUPSC Current Affairs",
  },
];

let legacyUpdated = 0;
for (const patch of legacyCategoryPatches) {
  const { data: patchedRows, error: patchError } = await supabase
    .from("current_affairs")
    .update({ category: patch.category, source: patch.source })
    .eq("title", patch.title)
    .select("id");

  if (patchError) {
    console.error(patchError);
    process.exit(1);
  }
  legacyUpdated += patchedRows?.length ?? 0;
}

console.log(`Seeded ${data?.length ?? entries.length} current affairs entries.`);
console.log(`Updated ${legacyUpdated} legacy current affairs rows with category/source.`);
