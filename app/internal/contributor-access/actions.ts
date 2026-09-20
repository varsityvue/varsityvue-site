"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireActiveMember } from "@/lib/member-access";
import { getSchoolBySlug } from "@/lib/schools";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function requireAdmin() {
  const { supabase, userId } = await requireActiveMember();

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (!roles?.some((row) => row.role === "admin")) redirect("/account");

  return { supabase, userId };
}

export async function assignContributorSchool(formData: FormData) {
  const targetUserId = text(formData, "user_id");
  const schoolSlug = text(formData, "school_slug");
  const assignmentRole = text(formData, "assignment_role");
  const { supabase, userId } = await requireAdmin();

  if (!targetUserId || !schoolSlug || !["scorekeeper", "coach"].includes(assignmentRole)) {
    redirect("/internal/contributor-access?message=Choose%20a%20user%2C%20school%2C%20and%20valid%20assignment%20type.");
  }

  const { error: roleError } = await supabase
    .from("user_roles")
    .upsert({ user_id: targetUserId, role: "scorekeeper", granted_by: userId }, { onConflict: "user_id,role" });

  if (roleError) {
    redirect(`/internal/contributor-access?message=${encodeURIComponent(roleError.message)}`);
  }

  const { error: assignmentError } = await supabase
    .from("contributor_school_assignments")
    .upsert(
      {
        user_id: targetUserId,
        school_slug: schoolSlug,
        assignment_role: assignmentRole,
        active: true,
        assigned_by: userId,
      },
      { onConflict: "user_id,school_slug" },
    );

  if (assignmentError) {
    redirect(`/internal/contributor-access?message=${encodeURIComponent(assignmentError.message)}`);
  }

  revalidatePath("/internal/contributor-access");
  revalidatePath("/account");
  revalidatePath("/report-score");
  redirect("/internal/contributor-access?updated=assigned");
}

export async function removeContributorSchool(formData: FormData) {
  const targetUserId = text(formData, "user_id");
  const schoolSlug = text(formData, "school_slug");
  const { supabase } = await requireAdmin();

  if (!targetUserId || !schoolSlug) {
    redirect("/internal/contributor-access?message=Missing%20contributor%20assignment.");
  }

  const { error: deleteError } = await supabase
    .from("contributor_school_assignments")
    .delete()
    .eq("user_id", targetUserId)
    .eq("school_slug", schoolSlug);

  if (deleteError) {
    redirect(`/internal/contributor-access?message=${encodeURIComponent(deleteError.message)}`);
  }

  const { count } = await supabase
    .from("contributor_school_assignments")
    .select("school_slug", { count: "exact", head: true })
    .eq("user_id", targetUserId)
    .eq("active", true);

  if ((count ?? 0) === 0) {
    await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", targetUserId)
      .eq("role", "scorekeeper");
  }

  revalidatePath("/internal/contributor-access");
  revalidatePath("/account");
  revalidatePath("/report-score");
  redirect("/internal/contributor-access?updated=removed");
}

const recruitmentStatuses = ["uncovered", "researching", "contacted", "interested", "onboarding", "paused"] as const;

export async function updateContributorRecruitment(formData: FormData) {
  const schoolSlug = text(formData, "school_slug");
  const recruitmentStatus = text(formData, "recruitment_status");
  const candidateName = text(formData, "candidate_name").slice(0, 120) || null;
  const candidateContact = text(formData, "candidate_contact").slice(0, 240) || null;
  const recruitmentNote = text(formData, "recruitment_note").slice(0, 1000) || null;
  const { supabase, userId } = await requireAdmin();

  if (!getSchoolBySlug(schoolSlug) || !recruitmentStatuses.includes(recruitmentStatus as (typeof recruitmentStatuses)[number])) {
    redirect("/internal/contributor-access?message=Choose%20a%20valid%20program%20and%20recruitment%20stage.");
  }

  const { error } = await supabase.from("contributor_recruitment_pipeline").upsert({
    school_slug: schoolSlug,
    recruitment_status: recruitmentStatus,
    candidate_name: candidateName,
    candidate_contact: candidateContact,
    recruitment_note: recruitmentNote,
    updated_by: userId,
    updated_at: new Date().toISOString(),
  }, { onConflict: "school_slug" });

  if (error) redirect(`/internal/contributor-access?message=${encodeURIComponent(error.message)}`);
  revalidatePath("/internal/contributor-access");
  redirect("/internal/contributor-access?updated=recruitment-saved");
}

export async function clearContributorRecruitment(formData: FormData) {
  const schoolSlug = text(formData, "school_slug");
  const { supabase } = await requireAdmin();
  if (!getSchoolBySlug(schoolSlug)) redirect("/internal/contributor-access?message=Unknown%20program.");

  const { error } = await supabase.from("contributor_recruitment_pipeline").delete().eq("school_slug", schoolSlug);
  if (error) redirect(`/internal/contributor-access?message=${encodeURIComponent(error.message)}`);
  revalidatePath("/internal/contributor-access");
  redirect("/internal/contributor-access?updated=recruitment-cleared");
}

export async function reviewContributorApplication(formData: FormData) {
  const applicationId = text(formData, "application_id");
  const decision = text(formData, "decision");
  const reviewNote = text(formData, "review_note").slice(0, 1000) || null;
  const { supabase } = await requireAdmin();
  if (!applicationId || !["approve", "decline", "defer"].includes(decision)) redirect("/internal/contributor-access?message=Invalid%20application%20decision.");

  const { error } = await supabase.rpc("review_contributor_application", {
    target_application_id: applicationId,
    decision,
    note: reviewNote,
  });
  if (error) redirect(`/internal/contributor-access?message=${encodeURIComponent(error.message)}`);
  revalidatePath("/internal/contributor-access");
  revalidatePath("/contributors");
  revalidatePath("/account");
  revalidatePath("/report-score");
  redirect(`/internal/contributor-access?updated=application-${encodeURIComponent(decision)}d`);
}
