import { fail, ok } from "@/lib/api/response";
import { getTopicsFromDb } from "@/lib/product/db";
import { LEGACY_TOPIC_REDIRECTS } from "@/lib/study/ncert-master-index";

export async function GET() {
  try {
    const topics = await getTopicsFromDb();
    return ok({ topics: topics.filter((topic) => !LEGACY_TOPIC_REDIRECTS[topic.key]) });
  } catch {
    return fail("Could not load study topics.", 500);
  }
}
