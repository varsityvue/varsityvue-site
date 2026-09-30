"use server";

import { requireActiveMember } from "@/lib/member-access";
import { captchaMessage, captchaToken, isCaptchaError } from "@/lib/auth-captcha";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@supabase/supabase-js";

export type PasswordState = { status: "idle" | "error" | "success" | "nonce"; message: string };

export async function changePassword(_previous: PasswordState, formData: FormData): Promise<PasswordState> {
  const current = formData.get("current_password");
  const next = formData.get("new_password");
  const confirmation = formData.get("confirm_password");
  const nonce = formData.get("nonce");
  if (typeof current !== "string" || typeof next !== "string" || typeof confirmation !== "string")
    return { status: "error", message: "Complete all password fields." };
  if (next.length < 8) return { status: "error", message: "Use a password with at least 8 characters." };
  if (next !== confirmation) return { status: "error", message: "The new passwords do not match." };
  if (next === current) return { status: "error", message: "Choose a different new password." };
  const token = captchaToken(formData);
  if (!token) return { status: "error", message: captchaMessage };
  const { supabase, userId } = await requireActiveMember();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || userData.user?.id !== userId || !userData.user.email)
    return { status: "error", message: "Could not verify your account. Sign in again." };

  // Verify the current password with Auth itself. The updateUser current_password
  // parameter is only enforced if the project's optional Auth setting is enabled.
  // This separate client never persists its temporary session or touches SSR cookies.
  const { url, publishableKey } = getSupabaseConfig();
  const verifier = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data: verified, error: verificationError } = await verifier.auth.signInWithPassword({
    email: userData.user.email, password: current, options: { captchaToken: token },
  });
  if (verificationError || verified.user?.id !== userId) {
    return { status: "error", message: verificationError && isCaptchaError(verificationError)
      ? captchaMessage : "The current password is incorrect." };
  }
  await verifier.auth.signOut({ scope: "local" });
  const { error } = await supabase.auth.updateUser({
    password: next,
    ...(typeof nonce === "string" && nonce.trim() ? { nonce: nonce.trim() } : {}),
  });
  if (error) {
    if (error.code === "reauthentication_needed") {
      const { error: nonceError } = await supabase.auth.reauthenticate();
      return nonceError
        ? { status: "error", message: "Could not send a reauthentication code. Try again later." }
        : { status: "nonce", message: "Check your email for a reauthentication code, then reenter your passwords and the code." };
    }
    return { status: "error", message: error.code === "same_password" ? "Choose a different new password."
      : "Password change rejected. Check your current password and try again." };
  }
  const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
  return signOutError
    ? { status: "error", message: "Password changed, but local sign-out failed. Sign out manually before continuing." }
    : { status: "success", message: "Password changed. Sign in again with your new password." };
}
