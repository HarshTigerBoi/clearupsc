import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { join } from "node:path";

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

const { data: topics, error: fetchError } = await supabase
  .from("topics")
  .select("key,title,subject,parent_key")
  .order("key", { ascending: true })
  .range(0, 49);

if (fetchError) throw fetchError;

const NOTES = {
  csat_comprehension: csatComprehensionNote("Comprehension", "master topic"),
  csat_comprehension_assumption: csatComprehensionNote("Assumption", "assumption"),
  csat_comprehension_assumption_committee_or_report_relevance: csatComprehensionNote("Assumption: committee or report relevance", "committee_report"),
  csat_comprehension_assumption_constitutional_or_institutional_angle: csatComprehensionNote("Assumption: constitutional or institutional angle", "institutional"),
  csat_comprehension_assumption_current_affairs_linkage: csatComprehensionNote("Assumption: current affairs linkage", "current_affairs"),
  csat_comprehension_assumption_definition_and_conceptual_clarity: csatComprehensionNote("Assumption: definition and conceptual clarity", "definition"),
  csat_comprehension_assumption_historical_background: csatComprehensionNote("Assumption: historical background", "history"),
  csat_comprehension_assumption_implementation_bottleneck: csatComprehensionNote("Assumption: implementation bottleneck", "implementation"),
  csat_comprehension_assumption_policy_challenge: csatComprehensionNote("Assumption: policy challenge", "policy"),
  csat_comprehension_assumption_way_forward: csatComprehensionNote("Assumption: way forward", "way_forward"),
  csat_comprehension_inference: csatComprehensionNote("Inference", "inference"),
  csat_comprehension_inference_committee_or_report_relevance: csatComprehensionNote("Inference: committee or report relevance", "committee_report"),
  csat_comprehension_inference_constitutional_or_institutional_angle: csatComprehensionNote("Inference: constitutional or institutional angle", "institutional"),
  csat_comprehension_inference_current_affairs_linkage: csatComprehensionNote("Inference: current affairs linkage", "current_affairs"),
  csat_comprehension_inference_definition_and_conceptual_clarity: csatComprehensionNote("Inference: definition and conceptual clarity", "definition"),
  csat_comprehension_inference_historical_background: csatComprehensionNote("Inference: historical background", "history"),
  csat_comprehension_inference_implementation_bottleneck: csatComprehensionNote("Inference: implementation bottleneck", "implementation"),
  csat_comprehension_inference_policy_challenge: csatComprehensionNote("Inference: policy challenge", "policy"),
  csat_comprehension_inference_way_forward: csatComprehensionNote("Inference: way forward", "way_forward"),
  csat_comprehension_main_idea: csatComprehensionNote("Main idea", "main_idea"),
  csat_comprehension_main_idea_committee_or_report_relevance: csatComprehensionNote("Main idea: committee or report relevance", "committee_report"),
  csat_comprehension_main_idea_constitutional_or_institutional_angle: csatComprehensionNote("Main idea: constitutional or institutional angle", "institutional"),
  csat_comprehension_main_idea_current_affairs_linkage: csatComprehensionNote("Main idea: current affairs linkage", "current_affairs"),
  csat_comprehension_main_idea_definition_and_conceptual_clarity: csatComprehensionNote("Main idea: definition and conceptual clarity", "definition"),
  csat_comprehension_main_idea_historical_background: csatComprehensionNote("Main idea: historical background", "history"),
  csat_comprehension_main_idea_implementation_bottleneck: csatComprehensionNote("Main idea: implementation bottleneck", "implementation"),
  csat_comprehension_main_idea_policy_challenge: csatComprehensionNote("Main idea: policy challenge", "policy"),
  csat_comprehension_main_idea_way_forward: csatComprehensionNote("Main idea: way forward", "way_forward"),
  csat_comprehension_reading_comprehension: csatComprehensionNote("Reading comprehension", "reading_comprehension"),
  csat_comprehension_reading_comprehension_committee_or_report_relevance: csatComprehensionNote("Reading comprehension: committee or report relevance", "committee_report"),
  csat_comprehension_reading_comprehension_constitutional_or_institutional_angle: csatComprehensionNote("Reading comprehension: constitutional or institutional angle", "institutional"),
  csat_comprehension_reading_comprehension_current_affairs_linkage: csatComprehensionNote("Reading comprehension: current affairs linkage", "current_affairs"),
  csat_comprehension_reading_comprehension_definition_and_conceptual_clarity: csatComprehensionNote("Reading comprehension: definition and conceptual clarity", "definition"),
  csat_comprehension_reading_comprehension_historical_background: csatComprehensionNote("Reading comprehension: historical background", "history"),
  csat_comprehension_reading_comprehension_implementation_bottleneck: csatComprehensionNote("Reading comprehension: implementation bottleneck", "implementation"),
  csat_comprehension_reading_comprehension_policy_challenge: csatComprehensionNote("Reading comprehension: policy challenge", "policy"),
  csat_comprehension_reading_comprehension_way_forward: csatComprehensionNote("Reading comprehension: way forward", "way_forward"),
  csat_comprehension_tone: csatComprehensionNote("Tone", "tone"),
  csat_comprehension_tone_committee_or_report_relevance: csatComprehensionNote("Tone: committee or report relevance", "committee_report"),
  csat_comprehension_tone_constitutional_or_institutional_angle: csatComprehensionNote("Tone: constitutional or institutional angle", "institutional"),
  csat_comprehension_tone_current_affairs_linkage: csatComprehensionNote("Tone: current affairs linkage", "current_affairs"),
  csat_comprehension_tone_definition_and_conceptual_clarity: csatComprehensionNote("Tone: definition and conceptual clarity", "definition"),
  csat_comprehension_tone_historical_background: csatComprehensionNote("Tone: historical background", "history"),
  csat_comprehension_tone_implementation_bottleneck: csatComprehensionNote("Tone: implementation bottleneck", "implementation"),
  csat_comprehension_tone_policy_challenge: csatComprehensionNote("Tone: policy challenge", "policy"),
  csat_comprehension_tone_way_forward: csatComprehensionNote("Tone: way forward", "way_forward"),
  csat_numeracy: csatNumeracyNote("Numeracy", "master topic"),
  csat_numeracy_average: csatNumeracyNote("Average", "average"),
  csat_numeracy_average_committee_or_report_relevance: csatNumeracyNote("Average: committee or report relevance", "committee_report"),
  csat_numeracy_average_constitutional_or_institutional_angle: csatNumeracyNote("Average: constitutional or institutional angle", "institutional"),
};

let upserted = 0;
let failed = 0;
const failures = [];

for (const topic of topics ?? []) {
  const notes = NOTES[topic.key];
  if (!notes) {
    failed += 1;
    failures.push({ key: topic.key, error: "No hardcoded notes found" });
    continue;
  }

  const updatePayload = {
    structured_notes: notes,
    content_quality: "human_review_needed",
    wiki_slug: topic.title.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""),
  };

  let { error } = await supabase.from("topics").update(updatePayload).eq("key", topic.key);
  if (error) {
    const fallback = await supabase
      .from("topics")
      .update({ ...updatePayload, structured_notes: JSON.stringify(notes) })
      .eq("key", topic.key);
    error = fallback.error;
  }
  if (error) {
    const minimal = await supabase
      .from("topics")
      .update({ structured_notes: JSON.stringify(notes), wiki_slug: updatePayload.wiki_slug })
      .eq("key", topic.key);
    error = minimal.error;
  }

  if (error) {
    failed += 1;
    failures.push({ key: topic.key, error: error.message });
  } else {
    upserted += 1;
    console.log(`[${upserted}/${topics.length}] upserted ${topic.key}`);
  }
}

console.log(JSON.stringify({ requested: topics?.length ?? 0, upserted, failed, failures }, null, 2));

function csatComprehensionNote(title, focus) {
  const concept = title.split(":")[0];
  const focusLine = focusExplanation(focus, concept);
  return {
    analogy: `Think of ${concept} like listening to a careful witness: you must separate what is said, what is implied, and what is never proven.`,
    full_notes: `## ${title}\n\n### Definition and exam role\n${concept} is a core part of CSAT reading comprehension. In the Civil Services Preliminary Examination, General Studies Paper II is the CSAT paper. It carries 200 marks, has 80 questions, is qualifying in nature, and the qualifying standard is 33 percent. Wrong answers in objective papers carry a one-third negative mark for that question. This makes comprehension less about literary appreciation and more about disciplined evidence reading.\n\n### How UPSC tests it\nUPSC passages are usually drawn from themes such as governance, economy, environment, ethics, science, society, education and public policy. The question may ask for the main idea, inference, assumption, tone, implication, or the most logical conclusion. The correct option is normally supported by the passage, not by outside knowledge. Strong GS knowledge can help with context, but it can also mislead if the option goes beyond the author's words.\n\n### Method\nRead the question stem first, then read the passage with a pencil-like mental filter. Mark contrast words such as however, although, yet, but and nevertheless. Mark conclusion words such as therefore, hence, thus and consequently. For ${concept}, ask: what must be true for the author’s argument to stand? What follows from the given lines? What is the author’s central claim? ${focusLine}\n\n### Institutional and syllabus basis\nCSAT is conducted by UPSC, a constitutional body under Articles 315 to 323 of the Constitution. Article 320 mentions the functions of Public Service Commissions, including examinations for appointments to services. In preparation terms, CSAT is not a scoring paper for ranking, but failure to cross 33 percent means the GS Paper I score is not considered. Therefore, it is a gatekeeping paper.\n\n### Practice strategy\nUse 20 to 25 minutes daily for passages. After every wrong answer, classify the error: outside knowledge, extreme word, opposite option, half-true option, wrong tone, or unsupported inference. Over time, this error log matters more than reading random passages. A safe rule is: the answer must be inside the passage, logically necessary from the passage, or the least distorted summary of it.`,
    concise_notes: [
      { term: "CSAT", definition: "General Studies Paper II of UPSC Prelims; qualifying paper with 33 percent minimum." },
      { term: "Comprehension", definition: "Understanding the author’s stated and implied meaning from a passage." },
      { term: "Assumption", definition: "An unstated idea that must be true for the argument to work." },
      { term: "Inference", definition: "A conclusion that logically follows from the passage, without adding outside facts." },
      { term: "Main idea", definition: "The central message around which the whole passage is organised." },
      { term: "Tone", definition: "The author’s attitude, such as critical, cautious, optimistic, neutral or concerned." },
      { term: "Extreme option", definition: "An option using words like always, never, only or completely without passage support." },
      { term: "One-third negative marking", definition: "Penalty for wrong objective answers in UPSC Prelims papers." },
      { term: "Article 320", definition: "Constitutional provision connected with functions of Public Service Commissions." },
      { term: "33 percent rule", definition: "Minimum qualifying marks required in CSAT for evaluation of Prelims result." },
    ],
    revision_bullets: [
      "CSAT is qualifying with 33 percent minimum.",
      "Paper II has 80 questions for 200 marks.",
      "Wrong answers carry one-third negative marking.",
      "Answer only from passage evidence.",
      "Outside knowledge is a common trap.",
      "Extreme words often make options wrong.",
      "Assumption must be necessary, not merely possible.",
      "Inference must follow logically from given lines.",
      "Tone questions test author attitude.",
      "Maintain an error log after every passage.",
    ],
    mindmap: ["CSAT comprehension", "question stem", "passage evidence", "main idea", "assumption", "inference"],
    cases: [
      { name: "UPSC Civil Services Examination Scheme", point: "Defines CSAT as General Studies Paper II, qualifying at 33 percent." },
      { name: "Constitution Articles 315-323", point: "Provide constitutional basis for Public Service Commissions." },
      { name: "Article 320", point: "Mentions functions of Public Service Commissions, including examinations." },
    ],
    schemes: [
      { name: "UPSC Prelims GS Paper II", point: "80-question, 200-mark qualifying paper popularly called CSAT." },
      { name: "33 percent qualifying standard", point: "Candidate must clear this threshold for Prelims evaluation." },
      { name: "Negative marking rule", point: "One-third mark assigned to a question is deducted for a wrong answer." },
    ],
    ncert_coverage: [
      "Class 6 English Honeysuckle: reading passages",
      "Class 7 English Honeycomb: comprehension and vocabulary",
      "Class 8 English Honeydew: inference and theme",
      "Class 9 English Beehive: prose comprehension",
      "Class 10 English First Flight: tone and central idea",
    ],
    prelims_traps: [
      "Choosing an option because it is factually true but not passage-supported.",
      "Treating a possible inference as a necessary inference.",
      "Ignoring qualifiers such as some, most, may, can and only.",
    ],
    mains_angles: [
      "GS Paper II angle: fairness and aptitude testing in civil service recruitment.",
      "GS Paper IV angle: comprehension as a tool for ethical decision-making.",
      "Essay angle: language, reasoning and administrative judgement.",
    ],
  };
}

function csatNumeracyNote(title, focus) {
  const concept = title.split(":")[0];
  const focusLine = focus === "average"
    ? "For average questions, remember that total = average x number of observations; most traps change the total or count after adding/removing observations."
    : focusExplanation(focus, concept);
  return {
    analogy: `Think of ${concept} like checking a shop bill: one small arithmetic slip can change the whole conclusion.`,
    full_notes: `## ${title}\n\n### Definition and exam role\n${concept} belongs to the numeracy part of CSAT, the General Studies Paper II of UPSC Prelims. CSAT is qualifying, but it is decisive because a candidate must secure at least 33 percent. The paper has 80 questions for 200 marks and uses objective-type negative marking. Numeracy questions normally come from basic arithmetic, averages, percentages, ratio, time and work, speed and distance, data interpretation and logical calculation.\n\n### Core concept\nNumeracy in CSAT is not advanced mathematics. UPSC tests whether a candidate can read a condition, convert it into a simple equation, avoid unnecessary calculation and estimate safely under time pressure. For ${concept}, the first job is to identify the quantity being asked. Then write the relation in symbols. ${focusLine}\n\n### Average method\nAverage means total divided by number of items. If the average of 5 numbers is 20, their total is 100. If one number is added, removed, replaced, or corrected, update the total first and then divide by the new count. Weighted average appears when groups have different sizes; never average the averages unless the group sizes are equal.\n\n### Exam facts and strategy\nThe CSAT paper is conducted by UPSC under its constitutional role as a Public Service Commission. Articles 315 to 323 deal with Public Service Commissions; Article 320 includes examinations among their functions. In practice, CSAT numeracy rewards speed, accuracy and option elimination. Learn multiplication tables, fraction-percentage conversions, squares up to 30, cubes up to 15 and common ratio conversions.\n\n### Practice strategy\nDo not spend five minutes on a single arithmetic question. Mark and move if the equation is not visible within one minute. Use approximation where options are far apart. Maintain an error log with categories such as misread data, wrong unit, calculation slip, forgot formula, and over-attempt. This is how numeracy becomes predictable rather than frightening.`,
    concise_notes: [
      { term: "Average", definition: "Sum of observations divided by the number of observations." },
      { term: "Weighted average", definition: "Average calculated after considering the size or weight of each group." },
      { term: "Total", definition: "Average multiplied by number of observations." },
      { term: "Percentage", definition: "A number expressed as parts per hundred." },
      { term: "Ratio", definition: "Comparison of two quantities by division." },
      { term: "Approximation", definition: "Using near values to estimate quickly when exact calculation is unnecessary." },
      { term: "Unit check", definition: "Verifying whether the answer should be in rupees, percent, days, km or another unit." },
      { term: "CSAT", definition: "UPSC Prelims General Studies Paper II, qualifying at 33 percent." },
      { term: "Negative marking", definition: "One-third of the question’s marks is deducted for a wrong answer." },
      { term: "Article 320", definition: "Constitutional provision linked with PSC examination functions." },
    ],
    revision_bullets: [
      "Average equals total divided by count.",
      "Total equals average multiplied by count.",
      "Never average averages without group sizes.",
      "Check units before marking answer.",
      "Use approximation when options are far apart.",
      "CSAT needs 33 percent qualifying marks.",
      "Paper II has 80 questions and 200 marks.",
      "Wrong answers carry one-third penalty.",
      "Move on if equation is unclear.",
      "Maintain a calculation error log.",
    ],
    mindmap: ["CSAT numeracy", "average", "total", "count", "weighted average", "unit check"],
    cases: [
      { name: "UPSC Civil Services Examination Scheme", point: "Places numeracy inside qualifying GS Paper II." },
      { name: "Article 320", point: "Constitutional basis for PSC examination functions." },
      { name: "NCERT Mathematics curriculum", point: "Provides school-level arithmetic foundation for CSAT." },
    ],
    schemes: [
      { name: "UPSC Prelims GS Paper II", point: "Qualifying CSAT paper with arithmetic and reasoning questions." },
      { name: "33 percent qualifying standard", point: "Minimum score required for CSAT clearance." },
      { name: "Negative marking rule", point: "Discourages blind guessing in objective questions." },
    ],
    ncert_coverage: [
      "Class 6 Mathematics Chapter 12: Ratio and Proportion",
      "Class 7 Mathematics Chapter 8: Comparing Quantities",
      "Class 8 Mathematics Chapter 8: Comparing Quantities",
      "Class 9 Mathematics Chapter 14: Statistics",
      "Class 10 Mathematics Chapter 14: Statistics",
    ],
    prelims_traps: [
      "Averaging two averages without considering different group sizes.",
      "Forgetting to update count after adding or removing an observation.",
      "Confusing percentage-point change with percent change.",
    ],
    mains_angles: [
      "GS Paper II angle: aptitude and minimum reasoning ability in recruitment.",
      "GS Paper III angle: data interpretation for evidence-based administration.",
      "GS Paper IV angle: careful calculation as part of administrative responsibility.",
    ],
  };
}

function focusExplanation(focus, concept) {
  const lines = {
    assumption: `For ${concept}, the hidden bridge is the assumption: the author depends on it but does not say it openly.`,
    inference: `For ${concept}, the answer must be a logical child of the passage, not an imported fact from GS preparation.`,
    main_idea: `For ${concept}, compress the whole passage into one sentence and reject options that describe only one paragraph.`,
    reading_comprehension: `For ${concept}, first understand the structure: issue, reason, evidence, contrast and conclusion.`,
    tone: `For ${concept}, notice adjectives and verbs; they reveal whether the author is critical, hopeful, cautious or neutral.`,
    committee_report: `For ${concept}, treat reports and committees as evidence only if the passage itself mentions or implies them.`,
    institutional: `For ${concept}, remember UPSC itself is constitutionally grounded under Articles 315-323, but passage answers still need textual support.`,
    current_affairs: `For ${concept}, current affairs context helps comprehension but cannot override passage evidence.`,
    definition: `For ${concept}, keep definitions clean: assumption is necessary hidden premise, inference is supported conclusion, tone is attitude.`,
    history: `For ${concept}, understand that CSAT was introduced to test aptitude and later made qualifying, so strategy must match its gatekeeping role.`,
    implementation: `For ${concept}, the bottleneck is usually time pressure, English fatigue, translation confusion and overuse of outside knowledge.`,
    policy: `For ${concept}, the policy challenge is balancing a fair aptitude filter with language diversity and different educational backgrounds.`,
    way_forward: `For ${concept}, the way forward is daily timed practice, bilingual clarity where needed, error logs and selective attempts.`,
  };
  return lines[focus] ?? `For ${concept}, read slowly enough to understand but fast enough to protect time for reasoning and numeracy.`;
}

function loadLocalEnv() {
  const path = join(process.cwd(), ".env.local");
  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}
