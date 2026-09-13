export type StatAvailability = "verified" | "partial" | "pending" | "unavailable";

export type GameStatAvailability = {
  status: StatAvailability;
  note?: string;
};

const DEFAULT_PENDING_NOTE =
  "Verified individual statistics have not yet been made available. VarsityVue adds game statistics as reliable data is received.";

export const gameStatAvailability: Record<string, GameStatAvailability> = {
  "santo-at-chilton-2026-week-1": {
    status: "pending",
    note: DEFAULT_PENDING_NOTE,
  },
  "santo-at-dublin-2026-week-2": {
    status: "pending",
    note: DEFAULT_PENDING_NOTE,
  },
  "haskell-at-santo-2026-week-3": {
    status: "pending",
    note: DEFAULT_PENDING_NOTE,
  },
};

export function getGameStatAvailability(gameId: string): GameStatAvailability | undefined {
  return gameStatAvailability[gameId];
}

export function getStatAvailabilityLabel(status: StatAvailability) {
  if (status === "verified") return "Stats Verified";
  if (status === "partial") return "Partial Stats";
  if (status === "pending") return "Stats Pending";
  return "Stats Unavailable";
}
