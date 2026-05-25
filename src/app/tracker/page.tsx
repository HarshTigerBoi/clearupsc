import { TrackerClient } from "@/components/tracker/TrackerClient";
import ProductShell from "@/components/product/ProductShell";
import { createClient } from "@/lib/supabase/server";
import { getSyllabusProgress, getTopicsFromDb } from "@/lib/product/db";

export default async function TrackerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { topics, progress } = user ? await getSyllabusProgress(user.id) : { topics: await getTopicsFromDb(), progress: [] };

  return (
    <ProductShell>
      <TrackerClient userId={user?.id ?? null} topics={topics} progress={progress} />
    </ProductShell>
  );
}
