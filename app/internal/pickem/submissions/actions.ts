"use server";

import { revalidatePath } from "next/cache";
import { runAdminWrite, type AdminActionState } from "@/lib/pickem-admin-recovery";
import { requireActiveMember } from "@/lib/member-access";
import { finalizePickemWithCutoffResolution } from "@/lib/pickem-finalization";

function weekId(formData: FormData) {
  const value = String(formData.get("week_id") ?? "");
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) ? value : null;
}

export async function recordWinnerNotice(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const week = weekId(formData);
  if (!week) return { status: "rejected", message: "Choose a valid contest week." };
  const { supabase } = await requireActiveMember();
  return runAdminWrite(() => supabase.rpc("admin_record_pickem_winner_notice", { p_week_id: week }));
}

export async function finalizeContestResults(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const week = weekId(formData);
  if (!week) return { status: "rejected", message: "Choose a valid contest week." };
  const { supabase } = await requireActiveMember();
  const settings = await supabase.from("pickem_weeks")
    .select("outcome_resolution_at").eq("id", week).maybeSingle().then(result => result, () => ({ data: null, error: true }));
  const { data: contest, error: weekError } = settings;
  if (weekError || !contest) return { status: "rejected", message: "Contest settings could not be loaded. Refresh status before retrying." };
  const result = await runAdminWrite(() => finalizePickemWithCutoffResolution({
    outcomeResolutionAt: contest.outcome_resolution_at,
    nowMs: Date.now(),
    resolve: () => supabase.rpc("admin_resolve_pickem_contest_week", { p_week_id: week }),
    finalize: () => supabase.rpc("admin_finalize_pickem_contest_results", { p_week_id: week }),
  }));
  // Resolution may have changed VOID presentation even if finalization failed.
  try { revalidatePath("/pickem"); } catch {
    return { ...result, message: `${result.message} Public status refresh failed; reload status before continuing.` };
  }
  return result;
}

export async function recordWinnerResponse(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const week = weekId(formData);
  if (!week) return { status: "rejected", message: "Choose a valid contest week." };
  const { supabase } = await requireActiveMember();
  return runAdminWrite(() => supabase.rpc("admin_record_pickem_winner_response", { p_week_id: week }));
}

export async function decideWinnerClaim(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const week = weekId(formData);
  if (!week) return { status: "rejected", message: "Choose a valid contest week." };
  const { supabase } = await requireActiveMember();
  const decision = String(formData.get("decision") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason || !["confirmed", "ineligible", "cannot_contact", "no_response"].includes(decision)) {
    return { status: "rejected", message: "Choose a decision and provide a review note." };
  }
  return runAdminWrite(() => supabase.rpc("admin_decide_pickem_winner_claim_reviewed", {
    p_week_id: week, p_decision: decision, p_reason: reason,
    p_expected_winner_id: String(formData.get("expected_winner_id") ?? ""),
    p_expected_generation: Number(formData.get("expected_generation")),
  }));
}

export async function recordPrizePaid(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const week = weekId(formData);
  if (!week) return { status: "rejected", message: "Choose a valid contest week." };
  const { supabase } = await requireActiveMember();
  return runAdminWrite(() => supabase.rpc("admin_record_pickem_prize_paid", { p_week_id: week }));
}
