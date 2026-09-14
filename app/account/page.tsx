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

  const roleSet = new Set((roles ?? []).map((row) => row.role));
  const isAdmin = roleSet.has("admin");
  const isModerator = roleSet.has("moderator");
  const isScorekeeper = roleSet.has("scorekeeper");
  const canModerate = isModerator || isAdmin;
  const isContributor = isScorekeeper || canModerate;

  const displayName = profile?.display_name || claims.email || "VarsityVue Member";
  const accountLabel = isAdmin
    ? "VarsityVue Admin"
    : isModerator
      ? "VarsityVue Moderator"
      : isScorekeeper
        ? "VarsityVue Scorekeeper"
        : "VarsityVue Member";

  const visibleRoles = [
    roleSet.has("member") ? "Member" : null,
    isScorekeeper ? "Scorekeeper" : null,
    isModerator ? "Moderator" : null,
    isAdmin ? "Admin" : null,
  ].filter(Boolean) as string[];

  return (
    <main className="min-h-screen bg-[var(--vv-bg)] px-4 py-10 text-white sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(122,16,34,0.42),transparent_36%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 sm:rounded-[2rem] sm:p-8">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--vv-accent)] sm:text-xs sm:tracking-[0.3em]">
            {accountLabel}
          </p>
          <h1 className="mt-3 text-3xl font-black sm:text-5xl">{displayName}</h1>
          <div className="mt-4 flex flex-wrap gap-2">
            {visibleRoles.map((role) => (
              <span key={role} className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white/55">
                {role}
              </span>
            ))}
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60 sm:text-base sm:leading-7">
            {isContributor
              ? "Your account includes game-night contributor tools in addition to the normal VarsityVue member experience."
              : "Your VarsityVue account is your home for community score reports now, with Pick ’Ems, followed schools, notifications, and more coming next."}
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

        {isContributor ? (
          <section className="mt-6 rounded-[1.5rem] border border-[var(--vv-primary)]/40 bg-[radial-gradient(circle_at_top_left,rgba(122,16,34,0.24),transparent_45%),rgba(255,255,255,0.035)] p-5 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--vv-accent)]">Contributor Dashboard</p>
                <h2 className="mt-2 text-2xl font-black">Game-night tools</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                  Submit live or final score reports from games already cleared for scoreboard identity. Reports still pass through verification before becoming official VarsityVue game state.
                </p>
              </div>
              <span className="w-fit rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-emerald-100">
                Contributor Access
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/report-score" className="rounded-full bg-[var(--vv-primary)] px-5 py-2.5 text-sm font-black transition hover:bg-[#93142a]">
                Enter Score
              </Link>
              <Link href="/scoreboard" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-bold text-white/80 transition hover:border-white/30 hover:text-white">
                View Scoreboard
              </Link>
              {canModerate ? (
                <Link href="/internal/score-review" className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-5 py-2.5 text-sm font-bold text-emerald-50 transition hover:bg-emerald-400/15">
                  Review Score Reports
                </Link>
              ) : null}
            </div>
          </section>
        ) : (
          <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Community Participation</p>
            <h2 className="mt-2 text-xl font-black">Help keep Friday night current.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
              Members can send score reports for review. Verified contributor and moderation tools stay separate from the standard member account.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/report-score" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-bold text-white/80 transition hover:border-white/30 hover:text-white">
                Report a Score
              </Link>
              <Link href="/scoreboard" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-bold text-white/80 transition hover:border-white/30 hover:text-white">
                View Scoreboard
              </Link>
            </div>
          </section>
        )}

        {canModerate ? (
          <section className="mt-6 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.06] p-5 sm:p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-100/60">Moderation</p>
            <h2 className="mt-2 text-xl font-black">Verification queue</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
              Review pending reports, confirm team identity readiness, and approve or reject updates before they reach the public scoreboard.
            </p>
            <div className="mt-5">
              <Link href="/internal/score-review" className="inline-flex rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-black text-white transition hover:bg-emerald-500">
                Open Review Queue
              </Link>
            </div>
          </section>
        ) : null}

        <div className="mt-6 flex items-center justify-between gap-4 border-t border-white/10 pt-6">
          <Link href="/scoreboard" className="text-sm font-bold text-white/50 transition hover:text-white">← Back to scoreboard</Link>
          <form action="/auth/signout" method="post">
            <button type="submit" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-bold text-white/70 transition hover:border-white/30 hover:text-white">
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
