import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  adminPickemGradeLabel,
  adminPickemPointsLabel,
  groupAdminPickemSubmissions,
  type AdminPickemSubmissionRow,
} from "@/lib/admin-pickem-submissions";
import { getGameById } from "@/lib/games";
import { requireActiveMember } from "@/lib/member-access";
import { getSchoolBySlug } from "@/lib/schools";

export const metadata: Metadata = {
  title: "Pick ’Em Submissions",
  robots: { index: false, follow: false, nocache: true },
};

type PageProps = { searchParams: Promise<{ week?: string }> };

type WeekOption = {
  id: string;
  season: number;
  week: number;
  title: string;
  status: string;
};

function dateTimeLabel(value: string | null) {
  if (!value) return "No saved picks";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time unavailable";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
    timeZoneName: "short",
  });
}

function teamName(row: AdminPickemSubmissionRow, slug: string | null) {
  if (!slug) return null;
  const canonical = getGameById(row.game_id);
  if (slug === row.away_school_slug) return canonical?.awayTeam ?? getSchoolBySlug(slug)?.name ?? slug;
  if (slug === row.home_school_slug) return canonical?.homeTeam ?? getSchoolBySlug(slug)?.name ?? slug;
  return getSchoolBySlug(slug)?.name ?? slug;
}

function matchup(row: AdminPickemSubmissionRow) {
  const canonical = getGameById(row.game_id);
  const away = canonical?.awayTeam ?? teamName(row, row.away_school_slug) ?? "Away team";
  const home = canonical?.homeTeam ?? teamName(row, row.home_school_slug) ?? "Home team";
  return `${away} at ${home}`;
}

function resultLabel(row: AdminPickemSubmissionRow) {
  const grade = adminPickemGradeLabel(row);
  if (grade === "Void") {
    if (row.result_type === "tie") return "Void · Tie";
    if (row.result_type === "no_contest") return "Void · No contest";
    return "Void · Cancelled";
  }
  const winner = teamName(row, row.result_winner_school_slug);
  return winner ? `Winner: ${winner}` : "Result pending";
}

function gradeClass(grade: string) {
  if (grade === "Correct") return "border-emerald-300/20 bg-emerald-300/10 text-emerald-100";
  if (grade === "Incorrect") return "border-red-300/20 bg-red-300/10 text-red-100";
  if (grade === "Void") return "border-sky-300/20 bg-sky-300/10 text-sky-100";
  return "border-white/10 bg-white/[0.04] text-white/45";
}

export default async function PickemSubmissionsPage({ searchParams }: PageProps) {
  const { supabase, userId } = await requireActiveMember();
  const [{ data: roles }, { data: weekRows }, params] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", userId),
    supabase
      .from("pickem_weeks")
      .select("id, season, week, title, status")
      .order("season", { ascending: false })
      .order("week", { ascending: false }),
    searchParams,
  ]);

  if (!roles?.some((row) => row.role === "admin")) redirect("/account");

  const weeks = (weekRows ?? []) as WeekOption[];
  const selectedWeek = weeks.find((week) => week.id === params.week) ?? weeks[0] ?? null;
  const { data, error } = selectedWeek
    ? await supabase.rpc("admin_pickem_submissions", { p_week_id: selectedWeek.id })
    : { data: [], error: null };
  const rows = (data ?? []) as AdminPickemSubmissionRow[];
  const entrants = groupAdminPickemSubmissions(rows);
  const totalSavedPicks = entrants.reduce((total, entrant) => total + entrant.savedPicks, 0);
  const completeEntrants = entrants.filter((entrant) => entrant.complete).length;

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-5 text-white sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--vv-accent)]">Admin · Pick ’Em</p>
            <h1 className="mt-1.5 text-3xl font-black sm:mt-2 sm:text-5xl">Member submissions</h1>
            <p className="mt-2 max-w-3xl text-sm leading-5 text-white/50 sm:mt-3 sm:text-base sm:leading-6">
              Participation is visible immediately. Each selection stays concealed until that matchup locks.
            </p>
          </div>
          <Link href="/internal/pickem" className="text-sm font-bold text-white/50 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">← Pick ’Em management</Link>
        </header>

        <form className="mt-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 sm:mt-6 sm:flex-row sm:items-end sm:p-4" method="get">
          <label className="min-w-0 flex-1">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/40">Week</span>
            <select name="week" defaultValue={selectedWeek?.id} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm font-bold text-white outline-none focus:border-white/35 focus-visible:ring-2 focus-visible:ring-white/60">
              {weeks.map((week) => <option key={week.id} value={week.id}>{week.season} · Week {week.week} · {week.status}</option>)}
            </select>
          </label>
          <button type="submit" className="rounded-xl bg-white px-5 py-3 text-sm font-black text-black transition hover:bg-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">View week</button>
        </form>

        {error ? (
          <div role="alert" className="mt-6 rounded-2xl border border-red-300/20 bg-red-500/10 p-5 text-sm text-red-50">Submission data is temporarily unavailable.</div>
        ) : selectedWeek ? (
          <>
            <section aria-label="Participation summary" className="mt-4 grid grid-cols-3 gap-2 sm:mt-6 sm:gap-3">
              {[
                ["Entrants", entrants.length],
                ["Complete", completeEntrants],
                ["Picks saved", totalSavedPicks],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.04] p-3 sm:p-5">
                  <p className="text-2xl font-black sm:text-3xl">{value}</p>
                  <p className="mt-1 text-[8px] font-black uppercase tracking-[0.1em] text-white/35 sm:text-[10px] sm:tracking-[0.14em]">{label}</p>
                </div>
              ))}
            </section>

            {entrants.length > 0 ? (
              <section className="mt-4 space-y-2.5 sm:mt-6 sm:space-y-3" aria-label={`${selectedWeek.title} entrants`}>
                {entrants.map((entrant) => (
                  <details key={entrant.userId} className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
                    <summary className="cursor-pointer list-none p-3.5 outline-none transition hover:bg-white/[0.035] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70 sm:p-5 [&::-webkit-details-marker]:hidden">
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <h2 className="min-w-0 truncate text-base font-black sm:text-xl">{entrant.displayName}</h2>
                            <span className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.09em] sm:px-2.5 sm:py-1 sm:text-[9px] sm:tracking-[0.1em] ${entrant.complete ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : "border-amber-300/20 bg-amber-300/10 text-amber-100"}`}>{entrant.complete ? "Complete" : "Incomplete"}</span>
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-white/45 sm:mt-2 sm:text-xs">
                            <span className="font-bold text-white/65">{entrant.savedPicks} of {entrant.gameCount} saved</span>
                            <span>Last saved {dateTimeLabel(entrant.lastSubmittedAt)}</span>
                            <span className="font-black text-white/75">{adminPickemPointsLabel(entrant.gradedPicks, entrant.points)}</span>
                          </div>
                        </div>
                        <span className="flex shrink-0 items-center gap-1.5 pt-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-white/45 sm:gap-2 sm:text-[10px]">
                          <span className="group-open:hidden">View picks</span>
                          <span className="hidden group-open:inline">Hide picks</span>
                          <span aria-hidden="true" className="text-base leading-none transition-transform group-open:rotate-180">⌄</span>
                        </span>
                      </div>
                    </summary>

                    <div className="divide-y divide-white/10 border-t border-white/10">
                      {entrant.games.map((game) => {
                        const grade = adminPickemGradeLabel(game);
                        const selectedTeam = teamName(game, game.picked_school_slug);
                        return (
                          <div key={game.pickem_game_id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(11rem,auto)] sm:items-center sm:p-5">
                            <div className="min-w-0">
                              <p className="text-sm font-black">{matchup(game)}</p>
                              <p className="mt-1 text-[10px] text-white/35">{game.is_locked ? `Locked ${dateTimeLabel(game.lock_at)}` : `Locks ${dateTimeLabel(game.lock_at)}`}</p>
                              {game.is_locked ? (
                                <p className="mt-2 text-sm text-white/70">{selectedTeam ? <>Picked <strong className="text-white">{selectedTeam}</strong></> : "No pick saved"}</p>
                              ) : (
                                <p className="mt-2 text-sm font-bold text-white/45">Pick concealed until this game locks</p>
                              )}
                            </div>
                            <div className="flex items-center justify-between gap-3 sm:block sm:text-right">
                              <p className="text-xs text-white/40">{game.is_locked ? resultLabel(game) : "Result hidden until lock"}</p>
                              <span className={`mt-0 inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] sm:mt-2 ${gradeClass(grade)}`}>{grade}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </details>
                ))}
              </section>
            ) : (
              <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-7 text-center">
                <h2 className="text-xl font-black">No submissions yet</h2>
                <p className="mt-2 text-sm text-white/45">No member has saved a pick for {selectedWeek.title}.</p>
              </section>
            )}
          </>
        ) : (
          <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-7 text-center text-sm text-white/45">No Pick ’Em weeks are configured.</section>
        )}
      </div>
    </main>
  );
}
