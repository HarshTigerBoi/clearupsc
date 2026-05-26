import { createClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "./script-env.mjs";

const MIGRATION_SQL = `ALTER TABLE current_affairs
  ADD COLUMN IF NOT EXISTS upsc_angle text,
  ADD COLUMN IF NOT EXISTS static_link text,
  ADD COLUMN IF NOT EXISTS prelims_hook text,
  ADD COLUMN IF NOT EXISTS mains_angle text;`;

const { url, serviceKey } = requireSupabaseEnv();
const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: rows, error } = await supabase
  .from("current_affairs")
  .select("id,date,title,summary,tags,upsc_relevance,category,source,source_url")
  .order("date", { ascending: false });

if (error) {
  console.error(error);
  process.exit(1);
}

let updated = 0;
const failed = [];

for (const row of rows ?? []) {
  const enhancement = enhance(row);
  const { error: updateError } = await supabase
    .from("current_affairs")
    .update(enhancement)
    .eq("id", row.id);

  if (updateError) {
    if (updateError.code === "PGRST204" || /upsc_angle|static_link|prelims_hook|mains_angle/i.test(updateError.message ?? "")) {
      console.error("Current affairs columns are missing. Apply this SQL first:\n");
      console.error(MIGRATION_SQL);
      process.exit(1);
    }
    failed.push({ id: row.id, title: row.title, error: updateError.message });
    continue;
  }
  updated += 1;
}

console.log(JSON.stringify({ fetched: rows?.length ?? 0, updated, failed: failed.length, failedRows: failed }, null, 2));

function enhance(row) {
  const text = `${row.title ?? ""} ${row.summary ?? ""} ${Array.isArray(row.tags) ? row.tags.join(" ") : ""} ${row.category ?? ""}`.toLowerCase();
  const domain = classify(text);
  const staticLink = topicFor(domain, text);
  const paper = paperFor(domain);
  const source = row.source ? ` Source: ${row.source}.` : "";
  const title = String(row.title ?? "this development");
  const summary = String(row.summary ?? "");
  const keyFact = extractKeyFact(title, summary, domain);

  return {
    upsc_angle: `${paper}: UPSC can test this as a link between current governance decisions, static syllabus concepts and implementation outcomes.${source}`,
    static_link: staticLink,
    prelims_hook: keyFact,
    mains_angle: `${paper}: Use this as a current example in a 150-word answer on ${mainsTheme(domain)}; write one line on context, one on institutional mechanism, and one on outcome or challenge.`,
  };
}

function classify(text) {
  if (/(climate|heatwave|wetland|forest|biodiversity|pollution|environment|cyclone|disaster)/.test(text)) return "environment";
  if (/(economy|inflation|iip|gdp|bank|rbi|gst|budget|infrastructure|rail|semiconductor|investment|finance|project)/.test(text)) return "economy";
  if (/(science|technology|space|isro|csir|biotech|ai|digital|cyber|communication)/.test(text)) return "science";
  if (/(defence|security|terror|border|operation|military|armed forces)/.test(text)) return "security";
  if (/(mea|foreign|bilateral|india-|neighbour|summit|treaty|global|international)/.test(text)) return "international";
  if (/(education|health|women|employment|rozgar|skill|social|welfare|vulnerable)/.test(text)) return "social";
  return "governance";
}

function topicFor(domain, text) {
  if (domain === "environment") return text.includes("disaster") || text.includes("heatwave") ? "gs3_environment_disaster_management" : "gs3_environment_climate_change";
  if (domain === "economy") return text.includes("infrastructure") || text.includes("rail") || text.includes("project") ? "gs3_economy_infrastructure" : "gs3_economy_basics";
  if (domain === "science") return "gs3_science_technology";
  if (domain === "security") return "gs3_security_internal_security";
  if (domain === "international") return "gs2_ir_neighbourhood";
  if (domain === "social") return text.includes("education") ? "gs2_social_justice_education" : "gs2_social_justice_welfare_schemes";
  return text.includes("local") ? "gs2_polity_local_bodies" : "gs2_governance_e_governance";
}

function paperFor(domain) {
  if (domain === "environment" || domain === "economy" || domain === "science" || domain === "security") return "GS3";
  if (domain === "international" || domain === "social" || domain === "governance") return "GS2";
  return "GS2/GS3";
}

function mainsTheme(domain) {
  const themes = {
    environment: "climate resilience, environmental governance and sustainable development",
    economy: "growth, infrastructure, fiscal capacity and inclusive development",
    science: "science and technology policy, innovation and public service delivery",
    security: "internal security, defence preparedness and counter-terror response",
    international: "India's foreign policy, strategic autonomy and neighbourhood diplomacy",
    social: "social justice, human capital and welfare delivery",
    governance: "transparency, accountability and digital governance",
  };
  return themes[domain] ?? "governance and development";
}

function extractKeyFact(title, summary, domain) {
  const combined = `${title}. ${summary}`;
  const numberMatch = combined.match(/(?:Rs\.?\s*)?\d[\d,.]*(?:\s*(?:lakh crore|crore|percent|%|projects|cities|venues|letters|MW|GW))?/i);
  if (numberMatch) return `Prelims hook: remember the specific fact "${numberMatch[0].trim()}" and the ministry/institution linked to it.`;
  if (domain === "economy") return "Prelims hook: identify the institution, index, base year, fiscal term or scheme mentioned in the news.";
  if (domain === "environment") return "Prelims hook: connect the event to the relevant Act, convention, species, pollutant or disaster-management authority.";
  if (domain === "science") return "Prelims hook: note the institution, mission, technology application and ministry behind the initiative.";
  if (domain === "security") return "Prelims hook: separate internal security, defence preparedness and external relations dimensions.";
  return "Prelims hook: map the headline to the responsible ministry, constitutional body, statutory body or scheme.";
}
