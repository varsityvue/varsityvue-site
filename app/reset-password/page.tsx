import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { updatePassword } from "./actions";

export const metadata: Metadata = { title: "Reset Password", robots: { index: false, follow: false, nocache: true } };

const recoveryCookie = "vv_password_recovery";
const updatedCookie = "vv_password_updated";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    error?: string;
    status?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  "too-short": "Use a password with at least 8 characters.",
  mismatch: "The two passwords do not match.",
  "same-password": "Choose a different password. Your new password must be different from your current password.",
  "update-failed": "We could not update your password. Try again, or request a new reset link if the problem continues.",
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { error, status } = await searchParams;
  const cookieStore = await cookies();
  const updated =
    status === "updated" &&
    cookieStore.get(updatedCookie)?.value === "confirmed";
  const hasRecoveryMarker = cookieStore.get(recoveryCookie)?.value === "verified";
  const supabase = await createClient();
  const { data: userData } = updated
    ? { data: { user: null } }
    : await supabase.auth.getUser();
  const hasRecoverySession = Boolean(userData.user);
  const invalidLink =
    error === "invalid-link" ||
    (!updated && (!hasRecoveryMarker || !hasRecoverySession));

  return (
    <main className="min-h-screen bg-[var(--vv-bg)] px-4 py-10 text-white sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-xl">
        <section className="rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(122,16,34,0.42),transparent_36%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 sm:rounded-[2rem] sm:p-8">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--vv-accent)] sm:text-xs sm:tracking-[0.3em]">
            VarsityVue Member
          </p>

          {updated ? (
            <>
              <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
                Password changed.
              </h1>
              <div
                role="status"
                aria-live="polite"
                className="mt-6 rounded-2xl border border-emerald-300/35 bg-emerald-300/10 p-5"
              >
                <p className="text-sm leading-6 text-emerald-50/80">
                  Your VarsityVue password was updated successfully. Sign in with your new password to continue.
                </p>
              </div>
              <Link
                href="/login"
                className="mt-6 block w-full rounded-full bg-[var(--vv-primary)] px-6 py-3.5 text-center text-sm font-black transition hover:bg-[#93142a]"
              >
                Continue to Sign In
              </Link>
            </>
          ) : invalidLink ? (
            <>
              <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
                Reset link unavailable.
              </h1>
              <div role="alert" className="mt-6 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-5">
                <p className="text-sm leading-6 text-amber-50/80">
                  This password reset link is invalid or has expired.
                </p>
              </div>
              <Link
                href="/forgot-password"
                className="mt-6 block w-full rounded-full bg-[var(--vv-primary)] px-6 py-3.5 text-center text-sm font-black transition hover:bg-[#93142a]"
              >
                Request a new reset link
              </Link>
              <div className="mt-5 text-center text-sm text-white/50">
                <Link
                  href="/login"
                  className="font-bold text-white underline decoration-white/30 underline-offset-4 hover:decoration-white"
                >
                  Return to Sign In
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
                Choose a new password.
              </h1>
              <p className="mt-4 text-sm leading-6 text-white/60 sm:text-base sm:leading-7">
                Use at least 8 characters. You’ll sign in again after the password is changed.
              </p>

              {error && errorMessages[error] ? (
                <div role="alert" className="mt-5 rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm leading-6 text-amber-50/85">
                  {errorMessages[error]}
                </div>
              ) : null}

              <form action={updatePassword} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="new_password" className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-white/55">
                    New password
                  </label>
                  <input
                    id="new_password"
                    name="new_password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-[var(--vv-accent)]"
                    placeholder="At least 8 characters"
                  />
                </div>

                <div>
                  <label htmlFor="confirm_password" className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-white/55">
                    Confirm new password
                  </label>
                  <input
                    id="confirm_password"
                    name="confirm_password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-[var(--vv-accent)]"
                    placeholder="Enter it again"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-full bg-[var(--vv-primary)] px-6 py-3.5 text-sm font-black transition hover:bg-[#93142a]"
                >
                  Update password
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
