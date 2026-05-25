import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const BATCH_SIZE = 30;

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
  csat_comprehension: {
    concise: [
      ["CSAT Paper II", "UPSC Prelims qualifying paper of 200 marks; minimum qualifying marks are 33 percent."],
      ["Comprehension", "Ability to identify stated meaning, implied meaning, tone and central argument from a passage."],
      ["Main Idea", "The central claim around which all sentences in a passage are organised."],
      ["Inference", "A conclusion that follows logically from the passage without adding outside facts."],
      ["Assumption", "An unstated premise necessary for the author's argument to stand."],
      ["Tone", "The author's attitude, such as critical, neutral, optimistic, concerned or analytical."],
      ["Extreme Option", "Option using words like only, always, never or completely without passage support."],
      ["One-third Negative Marking", "Penalty applied for wrong answers in UPSC objective papers."],
      ["Article 320", "Constitutional provision connected with UPSC functions, including examinations."],
      ["Evidence Rule", "Correct option must be directly stated or necessarily implied in the passage."],
    ],
    bullets: [
      "CSAT Paper II carries 200 marks.",
      "CSAT has 80 questions in UPSC Prelims.",
      "Minimum qualifying standard is 33 percent.",
      "Wrong answers carry one-third negative marking.",
      "Main idea is broader than supporting examples.",
      "Inference must not add outside information.",
      "Assumption must be necessary, not merely possible.",
      "Tone questions test author's attitude.",
      "Extreme words often make options incorrect.",
      "Article 320 covers PSC examination functions.",
    ],
  },
  csat_numeracy: {
    concise: [
      ["Percentage", "A fraction expressed per hundred; 25 percent means 25 out of 100."],
      ["Ratio", "Comparison of two quantities by division, written as a:b."],
      ["Average", "Sum of observations divided by number of observations."],
      ["Speed", "Distance divided by time; common unit conversion is 5/18 from km/h to m/s."],
      ["Time And Work", "If A finishes work in x days, one-day work is 1/x."],
      ["LCM", "Least common multiple, used for cycles, bells and repeated events."],
      ["HCF", "Highest common factor, used for largest equal grouping or measurement."],
      ["Simple Interest", "Interest calculated as P x R x T divided by 100."],
      ["Compound Interest", "Interest calculated on principal plus accumulated interest."],
      ["Data Interpretation", "Reading tables, graphs and charts using percentage, ratio and averages."],
    ],
    bullets: [
      "km/h to m/s conversion factor is 5/18.",
      "m/s to km/h conversion factor is 18/5.",
      "Average equals total divided by number of items.",
      "One-day work of x-day worker is 1/x.",
      "Successive 10 percent increases give 21 percent total increase.",
      "Ratio a:b means a divided by b.",
      "Percentage means per hundred.",
      "Simple Interest formula is PRT/100.",
      "LCM handles repeated cycles.",
      "HCF handles maximum equal division.",
    ],
  },
  csat_reasoning: {
    concise: [
      ["Syllogism", "Deductive reasoning using statements and conclusions, often represented by Venn diagrams."],
      ["Blood Relation", "Family relationship puzzle based on generation, gender and lineage links."],
      ["Direction Sense", "Reasoning based on north, south, east, west and turns."],
      ["Coding-Decoding", "Pattern-based transformation of letters, numbers or words."],
      ["Seating Arrangement", "Ordering people or objects in linear, circular or rectangular positions."],
      ["Puzzle", "Multi-condition reasoning problem solved by tabulation or elimination."],
      ["Statement-Conclusion", "Question type testing what follows definitely from given statements."],
      ["Decision Making", "CSAT area testing administrative judgement, ethics and practical problem solving."],
      ["Calendar Reasoning", "Use of odd days to identify days and dates."],
      ["Venn Diagram", "Diagram showing logical relations between classes or sets."],
    ],
    bullets: [
      "Syllogism conclusions must follow from statements only.",
      "Direction questions assume north at top unless stated otherwise.",
      "Blood relation puzzles require generation mapping.",
      "Circular seating distinguishes facing centre and facing outside.",
      "Coding questions often use alphabet position values.",
      "Decision-making questions usually have no negative marking in older CSAT pattern.",
      "Venn diagrams reduce syllogism ambiguity.",
      "Puzzle grids track fixed and negative conditions.",
      "Left-right changes when a person faces south.",
      "Statement-conclusion answers reject possibilities not definitely true.",
    ],
  },
  essay: {
    concise: [
      ["Essay Paper", "UPSC Mains paper carrying 250 marks, normally requiring two essays."],
      ["Thesis", "Central argument or controlling idea of an essay."],
      ["Preamble", "Constitutional value source for justice, liberty, equality and fraternity."],
      ["Constitutional Morality", "Respect for constitutional values beyond majoritarian preference."],
      ["Multidimensional Analysis", "Coverage across social, economic, political, ethical, historical and global dimensions."],
      ["Dialectical Structure", "Essay structure that weighs argument, counterargument and synthesis."],
      ["Gandhian Talisman", "Ethical test asking whether action helps the poorest and weakest person."],
      ["Rawls' Justice", "Theory stressing fairness, equal basic liberties and benefit to the least advantaged."],
      ["Amartya Sen Capability Approach", "Development view focused on expanding real freedoms and capabilities."],
      ["Conclusion", "Final synthesis linking arguments to constitutional and humane way forward."],
    ],
    bullets: [
      "Essay paper carries 250 marks in UPSC Mains.",
      "Candidates generally write two essays.",
      "Preamble gives justice, liberty, equality and fraternity.",
      "42nd Amendment added socialist, secular and integrity.",
      "Gandhi stressed purity of means and ends.",
      "Ambedkar stressed constitutional morality.",
      "Rawls' difference principle protects the least advantaged.",
      "Amartya Sen links development with capability expansion.",
      "Examples should support thesis, not replace analysis.",
      "Balanced essays examine counterarguments.",
    ],
  },
  history_ancient: {
    concise: [
      ["Indus Valley Civilization", "Bronze Age urban civilization, c. 2600-1900 BCE, known for Harappa and Mohenjo-daro."],
      ["Great Bath", "Large ritual bathing structure discovered at Mohenjo-daro."],
      ["Rigveda", "Oldest Veda; composed in early Vedic period."],
      ["Mahajanapadas", "Sixteen major states of north India around 6th century BCE."],
      ["Buddhism", "Religion founded by Gautama Buddha; Four Noble Truths and Eightfold Path are core teachings."],
      ["Jainism", "Religion associated with Mahavira, the 24th Tirthankara; stresses ahimsa and aparigraha."],
      ["Mauryan Empire", "Empire founded by Chandragupta Maurya; Ashoka issued edicts after Kalinga War."],
      ["Arthashastra", "Treatise associated with Kautilya on statecraft, economy and administration."],
      ["Gupta Period", "Often called classical age; noted for literature, science, art and temple beginnings."],
      ["Sangam Literature", "Early Tamil corpus describing polity, economy and society of ancient south India."],
    ],
    bullets: [
      "Mature Harappan phase is c. 2600-1900 BCE.",
      "Mohenjo-daro is associated with the Great Bath.",
      "Rigveda is the oldest Veda.",
      "Buddha gave the Four Noble Truths.",
      "Mahavira was the 24th Tirthankara.",
      "Ashoka's Kalinga War occurred around 261 BCE.",
      "Arthashastra is associated with Kautilya.",
      "Allahabad Prashasti praises Samudragupta.",
      "Aryabhata wrote Aryabhatiya in 499 CE.",
      "Sangam texts mention Chera, Chola and Pandya polities.",
    ],
  },
  history_medieval: {
    concise: [
      ["Delhi Sultanate", "Series of Turkish-Afghan dynasties ruling Delhi from 1206 to 1526."],
      ["Iqta System", "Revenue assignment system used by Delhi Sultans to pay officials and soldiers."],
      ["Alauddin Khalji", "Sultan known for market control, price regulation and military campaigns."],
      ["Vijayanagara Empire", "South Indian empire founded in 1336 by Harihara and Bukka."],
      ["Bhakti Movement", "Devotional movement stressing personal devotion and often challenging ritual hierarchy."],
      ["Sufi Silsila", "Spiritual order in Islam; Chishti and Suhrawardi orders were influential in India."],
      ["Mughal Empire", "Empire founded by Babur after First Battle of Panipat in 1526."],
      ["Mansabdari System", "Mughal rank system combining civil and military obligations."],
      ["Akbar", "Mughal emperor known for mansabdari, sulh-i-kul and religious debates."],
      ["Marathas", "Power founded by Shivaji; known for guerrilla warfare and chauth-sardeshmukhi claims."],
    ],
    bullets: [
      "Delhi Sultanate began in 1206.",
      "First Battle of Panipat was fought in 1526.",
      "Vijayanagara was founded in 1336.",
      "Talikota battle was fought in 1565.",
      "Akbar ruled from 1556 to 1605.",
      "Mansabdari combined rank and military obligation.",
      "Chishti order spread widely in north India.",
      "Kabir criticised empty ritualism.",
      "Guru Nanak founded Sikhism in 15th-16th century.",
      "Shivaji was crowned in 1674.",
    ],
  },
  history_modern: {
    concise: [
      ["Regulating Act 1773", "First major British parliamentary control over East India Company administration."],
      ["Permanent Settlement 1793", "Cornwallis settlement making zamindars revenue collectors and landholders in Bengal."],
      ["Revolt of 1857", "Major anti-colonial uprising beginning at Meerut and spreading across north India."],
      ["Indian National Congress", "Founded in 1885; platform for early nationalist politics."],
      ["Swadeshi Movement", "Movement after Bengal Partition 1905 promoting boycott and indigenous goods."],
      ["Home Rule Movement", "Movement led by Tilak and Annie Besant in 1916 for self-government."],
      ["Non-Cooperation Movement", "Gandhian mass movement launched in 1920 after Rowlatt, Jallianwala and Khilafat issues."],
      ["Civil Disobedience Movement", "Movement launched with Dandi March in 1930 against salt tax."],
      ["Quit India Movement", "Mass movement launched on 8 August 1942 demanding British withdrawal."],
      ["Cabinet Mission Plan", "1946 plan proposing Constituent Assembly and federation before transfer of power."],
    ],
    bullets: [
      "Indian National Congress was founded in 1885.",
      "Bengal was partitioned in 1905.",
      "Morley-Minto reforms came in 1909.",
      "Home Rule Leagues began in 1916.",
      "Jallianwala Bagh massacre occurred in 1919.",
      "Non-Cooperation Movement started in 1920.",
      "Dandi March began on 12 March 1930.",
      "Government of India Act 1935 proposed provincial autonomy.",
      "Quit India Movement began on 8 August 1942.",
      "Cabinet Mission came to India in 1946.",
    ],
  },
  art_culture: {
    concise: [
      ["Nagara Style", "North Indian temple style with curvilinear shikhara."],
      ["Dravida Style", "South Indian temple style with vimana, gopuram and enclosed complex."],
      ["Vesara Style", "Hybrid Deccan temple style combining Nagara and Dravida features."],
      ["Stupa", "Buddhist relic mound; Sanchi is a major example."],
      ["Chaitya", "Buddhist prayer hall often with a stupa at the end."],
      ["Vihara", "Buddhist monastic residence."],
      ["Bharatanatyam", "Classical dance of Tamil Nadu."],
      ["Kathak", "Classical dance of north India with temple and court influences."],
      ["Ajanta Paintings", "Buddhist murals mainly from 2nd century BCE to 6th century CE."],
      ["UNESCO World Heritage Site", "Site recognised by UNESCO for outstanding universal cultural or natural value."],
    ],
    bullets: [
      "Sanchi Stupa is linked with Buddhist architecture.",
      "Nagara temples have curvilinear shikhara.",
      "Dravida temples have vimana and gopuram.",
      "Ajanta is famous for Buddhist murals.",
      "Ellora has Buddhist, Hindu and Jain caves.",
      "Bharatanatyam is associated with Tamil Nadu.",
      "Kathakali is associated with Kerala.",
      "Odissi is associated with Odisha.",
      "Sangita Ratnakara is linked to Indian music tradition.",
      "UNESCO recognises sites of outstanding universal value.",
    ],
  },
  geography: {
    concise: [
      ["Plate Tectonics", "Theory explaining movement of lithospheric plates over asthenosphere."],
      ["Himalayas", "Young fold mountains formed by collision of Indian and Eurasian plates."],
      ["Monsoon", "Seasonal reversal of winds caused by differential heating and pressure changes."],
      ["Jet Stream", "Fast upper-air wind influencing western disturbances and monsoon behaviour."],
      ["El Nino", "Warming of central/eastern Pacific often linked with weaker Indian monsoon."],
      ["Alluvial Soil", "Fertile soil deposited by rivers, dominant in Indo-Gangetic plains."],
      ["Black Soil", "Regur soil rich in clay, associated with Deccan Trap and cotton."],
      ["Western Ghats", "Biodiversity hotspot and orographic rainfall barrier along western India."],
      ["Tropical Cyclone", "Intense low-pressure system over warm oceans with spiralling winds."],
      ["Census of India", "Official decadal population enumeration, first synchronous census in 1881."],
    ],
    bullets: [
      "Indian Plate collides with Eurasian Plate.",
      "Himalayas are young fold mountains.",
      "Western Ghats cause orographic rainfall.",
      "El Nino often weakens Indian monsoon.",
      "Black soil is linked to Deccan Trap.",
      "Alluvial soil dominates Indo-Gangetic plains.",
      "IMD tracks cyclones and weather warnings.",
      "Census 2011 is India's latest completed census.",
      "India has both east-flowing and west-flowing rivers.",
      "Coral reefs need warm, shallow and clear water.",
    ],
  },
  society: {
    concise: [
      ["Article 14", "Guarantees equality before law and equal protection of laws."],
      ["Article 15", "Prohibits discrimination on religion, race, caste, sex or place of birth."],
      ["Article 17", "Abolishes untouchability and forbids its practice."],
      ["Article 21", "Protects life and personal liberty, interpreted to include dignity."],
      ["Indra Sawhney Case", "1992 judgment upholding OBC reservation and 50 percent ceiling principle."],
      ["NALSA Case", "2014 judgment recognising transgender persons' rights and self-identification."],
      ["Vishaka Guidelines", "1997 Supreme Court guidelines against workplace sexual harassment."],
      ["SC/ST Atrocities Act 1989", "Law preventing atrocities against Scheduled Castes and Scheduled Tribes."],
      ["Urbanisation", "Increase in share of population living in urban areas."],
      ["Demographic Dividend", "Economic potential from high working-age population share."],
    ],
    bullets: [
      "Article 17 abolishes untouchability.",
      "Indra Sawhney judgment came in 1992.",
      "NALSA judgment recognised transgender rights in 2014.",
      "Vishaka guidelines came in 1997.",
      "Census 2011 recorded 31.16 percent urban population.",
      "Article 21 includes dignity through judicial interpretation.",
      "SC/ST Atrocities Act was enacted in 1989.",
      "Secularism is part of Basic Structure.",
      "Regionalism can be linguistic, ethnic or economic.",
      "Globalisation affects family, work, culture and migration.",
    ],
  },
  polity: {
    concise: [
      ["Preamble", "Introductory statement declaring justice, liberty, equality, fraternity and democratic republic values."],
      ["Article 12", "Defines State for Fundamental Rights enforcement."],
      ["Article 13", "Invalidates laws inconsistent with Fundamental Rights."],
      ["Article 32", "Right to constitutional remedies before Supreme Court."],
      ["Article 368", "Procedure for amendment of the Constitution."],
      ["Basic Structure", "Doctrine from Kesavananda Bharati 1973 limiting Parliament's amending power."],
      ["Article 324", "Superintendence, direction and control of elections vested in Election Commission."],
      ["Article 280", "Provides for Finance Commission every five years or earlier."],
      ["Article 356", "President's Rule in States on failure of constitutional machinery."],
      ["73rd Amendment 1992", "Constitutionalised Panchayati Raj institutions through Part IX."],
    ],
    bullets: [
      "Constitution was adopted on 26 November 1949.",
      "Constitution came into force on 26 January 1950.",
      "Kesavananda Bharati judgment came in 1973.",
      "42nd Amendment added Fundamental Duties.",
      "44th Amendment removed Right to Property from Part III.",
      "Article 32 is a Fundamental Right.",
      "Article 324 deals with Election Commission.",
      "Finance Commission is under Article 280.",
      "S.R. Bommai restricted misuse of Article 356.",
      "73rd and 74th Amendments were enacted in 1992.",
    ],
  },
  judiciary: {
    concise: [
      ["Supreme Court", "Apex court of India under Articles 124-147 and final interpreter of Constitution."],
      ["Original Jurisdiction", "Article 131 jurisdiction over disputes between Union and States or between States."],
      ["Writ Jurisdiction", "Article 32 power to enforce Fundamental Rights through writs."],
      ["Special Leave Petition", "Article 136 discretionary appellate power against courts or tribunals except armed forces."],
      ["Judicial Review", "Power to strike down unconstitutional laws or executive action; part of Basic Structure."],
      ["Basic Structure Doctrine", "Kesavananda Bharati 1973 doctrine limiting Parliament's amending power."],
      ["PIL", "Public Interest Litigation expanding locus standi for disadvantaged groups."],
      ["Collegium System", "Judicial appointments system evolved through Three Judges Cases."],
      ["Curative Petition", "Last remedy after review dismissal to prevent gross miscarriage of justice."],
      ["Contempt of Court", "Articles 129 and 215 empower Supreme Court and High Courts to punish contempt."],
    ],
    bullets: [
      "Article 124 establishes Supreme Court.",
      "SC judges retire at 65 years.",
      "HC judges retire at 62 years.",
      "Article 131 covers original jurisdiction.",
      "Article 32 is itself a Fundamental Right.",
      "Article 136 provides Special Leave Petition.",
      "Three Judges Cases shaped collegium system.",
      "NJAC was struck down in 2015.",
      "PIL expanded locus standi in 1980s.",
      "Judicial review is part of Basic Structure.",
    ],
  },
  governance: {
    concise: [
      ["RTI Act 2005", "Law giving citizens right to access information from public authorities."],
      ["Section 4 RTI", "Mandates suo motu disclosure by public authorities."],
      ["Central Information Commission", "Appellate body under RTI Act for Union public authorities."],
      ["Lokpal Act 2013", "Creates anti-corruption ombudsman for specified public functionaries."],
      ["CVC", "Central Vigilance Commission, statutory anti-corruption vigilance body."],
      ["Citizen Charter", "Public document listing service standards, timelines and grievance channels."],
      ["DBT", "Direct Benefit Transfer sending subsidies or benefits directly to beneficiary accounts."],
      ["Aadhaar Act 2016", "Law governing Aadhaar identity framework and authentication use."],
      ["Social Audit", "Community verification of public works and welfare delivery."],
      ["2nd ARC", "Second Administrative Reforms Commission; major source on governance reforms."],
    ],
    bullets: [
      "RTI Act was enacted in 2005.",
      "Section 4 RTI mandates proactive disclosure.",
      "Lokpal and Lokayuktas Act came in 2013.",
      "CVC became statutory through 2003 Act.",
      "MGNREGA mandates social audit by Gram Sabha.",
      "Aadhaar Act was enacted in 2016.",
      "DBT uses bank accounts for benefit transfer.",
      "Citizen charters specify service standards.",
      "2nd ARC reported on ethics and governance.",
      "Puttaswamy judgment protected privacy in 2017.",
    ],
  },
  ir: {
    concise: [
      ["Panchsheel", "Five principles of peaceful coexistence articulated in 1954 India-China agreement."],
      ["Strategic Autonomy", "India's ability to make foreign policy choices without alliance compulsion."],
      ["Neighbourhood First", "Indian policy prioritising relations with immediate neighbours."],
      ["Act East Policy", "Policy deepening India's engagement with ASEAN and Indo-Pacific region."],
      ["SAARC", "South Asian Association for Regional Cooperation, established in 1985."],
      ["BIMSTEC", "Bay of Bengal grouping linking South and Southeast Asia."],
      ["QUAD", "India, US, Japan and Australia grouping focused on Indo-Pacific cooperation."],
      ["BRICS", "Grouping of Brazil, Russia, India, China and South Africa, now expanded."],
      ["Article 253", "Parliament's power to legislate for implementing international agreements."],
      ["Indus Waters Treaty", "1960 India-Pakistan water-sharing treaty brokered by World Bank."],
    ],
    bullets: [
      "Panchsheel principles were articulated in 1954.",
      "SAARC was established in 1985.",
      "Indus Waters Treaty was signed in 1960.",
      "Simla Agreement was signed in 1972.",
      "India-Bangladesh Land Boundary Agreement took effect in 2015.",
      "Article 253 enables treaty implementation laws.",
      "QUAD includes India, US, Japan and Australia.",
      "BIMSTEC links Bay of Bengal countries.",
      "India hosted G20 Summit in 2023.",
      "Paris Agreement was adopted in 2015.",
    ],
  },
  economy: {
    concise: [
      ["GDP", "Market value of final goods and services produced within a country in a period."],
      ["GVA", "GDP minus net product taxes; measures value added by sectors."],
      ["CPI", "Consumer Price Index used by RBI for inflation targeting."],
      ["Repo Rate", "Rate at which RBI lends short-term funds to banks against securities."],
      ["MPC", "Six-member Monetary Policy Committee targeting CPI inflation at 4 percent plus/minus 2."],
      ["Fiscal Deficit", "Government total expenditure minus total receipts excluding borrowings."],
      ["FRBM Act 2003", "Law aimed at fiscal discipline and deficit management."],
      ["GST Council", "Constitutional body under Article 279A for GST recommendations."],
      ["IBC 2016", "Insolvency and Bankruptcy Code for time-bound insolvency resolution."],
      ["NITI Aayog", "Policy think tank created in 2015 replacing Planning Commission."],
    ],
    bullets: [
      "LPG reforms began in 1991.",
      "RBI was established in 1935.",
      "RBI was nationalised in 1949.",
      "Inflation target is 4 percent plus/minus 2.",
      "GST launched on 1 July 2017.",
      "GST Council is under Article 279A.",
      "IBC was enacted in 2016.",
      "FRBM Act was enacted in 2003.",
      "NITI Aayog replaced Planning Commission in 2015.",
      "Finance Commission is under Article 280.",
    ],
  },
  agriculture: {
    concise: [
      ["MSP", "Minimum Support Price announced by CCEA on CACP recommendation for selected crops."],
      ["CACP", "Commission for Agricultural Costs and Prices recommending MSP."],
      ["PM-KISAN", "Income support scheme giving eligible farmer families Rs 6000 per year."],
      ["PMFBY", "Crop insurance scheme launched in 2016."],
      ["e-NAM", "Electronic National Agriculture Market launched in 2016 for mandi integration."],
      ["FPO", "Farmer Producer Organisation aggregating small farmers for bargaining and marketing."],
      ["Green Revolution", "HYV seed-fertiliser-irrigation strategy raising wheat and rice output from 1960s."],
      ["Swaminathan Commission", "Recommended MSP at C2 cost plus 50 percent margin."],
      ["NFSA 2013", "Law providing subsidised foodgrains to eligible population."],
      ["PDS", "Public Distribution System delivering foodgrains through Fair Price Shops."],
    ],
    bullets: [
      "PMFBY launched in 2016.",
      "e-NAM launched in 2016.",
      "PM-KISAN gives Rs 6000 per year.",
      "Swaminathan Commission recommended C2 plus 50 percent MSP.",
      "NFSA was enacted in 2013.",
      "Green Revolution first boosted wheat output.",
      "CACP recommends MSP; CCEA approves it.",
      "FCI procures and stores foodgrains.",
      "Agriculture is Entry 14 of State List.",
      "Operation Flood transformed India's dairy sector.",
    ],
  },
  environment: {
    concise: [
      ["Environment Protection Act 1986", "Umbrella environmental law enacted after Bhopal gas tragedy."],
      ["Wildlife Protection Act 1972", "Law protecting wild animals, birds, plants and protected areas."],
      ["Forest Conservation Act 1980", "Law regulating diversion of forest land for non-forest use."],
      ["Biological Diversity Act 2002", "Law implementing CBD obligations and biodiversity governance."],
      ["NGT Act 2010", "Law creating National Green Tribunal for environmental disputes."],
      ["Article 48A", "Directive Principle requiring State to protect environment, forests and wildlife."],
      ["Article 51A(g)", "Fundamental Duty to protect natural environment and show compassion for living creatures."],
      ["Paris Agreement 2015", "Climate agreement under UNFCCC to limit global warming."],
      ["Ramsar Convention", "International treaty for conservation of wetlands."],
      ["CITES", "Convention regulating international trade in endangered species."],
    ],
    bullets: [
      "Wildlife Protection Act was enacted in 1972.",
      "Water Act was enacted in 1974.",
      "Forest Conservation Act was enacted in 1980.",
      "Environment Protection Act was enacted in 1986.",
      "Biological Diversity Act was enacted in 2002.",
      "NGT Act was enacted in 2010.",
      "Paris Agreement was adopted in 2015.",
      "Article 48A protects environment as DPSP.",
      "Article 51A(g) is environmental Fundamental Duty.",
      "Vellore case recognised precautionary principle.",
    ],
  },
  science: {
    concise: [
      ["ISRO", "Indian Space Research Organisation, India's national space agency."],
      ["PSLV", "ISRO's Polar Satellite Launch Vehicle known for reliable satellite launches."],
      ["GSLV", "Geosynchronous Satellite Launch Vehicle used for heavier payloads."],
      ["Chandrayaan-3", "ISRO lunar mission achieving soft landing near lunar south polar region in 2023."],
      ["Aditya-L1", "India's first dedicated solar observatory mission launched in 2023."],
      ["Gaganyaan", "India's human spaceflight programme."],
      ["DRDO", "Defence Research and Development Organisation for indigenous defence technology."],
      ["BrahMos", "Supersonic cruise missile jointly developed by India and Russia."],
      ["National Quantum Mission", "Mission approved in 2023 to develop quantum technologies."],
      ["DPDP Act 2023", "Digital Personal Data Protection Act governing personal data processing."],
    ],
    bullets: [
      "Aryabhata satellite was launched in 1975.",
      "Mars Orbiter Mission launched in 2013.",
      "Chandrayaan-3 soft-landed in 2023.",
      "Aditya-L1 was launched in 2023.",
      "ISRO's commercial arm is NSIL.",
      "IN-SPACe enables private space participation.",
      "DRDO develops strategic defence technologies.",
      "BrahMos is a supersonic cruise missile.",
      "National Quantum Mission was approved in 2023.",
      "DPDP Act was enacted in 2023.",
    ],
  },
  security: {
    concise: [
      ["UAPA", "Unlawful Activities Prevention Act, India's principal anti-terror law."],
      ["NIA Act 2008", "Law establishing National Investigation Agency after 26/11 attacks."],
      ["PMLA 2002", "Prevention of Money Laundering Act for laundering and proceeds of crime."],
      ["NDMA", "National Disaster Management Authority created under Disaster Management Act 2005."],
      ["NDRF", "Specialised disaster response force under Disaster Management Act framework."],
      ["LWE", "Left Wing Extremism involving Maoist insurgency in affected districts."],
      ["Coastal Security", "Maritime security architecture strengthened after 26/11 Mumbai attacks."],
      ["CERT-In", "National agency for cyber incident response under IT Act framework."],
      ["FATF", "Global body setting standards against money laundering and terror financing."],
      ["Article 355", "Union duty to protect States against external aggression and internal disturbance."],
    ],
    bullets: [
      "NIA Act was enacted in 2008.",
      "Disaster Management Act was enacted in 2005.",
      "PMLA was enacted in 2002.",
      "UAPA was originally enacted in 1967.",
      "NDMA is chaired by Prime Minister.",
      "NDRF is specialised disaster response force.",
      "26/11 attacks reshaped coastal security.",
      "CERT-In handles cyber incident response.",
      "FATF deals with money laundering and terror financing.",
      "Article 355 imposes Union protection duty.",
    ],
  },
  ethics: {
    concise: [
      ["Integrity", "Consistency between values, words and actions even without external supervision."],
      ["Probity", "Absolute honesty and uprightness in public life and use of public resources."],
      ["Objectivity", "Decision-making based on evidence, law and merit rather than bias."],
      ["Impartiality", "Equal treatment without favouritism, prejudice or political pressure."],
      ["Empathy", "Ability to understand another person's suffering and perspective."],
      ["Compassion", "Empathy translated into action to reduce suffering."],
      ["Emotional Intelligence", "Capacity to understand and manage one's emotions and relationships."],
      ["Conflict of Interest", "Situation where private interest may improperly influence public duty."],
      ["Nolan Principles", "UK public life principles: selflessness, integrity, objectivity, accountability, openness, honesty, leadership."],
      ["2nd ARC Ethics Report", "Administrative Reforms Commission report recommending ethics reforms in governance."],
    ],
    bullets: [
      "Integrity means consistency between values and action.",
      "Probity means uprightness in public office.",
      "Nolan Committee listed seven public life principles.",
      "2nd ARC reported on Ethics in Governance.",
      "RTI Act strengthens transparency.",
      "Lokpal Act was enacted in 2013.",
      "Whistle Blowers Protection Act was enacted in 2014.",
      "Gandhi stressed purity of means and ends.",
      "Ambedkar stressed constitutional morality.",
      "Conflict of interest undermines public trust.",
    ],
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
      const generated = buildConciseAndBullets(topic);

      const nextNotes = {
        ...notes,
        concise_notes: generated.concise_notes,
        revision_bullets: generated.revision_bullets,
      };

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

  console.log(JSON.stringify({ processed, updated, failed: failed.length, failed_keys: failed }, null, 2));
}

function buildConciseAndBullets(topic) {
  const pack = packs[classifyTopic(topic)] ?? packs.ethics;
  const focus = focusFacts(topic);
  const title = clean(topic.title);

  const topicPair = {
    term: title,
    definition: topicDefinition(title, topic),
  };

  const concise = uniquePairs([
    topicPair,
    ...focus.concise.map(([term, definition]) => ({ term, definition })),
    ...pack.concise.map(([term, definition]) => ({ term, definition })),
  ]).slice(0, 15);

  while (concise.length < 10) {
    concise.push({
      term: `UPSC fact ${concise.length + 1}`,
      definition: "Use the official syllabus, Constitution, Act, report or scheme source for this factual point.",
    });
  }

  const bullets = uniqueStrings([...focus.bullets, ...pack.bullets]).slice(0, 10);
  while (bullets.length < 10) bullets.push(`${title}: revise the exact year, article, act or institution name.`);

  return {
    concise_notes: concise,
    revision_bullets: bullets,
  };
}

function classifyTopic(topic) {
  const key = topic.key.toLowerCase();
  const title = topic.title.toLowerCase();
  const subject = (topic.subject || "").toLowerCase();

  if (subject === "csat") {
    if (key.includes("numeracy")) return "csat_numeracy";
    if (key.includes("reasoning")) return "csat_reasoning";
    return "csat_comprehension";
  }
  if (subject === "essay") return "essay";
  if (subject === "gs4" || key.includes("ethics") || title.includes("integrity")) return "ethics";

  if (subject === "gs1") {
    if (key.includes("geography")) return "geography";
    if (key.includes("society")) return "society";
    if (key.includes("art") || title.includes("culture")) return "art_culture";
    if (key.includes("medieval")) return "history_medieval";
    if (key.includes("modern") || key.includes("freedom") || key.includes("post_independence") || key.includes("world")) return "history_modern";
    return "history_ancient";
  }

  if (subject === "gs2") {
    if (key.includes("ir")) return "ir";
    if (key.includes("governance")) return "governance";
    if (key.includes("judiciary")) return "judiciary";
    return "polity";
  }

  if (subject === "gs3") {
    if (key.includes("agriculture") || title.includes("agriculture") || title.includes("food") || title.includes("msp")) return "agriculture";
    if (key.includes("environment") || title.includes("environment") || title.includes("climate") || title.includes("biodiversity") || title.includes("forest")) return "environment";
    if (key.includes("science") || title.includes("science") || title.includes("technology") || title.includes("space") || title.includes("isro") || title.includes("biotech")) return "science";
    if (key.includes("security") || title.includes("security") || title.includes("disaster") || title.includes("cyber")) return "security";
    return "economy";
  }

  return "ethics";
}

function focusFacts(topic) {
  const key = topic.key.toLowerCase();
  if (key.includes("committee_or_report_relevance")) {
    return {
      concise: [
        ["Sarkaria Commission", "1983 commission on Centre-State relations and cooperative federalism."],
        ["Punchhi Commission", "2007 commission reviewing Centre-State relations and Governor's role."],
        ["2nd ARC", "Commission reporting on governance, ethics, crisis management and citizen-centric administration."],
        ["Law Commission of India", "Advisory body producing reports on legal and judicial reform."],
        ["Finance Commission", "Article 280 body recommending tax devolution and grants."],
      ],
      bullets: [
        "Sarkaria Commission was set up in 1983.",
        "Punchhi Commission was set up in 2007.",
        "2nd ARC submitted governance reform reports.",
        "Finance Commission is under Article 280.",
        "Law Commission reports guide legal reform.",
      ],
    };
  }
  if (key.includes("constitutional_or_institutional_angle")) {
    return {
      concise: [
        ["Rule of Law", "Principle that government acts only under law and is subject to law."],
        ["Separation of Powers", "Functional division among legislature, executive and judiciary."],
        ["Checks and Balances", "Institutional limits preventing concentration of public power."],
        ["Judicial Review", "Court power to test constitutionality of laws and executive action."],
        ["Constitutional Morality", "Governance according to constitutional values and restraints."],
      ],
      bullets: [
        "Rule of law is part of Basic Structure.",
        "Judicial review is part of Basic Structure.",
        "Separation of powers limits arbitrary power.",
        "Constitutional morality was stressed by Ambedkar.",
        "Checks and balances protect limited government.",
      ],
    };
  }
  if (key.includes("current_affairs_linkage")) {
    return {
      concise: [
        ["Current Affairs Linkage", "Connection between static syllabus and recent official developments."],
        ["PIB", "Government source for schemes, cabinet decisions and policy announcements."],
        ["PRS Legislative Research", "Source for bills, acts and parliamentary analysis."],
        ["Economic Survey", "Annual official analysis of Indian economy tabled before Budget."],
        ["Supreme Court Judgment", "Authoritative source for constitutional and legal developments."],
      ],
      bullets: [
        "PIB is useful for official scheme facts.",
        "PRS tracks bills and acts.",
        "Economic Survey is tabled before Union Budget.",
        "Supreme Court judgments update constitutional interpretation.",
        "Current affairs must link to static syllabus.",
      ],
    };
  }
  if (key.includes("definition_and_conceptual_clarity")) {
    return {
      concise: [
        ["Definition", "Precise one-line meaning of a term."],
        ["Conceptual Distinction", "Difference between similar UPSC terms, such as GDP-GVA or Article 32-226."],
        ["Exception", "Condition where a general rule does not apply."],
        ["Keyword", "Exact exam term that controls the answer."],
        ["Operational Meaning", "How a concept works in law, policy or administration."],
      ],
      bullets: [
        "UPSC often tests definitions through exceptions.",
        "Article 32 and Article 226 differ in scope.",
        "GDP and GVA are not identical.",
        "CPI and WPI measure different price baskets.",
        "Constitutional and statutory bodies differ by legal source.",
      ],
    };
  }
  if (key.includes("historical_background")) {
    return {
      concise: [
        ["Chronology", "Sequence of events in time order."],
        ["Regulating Act 1773", "Beginning of British parliamentary control over Company administration."],
        ["Government of India Act 1935", "Major colonial constitutional law influencing Indian federal structure."],
        ["Constituent Assembly", "Body that drafted and adopted the Constitution between 1946 and 1949."],
        ["Historical Continuity", "Survival of older institutions or practices in modern governance."],
      ],
      bullets: [
        "Regulating Act came in 1773.",
        "Government of India Act came in 1935.",
        "Constituent Assembly first met on 9 December 1946.",
        "Constitution was adopted on 26 November 1949.",
        "Historical questions require chronology and causation.",
      ],
    };
  }
  if (key.includes("implementation_bottleneck")) {
    return {
      concise: [
        ["Implementation Gap", "Difference between policy design and actual delivery."],
        ["Capacity Deficit", "Shortage of staff, funds, skills or infrastructure for implementation."],
        ["Last-Mile Delivery", "Final stage where benefits or services reach citizens."],
        ["Social Audit", "Community verification of public programme implementation."],
        ["Outcome Budgeting", "Linking public expenditure with measurable results."],
      ],
      bullets: [
        "Implementation gaps often arise from capacity deficits.",
        "Social audit is mandatory under MGNREGA.",
        "Last-mile delivery affects welfare outcomes.",
        "Outcome budgeting links spending to results.",
        "DBT reduces leakages but can create exclusion errors.",
      ],
    };
  }
  if (key.includes("policy_challenge")) {
    return {
      concise: [
        ["Policy Trade-off", "Situation requiring balance between competing public values."],
        ["Fiscal Prudence", "Responsible management of deficits, debt and public spending."],
        ["Inclusion", "Ensuring vulnerable groups benefit from policy."],
        ["Sustainability", "Meeting present needs without harming future generations."],
        ["Regulatory Capture", "When regulated interests influence regulator decisions."],
      ],
      bullets: [
        "Policy choices involve trade-offs.",
        "Fiscal prudence matters for welfare sustainability.",
        "Inclusion reduces exclusion errors.",
        "Sustainability links economy and environment.",
        "Regulatory capture weakens public interest.",
      ],
    };
  }
  if (key.includes("way_forward")) {
    return {
      concise: [
        ["Way Forward", "Actionable reform path based on diagnosis."],
        ["Legal Reform", "Change in law to remove ambiguity or outdated provisions."],
        ["Institutional Reform", "Change in structure, process, capacity or accountability of institutions."],
        ["Digital Monitoring", "Use of dashboards and data systems to track implementation."],
        ["Grievance Redress", "System for citizens to complain and receive remedy."],
      ],
      bullets: [
        "Way forward must be actionable.",
        "Legal reform works when law is outdated.",
        "Institutional reform fixes process failures.",
        "Digital dashboards improve monitoring.",
        "Grievance redress improves citizen trust.",
      ],
    };
  }
  return { concise: [], bullets: [] };
}

function topicDefinition(title, topic) {
  const subject = topic.subject || "UPSC";
  const base = classifyTopic(topic);
  const labels = {
    csat_comprehension: `${title} is a CSAT comprehension area tested through passage evidence, inference and option elimination.`,
    csat_numeracy: `${title} is a CSAT numeracy area tested through formulas, unit conversion and calculation accuracy.`,
    csat_reasoning: `${title} is a CSAT reasoning area tested through logical conditions, arrangements and elimination.`,
    essay: `${title} is an Essay theme requiring constitutional values, examples and multidimensional analysis.`,
    history_ancient: `${title} is a GS1 history theme requiring chronology, sources and cultural-political facts.`,
    history_medieval: `${title} is a GS1 medieval history theme requiring dynasties, administration, culture and religious movements.`,
    history_modern: `${title} is a GS1 modern history theme requiring dates, movements, leaders and colonial laws.`,
    art_culture: `${title} is a GS1 art-culture theme requiring architecture, literature, religion and heritage facts.`,
    geography: `${title} is a GS1 geography theme requiring physical processes, maps and India-specific examples.`,
    society: `${title} is a GS1 society theme requiring constitutional rights, social data and reform examples.`,
    polity: `${title} is a GS2 polity theme requiring articles, institutions, amendments and judgments.`,
    judiciary: `${title} is a GS2 judiciary theme requiring Articles 124-147, jurisdictions, cases and reforms.`,
    governance: `${title} is a GS2 governance theme requiring acts, schemes, accountability tools and delivery facts.`,
    ir: `${title} is a GS2 IR theme requiring treaties, organisations, bilateral interests and foreign policy principles.`,
    economy: `${title} is a GS3 economy theme requiring indicators, institutions, laws and current data.`,
    agriculture: `${title} is a GS3 agriculture theme requiring MSP, schemes, markets, food security and farm reforms.`,
    environment: `${title} is a GS3 environment theme requiring laws, conventions, species and ecological principles.`,
    science: `${title} is a GS3 science-tech theme requiring missions, institutions, applications and regulation.`,
    security: `${title} is a GS3 security theme requiring laws, agencies, threats and response mechanisms.`,
    ethics: `${title} is a ${subject} ethics theme requiring values, thinkers, probity and case-study application.`,
  };
  return labels[base] ?? `${title} is a ${subject} topic requiring exact facts, institutions and exam-relevant examples.`;
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

function uniquePairs(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const term = clean(item.term);
    const definition = clean(item.definition);
    if (!term || !definition) continue;
    const key = term.toLowerCase();
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
      const value = trimmed
        .slice(index + 1)
        .trim()
        .replace(/^['"]|['"]$/g, "");
      process.env[key] ??= value;
    }
  } catch {}
}

await main();
