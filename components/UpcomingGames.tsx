import Link from "next/link";
import type { Game } from "../data/games";
import type { SchoolTheme } from "../types/school-theme";

type UpcomingGamesProps = {
  games: Game[];
  theme: SchoolTheme;
  schoolSlug: string;
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

function getGameLabel(game: Game) {
  if (game.gameType === "playoff") return "Playoff";
  return `Week ${game.week}`;
}

export default function UpcomingGames({
  games,
  theme,
  schoolSlug,
}: UpcomingGamesProps) {
  const visibleGames = games
    .filter((game) => game.gameType === "regular" || game.gameType === "playoff")
    .slice(0, 3);

  return (
    <section>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/60">
            Schedule Snapshot
          </p>
          <h2 className="mt-2 text-3xl font-black">Upcoming Games</h2>
        </div>
      </div>

      {visibleGames.length === 0 ? (
        <div
          className="rounded-3xl border bg-white/5 p-6 text-white/60"
          style={{ borderColor: `${theme.secondary}33` }}
        >
          No upcoming games listed yet.
        </div>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-3">
            {visibleGames.map((game) => (
              <Link
                key={game.id}
                href={`/games/${game.id}`}
                className="rounded-3xl border bg-white/[0.04] p-5 shadow-lg transition hover:-translate-y-1 hover:bg-white/[0.08]"
                style={{
                  borderColor: `${theme.secondary}33`,
                  boxShadow: `0 18px 50px ${theme.primary}22`,
                }}
              >
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/60">
                  {getGameLabel(game)}
                  {game.districtGame ? " · District" : ""}
                </p>

                <h3 className="mt-4 text-xl font-black leading-tight">
                  {game.awayTeam} at {game.homeTeam}
                </h3>

                <div className="mt-5 space-y-1.5 text-sm text-white/70">
                  <p>{formatGameDate(game.kickoff)}</p>
                  <p>{formatGameTime(game.kickoff)}</p>
                  <p>{game.venue}</p>
                </div>

                {game.specialEvent && (
                  <p className="mt-4 inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-white/70">
                    {game.specialEvent}
                  </p>
                )}

                <div
                  className="mt-5 h-1 w-16 rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})`,
                  }}
                />
              </Link>
            ))}
          </div>

          <Link
            href={`/schools/${schoolSlug}/schedule`}
            className="mt-6 inline-flex rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15"
          >
            View full schedule →
          </Link>
        </>
      )}
    </section>
  );
}