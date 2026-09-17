"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireActiveMember } from "@/lib/member-access";

const MANAGED_ROLES = ["member", "scorekeeper", "moderator"] as const;
type ManagedRole = (typeof MANAGED_ROLES)[number];

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function membersReturnPath(formData: FormData) {
  const raw = text(formData, "return_to");
  if (!raw) return "/internal/members";

  try {
    const url = new URL(raw, "https://varsityvue.com");
    if (url.origin !== "https://varsityvue.com" || url.pathname !== "/internal/members") {
      return "/internal/members";
    }
    return `${url.pathname}${url.search}`;
  } catch {
    return "/internal/members";
  }
}

function resultPath(returnTo: string, key: "message" | "updated", value: string) {
  const url = new URL(returnTo, "https://varsityvue.com");
  url.searchParams.delete("message");
  url.searchParams.delete("updated");
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}`;
}

function lifecycleMessage(error: { message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";
  if (message.includes("own account")) return "You cannot perform that lifecycle action on your own account.";
  if (message.includes("final active administrator")) return "VarsityVue must retain at least one active administrator.";
  if (message.includes("member not found")) return "That member no longer exists.";
  if (message.includes("type the member email")) return "Type the member email exactly to confirm permanent deletion.";
  if (message.includes("admin access required")) return "Active administrator access is required.";
  return "We could not update that member account. No lifecycle change was made.";
}

async function requireAdmin() {
  const { supabase, userId } = await requireActiveMember();
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (!roles?.some((row) => row.role === "admin")) redirect("/account");
  return { supabase };
}

export async function updateMemberRole(formData: FormData) {
  const targetUserId = text(formData, "user_id");
  const role = text(formData, "role") as ManagedRole;
  const enabled = text(formData, "enabled") === "true";
  const returnTo = membersReturnPath(formData);
  const { supabase } = await requireAdmin();

  if (!targetUserId || !MANAGED_ROLES.includes(role)) {
    redirect(resultPath(returnTo, "message", "Invalid member or role."));
  }

  if (!enabled && role === "member") {
    redirect(resultPath(returnTo, "message", "Member is the base account role and cannot be removed here."));
  }

  const { error } = await supabase.rpc("admin_set_user_role", {
    target_user_id: targetUserId,
    target_role: role,
    enabled,
  });

  if (error) redirect(resultPath(returnTo, "message", "We could not update that member role."));

  revalidatePath("/internal/members");
  revalidatePath("/account");
  revalidatePath("/internal/score-review");
  redirect(resultPath(returnTo, "updated", enabled ? "Role granted." : "Role removed."));
}

export async function suspendMember(formData: FormData) {
  const targetUserId = text(formData, "user_id");
  const returnTo = membersReturnPath(formData);
  const { supabase } = await requireAdmin();

  if (!targetUserId) redirect(resultPath(returnTo, "message", "Choose a valid member."));

  const { data, error } = await supabase.rpc("admin_set_member_suspension", {
    target_user_id: targetUserId,
    suspend: true,
  });

  if (error) redirect(resultPath(returnTo, "message", lifecycleMessage(error)));

  revalidatePath("/internal/members");
  redirect(resultPath(returnTo, "updated", data === "already_suspended" ? "Account was already suspended." : "Account suspended."));
}

export async function restoreMember(formData: FormData) {
  const targetUserId = text(formData, "user_id");
  const returnTo = membersReturnPath(formData);
  const { supabase } = await requireAdmin();

  if (!targetUserId) redirect(resultPath(returnTo, "message", "Choose a valid member."));

  const { data, error } = await supabase.rpc("admin_set_member_suspension", {
    target_user_id: targetUserId,
    suspend: false,
  });

  if (error) redirect(resultPath(returnTo, "message", lifecycleMessage(error)));

  revalidatePath("/internal/members");
  redirect(resultPath(returnTo, "updated", data === "already_active" ? "Account was already active." : "Account restored."));
}

export async function permanentlyDeleteMember(formData: FormData) {
  const targetUserId = text(formData, "user_id");
  const confirmation = text(formData, "confirmation");
  const returnTo = membersReturnPath(formData);
  const { supabase } = await requireAdmin();

  if (!targetUserId || !confirmation) {
    redirect(resultPath(returnTo, "message", "Type the member email exactly to confirm permanent deletion."));
  }

  const { error } = await supabase.rpc("admin_permanently_delete_member", {
    target_user_id: targetUserId,
    confirmation,
  });

  if (error) redirect(resultPath(returnTo, "message", lifecycleMessage(error)));

  revalidatePath("/internal/members");
  revalidatePath("/internal/contributor-access");
  revalidatePath("/internal/score-review");
  redirect(resultPath(returnTo, "updated", "Account permanently deleted."));
}
