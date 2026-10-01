"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDynamicGames } from "@/lib/dynamic-games";
import { requireActiveMember } from "@/lib/member-access";
import { parsePickemDraft } from "@/lib/pickem-admin-configuration";

function resultUrl(message: string) {
  return `/internal/pickem?message=${encodeURIComponent(message)}`;
}

async function requireModerator() {
  const { supabase, userId } = await requireActiveMember();
  const { data: roles, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (error || !roles?.some((row) => row.role === "moderator" || row.role === "admin")) redirect("/account");
  return supabase;
}

function saveError(code?: string) {
  if (code === "40001") return "The draft or schedule changed. Refresh and review before trying again.";
  if (code === "55000") return "Published, locked or participated contests are read-only in setup.";
  return "The request was rejected. Refresh and check the draft, tiebreaker and schedule. No partial changes were saved.";
}

export async function savePickemWeek(formData: FormData) {
  const supabase = await requireModerator();
  let configuration;
  try {
    configuration = parsePickemDraft(formData, await getDynamicGames());
  } catch (error) {
    redirect(resultUrl(error instanceof Error ? error.message : "Invalid draft configuration."));
  }
  const { error } = await supabase.rpc("configure_pickem_draft", configuration);
  if (error) redirect(resultUrl(saveError(error.code)));
  revalidatePath("/internal/pickem");
  redirect(resultUrl(`Week ${configuration.p_week} draft saved. It has not been opened.`));
}

export async function openPickemWeek(formData: FormData) {
  const supabase = await requireModerator();
  const id = String(formData.get("week_id") ?? "");
  const revisionText = String(formData.get("configuration_revision") ?? "");
  const revision = Number(revisionText);
  let revisions: Record<string, number>;
  try {
    revisions = JSON.parse(String(formData.get("schedule_revisions") ?? ""));
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) || !revisionText || !Number.isSafeInteger(revision) || revision < 0
      || !revisions || Array.isArray(revisions) || typeof revisions !== "object"
      || Object.values(revisions).some((value) => !Number.isSafeInteger(value) || value < 0)
      || formData.get("confirm_open") !== "yes") throw new Error("invalid");
  } catch {
    redirect(resultUrl("Review the saved draft and confirm opening before continuing."));
  }
  const { error } = await supabase.rpc("open_pickem_draft", {
    p_week_id: id, p_expected_revision: revision, p_schedule_revisions: revisions,
  });
  if (error) redirect(resultUrl(saveError(error.code)));
  revalidatePath("/internal/pickem");
  revalidatePath("/pickem");
  redirect(resultUrl("The saved draft is now open. Its contest configuration is read-only."));
}
