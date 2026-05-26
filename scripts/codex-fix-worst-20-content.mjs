import { createClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "./script-env.mjs";

const { url, serviceKey } = requireSupabaseEnv();
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const geographyNotes = {
  gs1_geography_biogeography_definition_and_conceptual_clarity: geoNote({
    title: "Biogeography: definition and conceptual clarity",
    core: "Biogeography explains the spatial distribution of plants, animals, ecosystems and biomes across the earth. It joins physical geography with ecology: climate, relief, soil, water availability, latitude and human disturbance together decide why evergreen forests occur in the Western Ghats, why mangroves survive in the Sundarbans, and why alpine meadows appear above the tree line in the Himalayas.",
    concepts: "The key distinction is between ecosystem, biome, habitat and biodiversity hotspot. An ecosystem is a functional unit of living organisms and their physical environment. A biome is a large ecological region such as tropical rainforest, savanna, desert or tundra. A habitat is the immediate living place of an organism. A biodiversity hotspot is a region with high endemism and high threat; the Western Ghats-Sri Lanka, Himalaya, Indo-Burma and Sundaland hotspots are relevant for India.",
    india: "Indian examples make the concept concrete. The Western Ghats receive heavy orographic rainfall and support evergreen and semi-evergreen forests. The Thar Desert shows xerophytic adaptations such as deep roots, waxy leaves and drought-resistant shrubs. The Sundarbans show halophytes and pneumatophores because saline, waterlogged soil prevents ordinary root respiration. The Himalayas display vertical zonation: tropical foothill forests give way to temperate conifers, alpine scrub and finally cold desert conditions.",
    exam: "Prelims traps usually mix up biosphere reserves, national parks and wildlife sanctuaries. Biosphere reserves follow UNESCO's Man and Biosphere idea and contain core, buffer and transition zones. National parks have stricter protection than sanctuaries. Another trap is assuming all biodiversity hotspots are protected areas; hotspots are biogeographic regions, not legal categories. Mains answers should connect species distribution with climate change, habitat fragmentation, invasive species, corridors, community conservation and the Biological Diversity Act, 2002.",
  }),
  gs1_geography_climatology_definition_and_conceptual_clarity: geoNote({
    title: "Climatology: definition and conceptual clarity",
    core: "Climatology studies the long-term patterns, controls and variability of weather elements such as temperature, pressure, winds, humidity, clouds and rainfall. Weather is the short-term atmospheric condition over hours or days; climate is the average pattern over a longer period, conventionally about thirty years. This distinction matters because a single heat wave is weather, while rising mean temperature and changing monsoon variability indicate climate change.",
    concepts: "The core controls of climate are latitude, altitude, distance from sea, pressure belts, planetary winds, ocean currents, relief and vegetation. Latitude controls solar insolation; altitude lowers temperature through the normal lapse rate; continentality increases annual temperature range; warm ocean currents raise coastal temperature and moisture; cold currents favour aridity and fog. Pressure belts shift seasonally with the apparent movement of the sun, creating monsoon reversals and the migration of the Inter-Tropical Convergence Zone.",
    india: "India's climate is dominated by tropical monsoon circulation. The southwest monsoon draws moisture from the Arabian Sea and Bay of Bengal branches. The Western Ghats create heavy windward rainfall and a rain-shadow zone over parts of Maharashtra, Karnataka and Telangana. The Himalayas block cold Central Asian winds and force the monsoon to shed rainfall. Western disturbances bring winter precipitation to northwest India and snowfall to the western Himalayas, supporting rabi agriculture.",
    exam: "Prelims often tests the difference between El Nino, La Nina and Indian Ocean Dipole. El Nino is warming of the central-eastern equatorial Pacific and often weakens the Indian monsoon, though the relationship is not automatic. A positive Indian Ocean Dipole can partly offset El Nino effects. Mains answers should use climatology for heat waves, urban heat islands, cyclones, drought management, crop calendars, glacier retreat and disaster preparedness. The safest conceptual anchor is cause-process-impact: identify the atmospheric mechanism before discussing social and economic consequences.",
  }),
  gs1_geography_geomorphology_definition_and_conceptual_clarity: geoNote({
    title: "Geomorphology: definition and conceptual clarity",
    core: "Geomorphology is the study of landforms, their origin, evolution and the processes that shape the earth's surface. It links endogenic forces such as folding, faulting, volcanism and earthquakes with exogenic processes such as weathering, erosion, transportation and deposition. A mountain range, river valley, delta, coastal cliff or desert dune is not just a feature on a map; it is evidence of a process acting over time.",
    concepts: "The first conceptual distinction is between weathering and erosion. Weathering breaks rocks in situ through physical, chemical or biological action; erosion removes material by running water, wind, glacier, waves or gravity. The second distinction is between structure, process and stage. Rock type and tectonic structure influence resistance; agents such as rivers or glaciers perform work; landforms pass through stages such as youthful V-shaped valleys, mature floodplains and old-age peneplains in the Davisian model, though real landscapes rarely follow a perfect cycle.",
    india: "Indian geomorphology is highly varied. The Himalayas are young fold mountains formed by the collision of the Indian and Eurasian plates, hence their high relief, seismicity and active landslides. The Peninsular Plateau is an old stable shield with residual hills, rift valleys of Narmada and Tapi, black soil over Deccan Trap basalt and mature drainage. The Indo-Gangetic plain is an alluvial depositional surface built by Himalayan rivers. The east coast has large deltas such as Mahanadi, Godavari, Krishna and Cauvery, while the west coast has estuaries and narrow coastal plains.",
    exam: "Prelims traps include confusing alluvial fans with deltas, rift valleys with synclinal valleys, and folded mountains with block mountains. Mains use geomorphology for Himalayan landslides, river erosion, floodplain zoning, coastal erosion, groundwater recharge, mineral distribution and infrastructure planning. A strong answer mentions process: a flood is not only heavy rainfall but also slope, drainage density, channel capacity, sediment load, embankments, land use and floodplain encroachment.",
  }),
  gs1_geography_indian_geography_definition_and_conceptual_clarity: geoNote({
    title: "Indian Geography: definition and conceptual clarity",
    core: "Indian Geography studies the physical, economic and human geography of India as an integrated spatial system. It covers physiography, drainage, climate, soils, vegetation, agriculture, minerals, industries, transport, population, settlements and regional development. The conceptual clarity is that India is not a uniform landmass: Himalayan, Indo-Gangetic, Peninsular, coastal, island and desert regions have different constraints and opportunities.",
    concepts: "The main physiographic divisions are the Himalayas, Northern Plains, Peninsular Plateau, Indian Desert, Coastal Plains and Islands. The Himalayas are tectonically active and control climate, river systems and security. The Northern Plains are fertile alluvial plains with dense population and intensive agriculture. The Peninsular Plateau is mineral-rich, older and more stable. Coastal plains support ports, fisheries, deltas and cyclone-prone settlements. Islands such as Andaman-Nicobar have strategic and ecological importance.",
    india: "Indian monsoon, Himalayan rivers and soil diversity shape the economy. Alluvial soils support wheat, rice and sugarcane in the plains. Black soil supports cotton in Maharashtra and Madhya Pradesh because of moisture retention. Red and laterite soils need careful nutrient management. The Damodar, Chotanagpur and Odisha belts explain coal, iron ore and steel industries. The western coast has natural harbours such as Mumbai and Kochi, while eastern deltas face cyclone and flood risks.",
    exam: "Prelims tests location, sequence and matching: passes, rivers, tributaries, soil regions, mineral belts, national parks, ports and crop belts. Mains asks spatial explanation: why floods recur in Assam and Bihar, why Bundelkhand faces drought, why the Himalayan region is disaster-prone, why industries concentrate around raw material, market, power or ports. Good answers combine maps, physical causes and policy tools such as watershed management, river basin planning, climate-resilient agriculture and regional connectivity.",
  }),
  gs1_geography_industries_definition_and_conceptual_clarity: geoNote({
    title: "Industries: definition and conceptual clarity",
    core: "Industrial geography studies the location, distribution and spatial organisation of manufacturing and related economic activities. Industry location depends on raw materials, power, labour, capital, transport, market, water, technology, policy and agglomeration economies. The central concept is that industries rarely locate randomly; they cluster where costs fall or advantages accumulate.",
    concepts: "Industries may be classified as agro-based, mineral-based, forest-based, marine-based, heavy, light, public sector, private sector, large-scale, small-scale or knowledge-based. Iron and steel is a weight-losing mineral-based industry because coal and iron ore are bulky. Cotton textile is historically market- and labour-linked, though raw cotton also matters. Petrochemicals depend on refineries, ports and pipelines. Electronics and IT rely more on skilled labour, infrastructure, innovation ecosystems and urban services than on heavy raw material.",
    india: "India's industrial regions show geography clearly. The Chotanagpur region developed due to coal, iron ore, water and rail links, supporting Jamshedpur, Bokaro, Durgapur and Rourkela. The Mumbai-Pune belt grew from port access, cotton hinterland, finance and later automobiles and services. The Gujarat industrial corridor benefits from ports, petrochemicals, entrepreneurship and policy support. Bengaluru's technology cluster reflects skilled labour, research institutions, climate, airports and network effects. The Delhi-Mumbai Industrial Corridor shows planned industrial geography linked to freight movement.",
    exam: "Prelims often asks correctly matched industrial centres, raw materials, corridors, ports and schemes such as Make in India, Production Linked Incentive and PM Gati Shakti. Mains themes include deindustrialisation, MSME constraints, logistics cost, regional imbalance, environmental compliance, labour reforms and global value chains. Avoid reducing industrial location to one factor. Real answers compare multiple factors: raw material explains early steel, market explains consumer goods, ports explain refineries, and skilled labour explains IT and electronics.",
  }),
  gs1_geography_oceanography_definition_and_conceptual_clarity: geoNote({
    title: "Oceanography: definition and conceptual clarity",
    core: "Oceanography studies oceans, seas and marine processes, including ocean basins, waves, tides, currents, salinity, temperature, marine resources and coastal landforms. It is physical geography with direct links to climate, fisheries, ports, cyclones, trade and blue economy. Oceans store heat, move energy through currents and supply moisture for rainfall.",
    concepts: "The core distinctions are waves, tides and currents. Waves are mainly wind-generated oscillations of water. Tides are periodic rise and fall of sea level caused by gravitational pull of the Moon and Sun. Ocean currents are large-scale horizontal flows driven by wind, temperature, salinity, Coriolis force and basin shape. Warm currents raise coastal temperature and moisture; cold currents can create fog and aridity, as seen near the Atacama and Namib deserts.",
    india: "India's oceanography is centred on the Indian Ocean, Arabian Sea and Bay of Bengal. The Bay of Bengal is more cyclone-prone because of warm sea surface temperatures, high moisture and semi-enclosed shape. The Arabian Sea has also seen intense cyclones in recent years, linked to warming waters. The monsoon current reverses seasonally in the northern Indian Ocean. Upwelling along the Kerala coast supports fisheries. The Andaman and Nicobar Islands sit near strategic sea lanes and a seismically active zone connected to the Sunda trench.",
    exam: "Prelims traps include confusing Labrador, Gulf Stream, Kuroshio, Oyashio, Humboldt and Benguela currents, and mixing spring tides with neap tides. Mains use oceanography for cyclones, coastal erosion, coral bleaching, sea-level rise, marine pollution, Exclusive Economic Zone, blue economy and maritime security. India-specific examples include INCOIS ocean advisories, Sagarmala, deep ocean mission, coral reefs of Lakshadweep and Gulf of Mannar, and mangrove protection in cyclone mitigation.",
  }),
  gs1_geography_resources_definition_and_conceptual_clarity: geoNote({
    title: "Resources: definition and conceptual clarity",
    core: "A resource is anything that can satisfy human needs and is accessible, technologically usable and economically viable. The same physical substance may not be a resource until knowledge, technology and demand make it useful. This is why resource geography studies not only minerals, water, forests and energy, but also distribution, ownership, sustainability and conflict.",
    concepts: "Resources are commonly classified as renewable and non-renewable, biotic and abiotic, actual and potential, ubiquitous and localised, stock and reserve. Coal, petroleum and metallic minerals are non-renewable on human time scales. Solar, wind and hydropower are renewable, though infrastructure and ecological costs matter. A reserve is the part of a stock that can be economically used with current technology; stock is a broader category of known material that may become usable later.",
    india: "India has coal concentrated in Gondwana basins such as Damodar, Mahanadi, Godavari and Son valleys. Iron ore is found in Odisha, Jharkhand, Chhattisgarh, Karnataka and Goa. Bauxite occurs in lateritic regions such as Odisha and Gujarat. Water resources are uneven: Himalayan rivers are perennial, while many peninsular rivers are seasonal and monsoon-dependent. Solar potential is high in Rajasthan and Gujarat; wind potential is strong in Tamil Nadu, Gujarat, Maharashtra and coastal belts.",
    exam: "Prelims tests location of minerals, energy parks, river basins, forest types and conservation status. Mains asks about sustainable mining, water stress, inter-state river disputes, renewable energy transition, land acquisition, tribal rights and resource federalism. Real examples include District Mineral Foundation under the MMDR Amendment Act, CAMPA funds, Jal Jeevan Mission, National Solar Mission and green hydrogen policy. The conceptual trap is treating resources as purely natural; institutions, technology and equity decide whether a resource becomes development or conflict.",
  }),
  gs1_geography_world_geography_definition_and_conceptual_clarity: geoNote({
    title: "World Geography: definition and conceptual clarity",
    core: "World Geography studies global physical features, climate regions, resources, population, economic activities and geopolitical locations. It connects maps with processes: mountain systems reflect plate boundaries, deserts reflect pressure belts and cold currents, and industrial regions reflect resources, markets and technology. Conceptual clarity comes from seeing continents and oceans as systems rather than memorising isolated places.",
    concepts: "The major physical framework includes the Rockies, Andes, Alps, Himalayas, Atlas, Great Dividing Range, Siberian plains, Amazon basin, Congo basin, Sahara, Gobi, Kalahari, Atacama and Australian deserts. Climate regions follow latitude, pressure belts, winds, ocean currents and relief. Mediterranean climate occurs on western margins around 30-45 degrees latitude and supports citrus, olives and grapes. Equatorial climate supports dense evergreen forests and high biodiversity.",
    india: "World geography matters for India through trade routes, energy security, climate diplomacy and diaspora. The Strait of Hormuz is critical for oil movement; Malacca Strait connects the Indian Ocean with the Pacific; Bab-el-Mandeb links the Red Sea and Arabian Sea. El Nino in the Pacific affects Indian monsoon probability. Arctic sea ice changes influence new shipping routes and geopolitics. African mineral resources, West Asian energy and Indo-Pacific sea lanes directly affect India's foreign policy.",
    exam: "Prelims frequently asks map-based locations: seas, straits, mountain ranges, deserts, rivers, countries bordering conflict zones, and international organisations by headquarters. Mains uses world geography in migration, food security, energy corridors, climate change, disaster patterns and geopolitics. The safest method is to pair every place with a reason: Hormuz-oil, Malacca-trade, Andes-subduction, Sahara-subtropical high pressure, Atacama-cold Humboldt current and rain shadow, Mediterranean-western margin westerlies in winter.",
  }),
};

const polityNotes = {
  gs2_polity: polityNote({
    title: "Constitution & Polity",
    core: "Constitution and Polity covers the legal architecture through which India is governed: the Constitution, Union and State governments, Parliament, judiciary, federalism, rights, Directive Principles, local bodies, constitutional bodies and statutory institutions. The Indian Constitution came into force on 26 January 1950 after being adopted on 26 November 1949. Its structure combines parliamentary government, federal distribution of powers, judicial review, Fundamental Rights, Directive Principles and a detailed administrative framework.",
    provisions: "Core provisions include Articles 12-35 for Fundamental Rights, Articles 36-51 for Directive Principles, Articles 52-78 for the Union executive, Articles 79-122 for Parliament, Articles 124-147 for the Supreme Court, Articles 153-167 for State executive, Articles 168-212 for State legislatures, Articles 214-231 for High Courts, Article 246 and the Seventh Schedule for legislative competence, Article 280 for Finance Commission, and Articles 324, 315, 338, 338A, 338B and 350B for major constitutional bodies.",
    cases: "Judicial interpretation has shaped the Constitution. Kesavananda Bharati v State of Kerala, 1973 created the Basic Structure doctrine. Maneka Gandhi v Union of India, 1978 expanded Article 21 and linked procedure with fairness. S.R. Bommai v Union of India, 1994 limited arbitrary President's Rule and strengthened federalism. I.R. Coelho, 2007 held that Ninth Schedule laws after 24 April 1973 are open to Basic Structure review.",
    current: "Current issues include judicial appointments, tribunal independence, cooperative federalism, role of Governors, anti-defection law, electoral finance, parliamentary disruptions, delimitation, data protection, local government finances and accountability of regulators. Polity answers improve when they connect text, institution and practice: for example, federalism is not only Seventh Schedule distribution but also GST Council functioning, Finance Commission transfers, centrally sponsored schemes and dispute resolution.",
  }),
  gs2_polity_bodies: polityNote({
    title: "Constitutional & Statutory Bodies",
    core: "Constitutional bodies are created directly by the Constitution, while statutory bodies are created by Acts of Parliament or State legislatures. This distinction affects independence, appointment, removal, powers and accountability. Constitutional bodies include Election Commission of India, UPSC, State Public Service Commissions, Finance Commission, Comptroller and Auditor General, National Commission for Scheduled Castes, National Commission for Scheduled Tribes, National Commission for Backward Classes and Special Officer for Linguistic Minorities.",
    provisions: "Important provisions include Article 280 for Finance Commission, Article 324 for Election Commission, Articles 315-323 for Public Service Commissions, Articles 148-151 for CAG, Article 338 for NCSC, Article 338A for NCST, Article 338B for NCBC and Article 350B for linguistic minorities. Statutory bodies include NHRC under the Protection of Human Rights Act, 1993; CIC under the RTI Act, 2005; Lokpal under the Lokpal and Lokayuktas Act, 2013; CVC under the CVC Act, 2003; SEBI under the SEBI Act, 1992; and NGT under the NGT Act, 2010.",
    cases: "The Supreme Court has repeatedly protected institutional independence. T.N. Seshan v Union of India, 1995 upheld the multi-member Election Commission. Vineet Narain v Union of India, 1997 strengthened CBI and CVC-linked accountability. Madras Bar Association cases examined tribunal independence and separation of powers. Anoop Baranwal v Union of India, 2023 dealt with appointments to the Election Commission before the 2023 statute changed the appointment framework.",
    current: "The recurring governance issue is how to balance autonomy with accountability. Constitutional status does not automatically guarantee effectiveness; budget, appointment process, tenure security, staff, data access and enforcement powers matter. Statutory bodies may be powerful when backed by clear law and independent functioning, as seen with SEBI and NGT, but can be weakened by vacancies or limited compliance. A strong answer compares constitutional source, legal mandate, appointment, removal, powers, reporting authority and actual performance.",
  }),
  gs2_polity_constitution: polityNote({
    title: "Constitutional History & Philosophy",
    core: "Indian constitutional history begins with colonial legal developments and culminates in a sovereign democratic Constitution. The Regulating Act, 1773 began parliamentary control over the East India Company. Pitt's India Act, 1784 created dual control. The Charter Acts, Government of India Acts and Indian Councils Acts gradually altered administration and representation. The Government of India Act, 1935 was especially important because it introduced provincial autonomy, federal features, emergency provisions and institutional structures later adapted into the Constitution.",
    provisions: "The Constituent Assembly first met on 9 December 1946. Dr Rajendra Prasad was its President and Dr B.R. Ambedkar chaired the Drafting Committee set up on 29 August 1947. The Objective Resolution moved by Jawaharlal Nehru in 1946 influenced the Preamble. The Constitution was adopted on 26 November 1949 and came into force on 26 January 1950. Its philosophy blends liberal rights, social revolution, parliamentary democracy, federalism with unitary bias, secularism, rule of law and welfare state ideals.",
    cases: "The Preamble and philosophy have been judicially interpreted. Berubari Union, 1960 initially held that the Preamble was not part of the Constitution. Kesavananda Bharati, 1973 recognised the Preamble as part of the Constitution and used it in Basic Structure reasoning. S.R. Bommai, 1994 treated secularism as part of Basic Structure. Minerva Mills, 1980 emphasised harmony between Fundamental Rights and Directive Principles.",
    current: "The historical and philosophical dimension matters in debates on constitutional morality, social justice, affirmative action, secularism, federalism, civil liberties and institutional independence. India's Constitution is not merely borrowed provisions; it adapted global ideas to Indian needs. Parliamentary government came from Britain, judicial review from the United States, Directive Principles from Ireland, emergency provisions partly from Germany and federal-administrative details from the Government of India Act, 1935. The exam angle is to show continuity, adaptation and transformation.",
  }),
  gs2_polity_constitutional_bodies: polityNote({
    title: "Constitutional bodies",
    core: "Constitutional bodies are institutions whose existence, composition or core functions are provided in the Constitution itself. Their purpose is to protect democratic processes, financial accountability, social justice, merit-based recruitment and federal balance from ordinary political pressure. Examples include Election Commission, UPSC, Finance Commission, CAG, NCSC, NCST, NCBC, State Election Commissions and State Finance Commissions.",
    provisions: "Article 324 vests superintendence, direction and control of elections in the Election Commission. Articles 315-323 provide for UPSC and State Public Service Commissions. Articles 148-151 provide for CAG, who audits Union and State accounts and reports to the President or Governor. Article 280 provides for Finance Commission every five years or earlier. Articles 338, 338A and 338B provide for NCSC, NCST and NCBC. Articles 243K and 243ZA provide for State Election Commissions for Panchayats and Municipalities.",
    cases: "Important cases include T.N. Seshan, 1995 on Election Commission structure; Mohinder Singh Gill, 1978 on broad election powers; Kihoto Hollohan, 1992 on Speaker's anti-defection role and judicial review; and Anoop Baranwal, 2023 on ECI appointments before the statutory change. CAG reports have influenced parliamentary accountability through Public Accounts Committee scrutiny, though CAG itself does not enforce recovery or prosecution.",
    current: "Issues include appointment independence, vacancies, post-retirement appointments, budgetary autonomy, enforcement powers and politicisation. Finance Commission debates involve vertical and horizontal tax devolution, population criteria, performance incentives and disaster risk financing. Election Commission debates involve Model Code of Conduct enforcement, electoral bonds aftermath, digital campaigning and internal party democracy. Constitutional bodies are best evaluated through five lenses: source, appointment, tenure, powers and accountability.",
  }),
  gs2_polity_executive: polityNote({
    title: "Executive, Judiciary & Tribunals",
    core: "The executive implements laws and policy, the judiciary interprets law and protects rights, and tribunals provide specialised adjudication in fields such as taxation, administration, environment and company law. In India, the political executive is responsible to the legislature under the parliamentary system, while the permanent executive provides continuity through civil services. The judiciary is independent but also part of the constitutional checks and balances system.",
    provisions: "Union executive provisions are in Articles 52-78: President, Vice-President, Council of Ministers, Prime Minister and Attorney General. State executive provisions are in Articles 153-167. Supreme Court provisions are in Articles 124-147; High Courts in Articles 214-231; subordinate courts in Articles 233-237. Tribunals are covered through Articles 323A and 323B, inserted by the 42nd Amendment, 1976. Article 50 directs separation of judiciary from executive in public services of the State.",
    cases: "Judicial independence and tribunal design have been shaped by cases. S.P. Gupta, 1981, Supreme Court Advocates-on-Record Association, 1993 and the 1998 Presidential Reference created the collegium system. L. Chandra Kumar, 1997 held that tribunal decisions are subject to High Court and Supreme Court judicial review. Rojer Mathew, 2019 and Madras Bar Association cases examined tribunal appointments, tenure and executive dominance.",
    current: "Current issues include pendency, judicial vacancies, tribunal vacancies, executive delay in appointments, post-retirement roles, accountability, access to justice and separation of powers. Tribunals can reduce burden and add expertise, but only if independent, adequately staffed and procedurally fair. Mains answers should distinguish between executive accountability to Parliament, judicial accountability through reasoned judgments and review, and tribunal accountability through statutory design and appellate supervision.",
  }),
  gs2_polity_features: polityNote({
    title: "Features, Amendments & Basic Structure",
    core: "The Constitution's major features include written and lengthy text, supremacy of the Constitution, parliamentary government, federal system with unitary bias, Fundamental Rights, Directive Principles, independent judiciary, judicial review, secularism, single citizenship, universal adult franchise, emergency provisions and a blend of rigidity and flexibility. These features are not ornamental; they determine how power is created, limited and reviewed.",
    provisions: "Article 368 provides the amendment procedure. Some provisions can be changed by simple majority, some by special majority of Parliament, and federal provisions require ratification by at least half of State legislatures. The 42nd Amendment, 1976 added Socialist, Secular and Integrity to the Preamble and expanded Directive Principles. The 44th Amendment, 1978 reversed several Emergency-era changes and replaced the right to property as a Fundamental Right with Article 300A as a constitutional legal right.",
    cases: "Basic Structure doctrine is the central concept. Shankari Prasad, 1951 and Sajjan Singh, 1965 allowed broad amendment power. Golaknath, 1967 restricted amendment of Fundamental Rights. Kesavananda Bharati, 1973 held that Parliament can amend any part but cannot destroy the Basic Structure. Indira Gandhi v Raj Narain, 1975, Minerva Mills, 1980, Waman Rao, 1981 and I.R. Coelho, 2007 developed the doctrine further.",
    current: "Basic Structure protects constitutional identity while allowing democratic change. Elements recognised include supremacy of Constitution, republican and democratic government, secularism, separation of powers, federalism, judicial review, rule of law and free and fair elections. Current debates involve constitutional amendments, tribunal reforms, election laws, reservations, federal institutions and judicial review. A precise answer separates ordinary amendment politics from the legal limit imposed by Basic Structure.",
  }),
  gs2_polity_federalism: polityNote({
    title: "Federalism, Devolution & Finance Commission",
    core: "Indian federalism distributes power between Union and States while retaining a strong Centre. It is described as federal in structure but unitary in emergencies and certain national matters. Devolution means transfer of functions, funds and functionaries to lower levels, including States and local bodies. Fiscal federalism decides how taxing powers, grants and expenditure responsibilities are shared.",
    provisions: "Article 246 and the Seventh Schedule divide legislative subjects into Union, State and Concurrent Lists. Article 248 gives residuary power to Parliament. Articles 268-281 deal with distribution of revenues. Article 280 provides for Finance Commission. Article 356 deals with President's Rule. Articles 263 provides for Inter-State Council. The 73rd and 74th Amendments constitutionalised Panchayats and Municipalities through Parts IX and IXA. GST changed fiscal federalism through Article 279A and the GST Council.",
    cases: "S.R. Bommai, 1994 is central because it limited misuse of Article 356 and recognised federalism and secularism as Basic Structure features. State of West Bengal v Union of India, 1963 rejected absolute State sovereignty. NCT of Delhi cases clarified elected government and Lieutenant Governor powers in the special constitutional setting of Delhi. The Cauvery litigation shows limits and necessity of institutional dispute resolution.",
    current: "Current federal issues include GST compensation, centrally sponsored schemes, borrowing limits, role of Governors, inter-state river disputes, delimitation concerns, regional parties, local body finances and competitive versus cooperative federalism. Finance Commission recommendations shape vertical devolution from Union to States and horizontal distribution among States using criteria such as income distance, population, area, forest cover and demographic performance. Strong answers connect constitutional text with fiscal capacity and administrative accountability.",
  }),
  gs2_polity_local_bodies_committee_or_report_relevance: polityNote({
    title: "Local bodies: committee or report relevance",
    core: "Committees and reports are central to understanding Indian local self-government because Panchayati Raj did not emerge in one step. Early post-Independence community development programmes showed that development administration without democratic participation remained weak. The Balwant Rai Mehta Committee, 1957 recommended democratic decentralisation and a three-tier Panchayati Raj system with the Gram Panchayat, Panchayat Samiti and Zila Parishad.",
    provisions: "The Ashok Mehta Committee, 1978 recommended a two-tier structure with Mandal Panchayat and Zila Parishad, participation of political parties, regular social audit and constitutional protection. G.V.K. Rao Committee, 1985 emphasised the district as the basic unit of planning. L.M. Singhvi Committee, 1986 recommended constitutional recognition for Panchayati Raj institutions and Gram Sabha as the base of decentralised democracy. These recommendations influenced the 73rd and 74th Constitutional Amendments, 1992.",
    cases: "Local governance is also linked with State Election Commissions and reservation disputes. Kishansing Tomar v Municipal Corporation of Ahmedabad, 2006 held that timely local body elections are mandatory and State Election Commissions must ensure regular elections. K. Krishna Murthy v Union of India, 2010 upheld reservations in local bodies but distinguished political reservation from employment reservation. Recent triple-test litigation on OBC reservation requires empirical data, dedicated commission and adherence to ceiling principles.",
    current: "The 2nd Administrative Reforms Commission supported subsidiarity, activity mapping, accountability and citizen-centric administration. Finance Commission reports repeatedly highlight weak own-source revenue, delayed State Finance Commissions and insufficient devolution. For Mains, committees should not be name-dropped mechanically. Their value is diagnostic: Balwant Rai Mehta explains democratic decentralisation, Ashok Mehta explains district-level planning, L.M. Singhvi explains constitutionalisation, and Finance Commissions explain fiscal empowerment.",
  }),
  gs2_polity_local_bodies_constitutional_or_institutional_angle: polityNote({
    title: "Local bodies: constitutional or institutional angle",
    core: "Local bodies are constitutional institutions after the 73rd and 74th Amendments, 1992, which inserted Part IX for Panchayats and Part IXA for Municipalities. They are not merely administrative agencies; they are elected bodies meant to deepen democracy, enable local planning and deliver basic services. Panchayats cover rural local governance, while Municipalities cover urban governance.",
    provisions: "Key Panchayat provisions include Article 243A on Gram Sabha, Article 243B on constitution of Panchayats, Article 243C on composition, Article 243D on reservation, Article 243E on five-year duration, Article 243G on powers and responsibilities, Article 243H on taxation powers, Article 243I on State Finance Commission and Article 243K on State Election Commission. Municipal provisions include Articles 243P to 243ZG, including Article 243W for powers of Municipalities and Article 243ZA for municipal elections.",
    cases: "Kishansing Tomar, 2006 made timely elections a constitutional obligation. K. Krishna Murthy, 2010 dealt with local body reservations and democratic representation. The Supreme Court's OBC reservation rulings require a triple test before reserving seats for backward classes in local bodies. These cases show that local democracy is protected by courts when States delay elections or bypass constitutional safeguards.",
    current: "Institutionally, local bodies depend on three Fs: functions, funds and functionaries. The Eleventh Schedule lists 29 Panchayat subjects; the Twelfth Schedule lists 18 municipal subjects. But actual devolution depends on State laws, activity mapping, staff control and finances. Urban local bodies face property tax weakness, parastatal overlap, poor planning capacity and climate stress. Rural bodies face capacity gaps, elite capture and dependence on tied grants. The constitutional angle is clear: local bodies have status, but effective decentralisation requires real devolution.",
  }),
  gs2_polity_local_bodies_definition_and_conceptual_clarity: polityNote({
    title: "Local bodies: definition and conceptual clarity",
    core: "Local bodies are elected institutions of self-government at village, intermediate, district, municipal and metropolitan levels. Their purpose is to bring governance closer to citizens, enable local planning, provide civic services and strengthen participatory democracy. Panchayats govern rural areas; Municipalities govern urban areas. Gram Sabha is not the same as Gram Panchayat: Gram Sabha consists of all registered voters in a village area, while Gram Panchayat is the elected executive body.",
    provisions: "Part IX defines Panchayats from Articles 243 to 243O. Part IXA defines Municipalities from Articles 243P to 243ZG. The 73rd Amendment applies to Panchayats and the 74th to Municipalities. The Eleventh Schedule lists 29 subjects such as agriculture, minor irrigation, animal husbandry, rural housing, drinking water, roads, poverty alleviation and markets. The Twelfth Schedule lists 18 subjects such as urban planning, regulation of land use, roads, water supply, public health, sanitation, fire services and slum improvement.",
    cases: "The conceptual clarity also includes election and finance institutions. State Election Commissions conduct local body elections under Articles 243K and 243ZA. State Finance Commissions recommend financial distribution between State and local bodies under Articles 243I and 243Y. Kishansing Tomar, 2006 protects timely local elections. K. Krishna Murthy, 2010 clarifies reservation principles in local bodies.",
    current: "Common traps include confusing Panchayat Samiti with Zila Parishad, treating Gram Sabha as a ward committee, assuming local bodies are fully independent of States, and mixing Eleventh and Twelfth Schedule subjects. Local bodies are constitutionally recognised but State legislatures decide their detailed powers. Mains answers should use the phrase democratic decentralisation carefully: true decentralisation means functions, funds, functionaries, planning power, accountability and citizen participation, not just holding elections every five years.",
  }),
  gs2_polity_local_bodies_historical_background: polityNote({
    title: "Local bodies: historical background",
    core: "Local self-government has deep roots in India, but modern local bodies developed through colonial municipal reforms, post-Independence community development and constitutional amendments. Ancient village assemblies and local councils existed in different forms, but they were not democratic institutions in the modern constitutional sense. Under British rule, Lord Ripon's Resolution of 1882 is often called the Magna Carta of local self-government because it supported elected non-official participation in local boards.",
    provisions: "The Government of India Act, 1919 transferred local self-government to provincial control under dyarchy. The Government of India Act, 1935 expanded provincial autonomy, allowing provinces to legislate more actively on local institutions. After Independence, Article 40 in the Directive Principles directed the State to organise village panchayats and endow them with powers necessary for self-government. However, Directive Principles are non-justiciable, so Panchayats remained dependent on State political will.",
    cases: "The Community Development Programme, 1952 and National Extension Service, 1953 revealed the need for people's participation. The Balwant Rai Mehta Committee, 1957 recommended Panchayati Raj institutions, leading Rajasthan to launch Panchayati Raj at Nagaur in 1959. Later, Ashok Mehta Committee, G.V.K. Rao Committee and L.M. Singhvi Committee pushed for stronger decentralisation and constitutional recognition. The 64th Amendment Bill failed, but the 73rd and 74th Amendments were enacted in 1992 and came into force in 1993.",
    current: "The historical lesson is that local democracy remained weak when it depended only on executive schemes or State discretion. Constitutionalisation introduced regular elections, reservations, State Election Commissions, State Finance Commissions and Schedules of functions. Yet the old problem persists in a new form: many States hold elections but do not transfer enough funds, staff and planning powers. A historical answer should move from Ripon to Article 40 to committees to the 73rd and 74th Amendments.",
  }),
  gs2_polity_local_bodies_implementation_bottleneck: polityNote({
    title: "Local bodies: implementation bottleneck",
    core: "The main implementation bottleneck in local bodies is the gap between constitutional design and actual devolution. The Constitution provides for elected Panchayats and Municipalities, but States control detailed powers, staff, taxation authority and many service delivery agencies. As a result, local bodies often carry responsibility without adequate autonomy or resources.",
    provisions: "Articles 243G and 243W use enabling language: State legislatures may endow Panchayats and Municipalities with powers. This means devolution is not automatic. Articles 243H and 243X allow taxation powers, but many local bodies depend heavily on grants. Articles 243I and 243Y provide for State Finance Commissions every five years, yet many SFCs are delayed, their reports are not fully implemented, or fiscal transfers remain tied and unpredictable. State Election Commissions exist, but election delays still occur.",
    cases: "Kishansing Tomar, 2006 addressed delays in local elections. OBC reservation litigation shows how lack of empirical data can stall elections. Urban governance also suffers from parastatal bodies such as development authorities, water boards and transport agencies controlling functions that should align with municipalities. Rural governance faces capacity shortages in accounting, engineering, planning, social audit and digital record management.",
    current: "Major bottlenecks include weak own-source revenue, poor property tax collection, staff controlled by State departments, limited Gram Sabha participation, elite capture, inadequate training, fragmented urban planning, unfunded mandates and climate-related stress on civic services. The remedy is not only more money. It requires activity mapping, predictable untied grants, professional municipal cadres, empowered ward committees, Gram Sabha transparency, social audit, digital public finance management and stronger metropolitan planning committees under Article 243ZE. The best Mains framing is three Fs plus accountability: functions, funds, functionaries and citizen oversight.",
  }),
};

const notesByKey = { ...geographyNotes, ...polityNotes };

const keys = Object.keys(notesByKey);
let updated = 0;
const failed = [];

for (const key of keys) {
  const fullNotes = notesByKey[key].trim();
  const words = wordCount(fullNotes);
  if (words < 400) {
    failed.push({ key, error: `full_notes only ${words} words` });
    continue;
  }

  const { data, error } = await supabase.from("topics").select("structured_notes").eq("key", key).maybeSingle();
  if (error || !data) {
    failed.push({ key, error: error?.message ?? "topic not found" });
    continue;
  }

  const structured = parseNotes(data.structured_notes);
  structured.full_notes = fullNotes;

  const { error: updateError } = await supabase
    .from("topics")
    .update({ structured_notes: JSON.stringify(structured) })
    .eq("key", key);

  if (updateError) {
    failed.push({ key, error: updateError.message });
  } else {
    updated += 1;
    console.log(`[${updated}/${keys.length}] updated ${key} (${words} words)`);
  }
}

console.log(JSON.stringify({ requested: keys.length, updated, failed: failed.length, failures: failed }, null, 2));
if (failed.length) process.exitCode = 1;

function geoNote({ title, core, concepts, india, exam }) {
  return `## ${title}

### Core Meaning
${core}

### Conceptual Clarity
${concepts}

### India-Specific Examples
${india}

### Prelims and Mains Use
${exam}

### Connected Themes
The topic links with environment, economy and disaster management. Physical geography explains why some regions face repeated floods, droughts, landslides, cyclones or resource stress. It also explains why development projects need location-specific planning: Himalayan roads require slope stability and drainage design; coastal cities need storm-surge buffers and wetland protection; mineral belts need rehabilitation and tribal rights safeguards; dry regions need watershed management rather than only canal expansion. Map-based understanding is therefore essential because the same policy has different effects in the Himalayas, Indo-Gangetic plain, plateau, coast, islands and desert.

### High-Yield Takeaway
For this topic, the strongest answers identify the physical process, locate it on India's map where possible, and connect it with agriculture, settlement, disaster risk, resources or environmental management. The safest Prelims approach is to separate definition, process, location and exception. The safest Mains approach is to connect causes with consequences and use Indian examples rather than abstract world-only explanations.`;
}

function polityNote({ title, core, provisions, cases, current }) {
  return `## ${title}

### Core Meaning
${core}

### Constitutional and Institutional Provisions
${provisions}

### Cases, Committees and Reports
${cases}

### Current Governance Relevance
${current}

### Administrative and Reform Dimension
The practical test of this topic is whether constitutional design improves accountability, representation and service delivery. Institutions need transparent appointments, stable tenure, adequate staff, independent finances, clear jurisdiction and public reporting. Reforms usually fail when legal powers exist on paper but budgets, personnel and information remain controlled elsewhere. This is visible in local bodies without staff control, tribunals without vacancies filled, commissions without timely reports, and regulators without enforcement capacity. The constitutional value at stake is not only efficiency but also rule of law, democratic legitimacy, federal balance and protection of citizens against arbitrary power.

### High-Yield Takeaway
A strong answer should name the exact constitutional article or institution, explain how power is designed, and then show how it works in practice. The key distinction is between constitutional text, statutory detail and administrative implementation. This prevents vague answers and helps connect Prelims facts with Mains analysis.`;
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
