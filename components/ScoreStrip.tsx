import Link from "next/link";
import { getHomepageScoreboardGames } from "@/lib/scoreboard";

function getScore(game: { awayScore?: number; homeScore?: number; score?: { away?: number; home?: number } }) {
  return {
    away: game.awayScore ?? game.score?.away,
    home: game.homeScore ?? game.score?.home,
  };
}

function getTickerLabel(mode: "finals" | "upcoming", week?: number) {
  if (mode === "finals") {
    return week !== undefined ? `Week ${week} Scores` : "Latest Scores";
  }

  return week !== undefined ? `Week ${week} Games` : "Upcoming Games";
}

export default function ScoreStrip() {
  const { mode, games } = getHomepageScoreboardGames(12);

  if (games.length === 0) return null;

  const week = games[0]?.week;
  const allSameWeek = week !== undefined && games.every((game) => game.week === week);
  const label = getTickerLabel(mode, allSameWeek ? week : undefined);
  const tickerGames = [...games, ...games];

  return (
    <section
      aria-label={label}
      className="overflow-hidden border-y border-white/10 bg-[#090909]"
    >
      <style>{`
        @keyframes vv-score-ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        .vv-score-ticker-track {
          animation: vv-score-ticker 38s linear infinite;
          width: max-content;
        }

        .vv-score-ticker-wrap:hover .vv-score-ticker-track,
        .vv-score-ticker-wrap:focus-within .vv-score-ticker-track {
          animation-play-state: paused;
        }

        @media (prefers-reduced-motion: reduce) {
          .vv-score-ticker-track {
            animation: none;
          }
        }
      `}</style>

      <div className="flex items-stretch">
        <Link
          href="/scoreboard"
          className="relative z-10 flex shrink-0 items-center border-r border-white/10 bg-[var(--vv-primary)] px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white sm:px-5 sm:text-xs"
        >
          {label}
          <span className="ml-2 text-white/60">→</span>
        </Link>

        <div className="vv-score-ticker-wrap min-w-0 flex-1 overflow-hidden">
          <div className="vv-score-ticker-track flex items-center py-2">
            {tickerGames.map((game, index) => {
              const score = getScore(game);
              const duplicate = index >= games.length;
              const isFinal = mode === "finals";

              return (
                <Link
                  key={`${game.id}-${index}`}
                  href={`/games/${game.id}`}
                  aria-hidden={duplicate ? true : undefined}
                  tabIndex={duplicate ? -1 : undefined}
                  className="group mx-1 flex min-w-max items-center gap-3 rounded-lg border border-white/10 bg-white/[0.035] px-4 py-2 transition hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/35">
                    {isFinal ? "Final" : game.displayStatus}
                  </span>

                  <span className="text-sm font-black text-white">
                    {game.awayTeam ?? "Away"}
                  </span>

                  {isFinal && score.away !== undefined ? (
                    <span className="text-base font-black text-white">{score.away}</span>
                  ) : null}

                  <span className="text-[10px] font-black uppercase text-white/25">
                    {isFinal ? "—" : "at"}
                  </span>

                  {isFinal && score.home !== undefined ? (
                    <span className="text-base font-black text-white">{score.home}</span>
                  ) : null}

                  <span className="text-sm font-black text-white">
                    {game.homeTeam ?? "Home"}
                  </span>

                  {game.districtGame && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white/35">
                      District
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
