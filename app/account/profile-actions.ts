"use server";

import { revalidatePath } from "next/cache";
import { requireActiveMember } from "@/lib/member-access";
import { centralDateTime, validateUsername } from "@/lib/account-username";

export type UsernameState = { status: "idle" | "success" | "error"; message: string; username?: string; nextEligible?: string };

export async function saveUsername(_previous: UsernameState, formData: FormData): Promise<UsernameState> {
  const raw = formData.get("username");
  if (typeof raw !== "string") return { status: "error", message: "Enter a username." };
  const { supabase, userId } = await requireActiveMember();
  const { data: profile, error: readError } = await supabase.from("profiles")
    .select("username, username_changed_at").eq("id", userId).single();
  if (readError || !profile) return { status: "error", message: "Unauthorized or profile unavailable." };
  const candidate = validateUsername(raw, profile.username);
  if (candidate.error === "invalid") return { status: "error", message: "Use 3–30 letters, numbers, or underscores only." };
  if (candidate.error === "reserved") return { status: "error", message: "That username is reserved." };
  if (candidate.error === "no-op") return { status: "error", message: "That is already your username." };
  if (profile.username_changed_at) {
    const next = new Date(new Date(profile.username_changed_at).getTime() + 30 * 86400000);
    if (Date.now() < next.getTime()) return { status: "error", message: `You can change your username after ${centralDateTime(next.toISOString())}.` };
  }
  const { data, error } = await supabase.from("profiles")
    .update({ username: candidate.canonical })
    .eq("id", userId).select("username, username_changed_at").single();
  if (error) {
    const message = error.code === "23505" ? "That username is already taken."
      : /Reserved username/.test(error.message) ? "That username is reserved."
      : /cooldown/.test(error.message) ? "Your 30-day username change limit is still active. Refresh for the exact next eligible time."
      : /unchanged/.test(error.message) ? "That is already your username."
      : /Invalid username/.test(error.message) ? "Use 3–30 letters, numbers, or underscores only."
      : "Username could not be updated. Check your account status and try again.";
    return { status: "error", message };
  }
  revalidatePath("/account");
  return { status: "success", username: data.username,
    nextEligible: data.username_changed_at ?? undefined,
    message: data.username_changed_at
      ? `Username updated. You can change it again after ${centralDateTime(new Date(new Date(data.username_changed_at).getTime() + 30 * 86400000).toISOString())}.`
      : "Username chosen. Your first future rename will start the 30-day limit." };
}
