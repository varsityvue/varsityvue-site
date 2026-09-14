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

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="max-w-4xl">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--vv-accent)]">Internal Tool</p>
          <h1 className="mt-3 text-4xl font-black sm:text-5xl">Score review queue</h1>
          <p className="mt-4 text-base leading-7 text-white/50">
            Review community score reports before they become verified VarsityVue game state. Approving a report updates the canonical dynamic score and automatically supersedes older pending reports for the same game.
          </p>
        </section>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-amber-100">
            {(submissions ?? []).length} Pending
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

        <section className="mt-8 space-y-4">
          {(submissions ?? []).length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-sm text-white/55">No pending score reports.</div>
          ) : (
            submissions!.map((submission) => {
              const game = getGameById(submission.game_id);
              const submitter = profileMap.get(submission.submitted_by);
              const awayReady = game ? hasCompleteSchoolIdentity(game.awaySchoolSlug, game.awayTeam) : false;
              const homeReady = game ? hasCompleteSchoolIdentity(game.homeSchoolSlug, game.homeTeam) : false;
              const identityReady = Boolean(game && awayReady && homeReady);
              const awayName = game ? displayTeamName(game.awayTeam, game.awaySchoolSlug) : "Away";
              const homeName = game ? displayTeamName(game.homeTeam, game.homeSchoolSlug) : "Home";
              const missingIdentityTeams = game
                ? [!awayReady ? awayName : null, !homeReady ? homeName : null].filter(Boolean)
                : ["Unknown game"];
              const isFinal = submission.game_status === "final";

              return (
                <article key={submission.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                  <div className="border-b border-white/10 bg-black/20 px-5 py-3 sm:px-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-amber-100">Pending Review</span>
                        <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${identityReady ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100" : "border-red-400/20 bg-red-500/10 text-red-100"}`}>
                          {identityReady ? "Identity Ready" : "Identity Missing"}
                        </span>
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/30">
                        {game ? `Week ${game.week ?? "—"}` : "Unknown game"}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_320px]">
                    <div>
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 sm:p-5">
                        <div className="min-w-0 text-center sm:text-left">
                          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/30">Away</p>
                          <p className="mt-1 truncate text-sm font-black text-white sm:text-base">{awayName}</p>
                          <p className="mt-2 text-4xl font-black tabular-nums">{submission.away_score}</p>
                        </div>

                        <div className="text-center">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${isFinal ? "border-white/15 bg-white/[0.06] text-white/60" : "border-red-400/20 bg-red-500/10 text-red-100"}`}>
                            {isFinal ? "Final" : "Live"}
                          </span>
                          {!isFinal && (submission.period || submission.clock) ? (
                            <p className="mt-2 text-xs font-bold text-white/45">
                              {[submission.period, submission.clock].filter(Boolean).join(" · ")}
                            </p>
                          ) : null}
                        </div>

                        <div className="min-w-0 text-center sm:text-right">
                          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/30">Home</p>
                          <p className="mt-1 truncate text-sm font-black text-white sm:text-base">{homeName}</p>
                          <p className="mt-2 text-4xl font-black tabular-nums">{submission.home_score}</p>
                        </div>
                      </div>

                      {!identityReady ? (
                        <p className="mt-3 rounded-xl border border-red-400/15 bg-red-500/[0.07] p-3 text-xs font-semibold text-red-100/80">
                          Approval blocked until complete identity data is added for {missingIdentityTeams.join(" and ")}.
                        </p>
                      ) : null}

                      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/35">
                        <span>Submitted by <strong className="font-bold text-white/55">{submitter?.display_name || submitter?.username || submission.submitted_by}</strong></span>
                        <span>{new Date(submission.created_at).toLocaleString("en-US", { timeZone: "America/Chicago", dateStyle: "medium", timeStyle: "short" })} CT</span>
                      </div>

                      {submission.source_note ? (
                        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
                          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/30">Source note</p>
                          <p className="mt-1 text-sm leading-6 text-white/60">{submission.source_note}</p>
                        </div>
                      ) : null}
                    </div>

                    <div className="lg:border-l lg:border-white/10 lg:pl-6">
                      <p className="mb-3 text-[10px] font-black uppercase tracking-[0.16em] text-white/35">Moderation action</p>
                      <form className="space-y-3">
                        <input type="hidden" name="submission_id" value={submission.id} />
                        <textarea name="review_note" rows={3} placeholder="Review note (optional)" className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-[var(--vv-accent)] focus:outline-none" />
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            formAction={approveScoreSubmission}
                            disabled={!identityReady}
                            title={identityReady ? "Approve score submission" : "Complete team identity data before approval"}
                            className="rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-black transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30 disabled:hover:bg-white/10"
                          >
                            Approve
                          </button>
                          <button formAction={rejectScoreSubmission} className="rounded-full border border-red-400/25 bg-red-500/10 px-4 py-2.5 text-sm font-black text-red-100 transition hover:bg-red-500/20">Reject</button>
                        </div>
                      </form>
                    </div>
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
