import { createClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "./script-env.mjs";

const { url, serviceKey } = requireSupabaseEnv();
const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  const { count: before, error: countError } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .ilike("question_text", "Practice question%");

  if (countError) throw countError;

  const { error } = await supabase
    .from("questions")
    .delete()
    .ilike("question_text", "Practice question%");

  if (error) throw error;

  const { count: after, error: afterError } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .ilike("question_text", "Practice question%");

  if (afterError) throw afterError;

  console.log(JSON.stringify({ removed: before ?? 0, remainingPlaceholders: after ?? 0 }, null, 2));
}
