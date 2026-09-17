"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const recoveryCookie = "vv_password_recovery";
const updatedCookie = "vv_password_updated";

function resetUrl(error: string) {
  const params = new URLSearchParams({ error });
  return `/reset-password?${params.toString()}`;
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("new_password") ?? "");
  const confirmation = String(formData.get("confirm_password") ?? "");

  if (password.length < 8) {
    redirect(resetUrl("too-short"));
  }

  if (password !== confirmation) {
    redirect(resetUrl("mismatch"));
  }

  const cookieStore = await cookies();
  if (cookieStore.get(recoveryCookie)?.value !== "verified") {
    redirect(resetUrl("invalid-link"));
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    redirect(resetUrl("invalid-link"));
  }

  const { error: updateError } = await supabase.auth.updateUser({ password });

  if (updateError) {
    console.error("Supabase Auth rejected a password recovery update.", {
      code: updateError.code,
      status: updateError.status,
    });
    redirect(resetUrl("update-failed"));
  }

  cookieStore.delete(recoveryCookie);
  cookieStore.set(updatedCookie, "confirmed", {
    httpOnly: true,
    maxAge: 5 * 60,
    path: "/reset-password",
    sameSite: "lax",
    secure: true,
  });
  const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
  if (signOutError) {
    console.error("The local recovery session could not be cleared.", {
      code: signOutError.code,
      status: signOutError.status,
    });
  }

  redirect("/reset-password?status=updated");
}
