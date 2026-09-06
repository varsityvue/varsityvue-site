import type { Metadata } from "next";
import Link from "next/link";
import { getGames } from "@/lib/games";

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

function formatStatus(status: string) {
  if (status === "upcoming") return "Upcoming";
  if (status === "live") return "Live";
  if (status === "final") return "Final";
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

export default function GamesPage() {
  const regularGames = [...getGames()]
    .filter((game) => game.gameType !== "bye")
    .sort((a, b) => getGameTimestamp(a) - getGameTimestamp(b));

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
  const upcomingGames = regularGames.filter(
    (game) => game.status === "upcoming"
  );
  const districtGames = regularGames.filter((game) => game.districtGame);
  const hasLiveGames = liveGames.length > 0;

  const displayGames = [...regularGames].sort((a, b) => {
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

  const stripGames = hasLiveGames
    ? liveGames
    : upcomingGames.length > 0
      ? upcomingGames.slice(0, 5)
      : [...finalGames].sort(compareGameDatesDesc).slice(0, 5);

  return (
    <main className="min-h-screen bg-[var(--vv-bg)] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(139,16,32,0.62),transparent_34%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_30%)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <section
            className="rounded-[2rem] border border-white/10 p-6 shadow-2xl md:p-8"
            style={{
              background: `
                radial-gradient(circle at top left, rgba(139,16,32,0.42), transparent 42%),
                radial-gradient(circle at bottom right, rgba(139,16,32,0.16), transparent 46%),
                rgba(255,255,255,0.045)
              `,
            }}
          >
            <h1 className="max-w-5xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">
              VarsityVue Football Scores + Schedules
            </h1>

            <p className="mt-6 max-w-3xl text-base leading-7 text-white/60 sm:text-lg">
              Schedules, live scores, featured matchups, district games, and
              game-week coverage across the VarsityVue ecosystem.
            </p>
          </section>

          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Games" value={regularGames.length.toString()} />
            <StatCard label="Live Now" value={liveGames.length.toString()} />
            <StatCard label="Final Scores" value={finalGames.length.toString()} />
            <StatCard label="District Games" value={districtGames.length.toString()} />
          </section>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          {featuredGame && (
            <section className="overflow-hidden rounded-[2rem] border border-[color:var(--vv-primary)]/40 bg-gradient-to-br from-[var(--vv-primary)]/45 via-black to-black shadow-2xl">
              <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
                <div className="p-6 md:p-8">
                  <p className="text-xs font-black uppercase tracking-[0.32em] text-[var(--vv-accent-soft)]">
                    {featuredGame.specialEvent === "Game of the Week" ? "Game of the Week" : "Featured Matchup"}
                  </p>

                  <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
                    {getAwayTeam(featuredGame)}
                    <span className="block text-white/35">at</span>
                    {getHomeTeam(featuredGame)}
                  </h2>

                  <div className="mt-6 flex flex-wrap gap-2">
                    <Badge
                      label={getGameTypeLabel(
                        featuredGame.gameType,
                        featuredGame.week
                      )}
                    />
                    <Badge label={formatStatus(featuredGame.status)} />
                    {featuredGame.districtGame && <Badge label="District Game" />}
                    {featuredGame.specialEvent && <Badge label={featuredGame.specialEvent} />}
                  </div>

                  <div className="mt-7 grid gap-3 sm:grid-cols-3">
                    <InfoCard label="Date" value={formatGameDate(featuredGame.kickoff)} />
                    <InfoCard label="Kickoff" value={formatGameTime(featuredGame.kickoff)} />
                    <InfoCard label="Venue" value={getVenue(featuredGame)} />
                  </div>
                </div>

                <div className="flex flex-col justify-between border-t border-white/10 bg-black/35 p-6 md:p-8 lg:border-l lg:border-t-0">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.28em] text-white/40">
                      Matchup Center
                    </p>
                    <h3 className="mt-3 text-3xl font-black">
                      Follow the game in one place.
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-white/55">
                      Open the matchup center for confirmed game details, scores,
                      team links, and verified postgame information as it becomes available.
                    </p>
                  </div>

                  <Link
                    href={`/games/${featuredGame.id}`}
                    className="mt-6 rounded-xl border border-white/15 bg-white/10 px-5 py-4 text-center text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/15"
                  >
                    Matchup Center →
                  </Link>
                </div>
              </div>
            </section>
          )}

          <section className="mt-8 rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl sm:p-6">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--vv-accent)]">
                  {hasLiveGames ? "Live Score Strip" : upcomingGames.length > 0 ? "Next Up" : "Recent Results"}
                </p>
                <h2 className="mt-2 text-3xl font-black text-white">
                  {hasLiveGames ? "Live Scoreboard" : upcomingGames.length > 0 ? "Upcoming Games" : "Latest Finals"}
                </h2>
              </div>

              <p className="text-sm font-bold text-white/45">
                {hasLiveGames
                  ? `${liveGames.length} live`
                  : upcomingGames.length > 0
                    ? `${upcomingGames.length} upcoming`
                    : finalGames.length > 0
                      ? `${finalGames.length} final`
                      : "No games listed"}
              </p>
            </div>

            {stripGames.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-2 pr-4">
                {stripGames.map((game) => (
                  <Link
                    key={game.id}
                    href={`/games/${game.id}`}
                    className="min-w-[280px] rounded-2xl border border-white/10 bg-black/35 p-4 transition hover:bg-white/10"
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--vv-accent)]">
                      {formatStatus(game.status)} · {getGameTypeLabel(game.gameType, game.week)}
                    </p>
                    <h3 className="mt-2 text-lg font-black text-white">
                      {getAwayTeam(game)} at {getHomeTeam(game)}
                    </h3>
                    <p className="mt-2 text-sm text-white/45">
                      {formatGameDate(game.kickoff)} · {formatGameTime(game.kickoff)}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-white/10 bg-black/35 p-4 text-sm text-white/55">
                No game information is currently available.
              </p>
            )}
          </section>

          <section className="mt-10">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--vv-accent)]">
                  Schedule Board
                </p>
                <h2 className="mt-2 text-3xl font-black text-white">All Matchups</h2>
              </div>
            </div>

            {displayGames.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {displayGames.map((game) => (
                  <Link
                    key={game.id}
                    href={`/games/${game.id}`}
                    className="group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-xl transition hover:-translate-y-1 hover:border-[color:var(--vv-accent)]/40 hover:bg-white/[0.075]"
                  >
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,16,32,0.38),transparent_55%)] opacity-45 transition group-hover:opacity-70" />
                    <div className="relative">
                      <div className="flex flex-wrap gap-2">
                        <Badge label={getGameTypeLabel(game.gameType, game.week)} />
                        <Badge label={formatStatus(game.status)} />
                        {game.districtGame && <Badge label="District" />}
                        {game.specialEvent && <Badge label={game.specialEvent} />}
                      </div>

                      <h3 className="mt-5 text-2xl font-black leading-tight text-white">
                        {getAwayTeam(game)}
                        <span className="block text-white/35">at</span>
                        {getHomeTeam(game)}
                      </h3>

                      <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <InfoCard label="Date" value={formatGameDate(game.kickoff)} />
                        <InfoCard label="Kickoff" value={formatGameTime(game.kickoff)} />
                      </div>

                      <div className="mt-3 rounded-2xl border border-white/10 bg-black/35 p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Venue</p>
                        <p className="mt-2 font-black text-white">{getVenue(game)}</p>
                      </div>

                      {game.status === "final" &&
                        game.homeScore !== undefined &&
                        game.awayScore !== undefined && (
                          <p className="mt-4 text-lg font-black text-white">
                            Final: {game.awayScore}-{game.homeScore}
                          </p>
                        )}

                      <p className="mt-6 text-sm font-black uppercase tracking-[0.14em] text-[var(--vv-accent)]">
                        Matchup Center →
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 text-sm text-white/55">
                No matchups are currently listed.
              </p>
            )}
          </section>

          <section className="mt-10 rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--vv-accent)]">
              VarsityVue Coverage
            </p>
            <h2 className="mt-3 text-3xl font-black text-white">
              Built for Texas high school football discovery.
            </h2>
            <p className="mt-4 max-w-4xl leading-7 text-white/60">
              VarsityVue organizes Texas high school football schedules, scores,
              district matchups, school hubs, game previews, player statistics,
              and local coverage into one searchable platform built for fans,
              families, athletes, schools, and communities.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 shadow-xl">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-white/40">{label}</p>
      <p className="mt-3 text-4xl font-black text-white">{value}</p>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/70">
      {label}
    </span>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">{label}</p>
      <p className="mt-2 font-black text-white">{value}</p>
    </div>
  );
}
