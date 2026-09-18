import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  getCanonicalScoreboardTeamName,
  hasCompleteScoreboardTeamIdentity,
} from "@/data/scoreboard-team-identities";
import { getDynamicGames } from "@/lib/dynamic-games";
import { getGameById } from "@/lib/games";
import { requireActiveMember } from "@/lib/member-access";
import { getSchoolBySlug } from "@/lib/schools";
import { approveScoreSubmission, rejectScoreSubmission } from "./actions";

export const metadata: Metadata = {
  title: "Score Review",
  robots: { index: false, follow: false, nocache: true },
};

type PageProps = {
  searchParams: Promise<{ message?: string; reviewed?: string }>;
};

function hasCompleteSchoolIdentity(slug?: string, teamName?: string) {
  const school = slug ? getSchoolBySlug(slug) : undefined;
  if (school) {
    return Boolean(
      school.abbreviation?.trim() &&
      school.mascot?.trim() &&
      school.colors?.primary?.trim() &&
      school.colors?.secondary?.trim(),
    );
  }

  return teamName ? hasCompleteScoreboardTeamIdentity(teamName) : false;
}

function displayTeamName(team?: string, slug?: string) {
  if (team) return getCanonicalScoreboardTeamName(team);
  if (slug) return getSchoolBySlug(slug)?.name ?? slug;
  return "Team TBD";
}

function scoreKey(report: { away_score: number; home_score: number }) {
  return `${report.away_score}:${report.home_score}`;
}

export default async function ScoreReviewPage({ searchParams }: PageProps) {
  const { supabase, userId } = await requireActiveMember();

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  const canModerate = roles?.some((row) => row.role === "moderator" || row.role === "admin");
  if (!canModerate) redirect("/account");

  const params = await searchParams;
  const [{ data: submissions }, dynamicGames] = await Promise.all([
    supabase
      .from("score_submissions")
      .select("id, game_id, submitted_by, home_score, away_score, game_status, period, clock, source_note, status, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    getDynamicGames(),
  ]);
  const dynamicGamesById = new Map(dynamicGames.map((game) => [game.id, game]));

  const submitterIds = Array.from(new Set((submissions ?? []).map((item) => item.submitted_by).filter(Boolean) as string[]));
  const [{ data: profiles }, { data: contributorAssignments }] = submitterIds.length
    ? await Promise.all([
        supabase.from("profiles").select("id, display_name, username").in("id", submitterIds),
        supabase
          .from("contributor_school_assignments")
          .select("user_id, school_slug, assignment_role")
          .in("user_id", submitterIds)
          .eq("active", true),
      ])
    : [
        { data: [] as { id: string; display_name: string | null; username: string | null }[] },
        { data: [] as { user_id: string; school_slug: string; assignment_role: string }[] },
      ];

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const assignmentsByUser = (contributorAssignments ?? []).reduce((map, assignment) => {
    const current = map.get(assignment.user_id) ?? [];
    current.push(assignment);
    map.set(assignment.user_id, current);
    return map;
  }, new Map<string, NonNullable<typeof contributorAssignments>>());

  const groupedSubmissions = Array.from(
    (submissions ?? []).reduce((groups, submission) => {
      const current = groups.get(submission.game_id) ?? [];
      current.push(submission);
      groups.set(submission.game_id, current);
      return groups;
    }, new Map<string, NonNullable<typeof submissions>>()),
  ).map(([gameId, reports]) => ({ gameId, reports }));

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="max-w-4xl">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--vv-accent)]">Internal Tool</p>
          <h1 className="mt-3 text-4xl font-black sm:text-5xl">Score review queue</h1>
          <p className="mt-4 text-base leading-7 text-white/50">
            Reports for the same game are grouped together so you can compare sources before approving one. Conflict groups now show a recommended review order, while every report still requires moderator judgment.
          </p>
        </section>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-amber-100">
            {(submissions ?? []).length} Pending Reports
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/50">
            {groupedSubmissions.length} Games
          </span>
          <a href="/internal/score-review/history" className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/50 transition hover:border-white/20 hover:text-white">
            Review History →
          </a>
        </div>

        {params.reviewed ? (
          <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-50">
            Submission {params.reviewed}.
          </div>
        ) : null}
        {params.message ? (
          <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-50">{params.message}</div>
        ) : null}

        <section className="mt-8 space-y-6">
          {groupedSubmissions.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-sm text-white/55">No pending score reports.</div>
          ) : (
            groupedSubmissions.map(({ gameId, reports }) => {
              const game = dynamicGamesById.get(gameId) ?? getGameById(gameId);
              const approvalBlocked = Boolean(
                game && ["final", "cancelled", "postponed"].includes(game.status),
              );
              const awayReady = game ? hasCompleteSchoolIdentity(game.awaySchoolSlug, game.awayTeam) : false;
              const homeReady = game ? hasCompleteSchoolIdentity(game.homeSchoolSlug, game.homeTeam) : false;
              const identityReady = Boolean(game && awayReady && homeReady);
              const awayName = game ? displayTeamName(game.awayTeam, game.awaySchoolSlug) : "Away";
              const homeName = game ? displayTeamName(game.homeTeam, game.homeSchoolSlug) : "Home";
              const missingIdentityTeams = game
                ? [!awayReady ? awayName : null, !homeReady ? homeName : null].filter(Boolean)
                : ["Unknown game"];
              const hasMultipleReports = reports.length > 1;
              const firstReport = reports[0];
              const scoresAgree = hasMultipleReports && reports.every((report) => scoreKey(report) === scoreKey(firstReport));
              const stateAgrees = hasMultipleReports && reports.every(
                (report) =>
                  report.game_status === firstReport.game_status &&
                  (report.period ?? "") === (firstReport.period ?? "") &&
                  (report.clock ?? "") === (firstReport.clock ?? ""),
              );
              const reportsAgree = scoresAgree && stateAgrees;

              const assignmentForReport = (submittedBy: string | null) => game && submittedBy
                ? (assignmentsByUser.get(submittedBy) ?? []).find(
                    (assignment) => assignment.school_slug === game.awaySchoolSlug || assignment.school_slug === game.homeSchoolSlug,
                  )
                : undefined;

              const assignedReports = reports.filter((report) => Boolean(assignmentForReport(report.submitted_by)));
              const hasAssignedContributorReport = assignedReports.length > 0;
              const scoreCounts = reports.reduce((map, report) => {
                const key = scoreKey(report);
                map.set(key, (map.get(key) ?? 0) + 1);
                return map;
              }, new Map<string, number>());
              const majorityScoreKey = [...scoreCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
              const priorityScoreKey = hasAssignedContributorReport ? scoreKey(assignedReports[0]) : majorityScoreKey;
              const isConflict = hasMultipleReports && !scoresAgree;

              const prioritizedReports = isConflict
                ? [...reports].sort((a, b) => {
                    const rank = (report: typeof a) => {
                      const assigned = Boolean(assignmentForReport(report.submitted_by));
                      if (assigned) return 0;
                      if (scoreKey(report) === priorityScoreKey) return 1;
                      return 2;
                    };
                    const rankDiff = rank(a) - rank(b);
                    if (rankDiff !== 0) return rankDiff;
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                  })
                : reports;

              return (
                <article key={gameId} className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.035]">
                  <div className="border-b border-white/10 bg-black/30 px-5 py-4 sm:px-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
                            {game ? `Week ${game.week ?? "—"}` : "Unknown game"}
                          </span>
                          <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${identityReady ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100" : "border-red-400/20 bg-red-500/10 text-red-100"}`}>
                            {identityReady ? "Identity Ready" : "Identity Missing"}
                          </span>
                          {hasMultipleReports ? (
                            <span className="rounded-full border border-sky-300/20 bg-sky-300/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-sky-100">Compare {reports.length} Reports</span>
                          ) : null}
                          {hasMultipleReports ? (
                            <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${reportsAgree ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100" : scoresAgree ? "border-amber-300/20 bg-amber-300/10 text-amber-100" : "border-red-400/20 bg-red-500/10 text-red-100"}`}>
                              {reportsAgree ? "Reports Agree" : scoresAgree ? "Score Match · State Differs" : "Score Conflict"}
                            </span>
                          ) : null}
                        </div>
                        <h2 className="mt-2 text-xl font-black sm:text-2xl">{awayName} at {homeName}</h2>
                        {isConflict ? (
                          <p className="mt-2 text-xs font-semibold text-red-100/75">Pending reports disagree on the score. Use the review path below before approving.</p>
                        ) : hasMultipleReports && scoresAgree && !stateAgrees ? (
                          <p className="mt-2 text-xs font-semibold text-amber-100/75">Scores match, but live/final state, period, or clock differs between reports.</p>
                        ) : hasMultipleReports ? (
                          <p className="mt-2 text-xs font-semibold text-emerald-100/65">All pending reports match on score and game state.</p>
                        ) : null}
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-center">
                        <p className="text-2xl font-black tabular-nums">{reports.length}</p>
                        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/35">Pending {reports.length === 1 ? "Report" : "Reports"}</p>
                      </div>
                    </div>

                    {approvalBlocked ? (
                      <p className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.08] p-3 text-xs font-semibold text-amber-100/80">
                        Approval blocked because this game is already verified as {game?.status}. Reject the stale report to clear it from the queue.
                      </p>
                    ) : !identityReady ? (
                      <p className="mt-3 rounded-xl border border-red-400/15 bg-red-500/[0.07] p-3 text-xs font-semibold text-red-100/80">
                        Approval blocked until complete identity data is added for {missingIdentityTeams.join(" and ")}.
                      </p>
                    ) : null}

                    {isConflict ? (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/35">Recommended review path</p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-3">
                          <div className="rounded-xl border border-sky-300/20 bg-sky-300/[0.07] p-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-sky-100">1 · Trusted signal</p>
                            <p className="mt-1 text-xs leading-5 text-white/50">{hasAssignedContributorReport ? "Review the assigned contributor report first." : "No assigned contributor report. Start with the most-reported score."}</p>
                          </div>
                          <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.05] p-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100">2 · Corroboration</p>
                            <p className="mt-1 text-xs leading-5 text-white/50">Check independent reports that match the priority score.</p>
                          </div>
                          <div className="rounded-xl border border-red-400/15 bg-red-500/[0.05] p-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-red-100">3 · Outliers</p>
                            <p className="mt-1 text-xs leading-5 text-white/50">Review conflicting scores and source notes before deciding.</p>
                          </div>
                        </div>
                        <p className="mt-3 text-[11px] leading-5 text-white/35">This order is a moderation aid only. It does not determine which report is correct or bypass manual approval.</p>
                      </div>
                    ) : null}
                  </div>

                  <div className={`grid gap-4 p-4 sm:p-5 ${prioritizedReports.length > 1 ? "lg:grid-cols-2" : ""}`}>
                    {prioritizedReports.map((submission, index) => {
                      const submitter = profileMap.get(submission.submitted_by);
                      const isFinal = submission.game_status === "final";
                      const matchingAssignment = assignmentForReport(submission.submitted_by);
                      const isAssignedContributor = Boolean(matchingAssignment);
                      const matchesPriorityScore = scoreKey(submission) === priorityScoreKey;
                      const reviewTier = !isConflict ? null : isAssignedContributor ? "trusted" : matchesPriorityScore ? "corroborates" : "outlier";
                      const contributorLabel = matchingAssignment?.assignment_role === "coach" ? "Assigned Coach" : "Assigned Scorekeeper";

                      return (
                        <section key={submission.id} className={`rounded-2xl border bg-black/20 p-4 sm:p-5 ${reviewTier === "trusted" ? "border-sky-300/35 ring-1 ring-sky-300/10" : reviewTier === "corroborates" ? "border-emerald-400/20" : reviewTier === "outlier" ? "border-red-400/25" : "border-white/10"}`}>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-amber-100">Report {index + 1}</span>
                              {isAssignedContributor ? (
                                <span className="rounded-full border border-sky-300/25 bg-sky-300/10 px-2 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-sky-100">{contributorLabel}</span>
                              ) : (
                                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-white/35">Community</span>
                              )}
                              {reviewTier ? (
                                <span className={`rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-[0.1em] ${reviewTier === "trusted" ? "border-sky-300/25 bg-sky-300/10 text-sky-100" : reviewTier === "corroborates" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100" : "border-red-400/20 bg-red-500/10 text-red-100"}`}>
                                  {reviewTier === "trusted" ? "Review First" : reviewTier === "corroborates" ? "Corroborates" : "Outlier"}
                                </span>
                              ) : null}
                            </div>
                            <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${isFinal ? "border-white/15 bg-white/[0.06] text-white/60" : "border-red-400/20 bg-red-500/10 text-red-100"}`}>
                              {isFinal ? "Final" : "Live"}
                            </span>
                          </div>

                          {isAssignedContributor ? (
                            <p className="mt-3 rounded-xl border border-sky-300/15 bg-sky-300/[0.06] px-3 py-2 text-[11px] font-semibold text-sky-100/75">
                              This reporter is assigned to {getSchoolBySlug(matchingAssignment!.school_slug)?.name ?? matchingAssignment!.school_slug} for this matchup.
                            </p>
                          ) : reviewTier === "corroborates" ? (
                            <p className="mt-3 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.05] px-3 py-2 text-[11px] font-semibold text-emerald-100/70">Independent report matching the priority score.</p>
                          ) : reviewTier === "outlier" ? (
                            <p className="mt-3 rounded-xl border border-red-400/15 bg-red-500/[0.05] px-3 py-2 text-[11px] font-semibold text-red-100/70">This score differs from the priority score and needs source verification.</p>
                          ) : null}

                          <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl border border-white/10 bg-black/25 p-3">
                            <div className="min-w-0">
                              <p className="truncate text-xs font-black text-white/65">{awayName}</p>
                              <p className="mt-1 text-3xl font-black tabular-nums">{submission.away_score}</p>
                            </div>
                            <div className="text-center text-white/20">—</div>
                            <div className="min-w-0 text-right">
                              <p className="truncate text-xs font-black text-white/65">{homeName}</p>
                              <p className="mt-1 text-3xl font-black tabular-nums">{submission.home_score}</p>
                            </div>
                          </div>

                          {!isFinal && (submission.period || submission.clock) ? (
                            <p className="mt-3 text-xs font-bold text-white/45">{[submission.period, submission.clock].filter(Boolean).join(" · ")}</p>
                          ) : null}

                          <div className="mt-3 text-xs leading-5 text-white/35">
                            <p>Submitted by <strong className="font-bold text-white/55">{submitter?.display_name || submitter?.username || submission.submitted_by || "Deleted member"}</strong></p>
                            <p>{new Date(submission.created_at).toLocaleString("en-US", { timeZone: "America/Chicago", dateStyle: "medium", timeStyle: "short" })} CT</p>
                          </div>

                          {submission.source_note ? (
                            <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3">
                              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/30">Source note</p>
                              <p className="mt-1 text-sm leading-6 text-white/60">{submission.source_note}</p>
                            </div>
                          ) : null}

                          <form className="mt-4 space-y-3 border-t border-white/10 pt-4">
                            <input type="hidden" name="submission_id" value={submission.id} />
                            <textarea name="review_note" rows={2} placeholder="Review note (optional)" className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-[var(--vv-accent)] focus:outline-none" />
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                formAction={approveScoreSubmission}
                                disabled={!identityReady || approvalBlocked}
                                title={approvalBlocked ? "Verified terminal game state cannot be replaced by a stale report" : identityReady ? "Approve this score submission" : "Complete team identity data before approval"}
                                className="rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-black transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30 disabled:hover:bg-white/10"
                              >Approve</button>
                              <button formAction={rejectScoreSubmission} className="rounded-full border border-red-400/25 bg-red-500/10 px-4 py-2.5 text-sm font-black text-red-100 transition hover:bg-red-500/20">Reject</button>
                            </div>
                          </form>
                        </section>
                      );
                    })}
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}
