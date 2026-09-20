import type { Metadata } from "next";
import Link from "next/link";
import ConversionViewEvent from "@/components/ConversionViewEvent";
import { CaptchaSubmit } from "@/components/auth/captcha-submit";
import { safeNextPath } from "@/lib/safe-next-path";
import { getSchoolBySlug } from "@/lib/schools";
import { login, signup } from "./actions";

export const metadata: Metadata = { title: "Log In", robots: { index: false, follow: false, nocache: true } };

type LoginPageProps = {
  searchParams: Promise<{
    message?: string;
    mode?: string;
    next?: string;
    status?: string;
  }>;
};

function intendedSchoolSlug(returnTo: string) {
  if (!returnTo.startsWith("/follow/complete?")) return undefined;
  const params = new URLSearchParams(returnTo.split("?")[1] ?? "");
  return params.get("school") ?? undefined;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { message, mode, next, status } = await searchParams;
  const signupMode = mode === "signup";
  const returnTo = safeNextPath(next);
  const followSchoolSlug = intendedSchoolSlug(returnTo);
  const followSchool = followSchoolSlug
    ? getSchoolBySlug(followSchoolSlug)
    : undefined;
  const confirmationPending = status === "confirmation-pending";
  const crossDeviceConfirmation = status === "confirmation-cross-device";
  const toggleParams = new URLSearchParams();
  if (!signupMode) toggleParams.set("mode", "signup");
  if (returnTo !== "/account") toggleParams.set("next", returnTo);
  const toggleHref = toggleParams.size ? `/login?${toggleParams.toString()}` : "/login";
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const sourceIntent = followSchool
    ? "follow"
    : returnTo.startsWith("/report-score")
      ? "score_report"
      : "account";

  return (
    <main className="min-h-screen bg-[var(--vv-bg)] px-4 py-10 text-white sm:px-6 sm:py-16 lg:px-8">
      {signupMode ? (
        <ConversionViewEvent
          name="Signup Viewed"
          properties={{ intent: sourceIntent, school: followSchool?.slug }}
        />
      ) : null}
      <div className="mx-auto max-w-xl">
        <section className="rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(122,16,34,0.42),transparent_36%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 sm:rounded-[2rem] sm:p-8">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--vv-accent)] sm:text-xs sm:tracking-[0.3em]">
            VarsityVue Member
          </p>
          <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
            {signupMode ? "Create your account." : "Welcome back."}
          </h1>
          <p className="mt-4 text-sm leading-6 text-white/60 sm:text-base sm:leading-7">
            Sign in to make picks, follow your teams, and share scores and local football information.
          </p>

          {confirmationPending ? (
            <div
              role="status"
              aria-live="polite"
              className="mt-6 rounded-2xl border border-emerald-300/35 bg-emerald-300/10 p-5 shadow-[0_0_0_1px_rgba(110,231,183,0.05)]"
            >
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-200">
                Account created
              </p>
              <h2 className="mt-2 text-xl font-black text-white">
                Check your email to confirm your account.
              </h2>
              <p className="mt-2 text-sm leading-6 text-emerald-50/75">
                Open the message from VarsityVue and select the confirmation link.
                {followSchool
                  ? ` After confirmation, we’ll return you to finish following ${followSchool.name}.`
                  : " After confirmation, you can sign in to VarsityVue."}
              </p>
            </div>
          ) : null}

          {crossDeviceConfirmation ? (
            <div
              role="status"
              aria-live="polite"
              className="mt-6 rounded-2xl border border-emerald-300/35 bg-emerald-300/10 p-5"
            >
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-200">
                Confirmation link opened
              </p>
              <h2 className="mt-2 text-xl font-black text-white">
                Continue by signing in.
              </h2>
              <p className="mt-2 text-sm leading-6 text-emerald-50/75">
                We couldn’t finish signing you in from this confirmation link.
                Your account may already be confirmed. Sign in to continue
                {followSchool
                  ? ` and return to ${followSchool.name} to finish following with one click.`
                  : "."}
              </p>
            </div>
          ) : null}

          {returnTo.startsWith("/report-score") ? (
            <div className="mt-5 rounded-2xl border border-[var(--vv-accent)]/15 bg-white/[0.04] px-4 py-3 text-xs leading-5 text-white/55">
              Sign in or create an account and we’ll return you directly to the score report you selected.
            </div>
          ) : null}

          {followSchoolSlug && !confirmationPending && !crossDeviceConfirmation ? (
            <div className="mt-5 rounded-2xl border border-[var(--vv-accent)]/15 bg-white/[0.04] px-4 py-3 text-xs leading-5 text-white/55">
              Sign in or create an account to finish following your selected school.
            </div>
          ) : null}

          {message ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-6 text-white/75">
              {message}
            </div>
          ) : null}

          <form action={signupMode ? signup : login} className="mt-6 space-y-4">
            <input type="hidden" name="next" value={returnTo} />
            {signupMode ? (
              <div>
                <label htmlFor="display_name" className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-white/55">
                  Display name
                </label>
                <input
                  id="display_name"
                  name="display_name"
                  type="text"
                  autoComplete="name"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-[var(--vv-accent)]"
                  placeholder="Your name"
                />
              </div>
            ) : null}

            <div>
              <label htmlFor="email" className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-white/55">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-[var(--vv-accent)]"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-white/55">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={signupMode ? "new-password" : "current-password"}
                minLength={8}
                required
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-[var(--vv-accent)]"
                placeholder="At least 8 characters"
              />
            </div>

            <CaptchaSubmit
              action={signupMode ? "signup" : "signin"}
              label={signupMode ? "Create VarsityVue Account" : "Sign In"}
              siteKey={turnstileSiteKey}
              schoolSlug={followSchool?.slug}
              sourceIntent={sourceIntent}
            />
          </form>

          <div className="mt-5 text-center text-sm text-white/50">
            {signupMode ? "Already have an account?" : "New to VarsityVue?"}{" "}
            <Link
              href={toggleHref}
              className="font-bold text-white underline decoration-white/30 underline-offset-4 hover:decoration-white"
            >
              {signupMode ? "Sign in" : "Create one"}
            </Link>
          </div>
          {!signupMode ? (
            <div className="mt-3 text-center text-sm">
              <Link
                href="/forgot-password"
                className="font-bold text-white/65 underline decoration-white/25 underline-offset-4 transition hover:text-white hover:decoration-white"
              >
                Forgot your password?
              </Link>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
