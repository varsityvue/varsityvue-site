import { normalizeGameStatus } from "@/lib/games";
import { clearInheritedSchoolBroadcasts } from "@/data/school-broadcasts";
import { getScoreAttribution, type PublicScoreState } from "@/lib/public-score-state";
import type { Game } from "@/types/platform";

export function applyGameState(game: Game, state?: PublicScoreState): Game {
  if (!state?.verified || state.game_id !== game.id) return game;
  const completeScore = typeof state.home_score === "number" && typeof state.away_score === "number";
  const exceptional = state.result_type === "forfeit" || state.result_type === "no_contest";
  // An incomplete score payload cannot replace or splice into a reviewed final.
  // Complete verified corrections and explicit status/outcome changes retain priority.
  if (game.status === "final" && game.publicScoreVerified && (["scheduled", "upcoming"].includes(state.status) || (["live", "final"].includes(state.status) && !completeScore)) && !exceptional) return game;

  const hasScore =
    typeof state.home_score === "number" &&
    typeof state.away_score === "number";

  const dynamicGame: Game = {
    ...game,
    status: state.status,
    scoreAttribution: getScoreAttribution(state),
    publicScoreVerified: true,
    kickoff: state.kickoff_override ?? game.kickoff,
    date: state.kickoff_override ? state.kickoff_override.slice(0, 10) : game.date,
    sourceStatus: state.verified ? "verified" : game.sourceStatus,
    homeScore: state.home_score ?? game.homeScore,
    awayScore: state.away_score ?? game.awayScore,
    resultType: state.result_type ?? game.resultType,
    officialWinnerSchoolSlug:
      state.official_winner_school_slug ?? game.officialWinnerSchoolSlug,
    score: hasScore
      ? {
          home: state.home_score as number,
          away: state.away_score as number,
          period: state.period ?? undefined,
          clock: state.clock ?? undefined,
        }
      : game.score,
  };

  const normalizedGame = normalizeGameStatus(dynamicGame);

  return normalizedGame.status === "upcoming" || normalizedGame.status === "live"
    ? normalizedGame
    : clearInheritedSchoolBroadcasts(normalizedGame);
}

