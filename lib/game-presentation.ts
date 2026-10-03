import type { Game } from "@/types/platform";

export type GamePresentationKind =
  | "scheduled"
  | "kickoff_window"
  | "verified_live"
  | "awaiting_verification"
  | "verified_final"
  | "postponed"
  | "cancelled"
  | "verified_exceptional";

export type GamePresentation = {
  kind: GamePresentationKind;
  label: string;
  authoritativeLive: boolean;
  authoritativeScore: boolean;
  showScore: boolean;
};

const KICKOFF_WINDOW_MS = 4 * 60 * 60 * 1000;
const CENTRAL_TIME_ZONE = "America/Chicago";

function exactKickoffTimestamp(game: Pick<Game, "kickoff">): number | null {
  if (!game.kickoff?.includes("T")) return null;
  const timestamp = new Date(game.kickoff).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function centralDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: CENTRAL_TIME_ZONE,
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return year && month && day ? `${year}-${month}-${day}` : "";
}

function hasNumericScore(game: Pick<Game, "homeScore" | "awayScore" | "score">) {
  const home = game.homeScore ?? game.score?.home;
  const away = game.awayScore ?? game.score?.away;
  return typeof home === "number" && typeof away === "number";
}

function isExceptionalFinal(game: Pick<Game, "resultType">) {
  return game.resultType === "forfeit" || game.resultType === "no_contest";
}

export function getGamePresentation(game: Game, now = new Date()): GamePresentation {
  if (game.status === "postponed") {
    return { kind: "postponed", label: "Postponed", authoritativeLive: false, authoritativeScore: false, showScore: false };
  }
  if (game.status === "cancelled") {
    return { kind: "cancelled", label: "Cancelled", authoritativeLive: false, authoritativeScore: false, showScore: false };
  }
  if (game.status === "final") {
    const exceptional = isExceptionalFinal(game);
    const score = hasNumericScore(game);
    return {
      kind: exceptional ? "verified_exceptional" : "verified_final",
      label: exceptional ? "FINAL · verified outcome" : "FINAL · verified",
      authoritativeLive: false,
      authoritativeScore: score && !exceptional,
      showScore: score && !exceptional,
    };
  }

  const score = hasNumericScore(game);
  if (game.status === "live" && game.publicScoreVerified === true) {
    return {
      kind: "verified_live",
      label: score ? "LIVE · verified score" : "LIVE · verified status",
      authoritativeLive: true,
      authoritativeScore: score,
      showScore: score,
    };
  }

  const exactKickoff = exactKickoffTimestamp(game);
  if (exactKickoff !== null) {
    const elapsed = now.getTime() - exactKickoff;
    if (elapsed >= 0 && elapsed <= KICKOFF_WINDOW_MS) {
      return {
        kind: "kickoff_window",
        label: "Kickoff window · live score unavailable",
        authoritativeLive: false,
        authoritativeScore: false,
        showScore: false,
      };
    }
    if (elapsed > KICKOFF_WINDOW_MS || game.status === "scheduled") {
      return {
        kind: "awaiting_verification",
        label: "Result awaiting verification",
        authoritativeLive: false,
        authoritativeScore: false,
        showScore: false,
      };
    }
  }

  if (game.status === "scheduled") {
    return {
      kind: "awaiting_verification",
      label: "Result awaiting verification",
      authoritativeLive: false,
      authoritativeScore: false,
      showScore: false,
    };
  }

  if (game.kickoff && !game.kickoff.includes("T")) {
    const today = centralDateKey(now);
    if (today && game.kickoff < today) {
      return {
        kind: "awaiting_verification",
        label: "Result awaiting verification",
        authoritativeLive: false,
        authoritativeScore: false,
        showScore: false,
      };
    }
  }

  return {
    kind: "scheduled",
    label: "Upcoming",
    authoritativeLive: false,
    authoritativeScore: false,
    showScore: false,
  };
}

export function isVerifiedLiveGame(game: Game, now = new Date()) {
  return getGamePresentation(game, now).kind === "verified_live";
}
