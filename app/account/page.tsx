import Link from "next/link";

import { getCanonicalScoreboardTeamName, hasCompleteScoreboardTeamIdentity } from "@/data/scoreboard-team-identities";
import { getDynamicGames } from "@/lib/dynamic-games";
import { resolveAccountFollows } from "@/lib/account-follows";
import { requireActiveMember } from "@/lib/member-access";
import { getSchoolBySlug } from "@/lib/schools";
import AccountFollowList from "@/components/AccountFollowList";
import NotificationPreferences from "@/components/NotificationPreferences";

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

function formatMemberSince(createdAt?: string) {
  if (!createdAt) return "Member date unavailable";
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "Member date unavailable";
  return `Member since ${date.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
}

export default async function AccountPage() {
  const { supabase, userId, claims } = await requireActiveMember();

  const [
    { data: profile },
    { data: roles },
    { data: assignments },
    { data: followRows },
    { data: notificationPreferences },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, username, created_at")
      .eq("id", userId)
      .maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
    supabase
      .from("contributor_school_assignments")
      .select("school_slug, assignment_role, active")
      .eq("user_id", userId)
      .eq("active", true)
      .order("school_slug", { ascending: true }),
    supabase
      .from("school_follows")
      .select("school_slug, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
    supabase
      .from("member_notification_preferences")
      .select("final_score_email, new_coverage_email")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const { follows: followedSchools, staleFollowCount } = resolveAccountFollows(followRows ?? []);

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
            {canModerate
              ? "Manage your VarsityVue account, followed programs, notifications, and platform administration."
              : isScorekeeper
                ? "Your account includes game-night contributor tools in addition to the normal VarsityVue member experience."
                : "Your VarsityVue account is your home for community score reports now, with Pick ’Ems, followed schools, notifications, and more coming next."}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/40 sm:text-sm">
            <span>{claims.email || "Email unavailable"}</span>
            <span aria-hidden="true">•</span>
            <span>{formatMemberSince(profile?.created_at)}</span>
            {profile?.username ? (
              <>
                <span aria-hidden="true">•</span>
                <span>@{profile.username}</span>
              </>
            ) : null}
          </div>
        </section>

        <AccountFollowList initialFollows={followedSchools} staleFollowCount={staleFollowCount} />

        <NotificationPreferences
          finalScoreEmail={notificationPreferences?.final_score_email === true}
          newCoverageEmail={notificationPreferences?.new_coverage_email === true}
          followCount={followedSchools.length}
        />

        {isScorekeeper && !canModerate ? (
          <section className="mt-6 rounded-[1.5rem] border border-[var(--vv-primary)]/40 bg-[radial-gradient(circle_at_top_left,rgba(122,16,34,0.24),transparent_45%),rgba(255,255,255,0.035)] p-5 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--vv-accent)]">Contributor Dashboard</p>
                <h2 className="mt-2 text-2xl font-black">Game-night tools</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                  Enter score reports only for games involving programs assigned to your contributor account. Reports still pass through verification before becoming official VarsityVue game state.
                </p>
              </div>
              <span className="w-fit rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-emerald-100">
                Contributor Access
              </span>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">Assigned Programs</p>
              {assignedPrograms.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {assignedPrograms.map((program) =>
                    program.role === "Coach" ? (
                      <Link key={program.slug} href={`/manage-roster?school=${encodeURIComponent(program.slug)}`} className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-xs font-bold text-amber-100 transition hover:bg-amber-300/15">
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

            {assignedPrograms.length > 0 ? (
              <div className="mt-5">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">Score-Ready Assigned Games</p>
                <p className="mt-1 text-xs text-white/40">Live games and past matchups awaiting a result.</p>
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
                        <Link href={`/report-score?game=${encodeURIComponent(game.id)}`} className="shrink-0 rounded-full bg-[var(--vv-primary)] px-4 py-2 text-center text-xs font-black transition hover:bg-[#93142a]">
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
              {assignedPrograms.length > 0 ? (
                <Link href="/report-score" className="rounded-full bg-[var(--vv-primary)] px-5 py-2.5 text-sm font-black transition hover:bg-[#93142a]">Enter Score</Link>
              ) : (
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-black text-white/30">Enter Score</span>
              )}
              {canManageRoster ? (
                <Link href={manageRosterHref} className="rounded-full border border-amber-300/25 bg-amber-300/10 px-5 py-2.5 text-sm font-black text-amber-100 transition hover:bg-amber-300/15">Manage Roster</Link>
              ) : null}
              <Link href="/scoreboard" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-bold text-white/80 transition hover:border-white/30 hover:text-white">View Scoreboard</Link>
            </div>
          </section>
        ) : canModerate ? (
          <section className="mt-6 rounded-[1.5rem] border border-[var(--vv-primary)]/35 bg-[radial-gradient(circle_at_top_left,rgba(122,16,34,0.2),transparent_45%),rgba(255,255,255,0.035)] p-5 sm:p-7">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--vv-accent)]">{isAdmin ? "Admin Tools" : "Moderator Tools"}</p>
            <h2 className="mt-2 text-2xl font-black">Platform operations</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
              Review game reports, maintain program data, and manage the access required to keep VarsityVue current.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/35">Scoreboard</p>
                <div className="mt-3 flex flex-col gap-2.5">
                  <Link href="/report-score" className="text-sm font-black text-white transition hover:text-[var(--vv-accent)]">Enter Score →</Link>
                  <Link href="/internal/score-review" className="text-sm font-black text-white transition hover:text-[var(--vv-accent)]">Review Score Reports →</Link>
                  <Link href="/scoreboard" className="text-sm font-bold text-white/65 transition hover:text-white">View Scoreboard →</Link>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/35">Program Data</p>
                <div className="mt-3 flex flex-col gap-2.5">
                  <Link href={manageRosterHref} className="text-sm font-black text-white transition hover:text-[var(--vv-accent)]">Manage Rosters →</Link>
                </div>
              </div>

              {isAdmin ? (
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/35">Members & Access</p>
                  <div className="mt-3 flex flex-col gap-2.5">
                    <Link href="/internal/members" className="text-sm font-black text-white transition hover:text-[var(--vv-accent)]">Manage Members & Roles →</Link>
                    <Link href="/internal/contributor-access" className="text-sm font-bold text-white/65 transition hover:text-white">Manage Contributor Access →</Link>
                  </div>
                </div>
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
              <Link href="/report-score" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-bold text-white/80 transition hover:border-white/30 hover:text-white">Report a Score</Link>
              <Link href="/scoreboard" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-bold text-white/80 transition hover:border-white/30 hover:text-white">View Scoreboard</Link>
            </div>
          </section>
        )}

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
