import type { SupabaseClient } from "@supabase/supabase-js";

export type MemberStatus = "active" | "suspended" | "unavailable";

// Only fixed categories are logged: never provider messages, URLs, IDs or tokens.
function reportUnavailable(reason: "timeout" | "network_error" | "request_rejected" | "request_failed" | "exception", startedAt: number) {
  console.warn(JSON.stringify({
    event: "member_access_check_failed",
    reason,
    duration_ms: Math.max(0, Date.now() - startedAt),
  }));
}

// One bounded read. No outage retry amplification or persistent authority cache.
export async function readMemberAccountStatus(supabase: Pick<SupabaseClient, "from">, userId: string): Promise<MemberStatus> {
  const startedAt = Date.now();
  const signal = AbortSignal.timeout(3000);
  try {
    const { data, error, status: httpStatus } = await supabase.from("member_account_status")
      .select("status").eq("user_id", userId).abortSignal(signal)
      .maybeSingle().retry(false);
    if (error) {
      reportUnavailable(signal.aborted ? "timeout"
        : httpStatus === 0 ? "network_error"
        : httpStatus >= 400 ? "request_rejected" : "request_failed", startedAt);
      return "unavailable";
    }
    return data?.status === "active" ? "active" : "suspended";
  } catch {
    reportUnavailable(signal.aborted ? "timeout" : "exception", startedAt);
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
