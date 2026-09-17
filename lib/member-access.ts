import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type ActiveMemberOptions = {
  loginPath?: string;
};

export async function memberAccountStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data, error } = await supabase
    .from("member_account_status")
    .select("status")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Unable to verify member account status.", {
      code: error.code,
    });
    return "unavailable" as const;
  }

  return data?.status === "active" ? "active" as const : "suspended" as const;
}

export async function requireActiveMember(options: ActiveMemberOptions = {}) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  const userId = claims?.sub;

  if (!userId) redirect(options.loginPath ?? "/login");

  const status = await memberAccountStatus(supabase, userId);
  if (status !== "active") {
    // Revoking the current user's Auth sessions prevents future refreshes.
    // The database status/RLS checks remain the immediate boundary because
    // an already-issued access token stays valid until its normal expiry.
    await supabase.auth.signOut({ scope: "global" }).catch(() => undefined);
    redirect("/account-suspended");
  }

  return { supabase, userId, claims };
}
