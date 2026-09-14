import Link from "next/link";
import { login, signup } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{
    message?: string;
    mode?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { message, mode } = await searchParams;
  const signupMode = mode === "signup";

  return (
    <main className="min-h-screen bg-[var(--vv-bg)] px-4 py-10 text-white sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-xl">
        <section className="rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(122,16,34,0.42),transparent_36%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 sm:rounded-[2rem] sm:p-8">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--vv-accent)] sm:text-xs sm:tracking-[0.3em]">
            VarsityVue Member
          </p>
          <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
            {signupMode ? "Create your account." : "Welcome back."}
          </h1>
          <p className="mt-4 text-sm leading-6 text-white/60 sm:text-base sm:leading-7">
            Member accounts will power Pick ’Ems, followed schools, score contributions, notifications, and contributor reputation.
          </p>

          {message ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-6 text-white/75">
              {message}
            </div>
          ) : null}

          <form className="mt-6 space-y-4">
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

            <button
              formAction={signupMode ? signup : login}
              className="w-full rounded-full bg-[var(--vv-primary)] px-6 py-3.5 text-sm font-black transition hover:bg-[#93142a]"
            >
              {signupMode ? "Create VarsityVue Account" : "Sign In"}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-white/50">
            {signupMode ? "Already have an account?" : "New to VarsityVue?"}{" "}
            <Link
              href={signupMode ? "/login" : "/login?mode=signup"}
              className="font-bold text-white underline decoration-white/30 underline-offset-4 hover:decoration-white"
            >
              {signupMode ? "Sign in" : "Create one"}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
