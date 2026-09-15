"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

const MANAGED_ROLES = ["member", "scorekeeper", "moderator"] as const;
type ManagedRole = (typeof MANAGED_ROLES)[number];

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) redirect("/login");

  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (!roles?.some((row) => row.role === "admin")) redirect("/account");

  return { supabase };
}

export async function updateMemberRole(formData: FormData) {
  const targetUserId = text(formData, "user_id");
  const role = text(formData, "role") as ManagedRole;
  const enabled = text(formData, "enabled") === "true";
  const { supabase } = await requireAdmin();

  if (!targetUserId || !MANAGED_ROLES.includes(role)) {
    redirect("/internal/members?message=Invalid%20member%20or%20role.");
  }

  if (!enabled && role === "member") {
    redirect("/internal/members?message=Member%20is%20the%20base%20account%20role%20and%20cannot%20be%20removed%20here.");
  }

  const { error } = await supabase.rpc("admin_set_user_role", {
    target_user_id: targetUserId,
    target_role: role,
    enabled,
  });

  if (error) redirect(`/internal/members?message=${encodeURIComponent(error.message)}`);

  revalidatePath("/internal/members");
  revalidatePath("/account");
  revalidatePath("/internal/score-review");
  redirect(`/internal/members?updated=${enabled ? "granted" : "removed"}`);
}
