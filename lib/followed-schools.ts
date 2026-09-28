import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function getCurrentUserFollowedSchoolSlugs(context?: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId?: string;
}): Promise<{
  isAuthenticated: boolean;
  schoolSlugs: Set<string>;
}> {
  const supabase = context?.supabase ?? await createClient();
  const claims = context ? null : await supabase.auth.getClaims();
  if (claims?.error) throw new Error("Unable to verify follow session.");
  const userId = context ? context.userId : claims?.data.claims?.sub;
  if (!userId) return { isAuthenticated: false, schoolSlugs: new Set() };

  const { data, error } = await supabase
    .from("school_follows")
    .select("school_slug")
    .eq("user_id", userId);
  if (error) {
    console.error("Unable to load school follows.", { code: error.code });
    throw new Error("Unable to load your followed teams.");
  }
  return {
    isAuthenticated: true,
    schoolSlugs: new Set((data ?? []).map((row) => row.school_slug)),
  };
}
