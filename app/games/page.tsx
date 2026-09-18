import type { Metadata } from "next";
import Link from "next/link";
import { getDynamicGames } from "@/lib/dynamic-games";
import { createClient } from "@/lib/supabase/server";
import type { MediaLink } from "@/types/platform";

export const metadata: Metadata = {
  title: "Texas High School Football Scores, Schedules & Matchups",
  description:
    "Browse Texas high school football schedules, scores, district matchups, kickoff times, venues, previews, and VarsityVue game coverage.",
};

function parseGameDate(kickoff?: string) {
  if (!kickoff) return null;

  if (!kickoff.includes("T")) {
    const [year, month, day] = kickoff.split("-").map(Number);
    if (!year || !month || !day) return null;
    const parsed = new Date(Date.UTC(year, month - 1, day, 12));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(kickoff);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatGameDate(kickoff?: string) {
  const parsed = parseGameDate(kickoff);
  if (!parsed) return "Date TBD";

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: kickoff?.includes("T") ? "America/Chicago" : "UTC",
  }).format(parsed);
}

function formatGameTime(kickoff?: string) {
  if (!kickoff?.includes("T")) return "Time TBD";
  const parsed = parseGameDate(kickoff);
  if (!parsed) return "Time TBD";

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  }).format(parsed);
}

function getGameTimestamp(game: { kickoff?: string }) {
  const parsed = parseGameDate(game.kickoff);
  return parsed ? parsed.getTime() : Number.MAX_SAFE_INTEGER;
}

function compareGameDatesDesc(
  a: { kickoff?: string },
  b: { kickoff?: string }
) {
  const aTime = getGameTimestamp(a);
  const bTime = getGameTimestamp(b);

  if (aTime === Number.MAX_SAFE_INTEGER && bTime === Number.MAX_SAFE_INTEGER) return 0;
  if (aTime === Number.MAX_SAFE_INTEGER) return 1;
  if (bTime === Number.MAX_SAFE_INTEGER) return -1;

  return bTime - aTime;
}

function formatStatus(status: string, gameType?: string) {
  if (status === "upcoming") return "Upcoming";
  if (status === "live") return "Live";
  if (status === "final") return "Final";
  if (status === "scheduled" && gameType === "scrimmage") return "Score Not Tracked";
  if (status === "scheduled") return "Result Pending";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getGameTypeLabel(gameType: string, week?: number) {
  if (gameType === "scrimmage") return "Scrimmage";
  if (gameType === "playoff") return "Playoff";
  if (gameType === "bye") return "BYE";
  return `Week ${week ?? "-"}`;
}

function getAwayTeam(game: { awayTeam?: string }) {
  return game.awayTeam ?? "Away Team";
}

function getHomeTeam(game: { homeTeam?: string }) {
  return game.homeTeam ?? "Home Team";
}

function getVenue(game: { venue?: string }) {
  return game.venue ?? "Venue TBD";
}

function getScoreReportLabel(game: { status: string; gameType: string }) {
  if (game.gameType === "scrimmage" || game.gameType === "bye") return null;
  if (game.status === "live") return "Report Live Score";
  if (game.status === "scheduled") return "Report Final Score";
  return null;
}

export default async function GamesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const { q = "", status = "all" } = await searchParams;
  const matchupQuery = q.trim().toLowerCase();
  const matchupStatus = ["all", "upcoming", "final", "district"].includes(status) ? status : "all";
  const regularGames = [...(await getDynamicGames())]
    .filter((game) => game.gameType !== "bye")
    .sort((a, b) => getGameTimestamp(a) - getGameTimestamp(b));

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const pendingGameIds = new Set<string>();
  const userId = claimsData?.claims?.sub;

  if (userId) {
    const { data: pendingRows } = await supabase
      .from("score_submissions")
      .select("game_id")
      .eq("submitted_by", userId)
      .eq("status", "pending");

    for (const row of pendingRows ?? []) pendingGameIds.add(row.game_id);
  }

  const finalGames = regularGames.filter((game) => game.status === "final");
  const latestFinal = [...finalGames].sort(compareGameDatesDesc)[0];
  const latestFeaturedFinal = [...finalGames]
    .filter((game) => game.specialEvent || game.featured)
    .sort(compareGameDatesDesc)[0];

  const featuredGame =
    regularGames.find((game) => game.status === "live") ??
    regularGames.find(
      (game) => game.status === "upcoming" && game.specialEvent === "Game of the Week"
    ) ??
    regularGames.find(
      (game) => game.status === "upcoming" && (game.featured || game.specialEvent)
    ) ??
    regularGames.find((game) => game.status === "upcoming") ??
    latestFeaturedFinal ??
    latestFinal ??
    regularGames[0];

  const liveGames = regularGames.filter((game) => game.status === "live");
  const upcomingGames = regularGames.filter((game) => game.status === "upcoming");
  const districtGames = regularGames.filter((game) => game.districtGame);
  const hasLiveGames = liveGames.length > 0;
  const hasFinalGames = finalGames.length > 0;

  const displayGames = [...regularGames]
    .filter((game) => {
      if (matchupStatus === "upcoming" && !["upcoming", "scheduled", "live"].includes(game.status)) return false;
      if (matchupStatus === "final" && game.status !== "final") return false;
      if (matchupStatus === "district" && !game.districtGame) return false;
      if (!matchupQuery) return true;

      const haystack = [
        getAwayTeam(game),
        getHomeTeam(game),
        getVenue(game),
        game.specialEvent,
        game.week !== undefined ? `week ${game.week}` : "",
      ].filter(Boolean).join(" ").toLowerCase();

      return haystack.includes(matchupQuery);
    })
    .sort((a, b) => {
      const statusPriority: Record<string, number> = {
        live: 0,
        upcoming: 1,
        scheduled: 2,
        final: 3,
      };

      const priorityDifference =
        (statusPriority[a.status] ?? 4) - (statusPriority[b.status] ?? 4);
      if (priorityDifference !== 0) return priorityDifference;

      const aTime = getGameTimestamp(a);
      const bTime = getGameTimestamp(b);

      if (aTime === Number.MAX_SAFE_INTEGER && bTime === Number.MAX_SAFE_INTEGER) return 0;
      if (aTime === Number.MAX_SAFE_INTEGER) return 1;
      if (bTime === Number.MAX_SAFE_INTEGER) return -1;

      return a.status === "final" ? bTime - aTime : aTime - bTime;
    });

  const matchupGroups = new Map<string, typeof displayGames>();
  for (const game of displayGames) {
    const groupLabel = game.gameType === "scrimmage"
      ? "Scrimmages"
      : game.gameType === "playoff"
        ? "Playoffs"
        : game.week !== undefined
          ? `Week ${game.week}`
          : "Other Games";
    const existing = matchupGroups.get(groupLabel) ?? [];
    existing.push(game);
    matchupGroups.set(groupLabel, existing);
  }

  const currentWeek = featuredGame?.week;

  const stripGames = hasLiveGames
    ? liveGames
    : hasFinalGames
      ? [...finalGames].sort(compareGameDatesDesc).slice(0, 5)
      : upcomingGames.slice(0, 5);

  return (
    <main className="min-h-screen bg-[var(--vv-bg)] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(139,16,32,0.62),transparent_34%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_30%)] px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <section
            className="rounded-[1.5rem] border border-white/10 p-5 shadow-2xl sm:rounded-[2rem] sm:p-6 md:p-8"
            style={{
              background: `
                radial-gradient(circle at top left, rgba(139,16,32,0.42), transparent 42%),
                radial-gradient(circle at bottom right, rgba(139,16,32,0.16), transparent 46%),
                rgba(255,255,255,0.045)
              `,
            }}
          >
            <h1 className="max-w-5xl text-[2rem] font-black leading-[1.08] tracking-tight sm:text-6xl sm:leading-tight">
              VarsityVue Football Scores + Schedules
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60 sm:mt-6 sm:text-lg sm:leading-7">
              Schedules, live scores, featured matchups, district games, and game-week coverage across the VarsityVue ecosystem.
            </p>
          </section>

          <section className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-6 sm:gap-4 lg:grid-cols-4">
            <StatCard label="Total Games" value={regularGames.length.toString()} />
            <StatCard label="Live Now" value={liveGames.length.toString()} />
            <StatCard label="Final Scores" value={finalGames.length.toString()} />
            <StatCard label="District Games" value={districtGames.length.toString()} />
          </section>
        </div>
      </section>

      <section className="px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          {featuredGame && (
            <section className="overflow-hidden rounded-[1.5rem] border border-[color:var(--vv-primary)]/40 bg-gradient-to-br from-[var(--vv-primary)]/45 via-black to-black shadow-2xl sm:rounded-[2rem]">
              <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
                <div className="p-4 sm:p-6 md:p-8">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--vv-accent-soft)] sm:text-xs sm:tracking-[0.32em]">
                    {featuredGame.specialEvent === "Game of the Week" ? "Game of the Week" : "Featured Matchup"}
                  </p>

                  <h2 className="mt-2.5 text-3xl font-black leading-[1.05] sm:mt-4 sm:text-5xl sm:leading-tight">
                    {getAwayTeam(featuredGame)}
                    <span className="block text-white/35">at</span>
                    {getHomeTeam(featuredGame)}
                  </h2>

                  <div className="mt-4 flex flex-wrap gap-1.5 sm:mt-6 sm:gap-2">
                    <Badge label={getGameTypeLabel(featuredGame.gameType, featuredGame.week)} />
                    <Badge label={formatStatus(featuredGame.status, featuredGame.gameType)} />
                    {featuredGame.districtGame && <Badge label="District Game" />}
                    {featuredGame.specialEvent && <Badge label={featuredGame.specialEvent} />}
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 sm:mt-7 sm:gap-3">
                    <InfoCard label="Date" value={formatGameDate(featuredGame.kickoff)} />
                    <InfoCard label="Kickoff" value={formatGameTime(featuredGame.kickoff)} />
                    <InfoCard label="Venue" value={getVenue(featuredGame)} />
                  </div>
                </div>

                <div className="flex flex-col justify-between border-t border-white/10 bg-black/35 p-4 sm:p-6 md:p-8 lg:border-l lg:border-t-0">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/40 sm:text-xs sm:tracking-[0.28em]">
                      Matchup Center
                    </p>
                    <h3 className="mt-2 text-xl font-black sm:mt-3 sm:text-3xl">
                      Follow the game in one place.
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-white/55 sm:mt-3 sm:text-sm sm:leading-6">
                      Open the matchup center for confirmed game details, scores, team links, and verified postgame information as it becomes available.
                    </p>
                  </div>

                  <div className="mt-4 space-y-2 sm:mt-6 sm:space-y-3">
                    <BroadcastButtons links={featuredGame.mediaLinks} />
                    <Link
                      href={`/games/${featuredGame.id}`}
                      className="block rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-center text-[11px] font-black uppercase tracking-[0.12em] text-white transition hover:bg-white/15 sm:px-5 sm:py-4 sm:text-sm sm:tracking-[0.16em]"
                    >
                      Matchup Center →
                    </Link>
                    <ScoreReportLink game={featuredGame} hasPendingReport={pendingGameIds.has(featuredGame.id)} />
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl sm:mt-8 sm:rounded-[1.75rem] sm:p-6">
            <div className="mb-4 flex items-end justify-between gap-3 sm:mb-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--vv-accent)] sm:text-xs sm:tracking-[0.28em]">
                  {hasLiveGames ? "Live Score Strip" : hasFinalGames ? "Recent Results" : "Next Up"}
                </p>
                <h2 className="mt-1.5 text-xl font-black text-white sm:mt-2 sm:text-3xl">
                  {hasLiveGames ? "Live Scoreboard" : hasFinalGames ? "Latest Finals" : "Upcoming Games"}
                </h2>
              </div>

              <p className="shrink-0 text-[11px] font-bold text-white/45 sm:text-sm">
                {hasLiveGames
                  ? `${liveGames.length} live`
                  : hasFinalGames
                    ? `${finalGames.length} finals`
                    : upcomingGames.length > 0
                      ? `${upcomingGames.length} upcoming`
                      : "No games listed"}
              </p>
            </div>

            {stripGames.length > 0 ? (
              <div className="flex gap-2.5 overflow-x-auto pb-1.5 pr-2 sm:gap-3 sm:pb-2 sm:pr-4">
                {stripGames.map((game) => (
                  <div key={game.id} className="min-w-[235px] rounded-[1.1rem] border border-white/10 bg-black/35 p-3 sm:min-w-[280px] sm:rounded-2xl sm:p-4">
                    <Link href={`/games/${game.id}`} className="block transition hover:opacity-80">
                      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[var(--vv-accent)] sm:text-[10px] sm:tracking-[0.18em]">
                        {formatStatus(game.status, game.gameType)} · {getGameTypeLabel(game.gameType, game.week)}
                      </p>
                      <h3 className="mt-1.5 text-sm font-black leading-5 text-white sm:mt-2 sm:text-lg">
                        {getAwayTeam(game)} at {getHomeTeam(game)}
                      </h3>
                      {game.status === "final" && game.awayScore !== undefined && game.homeScore !== undefined && (
                        <p className="mt-2 text-lg font-black leading-none text-white sm:text-xl">
                          {getAwayTeam(game)} {game.awayScore}
                          <span className="mx-1.5 text-white/30">—</span>
                          {getHomeTeam(game)} {game.homeScore}
                        </p>
                      )}
                      <p className="mt-1.5 text-xs text-white/45 sm:mt-2 sm:text-sm">
                        {formatGameDate(game.kickoff)} · {formatGameTime(game.kickoff)}
                      </p>
                    </Link>
                    <BroadcastButtons links={game.mediaLinks} compact />
                    <ScoreReportLink game={game} compact hasPendingReport={pendingGameIds.has(game.id)} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-white/10 bg-black/35 p-4 text-sm text-white/55">
                No game information is currently available.
              </p>
            )}
          </section>

          <section id="all-matchups" className="mt-7 scroll-mt-24 sm:mt-10">
            <div className="mb-4 sm:mb-6">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--vv-accent)] sm:text-xs sm:tracking-[0.28em]">
                Schedule + Archive
              </p>
              <div className="mt-1.5 flex items-end justify-between gap-3 sm:mt-2">
                <h2 className="text-2xl font-black text-white sm:text-3xl">Find a Matchup</h2>
                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-white/35">{displayGames.length} games</span>
              </div>
            </div>

            <form action="/games#all-matchups" method="get" className="mb-4 rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-3 sm:mb-6 sm:rounded-[1.75rem] sm:p-4">
              <label htmlFor="matchup-search" className="sr-only">Search matchups</label>
              <input id="matchup-search" name="q" type="search" defaultValue={q} placeholder="Search team, venue, or week…" className="w-full rounded-xl border border-white/10 bg-black/35 px-3.5 py-3 text-sm font-semibold text-white outline-none placeholder:text-white/30 focus:border-white/25 sm:rounded-2xl" />
              <div className="mt-2.5 grid grid-cols-[1fr_auto] gap-2">
                <label htmlFor="matchup-status" className="sr-only">Filter matchups</label>
                <select id="matchup-status" name="status" defaultValue={matchupStatus} className="min-w-0 rounded-xl border border-white/10 bg-black/35 px-3.5 py-3 text-xs font-black uppercase tracking-[0.1em] text-white/75 outline-none focus:border-white/25 sm:rounded-2xl">
                  <option value="all">All games</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="final">Finals</option>
                  <option value="district">District</option>
                </select>
                <button type="submit" className="rounded-xl border border-white/15 bg-white/[0.08] px-4 text-[10px] font-black uppercase tracking-[0.12em] text-white transition hover:bg-white/12 sm:rounded-2xl">Apply</button>
              </div>
              {(matchupQuery || matchupStatus !== "all") && <div className="mt-2.5 flex items-center justify-between gap-3"><p className="text-[10px] font-semibold text-white/40">{displayGames.length} matching game{displayGames.length === 1 ? "" : "s"}</p><Link href="/games#all-matchups" className="text-[9px] font-black uppercase tracking-[0.12em] text-white/55 hover:text-white">Clear filters</Link></div>}
            </form>

            {displayGames.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {[...matchupGroups.entries()].map(([groupLabel, games]) => {
                  const groupWeek = groupLabel.startsWith("Week ") ? Number(groupLabel.replace("Week ", "")) : undefined;
                  const shouldOpen = Boolean(matchupQuery) || matchupStatus !== "all" || groupWeek === currentWeek;
                  return <details key={groupLabel} open={shouldOpen} className="group rounded-[1.35rem] border border-white/10 bg-white/[0.035] p-3.5 sm:rounded-[1.75rem] sm:p-5">
                    <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                      <div className="flex items-center justify-between gap-3">
                        <div><h3 className="text-lg font-black text-white sm:text-xl">{groupLabel}</h3><p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-white/35">{games.length} matchup{games.length === 1 ? "" : "s"}</p></div>
                        <span className="text-sm font-black text-white/45 transition group-open:rotate-180">⌄</span>
                      </div>
                    </summary>
                    <div className="mt-3 grid gap-3 border-t border-white/10 pt-3 sm:mt-5 sm:gap-5 sm:pt-5 md:grid-cols-2 xl:grid-cols-3">
                      {games.map((game) => (
                        <div key={game.id} className="group/card relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4 shadow-xl transition hover:-translate-y-1 hover:border-[color:var(--vv-accent)]/40 hover:bg-white/[0.075] sm:rounded-[1.75rem] sm:p-5">
                          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,16,32,0.38),transparent_55%)] opacity-45 transition group-hover/card:opacity-70" />
                          <div className="relative">
                            <Link href={`/games/${game.id}`} className="block">
                              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                <Badge label={getGameTypeLabel(game.gameType, game.week)} />
                                <Badge label={formatStatus(game.status, game.gameType)} />
                                {game.districtGame && <Badge label="District" />}
                                {game.specialEvent && <Badge label={game.specialEvent} />}
                              </div>
                              <h3 className="mt-3 text-xl font-black leading-[1.08] text-white sm:mt-5 sm:text-2xl sm:leading-tight">{getAwayTeam(game)}<span className="block text-white/35">at</span>{getHomeTeam(game)}</h3>
                              <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-6 sm:gap-3"><InfoCard label="Date" value={formatGameDate(game.kickoff)} /><InfoCard label="Kickoff" value={formatGameTime(game.kickoff)} /></div>
                              <div className="mt-2 rounded-xl border border-white/10 bg-black/35 p-3 sm:mt-3 sm:rounded-2xl sm:p-4"><p className="text-[9px] font-black uppercase tracking-[0.15em] text-white/35 sm:text-[10px] sm:tracking-[0.18em]">Venue</p><p className="mt-1 text-sm font-black leading-5 text-white sm:mt-2 sm:text-base">{getVenue(game)}</p></div>
                              {game.status === "final" && game.homeScore !== undefined && game.awayScore !== undefined && <p className="mt-3 text-base font-black text-white sm:mt-4 sm:text-lg">Final: {game.awayScore}-{game.homeScore}</p>}
                              <p className="mt-4 text-[11px] font-black uppercase tracking-[0.11em] text-[var(--vv-accent)] sm:mt-6 sm:text-sm sm:tracking-[0.14em]">Matchup Center →</p>
                            </Link>
                            <BroadcastButtons links={game.mediaLinks} />
                            <ScoreReportLink game={game} hasPendingReport={pendingGameIds.has(game.id)} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>;
                })}
              </div>
            ) : (
              <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6 text-white/55">
                No matchups match those filters.
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function ScoreReportLink({
  game,
  compact = false,
  hasPendingReport = false,
}: {
  game: { id: string; status: string; gameType: string };
  compact?: boolean;
  hasPendingReport?: boolean;
}) {
  const reportLabel = getScoreReportLabel(game);
  if (!reportLabel) return null;
  const label = hasPendingReport ? "Pending Review" : reportLabel;

  return (
    <Link
      href={`/report-score?game=${encodeURIComponent(game.id)}`}
      className={`${compact ? "mt-2.5 px-2.5 py-2 text-[9px] sm:px-3 sm:text-[10px]" : "mt-3 px-3 py-2.5 text-[10px] sm:mt-4 sm:px-4 sm:py-3 sm:text-xs"} block rounded-xl border text-center font-black uppercase tracking-[0.12em] transition ${hasPendingReport ? "border-amber-300/30 bg-amber-300/10 text-amber-100 hover:bg-amber-300/15" : "border-[var(--vv-accent)]/25 bg-[var(--vv-accent)]/10 text-[var(--vv-accent)] hover:bg-[var(--vv-accent)]/15"}`}
    >
      {label} →
    </Link>
  );
}

function BroadcastButtons({ links, compact = false }: { links?: MediaLink[]; compact?: boolean }) {
  const broadcasts = (links ?? []).filter((link) => ["stream", "radio", "tv"].includes(link.type));
  if (broadcasts.length === 0) return null;

  return (
    <div className={`${compact ? "mt-2.5" : "mt-3"} flex flex-wrap gap-2 sm:mt-4`}>
      {broadcasts.map((link) => (
        <a
          key={`${link.type}-${link.url}`}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${compact ? "px-2.5 py-1.5 text-[9px] sm:px-3 sm:py-2 sm:text-[10px]" : "px-3 py-2 text-[10px] sm:px-4 sm:py-3 sm:text-xs"} rounded-lg border border-white/15 bg-white/10 font-black uppercase tracking-[0.12em] text-white transition hover:bg-white/15 sm:rounded-xl sm:tracking-[0.14em]`}
        >
          {link.type === "radio" ? "Listen Live" : "Watch Live"}
        </a>
      ))}
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-black/35 px-2 py-1 text-[8px] font-black uppercase tracking-[0.11em] text-white/70 sm:px-3 sm:py-1.5 sm:text-[10px] sm:tracking-[0.16em]">
      {label}
    </span>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.045] p-3 shadow-xl sm:rounded-2xl sm:p-5">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/35 sm:text-xs sm:tracking-[0.22em]">{label}</p>
      <p className="mt-1 text-xl font-black text-white sm:mt-2 sm:text-3xl">{value}</p>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-white/10 bg-black/35 p-2.5 sm:rounded-2xl sm:p-4">
      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-white/35 sm:text-[10px] sm:tracking-[0.18em]">{label}</p>
      <p className="mt-1 truncate text-[11px] font-black text-white sm:mt-2 sm:text-base">{value}</p>
    </div>
  );
}
