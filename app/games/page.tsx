import type { Metadata } from "next";
import Link from "next/link";
import { getGames } from "@/lib/games";

export const metadata: Metadata = {
  title: "Texas High School Football Scores, Schedules & Matchups | VarsityVue",
  description:
    "Browse Texas high school football schedules, scores, district matchups, kickoff times, venues, previews, and VarsityVue game coverage.",
};

function formatGameDate(kickoff: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/Chicago",
  }).format(new Date(kickoff));
}

function formatGameTime(kickoff: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  }).format(new Date(kickoff));
}

function formatStatus(status: string) {
  if (status === "upcoming") return "Upcoming";
  if (status === "live") return "Live";
  if (status === "final") return "Final";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getGameTypeLabel(gameType: string, week?: number) {
  if (gameType === "scrimmage") return "Scrimmage";
  if (gameType === "playoff") return "Playoff";
  if (gameType === "bye") return "BYE";
  return `Week ${week ?? "-"}`;
}

function getKickoffValue(game: { kickoff?: string }) {
  return game.kickoff ?? "";
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
    .sort(
      (a, b) =>
        new Date(getKickoffValue(a)).getTime() -
        new Date(getKickoffValue(b)).getTime()
    );

  const featuredGame =
    regularGames.find((game) => game.specialEvent) ??
    regularGames.find((game) => game.status === "upcoming") ??
    regularGames[0];

  const liveGames = regularGames.filter((game) => game.status === "live");
  const finalGames = regularGames.filter((game) => game.status === "final");
  const upcomingGames = regularGames.filter(
    (game) => game.status === "upcoming"
  );
  const districtGames = regularGames.filter((game) => game.districtGame);

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
            <p className="text-xs font-black uppercase tracking-[0.32em] text-[var(--vv-accent)]">
              VarsityVue Games
            </p>

            <h1 className="mt-4 max-w-5xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">
              VarsityVue Football Scores + Schedule
            </h1>

            <p className="mt-6 max-w-3xl text-base leading-7 text-white/60 sm:text-lg">
              Schedules, live scores, featured matchups, district games, and
              game-week coverage across the VarsityVue ecosystem.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <FilterPill label="All Games" active />
              <FilterPill label="Live" />
              <FilterPill label="Upcoming" />
              <FilterPill label="Final" />
              <FilterPill label="District" />
            </div>
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
                    Featured Matchup
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
                    {featuredGame.districtGame && (
                      <Badge label="District Game" />
                    )}
                    {featuredGame.specialEvent && (
                      <Badge label={featuredGame.specialEvent} />
                    )}
                  </div>

                  <div className="mt-7 grid gap-3 sm:grid-cols-3">
                    <InfoCard
                      label="Date"
                      value={formatGameDate(getKickoffValue(featuredGame))}
                    />
                    <InfoCard
                      label="Kickoff"
                      value={formatGameTime(getKickoffValue(featuredGame))}
                    />
                    <InfoCard label="Venue" value={getVenue(featuredGame)} />
                  </div>
                </div>

                <div className="flex flex-col justify-between border-t border-white/10 bg-black/35 p-6 md:p-8 lg:border-l lg:border-t-0">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.28em] text-white/40">
                      Game Week Inventory
                    </p>

                    <h3 className="mt-3 text-3xl font-black">
                      Own this featured matchup.
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-white/55">
                      Put your business in front of fans before kickoff, during
                      game week, and on the matchup page.
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
                  Live Score Strip
                </p>
                <h2 className="mt-2 text-3xl font-black text-white">
                  Friday Night Board
                </h2>
              </div>

              <p className="text-sm font-bold text-white/45">
                {liveGames.length > 0
                  ? `${liveGames.length} live`
                  : "Live scoring coming soon"}
              </p>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 pr-4">
              {(liveGames.length > 0
                ? liveGames
                : upcomingGames.slice(0, 5)
              ).map((game) => (
                <Link
                  key={game.id}
                  href={`/games/${game.id}`}
                  className="min-w-[280px] rounded-2xl border border-white/10 bg-black/35 p-4 transition hover:bg-white/10"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--vv-accent)]">
                    {formatStatus(game.status)} ·{" "}
                    {getGameTypeLabel(game.gameType, game.week)}
                  </p>

                  <h3 className="mt-2 text-lg font-black text-white">
                    {getAwayTeam(game)} at {getHomeTeam(game)}
                  </h3>

                  <p className="mt-2 text-sm text-white/45">
                    {formatGameDate(getKickoffValue(game))} ·{" "}
                    {formatGameTime(getKickoffValue(game))}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-10">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--vv-accent)]">
                  Schedule Board
                </p>

                <h2 className="mt-2 text-3xl font-black text-white">
                  All Matchups
                </h2>
              </div>

              <Link
                href="/sponsor-inquiry"
                className="w-fit rounded-full border border-white/10 bg-white/5 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-white/65 transition hover:bg-white/10 hover:text-white"
              >
                Sponsor a Game →
              </Link>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {regularGames.map((game) => (
                <Link
                  key={game.id}
                  href={`/games/${game.id}`}
                  className="group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-xl transition hover:-translate-y-1 hover:border-[color:var(--vv-accent)]/40 hover:bg-white/[0.075]"
                >
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,16,32,0.38),transparent_55%)] opacity-45 transition group-hover:opacity-70" />

                  <div className="relative">
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        label={getGameTypeLabel(game.gameType, game.week)}
                      />
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
                      <InfoCard
                        label="Date"
                        value={formatGameDate(getKickoffValue(game))}
                      />
                      <InfoCard
                        label="Kickoff"
                        value={formatGameTime(getKickoffValue(game))}
                      />
                    </div>

                    <div className="mt-3 rounded-2xl border border-white/10 bg-black/35 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
                        Venue
                      </p>
                      <p className="mt-2 font-black text-white">
                        {getVenue(game)}
                      </p>
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
              district matchups, school hubs, game previews, sponsor placements,
              and local coverage into one searchable platform built for fans,
              families, athletes, schools, and community businesses.
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
      <p className="text-xs font-black uppercase tracking-[0.22em] text-white/40">
        {label}
      </p>
      <p className="mt-3 text-4xl font-black text-white">{value}</p>
    </div>
  );
}

function FilterPill({
  label,
  active = false,
}: {
  label: string;
  active?: boolean;
}) {
  return (
    <span
      className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.14em] ${
        active
          ? "border-white/20 bg-white text-black"
          : "border-white/10 bg-white/5 text-white/60"
      }`}
    >
      {label}
    </span>
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
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>
      <p className="mt-2 font-black text-white">{value}</p>
    </div>
  );
}