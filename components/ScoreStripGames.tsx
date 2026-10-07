import Link from "next/link";
import ScoreTicker from "@/components/ScoreTicker";
import { liveGameContext } from "@/lib/live-period";
import { getGamePresentation } from "@/lib/game-presentation";
import type { ScoreboardGame } from "@/lib/scoreboard";

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

export default function ScoreStripGames({ mode, games }: { mode: "finals" | "upcoming"; games: ScoreboardGame[] }) {
  const week = games[0]?.week;
  const allSameWeek = week !== undefined && games.every((game) => game.week === week);
  const label = getTickerLabel(mode, allSameWeek ? week : undefined);

  return (
    <section
      aria-label={label}
      className="overflow-hidden border-y border-white/10 bg-[#070707]"
    >
      <div className="flex min-h-10 items-stretch sm:min-h-14">
        <Link
          href="/games?intent=scores"
          className="relative z-10 flex shrink-0 items-center border-r border-white/10 bg-[var(--vv-primary)] px-2.5 text-[8px] font-black uppercase tracking-[0.14em] text-white shadow-[8px_0_20px_rgba(0,0,0,0.35)] sm:px-5 sm:text-xs sm:tracking-[0.2em]"
        >
          <span className="max-w-[62px] leading-tight sm:max-w-none">{label}</span>
          <span className="ml-1 text-white/65 sm:ml-2">→</span>
        </Link>

        <ScoreTicker>
          {games.map((game) => {
            const score = getScore(game);
            const isFinal = mode === "finals";
            const presentation = getGamePresentation(game);
            const showScore = isFinal || presentation.showScore;

            return (
              <Link
                key={game.id}
                href={`/games/${game.id}`}
                className="group flex min-w-max items-center gap-1.5 border-r border-white/10 px-2.5 py-2 transition hover:bg-white/[0.055] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70 sm:gap-2.5 sm:px-4 sm:py-3"
              >
                <span
                  className={`text-[7px] font-black uppercase tracking-[0.12em] sm:text-[9px] sm:tracking-[0.16em] ${
                    isFinal ? "text-white/45" : "text-white/50"
                  }`}
                >
                  {isFinal ? "Final" : presentation.kind === "verified_live" ? liveGameContext(game.score?.period, game.score?.clock) : presentation.kind === "kickoff_window" ? "Kickoff window" : game.displayStatus}
                </span>

                <span className="text-[11px] font-black text-white sm:text-sm">
                  {game.awayTeam ?? "Away"}
                </span>

                {showScore && score.away !== undefined ? (
                  <span className="min-w-4 text-center text-xs font-black tabular-nums text-white sm:min-w-5 sm:text-base">
                    {score.away}
                  </span>
                ) : null}

                <span className="text-[7px] font-black uppercase tracking-[0.08em] text-white/25 sm:text-[9px] sm:tracking-[0.1em]">
                  {showScore ? "—" : "at"}
                </span>

                {showScore && score.home !== undefined ? (
                  <span className="min-w-4 text-center text-xs font-black tabular-nums text-white sm:min-w-5 sm:text-base">
                    {score.home}
                  </span>
                ) : null}

                <span className="text-[11px] font-black text-white sm:text-sm">
                  {game.homeTeam ?? "Home"}
                </span>

                {game.districtGame && (
                  <span className="ml-0.5 hidden text-[8px] font-black uppercase tracking-[0.12em] text-white/35 sm:inline sm:text-[9px]">
                    District
                  </span>
                )}
              </Link>
            );
          })}
        </ScoreTicker>
      </div>
    </section>
  );
}
