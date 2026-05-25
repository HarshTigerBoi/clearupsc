import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { classifyCurrentAffair, fetchCurrentAffairsRss } from "@/lib/current-affairs/rss-fetcher";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) return fail("Unauthorized", 401);

  const supabase = createAdminClient();
  if (!supabase) return fail("Admin client is not configured.", 503);

  const items = await fetchCurrentAffairsRss();
  const today = new Date().toISOString().slice(0, 10);
  const rows = items.map((item) => {
    const category = classifyCurrentAffair(item.title, item.description);
    return {
      date: today,
      title: item.title,
      summary: item.description.slice(0, 900) || "Read the original source and connect the issue with prelims facts and mains dimensions.",
      source_url: item.link,
      tags: [category, item.source],
      upsc_relevance: `${category}: useful for Prelims facts and Mains linkage.`,
    };
  });

  if (rows.length) {
    await supabase.from("current_affairs").upsert(rows, { onConflict: "date,title" });
  }
  return ok({ inserted: rows.length });
}
