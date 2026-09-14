import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  getCanonicalScoreboardTeamName,
  hasCompleteScoreboardTeamIdentity,
} from "@/data/scoreboard-team-identities";
import { getGameById } from "@/lib/games";
import { getSchoolBySlug } from "@/lib/schools";
import { createClient } from "@/lib/supabase/server";
import { approveScoreSubmission, rejectScoreSubmission } from "./actions";

export const metadata: Metadata = {
  title: "Score Review | VarsityVue",
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

export default async function ScoreReviewPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) redirect("/login");

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  const canModerate = roles?.some((row) => row.role === "moderator" || row.role === "admin");
  if (!canModerate) redirect("/account");

  const params = await searchParams;
  const { data: submissions } = await supabase
    .from("score_submissions")
    .select("id, game_id, submitted_by, home_score, away_score, game_status, period, clock, source_note, status, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const submitterIds = Array.from(new Set((submissions ?? []).map((item) => item.submitted_by)));
  const { data: profiles } = submitterIds.length
    ? await supabase.from("profiles").select("id, display_name, username").in("id", submitterIds)
    : { data: [] as { id: string; display_name: string | null; username: string | null }[] };

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const groupedSubmissions = Array.from(
    (submissions ?? []).reduce((groups, submission) => {
      const existing = groups.get(submission.game_id) ?? [];
      existing.push(submission);
      groups.set(submission.game_id, existing);
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
            Reports for the same game are grouped together so you can compare multiple sources before approving one. Approving a report updates canonical game state and supersedes older pending reports for that game.
          </p>
        </section>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-amber-100">
            {(submissions ?? []).length} Pending Reports
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/50">
            {groupedSubmissions.length} Games
          </span>
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
              const game = getGameById(gameId);
              const awayReady = game ? hasCompleteSchoolIdentity(game.awaySchoolSlug, game.awayTeam) : false;
              const homeReady = game ? hasCompleteSchoolIdentity(game.homeSchoolSlug, game.homeTeam) : false;
              const identityReady = Boolean(game && awayReady && homeReady);
              const awayName = game ? displayTeamName(game.awayTeam, game.awaySchoolSlug) : "Away";
              const homeName = game ? displayTeamName(game.homeTeam, game.homeSchoolSlug) : "Home";
              const missingIdentityTeams = game
                ? [!awayReady ? awayName : null, !homeReady ? homeName : null].filter(Boolean)
                : ["Unknown game"];
              const hasMultipleReports = reports.length > 1;

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
                            <span className="rounded-full border border-sky-300/20 bg-sky-300/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-sky-100">
                              Compare {reports.length} Reports
                            </span>
                          ) : null}
                        </div>
                        <h2 className="mt-2 text-xl font-black sm:text-2xl">{awayName} at {homeName}</h2>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-center">
                        <p className="text-2xl font-black tabular-nums">{reports.length}</p>
                        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/35">Pending {reports.length === 1 ? "Report" : "Reports"}</p>
                      </div>
                    </div>

                    {!identityReady ? (
                      <p className="mt-3 rounded-xl border border-red-400/15 bg-red-500/[0.07] p-3 text-xs font-semibold text-red-100/80">
                        Approval blocked until complete identity data is added for {missingIdentityTeams.join(" and ")}.
                      </p>
                    ) : null}
                  </div>

                  <div className={`grid gap-4 p-4 sm:p-5 ${reports.length > 1 ? "lg:grid-cols-2" : ""}`}>
                    {reports.map((submission, index) => {
                      const submitter = profileMap.get(submission.submitted_by);
                      const isFinal = submission.game_status === "final";

                      return (
                        <section key={submission.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-amber-100">
                              Report {index + 1}
                            </span>
                            <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${isFinal ? "border-white/15 bg-white/[0.06] text-white/60" : "border-red-400/20 bg-red-500/10 text-red-100"}`}>
                              {isFinal ? "Final" : "Live"}
                            </span>
                          </div>

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
                            <p className="mt-3 text-xs font-bold text-white/45">
                              {[submission.period, submission.clock].filter(Boolean).join(" · ")}
                            </p>
                          ) : null}

                          <div className="mt-3 text-xs leading-5 text-white/35">
                            <p>Submitted by <strong className="font-bold text-white/55">{submitter?.display_name || submitter?.username || submission.submitted_by}</strong></p>
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
                                disabled={!identityReady}
                                title={identityReady ? "Approve this score submission" : "Complete team identity data before approval"}
                                className="rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-black transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30 disabled:hover:bg-white/10"
                              >
                                Approve
                              </button>
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
