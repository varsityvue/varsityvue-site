"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function requireModerator() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) redirect("/login");

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  const canModerate = roles?.some((row) => row.role === "moderator" || row.role === "admin");
  if (!canModerate) redirect("/account");

  return { supabase, userId };
}

export async function approveScoreSubmission(formData: FormData) {
  const submissionId = text(formData, "submission_id");
  const reviewNote = text(formData, "review_note") || null;
  const { supabase, userId } = await requireModerator();

  const { error } = await supabase
    .from("score_submissions")
    .update({
      status: "approved",
      reviewed_by: userId,
      review_note: reviewNote,
    })
    .eq("id", submissionId)
    .eq("status", "pending");

  if (error) {
    redirect(`/internal/score-review?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/internal/score-review");
  revalidatePath("/scores");
  redirect("/internal/score-review?reviewed=approved");
}

export async function rejectScoreSubmission(formData: FormData) {
  const submissionId = text(formData, "submission_id");
  const reviewNote = text(formData, "review_note") || "Rejected during review.";
  const { supabase, userId } = await requireModerator();

  const { error } = await supabase
    .from("score_submissions")
    .update({
      status: "rejected",
      reviewed_by: userId,
      review_note: reviewNote,
    })
    .eq("id", submissionId)
    .eq("status", "pending");

  if (error) {
    redirect(`/internal/score-review?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/internal/score-review");
  redirect("/internal/score-review?reviewed=rejected");
}
