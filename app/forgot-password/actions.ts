"use server";

import { redirect } from "next/navigation";
import { captchaToken, isCaptchaError } from "@/lib/auth-captcha";
import { createClient } from "@/lib/supabase/server";

const recoveryCallbackUrl = "https://varsityvue.com/auth/recovery";

function isEmail(value: string) {
  return (
    value.length <= 320 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  );
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const token = captchaToken(formData);

  if (!isEmail(email)) {
    redirect("/forgot-password?error=invalid-email");
  }

  if (!token) {
    redirect("/forgot-password?error=security-check");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    captchaToken: token,
    redirectTo: recoveryCallbackUrl,
  });

  if (error) {
    if (isCaptchaError(error)) {
      redirect("/forgot-password?error=security-check");
    }
    // Keep the public response neutral so provider errors cannot reveal whether
    // the submitted address belongs to a VarsityVue account.
    console.error("Password recovery request was not accepted by Supabase Auth.", {
      code: error.code,
      status: error.status,
    });
  }

  redirect("/forgot-password?status=sent");
}
