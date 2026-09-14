import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getGameById } from "@/lib/games";
import { createClient } from "@/lib/supabase/server";
import { approveScoreSubmission, rejectScoreSubmission } from "./actions";

export const metadata: Metadata = {
  title: "Score Review | VarsityVue",
  robots: { index: false, follow: false, nocache: true },
};

type PageProps = {
  searchParams: Promise<{ message?: string; reviewed?: string }>;
};

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
              return (
                <article key={submission.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
                        {game ? `Week ${game.week ?? "—"}` : "Unknown game"}
                      </p>
                      <h2 className="mt-2 text-xl font-black">
                        {game ? `${game.awayTeam ?? game.awaySchoolSlug} at ${game.homeTeam ?? game.homeSchoolSlug}` : submission.game_id}
                      </h2>
                      <p className="mt-3 text-2xl font-black">
                        Away {submission.away_score} <span className="text-white/25">·</span> Home {submission.home_score}
                      </p>
                      <p className="mt-2 text-sm text-white/55">
                        {submission.game_status}{submission.period ? ` · ${submission.period}` : ""}{submission.clock ? ` · ${submission.clock}` : ""}
                      </p>
                      <p className="mt-3 text-xs text-white/35">
                        Submitted by {submitter?.display_name || submitter?.username || submission.submitted_by} · {new Date(submission.created_at).toLocaleString("en-US", { timeZone: "America/Chicago" })}
                      </p>
                      {submission.source_note ? <p className="mt-3 max-w-2xl rounded-xl border border-white/10 bg-black/20 p-3 text-sm leading-6 text-white/60">{submission.source_note}</p> : null}
                    </div>

                    <div className="w-full lg:max-w-sm">
                      <form className="space-y-3">
                        <input type="hidden" name="submission_id" value={submission.id} />
                        <textarea name="review_note" rows={2} placeholder="Review note (optional)" className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-[var(--vv-accent)] focus:outline-none" />
                        <div className="grid grid-cols-2 gap-3">
                          <button formAction={approveScoreSubmission} className="rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-black transition hover:bg-emerald-500">Approve</button>
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
