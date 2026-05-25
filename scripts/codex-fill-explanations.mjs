import { createClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "./script-env.mjs";

const { url, serviceKey } = requireSupabaseEnv();
const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: questions, error } = await supabase
  .from("questions")
  .select("id, question_text, topic_key, question_options(option_label, option_text, is_correct)")
  .is("explanation", null)
  .limit(500);

if (error) throw error;

let updated = 0;
const failed = [];

for (const question of questions ?? []) {
  try {
    const explanation = buildExplanation(question);
    const { error: updateError } = await supabase
      .from("questions")
      .update({
        explanation,
        source_label: "ClearUPSC Pattern",
      })
      .eq("id", question.id);

    if (updateError) throw updateError;
    updated += 1;
  } catch (err) {
    failed.push({ id: question.id, error: err.message });
  }
}

console.log(
  JSON.stringify(
    {
      fetched: questions?.length ?? 0,
      updated,
      failed: failed.length,
      failedIds: failed.map((item) => item.id),
    },
    null,
    2,
  ),
);

function buildExplanation(question) {
  const topic = titleFromKey(question.topic_key);
  const stem = String(question.question_text ?? "");
  const options = Array.isArray(question.question_options) ? question.question_options : [];
  const correct = options.find((option) => option?.is_correct);
  const correctText = correct?.option_text ? String(correct.option_text) : "the option that best matches the concept and source context";
  const domain = domainFor(question.topic_key, stem);

  if (domain === "csat") {
    return `The correct answer is "${correctText}" because CSAT rewards the option that follows from the given condition or passage without adding outside assumptions. For ${topic}, eliminate extreme choices and choose the answer most directly supported by the wording.`;
  }

  if (domain === "polity") {
    return `The correct answer is "${correctText}" because it links ${topic} to the proper constitutional, legal or institutional logic. UPSC polity questions often test exact functions, body type, article-based reasoning and the difference between rights, duties, policies and procedures.`;
  }

  if (domain === "economy") {
    return `The correct answer is "${correctText}" because it explains ${topic} through its economic mechanism, indicator, institution or policy effect. UPSC economy questions reward cause-effect clarity and source-based understanding from the Budget, Economic Survey, RBI or standard NCERT base.`;
  }

  if (domain === "environment") {
    return `The correct answer is "${correctText}" because it treats ${topic} as an ecology-governance issue with legal, scientific and sustainability dimensions. UPSC commonly traps aspirants by mixing up mitigation, adaptation, conservation, pollution control and institutional responsibility.`;
  }

  if (domain === "history") {
    return `The correct answer is "${correctText}" because it places ${topic} in the correct chronology, feature, cause or consequence. UPSC history questions reward understanding of processes and movements rather than isolated memorisation of dates.`;
  }

  if (domain === "geography") {
    return `The correct answer is "${correctText}" because it connects ${topic} with location, process, resource distribution or human impact. UPSC geography questions often test map sense, causal chains and distinctions between similar physical or regional terms.`;
  }

  if (domain === "ethics") {
    return `The correct answer is "${correctText}" because it applies ${topic} to public service values, stakeholders, consequences and feasible conduct. UPSC ethics answers must avoid slogans and show balanced judgment rooted in integrity, empathy and accountability.`;
  }

  if (domain === "science") {
    return `The correct answer is "${correctText}" because it links ${topic} with real-world application, institutional context and governance implications. UPSC science and technology questions test how a technology works, why it matters for India and what safeguards are needed.`;
  }

  if (domain === "security") {
    return `The correct answer is "${correctText}" because it treats ${topic} as a security-governance issue involving law, institutions, technology and coordination. UPSC expects balance between effective response, civil liberties, federal roles and long-term capacity building.`;
  }

  return `The correct answer is "${correctText}" because it connects ${topic} with definition, source-backed facts, examples and exam application. UPSC usually tests whether aspirants can avoid absolute statements, mismatched institutions and unsupported conclusions.`;
}

function domainFor(topicKey, stem) {
  const text = `${topicKey ?? ""} ${stem ?? ""}`.toLowerCase();
  if (text.includes("csat") || text.includes("comprehension") || text.includes("reasoning") || text.includes("numeracy")) return "csat";
  if (text.includes("polity") || text.includes("constitution") || text.includes("judiciary") || text.includes("parliament") || text.includes("governance")) return "polity";
  if (text.includes("economy") || text.includes("budget") || text.includes("inflation") || text.includes("banking") || text.includes("agriculture")) return "economy";
  if (text.includes("environment") || text.includes("ecology") || text.includes("biodiversity") || text.includes("climate")) return "environment";
  if (text.includes("history") || text.includes("ancient") || text.includes("medieval") || text.includes("modern") || text.includes("freedom")) return "history";
  if (text.includes("geography") || text.includes("monsoon") || text.includes("river") || text.includes("resource")) return "geography";
  if (text.includes("ethics") || text.includes("integrity") || text.includes("probity")) return "ethics";
  if (text.includes("science") || text.includes("technology") || text.includes("space") || text.includes("biotech")) return "science";
  if (text.includes("security") || text.includes("terror") || text.includes("border") || text.includes("cyber")) return "security";
  return "general";
}

function titleFromKey(key) {
  return String(key || "this topic")
    .replace(/^gs\d_/, "")
    .replace(/^csat_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
