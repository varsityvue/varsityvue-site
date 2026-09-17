import type { AuthError } from "@supabase/supabase-js";

export const captchaMessage = "Please complete the security check and try again.";

export function captchaToken(formData: FormData) {
  return String(formData.get("captcha_token") ?? "").trim();
}

export function isCaptchaError(error: AuthError) {
  return error.code === "captcha_failed";
}
