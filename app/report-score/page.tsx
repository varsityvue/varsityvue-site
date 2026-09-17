import type { Metadata } from "next";
import Link from "next/link";

import {
  getCanonicalScoreboardTeamName,
  getScoreboardTeamIdentity,
  hasCompleteScoreboardTeamIdentity,
} from "@/data/scoreboard-team-identities";
import { getProgramLogoPath } from "@/components/SchoolBadge";
import { getDynamicGames } from "@/lib/dynamic-games";
import { requireActiveMember } from "@/lib/member-access";
import { getSchoolBySlug } from "@/lib/schools";
import type { Game } from "@/types/platform";
import ScoreReportForm from "./ScoreReportForm";

export const metadata: Metadata = {
  title: "Report a Score | VarsityVue",
  description: "Submit a live or final Texas high school football score to VarsityVue for review.",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ message?: string; submitted?: "approved" | "pending"; game?: string }>;
};

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

function gameIsIdentityReady(game: Game) {
  return (
    teamHasCompleteIdentity(game.awaySchoolSlug, game.awayTeam) &&
    teamHasCompleteIdentity(game.homeSchoolSlug, game.homeTeam)
  );
}

function displayTeamName(team?: string, fallback?: string) {
  return team ? getCanonicalScoreboardTeamName(team) : (fallback ?? "Team TBD");
}

function teamVisualIdentity(slug: string | undefined, team: string | undefined) {
  const school = slug ? getSchoolBySlug(slug) : undefined;
  if (school) {
    return {
      abbreviation: school.badgeLabel ?? school.abbreviation ?? school.name.slice(0, 2).toUpperCase(),
      mascot: school.badgeSubtext ?? school.mascot,
      primary: school.colors.primary,
      secondary: school.colors.secondary,
      logoPath: getProgramLogoPath(school.slug) ?? null,
    };
  }

  const identity = team ? getScoreboardTeamIdentity(team) : undefined;
  return identity
    ? {
        abbreviation: identity.abbreviation,
        mascot: identity.mascot,
        primary: identity.primary,
        secondary: identity.secondary,
        logoPath: null,
      }
    : null;
}

function submissionStatusClasses(status: string) {
  if (status === "approved") {
    return "border-emerald-400/25 bg-emerald-400/10 text-emerald-100";
  }
  if (status === "rejected") {
    return "border-red-400/25 bg-red-400/10 text-red-100";
  }
  return "border-amber-300/25 bg-amber-300/10 text-amber-100";
}

function submissionStatusLabel(status: string) {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Pending";
}

export default async function ReportScorePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const next = params.game ? `/report-score?game=${encodeURIComponent(params.game)}` : "/report-score";
  const loginParams = new URLSearchParams({ message: "Sign in to report a score.", next });
  const { supabase, userId } = await requireActiveMember({ loginPath: `/login?${loginParams.toString()}` });

  const [{ data: roles }, { data: assignments }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", userId),
    supabase
      .from("contributor_school_assignments")
      .select("school_slug, active")
      .eq("user_id", userId)
      .eq("active", true),
  ]);

  const roleSet = new Set((roles ?? []).map((row) => row.role));
  const canModerate = roleSet.has("moderator") || roleSet.has("admin");
  const isRestrictedScorekeeper = roleSet.has("scorekeeper") && !canModerate;
  const assignedSchoolSlugs = new Set((assignments ?? []).map((assignment) => assignment.school_slug));

  const games = (await getDynamicGames())
    .filter(
      (game) =>
        game.season === 2026 &&
        game.gameType !== "bye" &&
        game.gameType !== "scrimmage" &&
        game.week !== undefined,
    )
    .sort((a, b) => (b.week ?? 0) - (a.week ?? 0));

  const relevantGames = games.filter((game) => {
    if (
      (game.week ?? 0) < 3 ||
      (game.week ?? 0) > 6 ||
      !["live", "scheduled"].includes(game.status) ||
      !gameIsIdentityReady(game)
    ) return false;
    if (!isRestrictedScorekeeper) return true;
    return Boolean(
      (game.awaySchoolSlug && assignedSchoolSlugs.has(game.awaySchoolSlug)) ||
      (game.homeSchoolSlug && assignedSchoolSlugs.has(game.homeSchoolSlug)),
    );
  });

  const selectedGameId = params.game && relevantGames.some((game) => game.id === params.game)
    ? params.game
    : "";
  const selectedGameHref = selectedGameId ? `/games/${encodeURIComponent(selectedGameId)}` : null;

  const [{ data: recentSubmissions }, { data: pendingSubmissions }] = await Promise.all([
    supabase
      .from("score_submissions")
      .select("id, game_id, home_score, away_score, game_status, period, status, created_at")
      .eq("submitted_by", userId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("score_submissions")
      .select("game_id, home_score, away_score, game_status, period, clock, created_at")
      .eq("submitted_by", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  const pendingByGame = new Map<string, NonNullable<typeof pendingSubmissions>[number]>();
  for (const pending of pendingSubmissions ?? []) {
    if (!pendingByGame.has(pending.game_id)) pendingByGame.set(pending.game_id, pending);
  }

  const formGames = relevantGames.map((game) => {
    const pending = pendingByGame.get(game.id);
    return {
      id: game.id,
      week: game.week,
      awayName: displayTeamName(game.awayTeam, game.awaySchoolSlug),
      homeName: displayTeamName(game.homeTeam, game.homeSchoolSlug),
      awayIdentity: teamVisualIdentity(game.awaySchoolSlug, game.awayTeam),
      homeIdentity: teamVisualIdentity(game.homeSchoolSlug, game.homeTeam),
      pendingReport: pending
        ? {
            awayScore: pending.away_score,
            homeScore: pending.home_score,
            gameStatus: pending.game_status,
            period: pending.period,
            clock: pending.clock,
            createdAt: pending.created_at,
          }
        : null,
    };
  });

  return (
    <main className="min-h-screen bg-[var(--vv-bg)] px-4 py-10 text-white sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <section className="rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(122,16,34,0.42),transparent_36%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 sm:rounded-[2rem] sm:p-8">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--vv-accent)] sm:text-xs sm:tracking-[0.3em]">
            {isRestrictedScorekeeper ? "Contributor Score Entry" : "Community Score Report"}
          </p>
          <h1 className="mt-3 text-3xl font-black sm:text-5xl">Help keep Friday night current.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60 sm:text-base sm:leading-7">
            {canModerate
              ? "Submit a score you can verify. Your trusted update is recorded, approved, and published immediately through VarsityVue's normal score history."
              : isRestrictedScorekeeper
              ? "Your contributor account can submit scores only for games involving programs assigned to you. Reports are still reviewed before becoming an official VarsityVue update."
              : "Submit a live or final score you can verify. Reports are saved with your account and reviewed before becoming an official VarsityVue update."}
          </p>
        </section>

        {params.submitted ? (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-50">
            <p>
              {params.submitted === "approved"
                ? "Score updated. The trusted result is now published."
                : "Score report received. It is now in the VarsityVue review queue."}
            </p>
            {selectedGameHref ? (
              <Link href={selectedGameHref} className="shrink-0 rounded-full border border-emerald-200/20 bg-black/20 px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-50 transition hover:bg-black/35">
                Back to Game Center →
              </Link>
            ) : null}
          </div>
        ) : null}

        {params.message ? (
          <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-50">
            {params.message}
          </div>
        ) : null}

        {isRestrictedScorekeeper && assignedSchoolSlugs.size === 0 ? (
          <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-50">
            No programs are assigned to this contributor account yet. An admin must add an assignment before score entry is available.
          </div>
        ) : null}

        <section className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 sm:p-7">
          <ScoreReportForm
            games={formGames}
            selectedGameId={selectedGameId}
            disabled={isRestrictedScorekeeper && assignedSchoolSlugs.size === 0}
            restricted={isRestrictedScorekeeper}
          />
        </section>

        {recentSubmissions && recentSubmissions.length > 0 ? (
          <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">Submission history</p>
                <h2 className="mt-1 text-lg font-black">Your recent reports</h2>
              </div>
              <span className="text-xs font-bold text-white/30">Last {recentSubmissions.length}</span>
            </div>
            <div className="mt-4 space-y-3">
              {recentSubmissions.map((submission) => {
                const game = games.find((item) => item.id === submission.game_id);
                const awayName = game ? displayTeamName(game.awayTeam, game.awaySchoolSlug) : "Away";
                const homeName = game ? displayTeamName(game.homeTeam, game.homeSchoolSlug) : "Home";
                const submittedAt = new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  timeZone: "America/Chicago",
                }).format(new Date(submission.created_at));

                return (
                  <div key={submission.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/30">
                          {submission.game_status === "final" ? "Final report" : submission.period ? `Live · ${submission.period}` : "Live report"}
                        </p>
                        <p className="mt-1 text-xs text-white/35">{submittedAt} CT</p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${submissionStatusClasses(submission.status)}`}>
                        {submissionStatusLabel(submission.status)}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm">
                      <p className="truncate font-bold text-white/80">{awayName}</p>
                      <p className="text-lg font-black tabular-nums text-white">{submission.away_score}</p>
                      <p className="truncate font-bold text-white/80">{homeName}</p>
                      <p className="text-lg font-black tabular-nums text-white">{submission.home_score}</p>
                    </div>

                    {submission.status === "pending" ? (
                      <p className="mt-3 border-t border-white/10 pt-3 text-xs leading-5 text-white/35">Waiting for VarsityVue verification.</p>
                    ) : submission.status === "approved" ? (
                      <p className="mt-3 border-t border-white/10 pt-3 text-xs leading-5 text-emerald-100/60">Verified and approved for the scoreboard.</p>
                    ) : (
                      <p className="mt-3 border-t border-white/10 pt-3 text-xs leading-5 text-red-100/60">This report was not approved for the scoreboard.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          {selectedGameHref ? <Link href={selectedGameHref} className="text-sm font-bold text-white/55 transition hover:text-white">← Back to Game Center</Link> : null}
          <Link href="/account" className="text-sm font-bold text-white/55 transition hover:text-white">Back to account</Link>
        </div>
      </div>
    </main>
  );
}
