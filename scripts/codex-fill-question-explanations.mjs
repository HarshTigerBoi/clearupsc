import { createClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "./script-env.mjs";

const { url, serviceKey } = requireSupabaseEnv();
const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let totalUpdated = 0;
const failed = [];

while (true) {
  const { data: emptyExplanations, error } = await supabase
    .from("questions")
    .select("id, question_text, topic_key")
    .is("explanation", null)
    .limit(500);

  if (error) throw error;
  if (!emptyExplanations?.length) break;

  for (const question of emptyExplanations) {
    try {
      const explanation = generateExplanation(question);
      const { error: updateError } = await supabase
        .from("questions")
        .update({ explanation })
        .eq("id", question.id);

      if (updateError) throw updateError;
      totalUpdated += 1;
    } catch (error) {
      failed.push({ id: question.id, topic_key: question.topic_key, error: error.message });
    }
  }

  console.log(`Updated ${totalUpdated} questions so far.`);
  if (emptyExplanations.length < 500) break;
}

console.log(
  JSON.stringify(
    {
      totalQuestionsUpdated: totalUpdated,
      failed: failed.length,
      failedIds: failed.map((item) => item.id),
    },
    null,
    2,
  ),
);

function generateExplanation(question) {
  const topic = titleFromKey(question.topic_key);
  const stem = String(question.question_text || "");
  const domain = domainFor(question.topic_key, stem);
  const focus = focusFor(stem);

  if (domain === "csat") {
    return `The correct answer must follow from the question's stated condition, not from outside assumptions. For ${topic}, UPSC rewards careful reading, elimination of extreme options, and choosing the option that is most directly supported.`;
  }

  if (domain === "economy") {
    return `The correct option connects ${topic} with its core economic mechanism, institution, or policy effect rather than treating it as a loose fact. In UPSC questions, economy items are usually tested through cause-effect logic, official indicators, schemes, and limits of implementation.`;
  }

  if (domain === "polity") {
    return `The correct option links ${topic} to the relevant constitutional, legal, or institutional framework. UPSC polity questions often look simple but test exact functions, body type, article/provision logic, and the difference between rights, duties, policy and procedure.`;
  }

  if (domain === "environment") {
    return `The correct answer treats ${topic} as an ecology-governance issue, connecting concepts with law, conservation practice, and sustainability. UPSC often traps aspirants by mixing up mitigation, adaptation, biodiversity protection, pollution control, and institutional responsibility.`;
  }

  if (domain === "history") {
    return `The correct option places ${topic} in its proper chronology, cause, feature, or consequence. UPSC history questions reward source-based understanding of processes and movements rather than isolated memorisation of names and dates.`;
  }

  if (domain === "geography") {
    return `The correct answer connects ${topic} with location, physical process, resource pattern, or human impact. UPSC geography questions frequently test map sense, causal chains, and the distinction between similar terms or regions.`;
  }

  if (domain === "ethics") {
    return `The correct option applies ${topic} to public service values, consequences, stakeholders, and feasible administrative conduct. UPSC ethics questions reward balanced judgment, not idealistic slogans or purely legalistic answers.`;
  }

  if (domain === "science") {
    return `The correct answer links ${topic} with its real-world application, institutional context, and governance implications. UPSC science and technology questions usually test how a technology works, why it matters for India, and what risks or safeguards are involved.`;
  }

  if (domain === "security") {
    return `The correct option treats ${topic} as a security-governance problem involving institutions, law, technology, and coordination. UPSC expects a balance between effectiveness, civil liberties, federal roles, and long-term capacity building.`;
  }

  if (focus === "mains") {
    return `The correct answer gives a balanced framework: define ${topic}, add source-backed facts, discuss challenges, and conclude with a practical way forward. UPSC Mains rewards structured analysis over one-sided criticism or unsupported claims.`;
  }

  return `The correct option is the one that connects ${topic} with definition, source-backed facts, examples and exam application. UPSC usually tests whether an aspirant can avoid absolute statements, mismatched institutions and unsupported conclusions.`;
}

function focusFor(stem) {
  const lower = stem.toLowerCase();
  if (lower.includes("mains") || lower.includes("answer-writing") || lower.includes("framework")) return "mains";
  if (lower.includes("source")) return "source";
  if (lower.includes("statement")) return "statement";
  return "concept";
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
