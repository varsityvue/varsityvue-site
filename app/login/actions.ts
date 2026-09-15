"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

async function notifyAdminOfNewMember({
  userId,
  displayName,
  email,
}: {
  userId: string;
  displayName: string;
  email: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("New-member notification skipped: RESEND_API_KEY is not configured.");
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `varsityvue-new-member/${userId}`,
    },
    body: JSON.stringify({
      from: "VarsityVue <notifications@varsityvue.com>",
      to: ["info@varsityvue.com"],
      subject: `New VarsityVue member: ${displayName}`,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#111"><h2 style="margin-bottom:12px">New VarsityVue member</h2><p>A new account was just created.</p><p><strong>Name:</strong> ${escapeHtml(displayName)}<br><strong>Email:</strong> ${escapeHtml(email)}</p><p style="color:#666;font-size:13px">User ID: ${escapeHtml(userId)}</p></div>`,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend new-member notification failed (${response.status}): ${detail}`);
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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

  // Supabase returns an empty identities array when signup is attempted for an
  // existing confirmed account. Only alert for a genuinely new auth identity.
  if (data.user && (data.user.identities?.length ?? 0) > 0) {
    try {
      await notifyAdminOfNewMember({ userId: data.user.id, displayName, email });
    } catch (notificationError) {
      // Account creation must not fail just because the admin alert provider is
      // temporarily unavailable. The failure remains visible in Vercel logs.
      console.error("Failed to send new-member notification.", notificationError);
    }
  }

  revalidatePath("/", "layout");
  redirect(loginUrl("Check your email to confirm your account.", next));
}
