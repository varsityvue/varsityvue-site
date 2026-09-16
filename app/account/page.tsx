import Link from "next/link";
import { redirect } from "next/navigation";

import { getCanonicalScoreboardTeamName, hasCompleteScoreboardTeamIdentity } from "@/data/scoreboard-team-identities";
import { getDynamicGames } from "@/lib/dynamic-games";
import { getSchoolBySlug } from "@/lib/schools";
import { createClient } from "@/lib/supabase/server";

function schoolHasCompleteIdentity(slug?: string) {
  if (!slug) return false;
  const school = getSchoolBySlug(slug);
  return Boolean(
    school?.abbreviation?.trim() &&
    school?.mascot?.trim() &&
    school?.colors?.primary?.trim() &&
    school?.colors?.secondary?.trim(),
  );
}

function teamHasCompleteIdentity(slug: string | undefined, team: string | undefined) {
  if (schoolHasCompleteIdentity(slug)) return true;
  return team ? hasCompleteScoreboardTeamIdentity(team) : false;
}

function displayTeamName(team?: string, fallback?: string) {
  return team ? getCanonicalScoreboardTeamName(team) : (fallback ?? "Team TBD");
}

function formatKickoff(kickoff?: string) {
  if (!kickoff) return "Kickoff TBD";

  if (!kickoff.includes("T")) {
    const date = new Date(`${kickoff}T12:00:00Z`);
    return Number.isNaN(date.getTime())
      ? kickoff
      : date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Chicago" });
  }

  const date = new Date(kickoff);
  if (Number.isNaN(date.getTime())) return kickoff;

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  });
}

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (!claims?.sub) {
    redirect("/login");
  }

  const [{ data: profile }, { data: roles }, { data: assignments }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, username, favorite_school_slug, created_at")
      .eq("id", claims.sub)
      .maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", claims.sub),
    supabase
      .from("contributor_school_assignments")
      .select("school_slug, assignment_role, active")
      .eq("user_id", claims.sub)
      .eq("active", true)
      .order("school_slug", { ascending: true }),
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

  const assignedPrograms = (assignments ?? []).map((assignment) => {
    const school = getSchoolBySlug(assignment.school_slug);
    return {
      slug: assignment.school_slug,
      name: school?.name ?? assignment.school_slug,
      role: assignment.assignment_role === "coach" ? "Coach" : "Scorekeeper",
    };
  });
  const coachPrograms = assignedPrograms.filter((program) => program.role === "Coach");
  const canManageRoster = canModerate || coachPrograms.length > 0;
  const manageRosterHref = canModerate
    ? "/manage-roster"
    : coachPrograms[0]
      ? `/manage-roster?school=${encodeURIComponent(coachPrograms[0].slug)}`
      : "/manage-roster";
  const dynamicGames = isScorekeeper && !canModerate ? await getDynamicGames() : [];
  const assignedSchoolSlugs = new Set(assignedPrograms.map((program) => program.slug));

  const scoreReadyAssignedGames = isScorekeeper && !canModerate
    ? dynamicGames
        .filter(
          (game) =>
            game.season === 2026 &&
            game.week !== undefined &&
            game.week >= 3 &&
            game.week <= 6 &&
            game.gameType !== "bye" &&
            game.gameType !== "scrimmage" &&
            ["live", "scheduled"].includes(game.status) &&
            ((game.awaySchoolSlug && assignedSchoolSlugs.has(game.awaySchoolSlug)) ||
              (game.homeSchoolSlug && assignedSchoolSlugs.has(game.homeSchoolSlug))) &&
            teamHasCompleteIdentity(game.awaySchoolSlug, game.awayTeam) &&
            teamHasCompleteIdentity(game.homeSchoolSlug, game.homeTeam),
        )
        .sort((a, b) => {
          if (a.status !== b.status) return a.status === "live" ? -1 : 1;
          return (b.kickoff ?? "").localeCompare(a.kickoff ?? "");
        })
        .slice(0, 6)
    : [];

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
                  {isScorekeeper && !canModerate
                    ? "Enter score reports only for games involving programs assigned to your contributor account. Reports still pass through verification before becoming official VarsityVue game state."
                    : "Submit live or final score reports from games already cleared for scoreboard identity. Reports still pass through verification before becoming official VarsityVue game state."}
                </p>
              </div>
              <span className="w-fit rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-emerald-100">
                Contributor Access
              </span>
            </div>

            {isScorekeeper && !canModerate ? (
              <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">Assigned Programs</p>
                {assignedPrograms.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {assignedPrograms.map((program) =>
                      program.role === "Coach" ? (
                        <Link
                          key={program.slug}
                          href={`/manage-roster?school=${encodeURIComponent(program.slug)}`}
                          className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-xs font-bold text-amber-100 transition hover:bg-amber-300/15"
                        >
                          {program.name} · Coach · Manage Roster →
                        </Link>
                      ) : (
                        <span key={program.slug} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-bold text-white/75">
                          {program.name} · {program.role}
                        </span>
                      ),
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-amber-100/75">No programs are assigned yet. Score entry will stay unavailable until an assignment is added.</p>
                )}
              </div>
            ) : null}

            {isScorekeeper && !canModerate && assignedPrograms.length > 0 ? (
              <div className="mt-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">Score-Ready Assigned Games</p>
                    <p className="mt-1 text-xs text-white/40">Live games and past matchups awaiting a result.</p>
                  </div>
                </div>

                {scoreReadyAssignedGames.length ? (
                  <div className="mt-3 grid gap-3">
                    {scoreReadyAssignedGames.map((game) => (
                      <div key={game.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/35">
                            {game.status === "live" ? "Live" : "Result Pending"} · Week {game.week ?? "—"} · {formatKickoff(game.kickoff)}
                          </p>
                          <p className="mt-1 truncate text-sm font-black text-white">
                            {displayTeamName(game.awayTeam, game.awaySchoolSlug)} at {displayTeamName(game.homeTeam, game.homeSchoolSlug)}
                          </p>
                        </div>
                        <Link
                          href={`/report-score?game=${encodeURIComponent(game.id)}`}
                          className="shrink-0 rounded-full bg-[var(--vv-primary)] px-4 py-2 text-center text-xs font-black transition hover:bg-[#93142a]"
                        >
                          Enter Score
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/45">
                    No assigned games are currently live or awaiting a result.
                  </div>
                )}
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              {(!isScorekeeper || canModerate || assignedPrograms.length > 0) ? (
                <Link href="/report-score" className="rounded-full bg-[var(--vv-primary)] px-5 py-2.5 text-sm font-black transition hover:bg-[#93142a]">
                  Enter Score
                </Link>
              ) : (
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-black text-white/30">
                  Enter Score
                </span>
              )}
              {canManageRoster ? (
                <Link href={manageRosterHref} className="rounded-full border border-amber-300/25 bg-amber-300/10 px-5 py-2.5 text-sm font-black text-amber-100 transition hover:bg-amber-300/15">
                  Manage Roster
                </Link>
              ) : null}
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
            <h2 className="mt-2 text-xl font-black">Verification and access</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
              Review pending reports, confirm team identity readiness, and manage contributor access before updates reach the public scoreboard.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/internal/score-review" className="inline-flex rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-black text-white transition hover:bg-emerald-500">
                Open Review Queue
              </Link>
              {canManageRoster ? (
                <Link href={manageRosterHref} className="inline-flex rounded-full border border-amber-300/20 bg-amber-300/10 px-5 py-2.5 text-sm font-black text-amber-100 transition hover:bg-amber-300/15">
                  Manage Rosters
                </Link>
              ) : null}
              {isAdmin ? (
                <>
                  <Link href="/internal/members" className="inline-flex rounded-full border border-[var(--vv-accent)]/30 bg-[var(--vv-primary)]/15 px-5 py-2.5 text-sm font-black text-red-50 transition hover:bg-[var(--vv-primary)]/25">
                    Manage Members & Roles
                  </Link>
                  <Link href="/internal/contributor-access" className="inline-flex rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-black text-white/80 transition hover:border-white/30 hover:text-white">
                    Manage Contributor Access
                  </Link>
                </>
              ) : null}
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
