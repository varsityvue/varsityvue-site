import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";
import { enforceMemberStatus, readMemberAccountStatus } from "@/lib/member-status";

import { createClient } from "@/lib/supabase/server";

type ActiveMemberOptions = {
  loginPath?: string;
};

// React cache is scoped to the server render, never shared across requests.
// Actions also perform a fresh bounded read; database authorization stays authoritative.
export const memberAccountStatus = cache(readMemberAccountStatus);

export async function requireActiveMember(options: ActiveMemberOptions = {}) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  const userId = claims?.sub;

  if (!userId) redirect(options.loginPath ?? "/login");

  const status = await memberAccountStatus(supabase, userId);
  await enforceMemberStatus(status, () => supabase.auth.signOut({ scope: "global" }), redirect);

  return { supabase, userId, claims };
}
