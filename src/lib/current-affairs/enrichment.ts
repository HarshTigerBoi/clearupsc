type CurrentAffairsSeed = {
  title?: unknown;
  summary?: unknown;
  tags?: unknown;
  category?: unknown;
  source?: unknown;
};

export function enrichCurrentAffairFallback(item: CurrentAffairsSeed) {
  const title = String(item.title ?? "this development");
  const summary = String(item.summary ?? "");
  const tags = Array.isArray(item.tags) ? item.tags.map(String) : [];
  const text = `${title} ${summary} ${tags.join(" ")} ${String(item.category ?? "")}`.toLowerCase();
  const domain = classifyCurrentAffairsDomain(text);
  const staticLink = topicForDomain(domain, text);
  const paper = paperForDomain(domain);
  const source = item.source ? ` Source: ${String(item.source)}.` : "";

  return {
    upscAngle: `${paper}: UPSC can test this as a link between current governance decisions, static syllabus concepts and implementation outcomes.${source}`,
    staticLink,
    prelimsHook: extractPrelimsHook(title, summary, domain),
    mainsAngle: `${paper}: Use this as a current example in a 150-word answer on ${mainsTheme(domain)}; write one line on context, one on institutional mechanism, and one on outcome or challenge.`,
  };
}

function classifyCurrentAffairsDomain(text: string) {
  if (/(climate|heatwave|wetland|forest|biodiversity|pollution|environment|cyclone|disaster)/.test(text)) return "environment";
  if (/(economy|inflation|iip|gdp|bank|rbi|gst|budget|infrastructure|rail|semiconductor|investment|finance|project)/.test(text)) return "economy";
  if (/(science|technology|space|isro|csir|biotech|ai|digital|cyber|communication)/.test(text)) return "science";
  if (/(defence|security|terror|border|operation|military|armed forces)/.test(text)) return "security";
  if (/(mea|foreign|bilateral|india-|neighbour|summit|treaty|global|international)/.test(text)) return "international";
  if (/(education|health|women|employment|rozgar|skill|social|welfare|vulnerable)/.test(text)) return "social";
  return "governance";
}

function topicForDomain(domain: string, text: string) {
  if (domain === "environment") return text.includes("disaster") || text.includes("heatwave") ? "gs3_environment_disaster_management" : "gs3_environment_climate_change";
  if (domain === "economy") return text.includes("infrastructure") || text.includes("rail") || text.includes("project") ? "gs3_economy_infrastructure" : "gs3_economy_basics";
  if (domain === "science") return "gs3_science_technology";
  if (domain === "security") return "gs3_security_internal_security";
  if (domain === "international") return "gs2_ir_neighbourhood";
  if (domain === "social") return text.includes("education") ? "gs2_social_justice_education" : "gs2_social_justice_welfare_schemes";
  return text.includes("local") ? "gs2_polity_local_bodies" : "gs2_governance_e_governance";
}

function paperForDomain(domain: string) {
  if (["environment", "economy", "science", "security"].includes(domain)) return "GS3";
  if (["international", "social", "governance"].includes(domain)) return "GS2";
  return "GS2/GS3";
}

function mainsTheme(domain: string) {
  const themes: Record<string, string> = {
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

function extractPrelimsHook(title: string, summary: string, domain: string) {
  const combined = `${title}. ${summary}`;
  const numberMatch = combined.match(/(?:Rs\.?\s*)?\d[\d,.]*(?:\s*(?:lakh crore|crore|percent|%|projects|cities|venues|letters|MW|GW))?/i);
  if (numberMatch) return `Prelims hook: remember "${numberMatch[0].trim()}" and the ministry or institution linked to it.`;
  if (domain === "economy") return "Prelims hook: identify the institution, index, base year, fiscal term or scheme mentioned in the news.";
  if (domain === "environment") return "Prelims hook: connect the event to the relevant Act, convention, species, pollutant or disaster-management authority.";
  if (domain === "science") return "Prelims hook: note the institution, mission, technology application and ministry behind the initiative.";
  if (domain === "security") return "Prelims hook: separate internal security, defence preparedness and external relations dimensions.";
  return "Prelims hook: map the headline to the responsible ministry, constitutional body, statutory body or scheme.";
}
