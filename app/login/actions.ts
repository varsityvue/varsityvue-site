"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deliverNextMemberNotification } from "@/lib/member-notifications";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function safeNext(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) return "/account";
  return value;
}

function loginUrl(message: string, next: string, mode?: "signup") {
  const params = new URLSearchParams({ message });
  if (next !== "/account") params.set("next", next);
  if (mode) params.set("mode", mode);
  return `/login?${params.toString()}`;
}

export async function login(formData: FormData) {
  const email = value(formData, "email");
  const password = value(formData, "password");
  const next = safeNext(value(formData, "next"));

  if (!email || !password) {
    redirect(loginUrl("Enter your email and password.", next));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(loginUrl(error.message, next));
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signup(formData: FormData) {
  const displayName = value(formData, "display_name");
  const email = value(formData, "email");
  const password = value(formData, "password");
  const next = safeNext(value(formData, "next"));

  if (!displayName || !email || password.length < 8) {
    redirect(
      loginUrl(
        "Enter your name, email, and a password of at least 8 characters.",
        next,
        "signup",
      ),
    );
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
      emailRedirectTo: confirmUrl.toString(),
      data: {
        display_name: displayName,
      },
    },
  });

  if (error) {
    redirect(loginUrl(error.message, next, "signup"));
  }

  // The auth.users trigger owns durable new-member detection. This immediate
  // attempt only reduces delivery latency; scheduled retries recover failures.
  if (data.user && (data.user.identities?.length ?? 0) > 0) {
    try {
      await deliverNextMemberNotification();
    } catch (notificationError) {
      console.error("Immediate member-notification attempt failed.", notificationError);
    }
  }

  revalidatePath("/", "layout");
  redirect(loginUrl("Check your email to confirm your account.", next));
}
