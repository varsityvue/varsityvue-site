"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveMember } from "@/lib/member-access";

function weekId(formData: FormData) {
  const value = String(formData.get("week_id") ?? "");
  return /^[0-9a-f-]{36}$/i.test(value) ? value : null;
}

function destination(week: string, outcome: "recorded" | "error") {
  return `/internal/pickem/submissions?week=${encodeURIComponent(week)}&claim=${outcome}`;
}

export async function recordWinnerNotice(formData: FormData) {
  const week = weekId(formData);
  if (!week) return;
  const { supabase } = await requireActiveMember();
  const { error } = await supabase.rpc("admin_record_pickem_winner_notice", { p_week_id: week });
  if (!error) revalidatePath("/internal/pickem/submissions");
  redirect(destination(week, error ? "error" : "recorded"));
}

export async function finalizeContestResults(formData: FormData) {
  const week = weekId(formData);
  if (!week) return;
  const { supabase } = await requireActiveMember();
  const { error } = await supabase.rpc("admin_finalize_pickem_contest_results", { p_week_id: week });
  if (!error) revalidatePath("/internal/pickem/submissions");
  redirect(destination(week, error ? "error" : "recorded"));
}

export async function recordWinnerResponse(formData: FormData) {
  const week = weekId(formData);
  if (!week) return;
  const { supabase } = await requireActiveMember();
  const { error } = await supabase.rpc("admin_record_pickem_winner_response", { p_week_id: week });
  if (!error) revalidatePath("/internal/pickem/submissions");
  redirect(destination(week, error ? "error" : "recorded"));
}

export async function decideWinnerClaim(formData: FormData) {
  const week = weekId(formData);
  if (!week) return;
  const { supabase } = await requireActiveMember();
  const decision = String(formData.get("decision") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason || !["confirmed", "ineligible", "cannot_contact", "no_response"].includes(decision)) {
    redirect(destination(week, "error"));
  }
  const { error } = await supabase.rpc("admin_decide_pickem_winner_claim", {
    p_week_id: week, p_decision: decision, p_reason: reason,
  });
  if (!error) revalidatePath("/internal/pickem/submissions");
  redirect(destination(week, error ? "error" : "recorded"));
}
