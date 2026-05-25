import { createClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { requireSupabaseEnv } from "./script-env.mjs";

const { url, serviceKey } = requireSupabaseEnv();
const anthropicKey = process.env.ANTHROPIC_API_KEY;
const geminiKey = process.env.GEMINI_API_KEY;
const force = process.env.FORCE_NOTES === "1" || process.argv.includes("--force");
const forceAll = process.argv.includes("--force-all");
const requestedMode = process.argv.find((arg) => arg.startsWith("--mode="))?.split("=")[1];
const mode = requestedMode ?? ((anthropicKey && !process.argv.includes("--local")) ? "claude" : "local-topic-engine");
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

if (mode === "claude" && !anthropicKey) {
  console.error("ANTHROPIC_API_KEY is required for --mode=claude.");
  process.exit(1);
}
if (mode === "gemini" && !geminiKey) {
  console.error("GEMINI_API_KEY is required for --mode=gemini.");
  process.exit(1);
}

const topics = await fetchAllTopics();

let processed = 0;
let skipped = 0;
let missingStructuredNotes = 0;
let missingWikiSlugs = 0;
let missingGovernmentSources = 0;
let missingNcertRefs = 0;
let publishReadyPreserved = 0;
let structuredJson = 0;
let plainTextRemaining = 0;
let processedCount = 0;
const updates = [];

for (const topic of topics) {
  const preservePublishReady = !forceAll && topic.content_quality === "publish_ready";
  if (preservePublishReady) publishReadyPreserved += 1;
  const shouldReplace = !preservePublishReady && (force || !topic.structured_notes || isOldFallback(topic.structured_notes) || !isStructuredJson(topic.structured_notes));
  let notes = topic.structured_notes;
  const wikiSlug = topic.wiki_slug || String(topic.title).replace(/[()[\],:;?]/g, "").replace(/\s+/g, "_");
  let updatePayload = {
    structured_notes: notes,
    content_quality: contentQuality(topic, notes),
    wiki_slug: wikiSlug,
  };

  if (shouldReplace && (mode === "claude" || mode === "gemini")) {
    let claudeResponse;
    try {
      if (mode === "claude") claudeResponse = await generateWithClaude(topic);
      else if (mode === "gemini") claudeResponse = await generateWithGemini(topic);
    } catch (error) {
      processedCount += 1;
      skipped += 1;
      console.warn(`Topic ${topic.key}: ${mode} request failed, skipping - ${error instanceof Error ? error.message : String(error)}`);
      console.log(`[${processedCount}/${topics.length}] ${topic.key} → skipped`);
      await new Promise(r => setTimeout(r, 4500));
      continue;
    }
    let parsed;
    try {
      // strip markdown fences Gemini commonly adds
      let raw = (claudeResponse || '').trim();
      raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
      parsed = JSON.parse(raw);
    } catch (e) {
      // second attempt: find first { to last }
      const start = (claudeResponse || '').indexOf('{');
      const end = (claudeResponse || '').lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        try { parsed = JSON.parse(claudeResponse.slice(start, end + 1)); } catch { parsed = null; }
      }
    }

    if (!parsed || !parsed.full_notes || !parsed.revision_bullets) {
      processedCount += 1;
      skipped += 1;
      console.warn(`Topic ${topic.key}: ${mode} returned invalid JSON, skipping`);
      console.log(`[${processedCount}/${topics.length}] ${topic.key} → skipped`);
      await new Promise(r => setTimeout(r, 4500));
      continue;
    }

    // Store as JSONB now (not text)
    updatePayload = {
      structured_notes: parsed,
      content_quality: 'human_review_needed',
      wiki_slug: topic.wiki_slug || topic.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')
    };
    notes = parsed;
  } else if (shouldReplace) {
    const generated = localTopicNotes(topic);
    notes = toStructuredJson(topic, generated);
    updatePayload = {
      structured_notes: notes,
      content_quality: contentQuality(topic, notes),
      wiki_slug: wikiSlug,
    };
  }

  updates.push({ key: topic.key, updatePayload });

  processed += shouldReplace ? 1 : 0;
  skipped += shouldReplace ? 0 : 1;
  if (!notes) missingStructuredNotes += 1;
  if (!updatePayload.wiki_slug) missingWikiSlugs += 1;
  if (!Array.isArray(topic.govt_sources) || !topic.govt_sources.length) missingGovernmentSources += 1;
  if (!Array.isArray(topic.ncert_refs) || !topic.ncert_refs.length) missingNcertRefs += 1;
  if (isStructuredJson(notes)) structuredJson += 1;
  else plainTextRemaining += 1;
  if (process.env.VERBOSE_NOTES === "1") {
    console.log(`${shouldReplace ? "Updated" : "Kept"} notes for ${topic.key} (${mode})`);
  }
  processedCount += 1;
  console.log(`[${processedCount}/${topics.length}] ${topic.key} → ${updatePayload.content_quality}`);
  if (shouldReplace && (mode === "claude" || mode === "gemini")) await new Promise(r => setTimeout(r, 4500));
}

for (const batch of chunks(updates, 50)) {
  await Promise.all(
    batch.map(async (item) => {
      const { error: updateError } = await supabase
        .from("topics")
        .update(item.updatePayload)
        .eq("key", item.key);
      if (updateError) {
        const { error: fallbackError } = await supabase.from("topics").update({ structured_notes: item.updatePayload.structured_notes, wiki_slug: item.updatePayload.wiki_slug }).eq("key", item.key);
        if (fallbackError) throw fallbackError;
      }
    }),
  );
}

const report = { mode, force, forceAll, processed, skipped, publishReadyPreserved, structuredJson, plainTextRemaining, missingStructuredNotes, missingWikiSlugs, missingGovernmentSources, missingNcertRefs, totalTopics: topics.length };
writeReport("topic-notes-report.json", report);
console.log(JSON.stringify(report, null, 2));

async function generateWithClaude(topic) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514",
      max_tokens: 1800,
      messages: [{ role: "user", content: prompt(topic) }],
    }),
  });
  if (!response.ok) return localTopicNotes(topic);
  const data = await response.json();
  return data.content?.map((part) => part.text).join("\n\n") ?? localTopicNotes(topic);
}

async function generateWithGemini(topic) {
  const apiKey = process.env.GEMINI_API_KEY;
  const promptText = prompt(topic);
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 2048 }
      })
    }
  );
  const data = await response.json();
  console.log('GEMINI_RAW:', JSON.stringify(data).slice(0, 500));
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

function prompt(topic) {
  return `You are a senior UPSC content writer. Generate structured notes for the topic "${topic.title}" under subject "${topic.subject}".

Return ONLY a valid JSON object. No explanation before or after. No markdown fences. Just raw JSON.

The JSON must follow this exact shape:
{
  "analogy": "One sentence beginner analogy. Make it vivid and concrete. Example: Think of X like Y because Z.",
  "full_notes": "Markdown string. Use ## and ### headings. Cover: definition, historical background, constitutional/legal basis if any, key institutions, recent developments, India-specific context. Minimum 400 words. Include article numbers, year facts, scheme names, judgment names where relevant.",
  "concise_notes": [
    { "term": "exact term", "definition": "one line UPSC-safe definition" }
  ],
  "revision_bullets": ["fact 1", "fact 2", "fact 3", "fact 4", "fact 5", "fact 6", "fact 7", "fact 8", "fact 9", "fact 10"],
  "mindmap": ["central concept", "branch 1", "branch 2", "branch 3", "branch 4", "branch 5"],
  "cases": [
    { "name": "case or report or scheme name", "point": "why it matters for UPSC in one line" }
  ],
  "schemes": [
    { "name": "scheme or act or policy name", "point": "key fact about it" }
  ],
  "ncert_coverage": ["Class X Subject Chapter Y: topic", "Class X Subject Chapter Z: topic"],
  "prelims_traps": ["common wrong answer trap 1", "trap 2", "trap 3"],
  "mains_angles": ["GS Paper X angle: question framing", "angle 2", "angle 3"]
}

Rules:
- concise_notes: minimum 8 items, maximum 15
- revision_bullets: exactly 10 bullets, each under 15 words
- cases: minimum 3, include real judgments/reports/committees if they exist for this topic
- schemes: minimum 3, include real government schemes/acts/policies
- ncert_coverage: list actual NCERT chapters that cover this topic
- prelims_traps: minimum 3 real traps aspirants commonly fall for
- mains_angles: minimum 3 angles with GS paper number
- Return only valid JSON. If you are unsure about a fact, omit it rather than guess.`;
}

function localTopicNotes(topic) {
  const title = String(topic.title);
  const subject = String(topic.subject);
  const key = String(topic.key);
  const base = title.split(":")[0].trim();
  const lens = title.includes(":") ? title.split(":").slice(1).join(":").trim() : "";
  const profile = topicProfile(key, title, subject);
  const angle = lens ? lensAngle(lens, base, profile) : profile.defaultAngle(base);

  return `Exam-ready intro
${base} belongs to ${subject} and should be prepared as a concept, a factual area, and an applied UPSC answer theme.
In Prelims, UPSC can test definitions, chronology, institutions, reports, provisions, places, or statement-based traps around ${base}.
In Mains, the same topic becomes useful when you explain causes, consequences, challenges, examples, and a balanced way forward.

Simple mental model
Think of ${base} as ${profile.mentalModel(base)}
If you can explain this mental model in one minute, you understand the topic well enough to start solving questions.

Core explanation
${profile.core(base)}
${angle}
The safest UPSC approach is to connect the static concept with one current example, one institution or report, and one practical implication.

5 high-yield facts
${profile.facts(base).map((fact, index) => `${index + 1}. ${fact}`).join("\n")}

Judgments/schemes/reports/examples
${profile.sources(base).map((item) => `- ${item}`).join("\n")}

Prelims traps
${profile.traps(base).map((trap) => `- ${trap}`).join("\n")}

Mains answer angle
${profile.mains(base)}
For this specific topic, use the line: "${base} matters because it links institutional design, implementation capacity, and citizen outcomes."

150-word answer skeleton
Intro: Define ${base} in one crisp sentence and locate it in the UPSC syllabus.
Body 1: Explain the core mechanism or background in 2-3 points.
Body 2: Add examples, data, committees, schemes, maps, judgments, or case studies depending on the topic.
Body 3: Mention challenges or limitations without sounding one-sided.
Conclusion: End with a balanced way forward: reform, capacity, accountability, sustainability, or constitutional values.

Related topics
${profile.related(base).map((item) => `- ${item}`).join("\n")}

Study task
Read the linked NCERT/Wikipedia source, solve 10 MCQs, create one flashcard from the fact you missed, and write one short answer using the skeleton above.`;
}

function toStructuredJson(topic, fullText) {
  if (typeof fullText === "string" && fullText.trim().startsWith("{")) {
    try {
      JSON.parse(fullText);
      return fullText;
    } catch {
      // Fall through to wrapper.
    }
  }
  const title = String(topic.title);
  const text = String(fullText ?? "");
  const concise = conciseNotes(title, text);
  return JSON.stringify(
    {
      analogy: {
        heading: `${title} in one simple picture`,
        body: analogyFor(title, String(topic.subject)),
      },
      full_notes: text,
      concise_notes: concise,
      revision_bullets: revisionBullets(title, text),
      mindmap: {
        center: title,
        branches: concise.slice(0, 6).map((item) => item.term),
      },
      cases: namedItems(text, /(case|v\.|judgment|judicial review|Supreme Court)/i),
      schemes: namedItems(text, /(scheme|mission|programme|yojana|policy|report|committee|survey)/i),
      ncert_coverage: listAfter(text, "High-yield facts").concat(listAfter(text, "Core explanation")).slice(0, 12),
      prelims_traps: listAfter(text, "Prelims traps").slice(0, 10),
      mains_angles: listAfter(text, "Mains answer angle").slice(0, 10),
    },
    null,
    2,
  );
}

function analogyFor(title, subject) {
  if (subject.toLowerCase().includes("polity")) {
    return `Think of ${title} like one rule in a large school constitution. It tells who has power, what limits that power, and how a student-citizen can complain when the rule is broken. First see the rule's job, then remember the official words.`;
  }
  if (subject.toLowerCase().includes("economy")) {
    return `Think of ${title} like money moving through a family, a shop, and the government at the same time. UPSC asks what causes the movement, who gains, who loses, and what policy can fix the imbalance.`;
  }
  if (subject.toLowerCase().includes("geography")) {
    return `Think of ${title} like a map story. First ask where it happens, then why it happens there, then how it affects people, resources, disasters, and development.`;
  }
  return `Think of ${title} like a new game rule explained slowly. First understand the problem it solves, then the official terms, then how UPSC can twist it in questions.`;
}

function conciseNotes(title, text) {
  const rows = [];
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  for (const line of lines) {
    const match = line.match(/^([A-Z][A-Za-z0-9 .()/-]{2,64}):\s*(.{18,220})$/);
    if (match) rows.push({ term: match[1], definition: match[2] });
    if (rows.length >= 12) break;
  }
  if (!rows.length) {
    rows.push(
      { term: title, definition: "Core UPSC topic to understand through meaning, features, examples and exam relevance." },
      { term: "Prelims use", definition: "Statement-based testing of facts, institutions, chronology or concepts." },
      { term: "Mains use", definition: "Analytical answer theme needing examples, challenges and a balanced way forward." },
    );
  }
  return rows.slice(0, 24);
}

function revisionBullets(title, text) {
  const traps = listAfter(text, "Prelims traps");
  const facts = listAfter(text, "5 high-yield facts");
  const combined = [...facts, ...traps].filter((item) => item.length >= 18).slice(0, 10);
  return combined.length ? combined : [`Define ${title} clearly.`, "Remember the main facts.", "Use one current example.", "Revise common traps.", "Practise topic MCQs."];
}

function namedItems(text, pattern) {
  return text
    .split(/\n+/)
    .map((line) => line.trim().replace(/^[-\d. ]+/, ""))
    .filter((line) => pattern.test(line))
    .slice(0, 8)
    .map((line) => ({ name: line.slice(0, 90), note: "Relevant source, example, case, scheme or report for answer enrichment." }));
}

function listAfter(text, heading) {
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const start = lines.findIndex((line) => line.toLowerCase().includes(heading.toLowerCase()));
  if (start === -1) return [];
  const items = [];
  for (const line of lines.slice(start + 1)) {
    if (/^\d+\.\s+[A-Z][A-Za-z ]{2,}$/.test(line) && items.length) break;
    const cleaned = line.replace(/^\d+\.\s*/, "").replace(/^[-\u2022]\s*/, "").trim();
    if (cleaned.length > 18 && cleaned.length < 220) items.push(cleaned);
    if (items.length >= 12) break;
  }
  return Array.from(new Set(items));
}

function contentQuality(topic, notes) {
  if (!notes) return "fallback";
  if (String(notes).includes("NCERT base used") || (Array.isArray(topic.ncert_refs) && topic.ncert_refs.length)) return "ncert_enriched";
  return "wiki_seeded";
}

function writeReport(name, report) {
  const dir = join(process.cwd(), "data", "content-reports");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, name), `${JSON.stringify({ ...report, generatedAt: new Date().toISOString() }, null, 2)}\n`);
}

function topicProfile(key, title, subject) {
  const text = `${key} ${title} ${subject}`.toLowerCase();
  if (text.includes("polity") || text.includes("constitution") || text.includes("parliament") || text.includes("judiciary") || text.includes("federalism")) return polityProfile(text);
  if (text.includes("governance") || text.includes("rti") || text.includes("transparency") || text.includes("accountability") || text.includes("civil_services")) return governanceProfile(text);
  if (text.includes("economy") || text.includes("inflation") || text.includes("bank") || text.includes("budget") || text.includes("agriculture")) return economyProfile(text);
  if (text.includes("geography") || text.includes("geomorphology") || text.includes("climatology") || text.includes("oceanography") || text.includes("resources")) return geographyProfile(text);
  if (text.includes("history") || text.includes("freedom") || text.includes("ancient") || text.includes("medieval") || text.includes("modern")) return historyProfile(text);
  if (text.includes("society") || text.includes("women") || text.includes("urbanisation") || text.includes("communalism") || text.includes("secularism")) return societyProfile(text);
  if (text.includes("environment") || text.includes("ecology") || text.includes("biodiversity") || text.includes("climate")) return environmentProfile(text);
  if (text.includes("ethics") || text.includes("integrity") || text.includes("aptitude") || text.includes("probity")) return ethicsProfile(text);
  if (text.includes("ir") || text.includes("international")) return irProfile(text);
  if (text.includes("csat")) return csatProfile(text);
  return generalProfile(text);
}

function polityProfile(text) {
  return {
    mentalModel: (base) => `the rulebook and operating system of the Indian State. ${base} decides who has power, how power is limited, and how citizens are protected.`,
    core: (base) => `${base} must be read through constitutional provisions, institutional roles, checks and balances, and the gap between law on paper and governance in practice.`,
    defaultAngle: (base) => `${base} is important because constitutional design becomes meaningful only when institutions work with accountability, independence, and public trust.`,
    facts: (base) => [
      `${base} should be linked with constitutional values: justice, liberty, equality, fraternity, rule of law, and democratic accountability.`,
      "Always identify the institution involved: Parliament, Executive, Judiciary, Election Commission, CAG, Finance Commission, local bodies, or statutory bodies.",
      "Prelims often asks powers, appointment/removal, tenure, jurisdiction, and exceptions.",
      "Mains often asks reform, independence, accountability, transparency, federal balance, and citizen rights.",
      "Use current examples carefully; do not make political claims without institutional framing.",
    ],
    sources: () => [
      "Constitution of India: relevant Parts, Schedules, Articles and Amendments.",
      "Supreme Court judgments where rights, basic structure, judicial review, federalism, or separation of powers is involved.",
      "PRS India for bills, parliamentary functioning, and legislative analysis.",
      "2nd Administrative Reforms Commission for governance and institutional reform themes.",
    ],
    traps: () => [
      "Confusing constitutional body, statutory body, executive body, and regulatory body.",
      "Mixing appointment authority with removal authority.",
      "Assuming all rights are absolute; most rights have reasonable restrictions.",
      "Forgetting federal exceptions such as emergencies, all-India services, and centrally sponsored schemes.",
    ],
    mains: (base) => `Use ${base} to show how constitutional ideals become governance outcomes. A strong answer balances independence with accountability, rights with duties, and legal provisions with implementation challenges.`,
    related: () => ["Constitution", "Fundamental Rights", "DPSP", "Separation of powers", "Judicial review", "Federalism", "Accountability"],
  };
}

function governanceProfile() {
  return {
    mentalModel: (base) => `a service delivery machine. ${base} is about whether government decisions actually reach people in a fair, transparent, timely, and accountable way.`,
    core: (base) => `${base} should be understood through citizens, institutions, processes, transparency tools, grievance redressal, technology, and last-mile delivery.`,
    defaultAngle: (base) => `${base} becomes a UPSC answer when you connect administrative capacity with citizen trust and measurable outcomes.`,
    facts: () => [
      "Governance answers improve when you mention transparency, accountability, participation, responsiveness, effectiveness, equity, and rule of law.",
      "Digital tools help only when access, literacy, privacy, and accountability are handled.",
      "Citizen-centric governance needs grievance redressal, service standards, and feedback loops.",
      "Civil society, media, pressure groups, and local bodies act as accountability channels.",
      "Implementation gaps usually come from capacity, coordination, corruption, data quality, and weak monitoring.",
    ],
    sources: () => ["2nd ARC reports", "RTI Act", "Citizen Charter framework", "Digital India", "Mission Karmayogi", "PIB releases on governance reforms"],
    traps: () => ["Treating technology as a complete solution.", "Ignoring privacy and exclusion risks.", "Writing only problems without reforms.", "Confusing transparency with accountability."],
    mains: (base) => `For ${base}, structure the answer as need -> mechanisms -> challenges -> reforms -> citizen outcome.`,
    related: () => ["Accountability", "Transparency", "RTI", "E-governance", "Citizen Charter", "Civil services reform"],
  };
}

function economyProfile() {
  return {
    mentalModel: (base) => `the blood circulation of society. ${base} affects income, prices, jobs, investment, government capacity, and household welfare.`,
    core: (base) => `${base} should be read through definitions, indicators, causes, policy instruments, institutions, trade-offs, and impact on different groups.`,
    defaultAngle: (base) => `${base} matters because economic policy is always a balance between growth, stability, equity, and sustainability.`,
    facts: () => [
      "Always define the indicator precisely before analysing it.",
      "Mention key institutions where relevant: RBI, Finance Ministry, GST Council, SEBI, NABARD, NITI Aayog, banks, and regulators.",
      "Separate short-term causes from structural causes.",
      "Analyse impact on households, firms, government finances, exports, employment, and vulnerable sections.",
      "Use Economic Survey, Budget, RBI reports, or national data sources as evidence.",
    ],
    sources: () => ["Economic Survey", "Union Budget", "RBI reports", "NITI Aayog reports", "MOSPI data", "World Bank/IMF only when comparative context is useful"],
    traps: () => ["Confusing nominal and real values.", "Ignoring inflation adjustment.", "Treating correlation as causation.", "Forgetting lag effects of monetary/fiscal policy."],
    mains: (base) => `For ${base}, use definition -> trend/causes -> impact -> policy response -> way forward.`,
    related: () => ["Inflation", "Fiscal policy", "Monetary policy", "Growth", "Employment", "Inclusive development", "Banking"],
  };
}

function geographyProfile() {
  return {
    mentalModel: (base) => `a cause-and-effect map. ${base} explains how physical processes, location, resources, climate, people, and economy shape each other.`,
    core: (base) => `${base} should be understood through maps, processes, spatial distribution, examples, and human-environment interaction.`,
    defaultAngle: (base) => `${base} becomes exam-ready when you can draw a simple diagram or map and explain why the pattern exists.`,
    facts: () => [
      "Locate the phenomenon on a map wherever possible.",
      "Explain process, distribution, factors, and consequences separately.",
      "Use Indian examples along with global examples when relevant.",
      "Connect physical geography to agriculture, disasters, resources, settlements, and economy.",
      "For Mains, diagrams and flowcharts improve clarity and save words.",
    ],
    sources: () => ["NCERT Geography", "Atlas maps", "IMD for climate/weather", "NDMA for disaster themes", "MoEFCC for environment overlap"],
    traps: () => ["Memorising locations without process.", "Ignoring seasonal variation.", "Mixing weather and climate.", "Drawing maps without labels or direction."],
    mains: (base) => `For ${base}, write process -> spatial distribution -> Indian examples -> impact -> management/way forward.`,
    related: () => ["Physical geography", "Climatology", "Resources", "Disasters", "Agriculture", "Environment"],
  };
}

function historyProfile(text) {
  return {
    mentalModel: (base) => `a timeline of causes and consequences. ${base} makes sense when you know what came before, what changed, and why it mattered later.`,
    core: (base) => `${base} should be studied through chronology, actors, causes, events, consequences, sources, and historiographical significance.`,
    defaultAngle: (base) => `${base} is useful for UPSC when facts are connected to themes like state formation, society, economy, culture, nationalism, reform, and continuity/change.`,
    facts: () => [
      "Build a clear timeline before memorising details.",
      "Separate political, economic, social, cultural, and ideological causes.",
      "Remember important personalities with their contribution, not just names.",
      "For art and culture, connect features with period, patronage, region, and examples.",
      "For modern history, link events to nationalism, colonial policy, mass participation, and constitutional development.",
    ],
    sources: () => ["NCERT History", "Spectrum/standard modern history references for revision", "ASI for culture themes", "Government museums/archive references where useful"],
    traps: () => ["Wrong chronology.", "Confusing similar movements or dynasties.", "Memorising personalities without contribution.", "Ignoring socio-economic background."],
    mains: (base) => `For ${base}, use background -> causes -> key developments -> impact -> historical significance.`,
    related: () => text.includes("modern") || text.includes("freedom") ? ["Revolt of 1857", "Gandhian phase", "Constitutional development", "Social reform"] : ["Ancient India", "Medieval India", "Art and Culture", "Sources of history"],
  };
}

function societyProfile() {
  return {
    mentalModel: (base) => `a living web of groups, identities, institutions, norms, and change. ${base} shows how people experience development differently.`,
    core: (base) => `${base} should be read through social structure, change, inequality, identity, constitutional values, policy response, and lived examples.`,
    defaultAngle: (base) => `${base} matters because development is incomplete if it ignores dignity, equity, inclusion, and social harmony.`,
    facts: () => [
      "Use concepts like diversity, inequality, patriarchy, social mobility, secularism, regionalism, urbanisation, and globalisation carefully.",
      "Mention constitutional values and social justice where relevant.",
      "Add examples from census, NFHS, NCRB, NSS, or government schemes when available.",
      "Avoid moral lectures; write analytical causes and practical solutions.",
      "Balance challenges with examples of reform, participation, and community resilience.",
    ],
    sources: () => ["NCERT Sociology", "Census/NFHS where relevant", "Ministry reports", "Social Justice/Women and Child Development schemes", "NITI Aayog indices"],
    traps: () => ["Using stereotypes.", "Writing only emotional points.", "Ignoring regional variation.", "Confusing secularism, communalism and pluralism."],
    mains: (base) => `For ${base}, write concept -> causes/trends -> impact on groups -> policy response -> inclusive way forward.`,
    related: () => ["Indian society", "Social justice", "Women", "Urbanisation", "Population", "Secularism", "Regionalism"],
  };
}

function environmentProfile() {
  return {
    mentalModel: (base) => `a balance system. ${base} is about how ecosystems stay stable, what disturbs them, and how policy can protect both nature and livelihoods.`,
    core: (base) => `${base} should be studied through definitions, ecological processes, threats, conservation instruments, laws, institutions, and India-specific examples.`,
    defaultAngle: (base) => `${base} becomes UPSC-relevant when you connect ecology with economy, climate risk, local communities, and sustainable development.`,
    facts: () => [
      "Start with exact ecological definitions.",
      "Remember protected areas, conventions, species, pollutants, and regulatory bodies where relevant.",
      "Connect environmental issues with agriculture, health, disaster risk, and livelihoods.",
      "Use MoEFCC, IPCC, UNFCCC, CBD, Ramsar, CITES, and national missions appropriately.",
      "Mains answers need balance: conservation plus development plus community participation.",
    ],
    sources: () => ["MoEFCC", "IPCC reports", "UNFCCC/CBD/Ramsar/CITES", "National Action Plan on Climate Change", "NCERT Biology ecology chapters"],
    traps: () => ["Confusing national parks, wildlife sanctuaries and biosphere reserves.", "Mixing conventions.", "Using vague climate language without mechanism.", "Ignoring local communities."],
    mains: (base) => `For ${base}, use definition -> causes/threats -> impacts -> laws/schemes -> sustainable way forward.`,
    related: () => ["Biodiversity", "Climate change", "Pollution", "Conservation", "Disaster management", "Sustainable development"],
  };
}

function ethicsProfile() {
  return {
    mentalModel: (base) => `a decision compass. ${base} helps a public servant choose what is legal, fair, humane, and publicly defensible.`,
    core: (base) => `${base} should be prepared through definitions, examples, administrative relevance, dilemmas, and application in case studies.`,
    defaultAngle: (base) => `${base} matters because governance fails when competence is not supported by values and accountability.`,
    facts: () => [
      "Define the value/concept in simple language.",
      "Connect it with public service: impartiality, integrity, empathy, accountability, courage, and objectivity.",
      "Use examples from administration, daily life, or public institutions.",
      "Case studies need stakeholders, ethical issues, options, consequences, and final decision.",
      "Avoid preachy writing; show practical judgment.",
    ],
    sources: () => ["ARC ethics references", "Nolan principles", "Code of conduct themes", "Constitutional morality", "Administrative examples"],
    traps: () => ["Writing slogans instead of application.", "Ignoring stakeholders.", "Choosing extreme options.", "Forgetting legality and feasibility."],
    mains: (base) => `For ${base}, write definition -> importance in civil service -> example -> challenge -> practical application.`,
    related: () => ["Integrity", "Aptitude", "Attitude", "Probity", "Emotional intelligence", "Case studies"],
  };
}

function irProfile() {
  return {
    mentalModel: (base) => `a chessboard of interests. ${base} is about how geography, economy, security, values, diaspora, and global institutions shape India's choices.`,
    core: (base) => `${base} should be read through national interest, neighbourhood, strategic autonomy, multilateral institutions, trade, security, and current events.`,
    defaultAngle: (base) => `${base} is important because India's external policy must balance principles, power, economics, and regional stability.`,
    facts: () => [
      "Always locate the issue geographically.",
      "Mention India's interests: security, trade, energy, diaspora, technology, maritime routes, and global influence.",
      "Use MEA language where possible: strategic autonomy, neighbourhood first, SAGAR, Act East, Global South.",
      "Separate bilateral, regional, and multilateral dimensions.",
      "Mains answers need challenges and way forward, not just background.",
    ],
    sources: () => ["MEA", "Parliament questions on foreign policy", "Joint statements", "International organisations' official pages"],
    traps: () => ["Writing newspaper opinion without facts.", "Ignoring India's national interest.", "Confusing organisations and memberships.", "Using outdated geopolitical context."],
    mains: (base) => `For ${base}, use background -> India's interests -> challenges -> recent developments -> way forward.`,
    related: () => ["Neighbourhood policy", "Multilateralism", "India-US", "India-China", "Indian Ocean", "Global South"],
  };
}

function csatProfile() {
  return {
    mentalModel: (base) => `a speed-and-accuracy filter. ${base} tests whether you can understand information, avoid traps, and solve under time pressure.`,
    core: (base) => `${base} should be prepared with methods, timed practice, error logs, and repeated exposure to question types.`,
    defaultAngle: (base) => `${base} matters because CSAT is qualifying but can still eliminate strong GS candidates.`,
    facts: () => [
      "Accuracy matters more than attempting everything.",
      "Comprehension requires identifying author's tone, assumption, inference, and central idea.",
      "Reasoning questions need diagrams, cases, and elimination.",
      "Numeracy improves with formula recall plus timed drills.",
      "Maintain an error log for trap types.",
    ],
    sources: () => ["UPSC CSAT papers", "NCERT basic maths", "Reasoning practice sets"],
    traps: () => ["Over-attempting.", "Reading options before understanding the passage.", "Calculation without approximation.", "Missing keywords such as only, all, most, cannot."],
    mains: (base) => `Not a Mains topic; prepare through timed drills and error analysis.`,
    related: () => ["Reading comprehension", "Logical reasoning", "Basic numeracy", "Data interpretation"],
  };
}

function generalProfile() {
  return {
    mentalModel: (base) => `a UPSC building block. ${base} becomes useful when you can define it, connect it to the syllabus, apply it to examples, and answer questions from it.`,
    core: (base) => `${base} should be prepared through definition, background, dimensions, examples, current relevance, and practice questions.`,
    defaultAngle: (base) => `${base} matters because UPSC rewards connected understanding, not isolated memorisation.`,
    facts: (base) => [
      `Define ${base} precisely.`,
      "Locate it in the syllabus and exam stage.",
      "Add one static fact and one current example.",
      "Connect it with institutions, policies, reports, maps, judgments, or schemes where relevant.",
      "Practise both MCQs and a short answer.",
    ],
    sources: () => ["NCERT where relevant", "Wikipedia summary for first reading", "PIB/PRS/government source links", "Standard syllabus notes"],
    traps: () => ["Vague definition.", "No example.", "No syllabus linkage.", "Only memorisation without application."],
    mains: (base) => `For ${base}, use definition -> dimensions -> example -> challenge -> way forward.`,
    related: () => ["Syllabus tracker", "NCERT chapter", "Practice MCQs", "Flashcards"],
  };
}

async function fetchAllTopics() {
  const rows = [];
  const selectWithQuality = "key,title,subject,structured_notes,wiki_slug,govt_sources,ncert_refs,content_quality";
  const selectWithoutQuality = "key,title,subject,structured_notes,wiki_slug,govt_sources,ncert_refs";
  let select = selectWithQuality;

  for (let from = 0; ; from += 1000) {
    let { data, error } = await supabase.from("topics").select(select).order("key", { ascending: true }).range(from, from + 999);
    if (error?.code === "42703" && select === selectWithQuality) {
      select = selectWithoutQuality;
      rows.length = 0;
      from = -1000;
      continue;
    }
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }

  return rows;
}

function chunks(items, size) {
  const output = [];
  for (let index = 0; index < items.length; index += size) output.push(items.slice(index, index + size));
  return output;
}

function lensAngle(lens, base, profile) {
  const text = lens.toLowerCase();
  if (text.includes("definition")) return `Here the focus is conceptual clarity: define ${base}, separate it from similar terms, and know the minimum facts needed to identify it in MCQs.`;
  if (text.includes("current")) return `Here the focus is current affairs linkage: connect ${base} with recent schemes, reports, judgments, international events, disasters, economic trends, or policy debates.`;
  if (text.includes("policy")) return `Here the focus is policy challenge: explain why ${base} is difficult to implement, who is affected, and what reforms can make it practical.`;
  if (text.includes("way forward")) return `Here the focus is solution design: write reforms that are specific, feasible, institutionally grounded, and balanced.`;
  if (text.includes("historical")) return `Here the focus is background: show how ${base} evolved and why that evolution matters for present governance or society.`;
  if (text.includes("committee") || text.includes("report")) return `Here the focus is evidence: add committees, reports, data sources, judgments, schemes, or official recommendations that make the answer credible.`;
  if (text.includes("constitutional") || text.includes("institutional")) return `Here the focus is institutions: identify the constitutional/legal body, its powers, limits, accountability, and real-world performance.`;
  if (text.includes("implementation")) return `Here the focus is implementation bottleneck: identify capacity, coordination, funding, awareness, data, technology, federalism, and monitoring gaps.`;
  return profile.defaultAngle(base);
}

function isOldFallback(notes) {
  return String(notes ?? "").includes("Start with the exact definition and scope") || String(notes ?? "").includes("Use this slot for Supreme Court judgments");
}

function isStructuredJson(notes) {
  if (typeof notes !== "string" || !notes.trim().startsWith("{")) return false;
  try {
    const parsed = JSON.parse(notes);
    return Boolean(parsed && typeof parsed === "object" && (parsed.full_notes || parsed.analogy || parsed.concise_notes));
  } catch {
    return false;
  }
}
