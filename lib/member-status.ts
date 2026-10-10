import type { SupabaseClient } from "@supabase/supabase-js";

export type MemberStatus = "active" | "suspended" | "unavailable";

// One bounded read. No outage retry amplification or persistent authority cache.
export async function readMemberAccountStatus(supabase: Pick<SupabaseClient, "from">, userId: string): Promise<MemberStatus> {
  try {
    const { data, error } = await supabase.from("member_account_status")
      .select("status").eq("user_id", userId).abortSignal(AbortSignal.timeout(3000))
      .maybeSingle().retry(false);
    if (error) return "unavailable";
    return data?.status === "active" ? "active" : "suspended";
  } catch {
    return "unavailable";
  }
}

export async function enforceMemberStatus(
  status: MemberStatus,
  suspend: () => Promise<unknown>,
  redirect: (path: string) => never,
) {
  if (status === "unavailable") redirect("/account-unavailable");
  if (status === "suspended") {
    await suspend().catch(() => undefined);
    redirect("/account-suspended");
  }
}
