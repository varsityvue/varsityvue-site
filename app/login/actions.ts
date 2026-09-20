"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deliverNextMemberNotification } from "@/lib/member-notifications";
import { captchaMessage, captchaToken, isCaptchaError } from "@/lib/auth-captcha";
import { trackConversion } from "@/lib/conversion-analytics";
import { memberAccountStatus } from "@/lib/member-access";
import { safeNextPath } from "@/lib/safe-next-path";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function loginUrl(message: string, next: string, mode?: "signup") {
  const params = new URLSearchParams({ message });
  if (next !== "/account") params.set("next", next);
  if (mode) params.set("mode", mode);
  return `/login?${params.toString()}`;
}

function confirmationPendingUrl(next: string) {
  const params = new URLSearchParams({ status: "confirmation-pending" });
  if (next !== "/account") params.set("next", next);
  return `/login?${params.toString()}`;
}

function signupIntent(next: string) {
  if (next.startsWith("/follow/complete?")) return "follow";
  if (next.startsWith("/pickem")) return "pickem";
  if (next.startsWith("/report-score")) return "score_report";
  return "account";
}

export async function login(formData: FormData) {
  const email = value(formData, "email");
  const password = value(formData, "password");
  const next = safeNextPath(value(formData, "next"));
  const token = captchaToken(formData);

  if (!email || !password) {
    redirect(loginUrl("Enter your email and password.", next));
  }

  if (!token) {
    redirect(loginUrl(captchaMessage, next));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: { captchaToken: token },
  });

  if (error) {
    redirect(
      loginUrl(
        isCaptchaError(error) ? captchaMessage : "The email or password is incorrect.",
        next,
      ),
    );
  }

  if (data.user) {
    const status = await memberAccountStatus(supabase, data.user.id);
    if (status !== "active") {
      await supabase.auth.signOut({ scope: "global" });
      redirect(loginUrl("Account suspended. Contact VarsityVue for account assistance.", "/account"));
    }
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signup(formData: FormData) {
  const displayName = value(formData, "display_name");
  const email = value(formData, "email");
  const password = value(formData, "password");
  const next = safeNextPath(value(formData, "next"));
  const submittedSource = value(formData, "signup_source");
  const signupSource = submittedSource === "home" || submittedSource === "scoreboard"
    ? submittedSource
    : "direct_or_other";
  const token = captchaToken(formData);

  if (!displayName || !email || password.length < 8) {
    redirect(
      loginUrl(
        "Enter your name, email, and a password of at least 8 characters.",
        next,
        "signup",
      ),
    );
  }

  if (!token) {
    redirect(loginUrl(captchaMessage, next, "signup"));
  }

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? "https://varsityvue.com";
  const confirmUrl = new URL("/auth/confirm", origin);
  if (next !== "/account") confirmUrl.searchParams.set("next", next);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      captchaToken: token,
      emailRedirectTo: confirmUrl.toString(),
      data: {
        display_name: displayName,
        signup_intent: signupIntent(next),
        signup_source: signupSource,
      },
    },
  });

  if (error) {
    redirect(
      loginUrl(
        isCaptchaError(error)
          ? captchaMessage
          : "We couldn't create that account. Check your details and try again.",
        next,
        "signup",
      ),
    );
  }

  // The auth.users trigger owns durable new-member detection. This immediate
  // attempt only reduces delivery latency; scheduled retries recover failures.
  if (data.user && (data.user.identities?.length ?? 0) > 0) {
    trackConversion("Account Created", { intent: signupIntent(next) });
    try {
      await deliverNextMemberNotification();
    } catch (notificationError) {
      console.error("Immediate member-notification attempt failed.", notificationError);
    }
  }

  revalidatePath("/", "layout");
  redirect(confirmationPendingUrl(next));
}
