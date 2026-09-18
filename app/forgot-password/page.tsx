import type { Metadata } from "next";
import Link from "next/link";
import { CaptchaSubmit } from "@/components/auth/captcha-submit";
import { requestPasswordReset } from "./actions";

export const metadata: Metadata = { title: "Reset Password Request", robots: { index: false, follow: false, nocache: true } };

type ForgotPasswordPageProps = {
  searchParams: Promise<{
    error?: string;
    status?: string;
  }>;
};

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const { error, status } = await searchParams;
  const sent = status === "sent";
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  return (
    <main className="min-h-screen bg-[var(--vv-bg)] px-4 py-10 text-white sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-xl">
        <section className="rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(122,16,34,0.42),transparent_36%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 sm:rounded-[2rem] sm:p-8">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--vv-accent)] sm:text-xs sm:tracking-[0.3em]">
            VarsityVue Member
          </p>
          <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
            Reset your password.
          </h1>
          <p className="mt-4 text-sm leading-6 text-white/60 sm:text-base sm:leading-7">
            Enter the email address associated with your VarsityVue account.
          </p>

          {sent ? (
            <div
              role="status"
              aria-live="polite"
              className="mt-6 rounded-2xl border border-emerald-300/35 bg-emerald-300/10 p-5"
            >
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-200">
                Check your email
              </p>
              <h2 className="mt-2 text-xl font-black text-white">
                Your request has been received.
              </h2>
              <p className="mt-2 text-sm leading-6 text-emerald-50/75">
                If an account exists for that email, we’ll send a password reset link.
              </p>
            </div>
          ) : (
            <form action={requestPasswordReset} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-white/55"
                >
                  Account email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  aria-describedby={error === "invalid-email" ? "email-error" : undefined}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-[var(--vv-accent)]"
                  placeholder="you@example.com"
                />
                {error === "invalid-email" ? (
                  <p id="email-error" role="alert" className="mt-2 text-sm text-amber-100">
                    Enter a valid email address.
                  </p>
                ) : null}
              </div>

              {error === "security-check" ? (
                <p role="alert" className="text-sm leading-6 text-amber-100">
                  Please complete the security check and try again.
                </p>
              ) : null}

              <CaptchaSubmit
                action="password_reset"
                label="Send reset link"
                siteKey={turnstileSiteKey}
              />
            </form>
          )}

          <div className="mt-5 text-center text-sm text-white/50">
            Remember your password?{" "}
            <Link
              href="/login"
              className="font-bold text-white underline decoration-white/30 underline-offset-4 hover:decoration-white"
            >
              Return to Sign In
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
