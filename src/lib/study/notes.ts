export interface StructuredTopicNotes {
  analogy: {
    heading: string;
    body: string;
  };
  full_notes: string;
  concise_notes: Array<{
    term: string;
    definition: string;
  }>;
  revision_bullets: string[];
  mindmap: {
    center: string;
    branches: string[];
  };
  cases: Array<{
    name: string;
    note: string;
  }>;
  schemes: Array<{
    name: string;
    note: string;
  }>;
  ncert_coverage: string[];
  prelims_traps: string[];
  mains_angles: string[];
  connected_topics: string[];
}

export function parseStructuredNotes(raw: unknown, fallback: { title: string; wikiSummary?: string | null }): StructuredTopicNotes {
  const title = fallback.title;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed.startsWith("{")) {
      try {
        return normalizeJsonNotes(JSON.parse(trimmed), fallback);
      } catch {
        return notesFromPlainText(trimmed, fallback);
      }
    }
    if (trimmed) return notesFromPlainText(trimmed, fallback);
  }
  if (raw && typeof raw === "object") return normalizeJsonNotes(raw, fallback);
  return emptyNotes(title, fallback.wikiSummary);
}

function normalizeJsonNotes(value: unknown, fallback: { title: string; wikiSummary?: string | null }): StructuredTopicNotes {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const title = fallback.title;
  const full = stringValue(record.full_notes) || fallback.wikiSummary || `Notes for ${title} are coming soon.`;
  const rawAnalogy = record.analogy;
  let analogy = {
    heading: "Understand It First",
    body: makeDefaultAnalogy(title),
  };
  if (typeof rawAnalogy === "string" && rawAnalogy.trim()) {
    analogy = { heading: "Think of it this way", body: rawAnalogy.trim() };
  } else if (rawAnalogy && typeof rawAnalogy === "object") {
    const raw = rawAnalogy as Record<string, unknown>;
    const body = stringValue(raw.body);
    if (body) {
      analogy = {
        heading: stringValue(raw.heading) || "Understand It First",
        body,
      };
    }
  }
  return {
    analogy,
    full_notes: full,
    concise_notes: normalizeDefinitions(record.concise_notes, full, title),
    revision_bullets: normalizeBullets(record.revision_bullets, full, title),
    mindmap: normalizeMindmap(record.mindmap, full, title),
    cases: normalizeNamedNotes(record.cases, extractCases(full)),
    schemes: normalizeNamedNotes(record.schemes, extractSchemes(full)),
    ncert_coverage: normalizeStringList(record.ncert_coverage, extractCoverage(full, title), 12),
    prelims_traps: normalizeStringList(record.prelims_traps, extractPrelimsTraps(full), 10),
    mains_angles: normalizeStringList(record.mains_angles, extractMainsAngles(full), 10),
    connected_topics: normalizeStringList(record.connected_topics, [], 6),
  };
}

function notesFromPlainText(text: string, fallback: { title: string; wikiSummary?: string | null }): StructuredTopicNotes {
  const title = fallback.title;
  const analogy = extractSection(text, "PART B") || extractSection(text, "PART A") || makeDefaultAnalogy(title);
  const full = text || fallback.wikiSummary || `Notes for ${title} are coming soon.`;
  return {
    analogy: {
      heading: "Understand It First",
      body: shortenAnalogy(analogy, title),
    },
    full_notes: full,
    concise_notes: extractDefinitions(full, title),
    revision_bullets: extractRevisionBullets(full, title),
    mindmap: {
      center: title,
      branches: extractMindmapBranches(full, title),
    },
    cases: extractCases(full),
    schemes: extractSchemes(full),
    ncert_coverage: extractCoverage(full, title),
    prelims_traps: extractPrelimsTraps(full),
    mains_angles: extractMainsAngles(full),
    connected_topics: [],
  };
}

function emptyNotes(title: string, wikiSummary?: string | null): StructuredTopicNotes {
  return {
    analogy: {
      heading: "Understand It First",
      body: makeDefaultAnalogy(title),
    },
    full_notes: wikiSummary || `Notes for ${title} are coming soon.`,
    concise_notes: [{ term: title, definition: "Core topic notes are being prepared." }],
    revision_bullets: [`Define ${title}.`, "Connect the topic to the syllabus.", "Attempt topic questions after reading."],
    mindmap: { center: title, branches: ["Meaning", "Features", "Examples", "Issues", "Questions", "Revision"] },
    cases: [],
    schemes: [],
    ncert_coverage: [`Understand the basic meaning of ${title}.`, "Read the mapped NCERT chapter or source."],
    prelims_traps: ["Watch for extreme words and mismatched institutions."],
    mains_angles: ["Define the topic, explain why it matters, add one example, and conclude with a way forward."],
    connected_topics: [],
  };
}

function extractSection(text: string, marker: string) {
  const index = text.indexOf(marker);
  if (index === -1) return "";
  const next = text.slice(index + marker.length).search(/\nPART [A-Z] -/);
  return text.slice(index, next === -1 ? undefined : index + marker.length + next).trim();
}

function shortenAnalogy(text: string, title: string) {
  const lines = text
    .replace(/^PART [A-Z] - .+$/gm, "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^(\d+\.|UPSC|Prelims|PART|Easy analogy)/i.test(line));
  const picked = lines.slice(0, 9).join("\n\n");
  return picked || makeDefaultAnalogy(title);
}

function makeDefaultAnalogy(title: string) {
  return `Start with the source for ${title}. First identify the problem the chapter explains, then note the official terms and how the question can test them.`;
}

function normalizeDefinitions(value: unknown, full: string, title: string) {
  if (Array.isArray(value)) {
    const rows = value
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const row = item as Record<string, unknown>;
        const term = stringValue(row.term);
        const definition = stringValue(row.definition);
        return term && definition ? { term, definition } : null;
      })
      .filter(Boolean) as Array<{ term: string; definition: string }>;
    if (rows.length) return rows.slice(0, 24);
  }
  return extractDefinitions(full, title);
}

function extractDefinitions(text: string, title: string) {
  const rows: Array<{ term: string; definition: string }> = [];
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  for (const line of lines) {
    const match = line.match(/^([A-Z][A-Za-z0-9 .()/-]{2,64}):\s*(.{12,220})$/);
    if (!match) continue;
    const term = cleanup(match[1]);
    const definition = cleanup(match[2]);
    if (/^(Option|Intro|Body|Conclusion|Trap|Tool|Protection|Memory trick)$/i.test(term)) continue;
    if (!rows.some((row) => row.term === term)) rows.push({ term, definition });
  }
  if (!rows.length) rows.push({ term: title, definition: "Core UPSC topic; learn meaning, features, examples and exam relevance." });
  return rows.slice(0, 24);
}

function normalizeBullets(value: unknown, full: string, title: string) {
  if (Array.isArray(value)) {
    const rows = value.map((item) => stringValue(item)).filter(Boolean).slice(0, 10);
    if (rows.length) return rows;
  }
  return extractRevisionBullets(full, title);
}

function extractRevisionBullets(text: string, title: string) {
  const revisionSection = extractSection(text, "PART D") || text;
  const bullets = revisionSection
    .split(/\n+/)
    .map((line) => cleanup(line.replace(/^[-\u2022]\s*/, "")))
    .filter((line) => line.length > 18 && line.length < 180)
    .filter((line) => !/^PART|^Short Notes|^Best analogy/i.test(line));
  const unique = Array.from(new Set(bullets));
  if (unique.length) return unique.slice(0, 10);
  return [`Define ${title} clearly.`, "Remember the main constitutional/legal facts.", "Use one example in Mains answers."];
}

function normalizeMindmap(value: unknown, full: string, title: string) {
  if (Array.isArray(value)) {
    const center = stringValue(value[0]) || title;
    const branches = value.slice(1).map((branch) => stringValue(branch)).filter(Boolean).slice(0, 6);
    if (branches.length) return { center, branches };
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const center = stringValue(record.center) || title;
    const branches = Array.isArray(record.branches)
      ? record.branches.map((branch) => stringValue(branch)).filter(Boolean).slice(0, 6)
      : [];
    if (branches.length) return { center, branches };
  }
  return { center: title, branches: extractMindmapBranches(full, title) };
}

function extractMindmapBranches(text: string, title: string) {
  const candidates = [
    ...extractDefinitions(text, title).map((item) => item.term),
    ...extractCases(text).map((item) => item.name),
  ].filter((item) => item.length <= 34);
  const branches = Array.from(new Set(candidates)).slice(0, 6);
  return branches.length >= 3 ? branches : ["Meaning", "Features", "Examples", "Cases", "Traps", "Revision"];
}

function normalizeNamedNotes(value: unknown, fallback: Array<{ name: string; note: string }>) {
  if (Array.isArray(value)) {
    const rows = value
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const row = item as Record<string, unknown>;
        const name = stringValue(row.name);
        const note = stringValue(row.note ?? row.point ?? "");
        return name && note ? { name, note } : null;
      })
      .filter(Boolean) as Array<{ name: string; note: string }>;
    if (rows.length) return rows.slice(0, 8);
  }
  return fallback.slice(0, 8);
}

function normalizeStringList(value: unknown, fallback: string[], limit: number) {
  if (Array.isArray(value)) {
    const rows = value.map((item) => stringValue(item)).filter(Boolean);
    if (rows.length) return rows.slice(0, limit);
  }
  return fallback.slice(0, limit);
}

function extractCoverage(text: string, title: string) {
  const coverage =
    extractListAfterHeading(text, "NCERT chapter logic") ||
    extractListAfterHeading(text, "High-yield facts") ||
    extractListAfterHeading(text, "Core explanation");
  return coverage.length
    ? coverage.slice(0, 12)
    : [`Meaning and importance of ${title}`, "Core facts", "Examples", "UPSC application"];
}

function extractPrelimsTraps(text: string) {
  const byHeading = extractListAfterHeading(text, "Prelims traps");
  if (byHeading.length) return byHeading;
  return text
    .split(/\n+/)
    .map((line) => cleanup(line))
    .filter((line) => /^Prelims trap/i.test(line) || /\bUPSC can trap\b/i.test(line))
    .map((line) => line.replace(/^Prelims traps?:\s*/i, ""))
    .slice(0, 10);
}

function extractMainsAngles(text: string) {
  const byHeading = extractListAfterHeading(text, "Mains answer");
  if (byHeading.length) return byHeading;
  return text
    .split(/\n+/)
    .map((line) => cleanup(line))
    .filter((line) => /^UPSC angle/i.test(line) || /^Mains angle/i.test(line) || /\bMains\b.+\banswer\b/i.test(line))
    .map((line) => line.replace(/^(UPSC angle|Mains angle):\s*/i, ""))
    .slice(0, 10);
}

function extractListAfterHeading(text: string, heading: string) {
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const start = lines.findIndex((line) => line.toLowerCase().includes(heading.toLowerCase()));
  if (start === -1) return [];
  const items: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (/^\d+\.\s+[A-Z][A-Za-z ]{2,}$/.test(line) && items.length) break;
    if (/^[A-Z][A-Za-z ]{2,}:$/.test(line) && items.length) break;
    const cleaned = cleanup(line.replace(/^\d+\.\s*/, "").replace(/^[-\u2022]\s*/, ""));
    if (cleaned.length > 18 && cleaned.length < 220) items.push(cleaned);
    if (items.length >= 12) break;
  }
  return Array.from(new Set(items));
}

function extractCases(text: string) {
  const rows: Array<{ name: string; note: string }> = [];
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  for (let index = 0; index < lines.length; index += 1) {
    const line = cleanup(lines[index]);
    if (!/\bv\.?\s+/i.test(line) && !/\bcase\b/i.test(line)) continue;
    if (line.length > 110) continue;
    const note = cleanup(lines[index + 1] ?? "Important case for this topic.");
    if (!rows.some((row) => row.name === line)) rows.push({ name: line.replace(/:$/, ""), note });
  }
  return rows;
}

function extractSchemes(text: string) {
  const rows: Array<{ name: string; note: string }> = [];
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  for (let index = 0; index < lines.length; index += 1) {
    const line = cleanup(lines[index]);
    if (!/\b(scheme|mission|programme|yojana|portal|policy|e-courts|legal aid)\b/i.test(line)) continue;
    if (line.length > 120) continue;
    const note = cleanup(lines[index + 1] ?? "Relevant government/policy reference for answer enrichment.");
    if (!rows.some((row) => row.name === line)) rows.push({ name: line.replace(/:$/, ""), note });
  }
  return rows;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanup(value: string) {
  return value.replace(/\s+/g, " ").replace(/^[-\u2022]\s*/, "").trim();
}
