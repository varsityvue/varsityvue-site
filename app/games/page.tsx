import Link from "next/link";
import { games } from "../../data/games";

function formatGameDate(kickoff: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
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

export default function GamesPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#d65a6d] sm:text-sm">
          VarsityVue Games
        </p>

        <h1 className="mt-4 text-4xl font-black leading-tight sm:text-6xl lg:text-7xl">
          Games
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-white/60 sm:text-xl">
          Browse upcoming matchups, game previews, scoreboards, and featured
          Friday night coverage.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {games.map((game) => (
            <Link
              key={game.id}
              href={`/games/${game.id}`}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg transition hover:-translate-y-1 hover:bg-white/[0.08]"
            >
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#d65a6d]">
                Week {game.week} · {game.status}
              </p>

              <h2 className="mt-4 text-3xl font-black">
                {game.awayTeam} at {game.homeTeam}
              </h2>

              <div className="mt-6 space-y-2 text-white/70">
                <p>{formatGameDate(game.kickoff)}</p>
                <p>{formatGameTime(game.kickoff)}</p>
                <p>{game.venue}</p>
                {game.districtGame && <p>District game</p>}
              </div>

              {game.status === "final" &&
                game.homeScore !== undefined &&
                game.awayScore !== undefined && (
                  <p className="mt-4 text-lg font-bold text-white">
                    Final: {game.awayScore}-{game.homeScore}
                  </p>
                )}

              <p className="mt-6 text-sm font-bold text-[#d65a6d]">
                View matchup →
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}