import { createClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "./script-env.mjs";

const { url, serviceKey } = requireSupabaseEnv();
const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const keys = [
  "gs3_economy_basics",
  "gs4_ethics_integrity",
  "gs1_geography_physical",
];

for (const key of keys) {
  const { data } = await supabase.from("topics").select("key,title").eq("key", key).single();
  console.log(key, "->", data ? "EXISTS: " + data.title : "NOT FOUND");
}
