"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) redirect("/login");

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
