import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCanonicalScoreboardTeamName } from "@/data/scoreboard-team-identities";
import { getGameById } from "@/lib/games";
import { getSchoolBySlug } from "@/lib/schools";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Score Review History | VarsityVue",
  robots: { index: false, follow: false, nocache: true },
};

type HistoryFilter = "all" | "approved" | "rejected" | "superseded";

type PageProps = {
  searchParams: Promise<{ status?: string; q?: string }>;
};

function displayTeamName(team?: string, slug?: string) {
  if (team) return getCanonicalScoreboardTeamName(team);
  if (slug) return getSchoolBySlug(slug)?.name ?? slug;
  return "Team TBD";
}

function statusClasses(status: string) {
  if (status === "approved") return "border-emerald-400/20 bg-emerald-400/10 text-emerald-100";
  if (status === "rejected") return "border-red-400/20 bg-red-500/10 text-red-100";
  return "border-white/10 bg-white/[0.05] text-white/45";
}

function statusLabel(status: string) {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  if (status === "superseded") return "Superseded";
  return status;
}

function normalizeFilter(value?: string): HistoryFilter {
  if (value === "approved" || value === "rejected" || value === "superseded") return value;
  return "all";
}

function filterHref(filter: HistoryFilter, query: string) {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("status", filter);
  if (query) params.set("q", query);
  const search = params.toString();
  return search ? `/internal/score-review/history?${search}` : "/internal/score-review/history";
}

export default async function ScoreReviewHistoryPage({ searchParams }: PageProps) {
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
  const activeFilter = normalizeFilter(params.status);
  const searchQuery = params.q?.trim() ?? "";
  const normalizedQuery = searchQuery.toLowerCase();

  const { data: submissions } = await supabase
    .from("score_submissions")
    .select("id, game_id, submitted_by, reviewed_by, home_score, away_score, game_status, period, clock, source_note, status, created_at, reviewed_at, review_note")
    .in("status", ["approved", "rejected", "superseded"])
    .order("reviewed_at", { ascending: false, nullsFirst: false })
    .limit(50);

  const allSubmissions = submissions ?? [];
  const statusFilteredSubmissions = activeFilter === "all"
    ? allSubmissions
    : allSubmissions.filter((item) => item.status === activeFilter);

  const filteredSubmissions = normalizedQuery
    ? statusFilteredSubmissions.filter((item) => {
        const game = getGameById(item.game_id);
        const awayName = game ? displayTeamName(game.awayTeam, game.awaySchoolSlug) : "";
        const homeName = game ? displayTeamName(game.homeTeam, game.homeSchoolSlug) : "";
        return `${awayName} ${homeName} ${item.game_id}`.toLowerCase().includes(normalizedQuery);
      })
    : statusFilteredSubmissions;

  const userIds = Array.from(
    new Set(
      filteredSubmissions.flatMap((item) => [item.submitted_by, item.reviewed_by].filter(Boolean) as string[]),
    ),
  );

  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, display_name, username").in("id", userIds)
    : { data: [] as { id: string; display_name: string | null; username: string | null }[] };

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  const approvedCount = allSubmissions.filter((item) => item.status === "approved").length;
  const rejectedCount = allSubmissions.filter((item) => item.status === "rejected").length;
  const supersededCount = allSubmissions.filter((item) => item.status === "superseded").length;

  const filters: { key: HistoryFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: allSubmissions.length },
    { key: "approved", label: "Approved", count: approvedCount },
    { key: "rejected", label: "Rejected", count: rejectedCount },
    { key: "superseded", label: "Superseded", count: supersededCount },
  ];

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="max-w-4xl">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--vv-accent)]">Internal Tool</p>
          <h1 className="mt-3 text-4xl font-black sm:text-5xl">Moderation history</h1>
          <p className="mt-4 text-base leading-7 text-white/50">
            Recent score review decisions are kept here so the active queue stays focused on pending reports while moderators can still audit what was approved, rejected, or superseded.
          </p>
        </section>

        <form method="get" className="mt-6 flex max-w-2xl flex-col gap-2 sm:flex-row">
          {activeFilter !== "all" ? <input type="hidden" name="status" value={activeFilter} /> : null}
          <input
            type="search"
            name="q"
            defaultValue={searchQuery}
            placeholder="Search school or matchup"
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-[var(--vv-accent)] focus:outline-none"
          />
          <button type="submit" className="rounded-xl bg-[var(--vv-primary)] px-5 py-3 text-sm font-black transition hover:bg-[#93142a]">Search</button>
          {searchQuery ? (
            <Link href={filterHref(activeFilter, "")} className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-bold text-white/50 transition hover:text-white">Clear</Link>
          ) : null}
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {filters.map((filter) => {
            const active = filter.key === activeFilter;
            return (
              <Link
                key={filter.key}
                href={filterHref(filter.key, searchQuery)}
                aria-current={active ? "page" : undefined}
                className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] transition ${
                  active
                    ? filter.key === "approved"
                      ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-50"
                      : filter.key === "rejected"
                        ? "border-red-400/30 bg-red-500/15 text-red-50"
                        : filter.key === "superseded"
                          ? "border-white/20 bg-white/10 text-white"
                          : "border-[var(--vv-accent)]/40 bg-[var(--vv-accent)]/10 text-white"
                    : "border-white/10 bg-white/[0.04] text-white/45 hover:border-white/20 hover:text-white/70"
                }`}
              >
                {filter.label} · {filter.count}
              </Link>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-[10px] font-black uppercase tracking-[0.14em] text-white/30">
          <span>{approvedCount} Approved</span>
          <span>·</span>
          <span>{rejectedCount} Rejected</span>
          <span>·</span>
          <span>{supersededCount} Superseded</span>
          {searchQuery ? <><span>·</span><span>{filteredSubmissions.length} Search Results</span></> : null}
        </div>

        <section className="mt-8 space-y-4">
          {filteredSubmissions.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-sm text-white/55">
              {searchQuery
                ? `No recent moderation records match “${searchQuery}”.`
                : activeFilter === "all"
                  ? "No moderation history yet."
                  : `No ${statusLabel(activeFilter).toLowerCase()} reports in the recent history.`}
            </div>
          ) : (
            filteredSubmissions.map((submission) => {
              const game = getGameById(submission.game_id);
              const awayName = game ? displayTeamName(game.awayTeam, game.awaySchoolSlug) : "Away";
              const homeName = game ? displayTeamName(game.homeTeam, game.homeSchoolSlug) : "Home";
              const submitter = profileMap.get(submission.submitted_by);
              const reviewer = submission.reviewed_by ? profileMap.get(submission.reviewed_by) : undefined;
              const isFinal = submission.game_status === "final";

              return (
                <article key={submission.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-black/20 px-5 py-3 sm:px-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${statusClasses(submission.status)}`}>
                        {statusLabel(submission.status)}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/30">{game ? `Week ${game.week ?? "—"}` : submission.game_id}</span>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/30">
                      {submission.reviewed_at
                        ? `${new Date(submission.reviewed_at).toLocaleString("en-US", { timeZone: "America/Chicago", dateStyle: "medium", timeStyle: "short" })} CT`
                        : "Review time unavailable"}
                    </p>
                  </div>

                  <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_320px]">
                    <div>
                      <h2 className="text-lg font-black sm:text-xl">{awayName} at {homeName}</h2>

                      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl border border-white/10 bg-black/25 p-4">
                        <div>
                          <p className="truncate text-xs font-black text-white/60">{awayName}</p>
                          <p className="mt-1 text-3xl font-black tabular-nums">{submission.away_score}</p>
                        </div>
                        <div className="text-center">
                          <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${isFinal ? "border-white/15 bg-white/[0.06] text-white/60" : "border-red-400/20 bg-red-500/10 text-red-100"}`}>
                            {isFinal ? "Final" : "Live"}
                          </span>
                          {!isFinal && (submission.period || submission.clock) ? (
                            <p className="mt-2 text-xs font-bold text-white/40">{[submission.period, submission.clock].filter(Boolean).join(" · ")}</p>
                          ) : null}
                        </div>
                        <div className="text-right">
                          <p className="truncate text-xs font-black text-white/60">{homeName}</p>
                          <p className="mt-1 text-3xl font-black tabular-nums">{submission.home_score}</p>
                        </div>
                      </div>

                      <div className="mt-4 text-xs leading-5 text-white/35">
                        <p>Submitted by <strong className="font-bold text-white/55">{submitter?.display_name || submitter?.username || submission.submitted_by}</strong></p>
                        <p>Reviewed by <strong className="font-bold text-white/55">{reviewer?.display_name || reviewer?.username || submission.reviewed_by || "System"}</strong></p>
                      </div>

                      {submission.source_note ? (
                        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
                          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/30">Source note</p>
                          <p className="mt-1 text-sm leading-6 text-white/60">{submission.source_note}</p>
                        </div>
                      ) : null}
                    </div>

                    <div className="lg:border-l lg:border-white/10 lg:pl-6">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">Review record</p>
                      <p className="mt-3 text-sm font-bold text-white/75">{statusLabel(submission.status)}</p>
                      <p className="mt-2 text-xs leading-5 text-white/40">Submitted {new Date(submission.created_at).toLocaleString("en-US", { timeZone: "America/Chicago", dateStyle: "medium", timeStyle: "short" })} CT</p>
                      {submission.review_note ? (
                        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
                          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/30">Review note</p>
                          <p className="mt-1 text-sm leading-6 text-white/60">{submission.review_note}</p>
                        </div>
                      ) : (
                        <p className="mt-4 text-xs text-white/30">No review note recorded.</p>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>

        <div className="mt-8 border-t border-white/10 pt-6">
          <Link href="/internal/score-review" className="text-sm font-bold text-white/55 transition hover:text-white">← Back to active review queue</Link>
        </div>
      </div>
    </main>
  );
}
