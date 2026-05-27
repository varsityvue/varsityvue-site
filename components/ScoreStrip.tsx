import Link from "next/link";
import { getScoreboardGames } from "@/lib/scoreboard";

function formatKickoff(kickoff?: string) {
  if (!kickoff) return "TBD";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  }).format(new Date(kickoff));
}

export default function ScoreStrip() {
  const games = getScoreboardGames().slice(0, 8);

  if (games.length === 0) return null;

  return (
    <section className="border-b border-white/10 bg-white/[0.03]">
      <div className="mx-auto flex max-w-7xl gap-4 overflow-x-auto px-4 py-4 sm:px-6 lg:px-8">
        {games.map((game) => (
          <Link
            key={game.id}
            href={`/games/${game.id}`}
            className="min-w-[280px] rounded-2xl border border-white/10 bg-black/50 p-4 transition hover:border-[color:var(--vv-accent)] hover:bg-white/10"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--vv-accent)]">
                {game.displayStatus}
              </p>

              <p className="text-xs text-white/40">Week {game.week}</p>
            </div>

            <p className="mt-3 font-black">
              {game.awayTeam} at {game.homeTeam}
            </p>

            <p className="mt-2 text-sm text-white/55">
              {formatKickoff(game.kickoff)}
            </p>

            {game.status === "final" &&
              game.homeScore !== undefined &&
              game.awayScore !== undefined && (
                <p className="mt-3 text-sm font-bold text-white">
                  Final: {game.awayScore}-{game.homeScore}
                </p>
              )}
          </Link>
        ))}
      </div>
    </section>
  );
}