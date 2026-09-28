import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function getCurrentUserFollowedSchoolSlugs(): Promise<{
  isAuthenticated: boolean;
  schoolSlugs: Set<string>;
}> {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError) throw new Error("Unable to verify follow session.");
  const userId = claimsData?.claims?.sub;
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
