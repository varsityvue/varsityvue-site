import "server-only";

import { optionalRead } from "@/lib/public-read";
import { createPublicReadClient, readPublicClaims } from "@/lib/supabase/server";

async function readFollowedSchoolSlugs(context?: {
  supabase: Awaited<ReturnType<typeof createPublicReadClient>>;
  userId?: string;
}): Promise<{
  isAuthenticated: boolean;
  schoolSlugs: Set<string>;
  loadedAt: number;
  unavailable?: boolean;
}> {
  const supabase = context?.supabase ?? await createPublicReadClient();
  const claims = context ? null : await readPublicClaims();
  if (claims?.error) throw new Error("Unable to verify follow session.");
  const userId = context ? context.userId : claims?.data?.claims?.sub;
  if (!userId) return { isAuthenticated: false, schoolSlugs: new Set(), loadedAt: Date.now() };

  const { data, error } = await supabase
    .from("school_follows")
    .select("school_slug")
    .eq("user_id", userId).retry(false);
  if (error) {
    console.error("Unable to load school follows.", { code: error.code });
    throw new Error("Unable to load your followed teams.");
  }
  return {
    isAuthenticated: true,
    loadedAt: Date.now(),
    schoolSlugs: new Set((data ?? []).map((row) => row.school_slug)),
  };
}

export async function getCurrentUserFollowedSchoolSlugs(context?: Parameters<typeof readFollowedSchoolSlugs>[0]) {
  return optionalRead(() => readFollowedSchoolSlugs(context), {
    isAuthenticated: Boolean(context?.userId), schoolSlugs: new Set<string>(), loadedAt: Date.now(), unavailable: true,
  });
}
