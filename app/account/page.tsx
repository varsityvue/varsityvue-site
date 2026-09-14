import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (!claims?.sub) {
    redirect("/login");
  }

  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, username, favorite_school_slug, created_at")
      .eq("id", claims.sub)
      .maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", claims.sub),
  ]);

  const displayName = profile?.display_name || claims.email || "VarsityVue Member";
  const canModerate = roles?.some((row) => row.role === "moderator" || row.role === "admin");

  return (
    <main className="min-h-screen bg-[var(--vv-bg)] px-4 py-10 text-white sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <section className="rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(122,16,34,0.42),transparent_36%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 sm:rounded-[2rem] sm:p-8">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--vv-accent)] sm:text-xs sm:tracking-[0.3em]">
            VarsityVue Member
          </p>
          <h1 className="mt-3 text-3xl font-black sm:text-5xl">{displayName}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60 sm:text-base sm:leading-7">
            This account is your home for score contributions now, with Pick ’Ems, followed schools, notifications, and contributor history coming next.
          </p>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Account</p>
            <p className="mt-2 text-sm text-white/75">{claims.email || "Email unavailable"}</p>
            <p className="mt-1 text-xs text-white/40">
              {profile?.username ? `@${profile.username}` : "Username setup coming next."}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Following</p>
            <p className="mt-2 text-sm text-white/75">
              {profile?.favorite_school_slug || "No favorite school selected yet."}
            </p>
            <p className="mt-1 text-xs text-white/40">School follows and notification controls are on the roadmap.</p>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
          <h2 className="text-xl font-black">Game-night participation is live.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
            Members can report live and final scores. Reports stay pending until VarsityVue reviews them, so community help improves coverage without sacrificing verification.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/report-score"
              className="rounded-full bg-[var(--vv-primary)] px-5 py-2.5 text-sm font-bold transition hover:bg-[#93142a]"
            >
              Report a Score
            </Link>
            <Link
              href="/scores"
              className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-bold text-white/80 transition hover:border-white/30 hover:text-white"
            >
              View Scores
            </Link>
            {canModerate ? (
              <Link
                href="/internal/score-review"
                className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-5 py-2.5 text-sm font-bold text-emerald-50 transition hover:bg-emerald-400/15"
              >
                Review Score Reports
              </Link>
            ) : null}
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-bold text-white/70 transition hover:border-white/30 hover:text-white"
              >
                Sign Out
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
