import "server-only";
import { createClient } from "@/lib/supabase/server";
import { memberAccountStatus } from "@/lib/member-access";
import { resolveScorekeeperCta, type ScorekeeperCtaState } from "@/lib/scorekeeper-cta";

// Owner-scoped reads only; no identity or assignment snapshot reaches the CTA.
export async function getScorekeeperCtaState(schoolSlug?: string): Promise<ScorekeeperCtaState> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    if (error && error.name !== "AuthSessionMissingError") return "unavailable";
    const userId = data?.claims?.sub;
    if (!userId) return "apply";
    const accountStatus = await memberAccountStatus(supabase, userId);
    if (accountStatus !== "active") return "unavailable";
    const [roles, assignments, applications] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("contributor_school_assignments").select("school_slug,assignment_role,active").eq("user_id", userId),
      supabase.from("contributor_applications").select("school_slug,requested_role,status").eq("applicant_id", userId),
    ]);
    return resolveScorekeeperCta({ signedIn: true, accountStatus, schoolSlug,
      lookupFailed: Boolean(roles.error || assignments.error || applications.error),
      roles: roles.data?.map(r => r.role), assignments: assignments.data ?? [], applications: applications.data ?? [] });
  } catch { return "unavailable"; }
}
