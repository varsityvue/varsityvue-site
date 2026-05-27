import Link from "next/link";
import type { Game } from "@/types/platform";
import type { SchoolTheme } from "../types/school-theme";

type UpcomingGamesProps = {
  games: Game[];
  theme: SchoolTheme;
  schoolSlug: string;
};

function formatGameDate(kickoff?: string) {
  if (!kickoff) return "TBD";

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/Chicago",
  }).format(new Date(kickoff));
}

function formatGameTime(kickoff?: string) {
  if (!kickoff) return "TBD";

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  }).format(new Date(kickoff));
}

function getGameLabel(game: Game) {
  if (game.gameType === "playoff") return "Playoff";
  if (game.gameType === "scrimmage") return "Scrimmage";
  if (game.gameType === "bye") return "BYE";
  return game.week === undefined ? "Week TBD" : `Week ${game.week}`;
}

function getTeamName(team?: string, fallback = "Team TBD") {
  return team ?? fallback;
}

function getVenueName(venue?: string) {
  return venue ?? "Venue TBD";
}

export default function UpcomingGames({
  games,
  theme,
  schoolSlug,
}: UpcomingGamesProps) {
  const visibleGames = games
    .filter((game) => game.gameType !== "bye")
    .slice(1, 5);

  const featuredGame = visibleGames[0];
  const remainingGames = visibleGames.slice(1, 4);

  return (
    <section
      className="rounded-[1.75rem] border bg-white/[0.045] p-5 shadow-2xl sm:p-6"
      style={{
        borderColor: `${theme.secondary}22`,
        boxShadow: `0 18px 55px ${theme.primary}14`,
      }}
    >
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-white/70">
            Schedule Snapshot
          </p>

          <h2 className="mt-2 text-3xl font-black text-white">
            Upcoming Games
          </h2>
        </div>

        <Link
          href={`/schools/${schoolSlug}/schedule`}
          className="hidden rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:brightness-110 sm:inline-flex"
          style={{
            borderColor: `${theme.secondary}33`,
            backgroundColor: "rgba(255,255,255,0.08)",
          }}
        >
          Full Schedule →
        </Link>
      </div>

      {visibleGames.length === 0 ? (
        <div
          className="rounded-3xl border bg-black/35 p-6"
          style={{ borderColor: `${theme.secondary}33` }}
        >
          <p className="text-lg font-black text-white">
            2026 schedule coming soon.
          </p>
          <p className="mt-2 text-sm leading-6 text-white/50">
            Upcoming matchups will appear here once this school’s schedule is
            added to VarsityVue.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          {featuredGame && (
            <Link
              href={`/games/${featuredGame.id}`}
              className="group relative overflow-hidden rounded-[1.5rem] border bg-black/45 p-6 transition hover:-translate-y-1 hover:bg-white/[0.06]"
              style={{
                borderColor: `${theme.secondary}33`,
                boxShadow: `0 18px 50px ${theme.primary}22`,
              }}
            >
              <div
                className="absolute inset-0 opacity-35 transition group-hover:opacity-50"
                style={{
                  background: `radial-gradient(circle at top left, ${theme.primary}, transparent 52%)`,
                }}
              />

              <div className="relative">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge label={getGameLabel(featuredGame)} theme={theme} />
                  {featuredGame.districtGame && (
                    <Badge label="District" theme={theme} />
                  )}
                  {featuredGame.specialEvent && (
                    <Badge label={featuredGame.specialEvent} theme={theme} />
                  )}
                </div>

                <h3 className="mt-5 text-3xl font-black leading-tight text-white sm:text-4xl">
                  {getTeamName(featuredGame.awayTeam, "Away Team")}
                  <span className="block text-white/35">at</span>
                  {getTeamName(featuredGame.homeTeam, "Home Team")}
                </h3>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <InfoCard
                    label="Date"
                    value={formatGameDate(featuredGame.kickoff)}
                  />
                  <InfoCard
                    label="Kickoff"
                    value={formatGameTime(featuredGame.kickoff)}
                  />
                  <InfoCard
                    label="Venue"
                    value={getVenueName(featuredGame.venue)}
                  />
                </div>

                <p
                  className="mt-6 text-sm font-black uppercase tracking-[0.16em]"
                  style={{ color: theme.secondary }}
                >
                  View matchup →
                </p>
              </div>
            </Link>
          )}

          <div className="grid gap-3">
            {remainingGames.map((game) => (
              <Link
                key={game.id}
                href={`/games/${game.id}`}
                className="rounded-2xl border bg-black/35 p-4 transition hover:bg-white/10"
                style={{ borderColor: `${theme.secondary}22` }}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-white/45">
                    {getGameLabel(game)}
                    {game.districtGame ? " · District" : ""}
                  </p>

                  <p className="text-xs font-bold text-white/45">
                    {formatGameDate(game.kickoff)}
                  </p>
                </div>

                <h3 className="mt-3 text-lg font-black leading-tight text-white">
                  {getTeamName(game.awayTeam, "Away Team")} at{" "}
                  {getTeamName(game.homeTeam, "Home Team")}
                </h3>

                <p className="mt-2 text-sm text-white/50">
                  {getVenueName(game.venue)}
                </p>
              </Link>
            ))}

            <Link
              href={`/schools/${schoolSlug}/schedule`}
              className="rounded-2xl border p-4 text-center text-sm font-black uppercase tracking-[0.16em] text-white transition hover:brightness-110 sm:hidden"
              style={{
                borderColor: `${theme.secondary}33`,
                backgroundColor: "rgba(255,255,255,0.08)",
              }}
            >
              View full schedule →
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

function Badge({
  label,
  theme,
}: {
  label: string;
  theme: SchoolTheme;
}) {
  return (
    <span
      className="rounded-full border bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-white/75"
      style={{ borderColor: `${theme.secondary}22` }}
    >
      {label}
    </span>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/35 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>
      <p className="mt-2 font-bold text-white">{value}</p>
    </div>
  );
}