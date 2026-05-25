import { XMLParser } from "fast-xml-parser";

export interface RssItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
}

const sources = [
  { name: "PIB", url: "https://pib.gov.in/RssMain.aspx" },
  { name: "MEA", url: "https://www.mea.gov.in/rss-feeds.htm" },
];

export async function fetchCurrentAffairsRss() {
  const parser = new XMLParser({ ignoreAttributes: false });
  const items: RssItem[] = [];
  for (const source of sources) {
    try {
      const response = await fetch(source.url, { next: { revalidate: 3600 } });
      if (!response.ok) continue;
      const xml = await response.text();
      const parsed = parser.parse(xml) as { rss?: { channel?: { item?: unknown[] } } };
      const rawItems = parsed.rss?.channel?.item ?? [];
      for (const item of rawItems.slice(0, 12)) {
        const row = item as { title?: string; description?: string; link?: string; pubDate?: string };
        if (!row.title) continue;
        items.push({
          title: clean(row.title),
          description: clean(row.description ?? ""),
          link: row.link ?? "",
          pubDate: row.pubDate ?? new Date().toISOString(),
          source: source.name,
        });
      }
    } catch {
      // Individual feeds are allowed to fail without breaking the daily digest.
    }
  }
  return items;
}

export function classifyCurrentAffair(title: string, description: string) {
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes("climate") || text.includes("forest") || text.includes("biodiversity")) return "Environment";
  if (text.includes("economy") || text.includes("finance") || text.includes("rbi")) return "Economy";
  if (text.includes("external") || text.includes("bilateral") || text.includes("summit")) return "International Relations";
  if (text.includes("defence") || text.includes("security")) return "Defence";
  if (text.includes("technology") || text.includes("space") || text.includes("science")) return "Science & Tech";
  return "Polity";
}

function clean(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
