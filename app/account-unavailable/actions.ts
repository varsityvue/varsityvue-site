"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { enforceMemberStatus, readMemberAccountStatus } from "@/lib/member-status";

export async function checkAccountAccess() {
  const supabase = await createClient();
  let userId: string | undefined;
  let claimsFailed = false;
  try {
    const { data, error } = await supabase.auth.getClaims();
    claimsFailed = Boolean(error);
    userId = data?.claims?.sub;
  } catch {
    claimsFailed = true;
  }
  if (claimsFailed) {
    console.warn(JSON.stringify({ event: "member_access_check_failed", reason: "session_check_failed" }));
    redirect("/account-unavailable?checked=1");
  }
  if (!userId) redirect("/login?next=%2Faccount");

  // A deliberate POST performs one fresh read. Never replay a prior score/pick.
  const status = await readMemberAccountStatus(supabase, userId);
  if (status === "unavailable") redirect("/account-unavailable?checked=1");
  await enforceMemberStatus(status, () => supabase.auth.signOut({ scope: "global" }), redirect);
  revalidatePath("/account");
  redirect("/account");
}
