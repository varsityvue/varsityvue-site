export type StatAvailability = "verified" | "partial" | "pending" | "unavailable";

export type GameStatAvailability = {
  status: StatAvailability;
  note?: string;
};

const DEFAULT_PENDING_NOTE =
  "Verified individual statistics have not yet been made available. VarsityVue adds game statistics as reliable data is received.";

export const gameStatAvailability: Record<string, GameStatAvailability> = {
  "cisco-at-hawley-2026-week-8": { status: "pending", note: "Quarter scores are available. Cisco's Week 8 team and player statistics have not yet been provided; no Hawley offensive statistics were included in this batch." },
  "goldthwaite-at-albany-2026-week-8": { status: "pending", note: "Quarter scores are available. Week 8 team and player statistics are still needed from Albany and Goldthwaite." },

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
  "holland-at-hico-2026-week-1": {
    status: "pending",
    note: DEFAULT_PENDING_NOTE,
  },
  "cross-plains-at-hico-2026-week-2": {
    status: "pending",
    note: DEFAULT_PENDING_NOTE,
  },
  "hico-at-moody-2026-week-3": {
    status: "pending",
    note: DEFAULT_PENDING_NOTE,
  },
  "stamford-at-hawley-2026-week-3": {
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
