import type { Game } from "@/types/platform";
import type { GameLocation } from "@/types/game-location";
import { getGamePresentation } from "./game-presentation";
import { currentScheduleWeek } from "./game-discovery";
import { toDiscoveryGame } from "./game-location";
import { distanceMiles, type GeographicPoint } from "./geo-distance";

export type WeeklyGame = Game & {
  classification: string;
  searchText: string;
  locationInfo: GameLocation;
  winnerName?: string;
  previewHref?: string;
  recordLabel?: string;
  statsLabel?: string;
};
export type WeeklyParams = {
  season: string;
  week: string;
  q: string;
  filter: "all" | "live" | "upcoming" | "completed";
  mode: "all" | "nearby";
  classification: string;
  district: boolean;
  following: boolean;
  radius: number;
  current: boolean;
  verified: boolean;
  intent: boolean;
};
export const publicKeys = [
  "season",
  "week",
  "q",
  "filter",
  "mode",
  "classification",
  "district",
  "following",
  "radius",
  "state",
  "result",
  "intent",
  "status",
  "view",
] as const;
const completed = new Set([
  "verified_final",
  "verified_exceptional",
  "cancelled",
]);
const scalar = (v: string | string[] | undefined) =>
  typeof v === "string" ? v : "";
export function parseWeeklyParams(
  raw: Record<string, string | string[] | undefined>,
  games: readonly WeeklyGame[],
  now = new Date(),
): WeeklyParams {
  const season = /^\d{4}$/.test(scalar(raw.season))
    ? scalar(raw.season)
    : String(Math.max(...games.map((g) => g.season)));
  const slate = games.filter(
    (g) => String(g.season) === season && g.gameType !== "bye",
  );
  const filterValue = scalar(raw.filter);
  const status = scalar(raw.status);
  const view = scalar(raw.view);
  const filter: WeeklyParams["filter"] = [
    "all",
    "live",
    "upcoming",
    "completed",
  ].includes(filterValue)
    ? (filterValue as WeeklyParams["filter"])
    : view !== "current" && (status === "final" || view === "completed")
      ? "completed"
      : "all";
  const current =
    scalar(raw.state) === "current" ||
    (!filterValue &&
      view !== "completed" &&
      ["upcoming", "district"].includes(status)) ||
    (!filterValue && view === "current");
  const q = scalar(raw.q).trim().slice(0, 200);
  const requested = scalar(raw.week);
  const explicit = requested === "all" || /^\d{1,2}$/.test(requested);
  const byTime = [...slate].sort(
    (a, b) =>
      (Date.parse(a.kickoff ?? "") || Infinity) -
      (Date.parse(b.kickoff ?? "") || Infinity),
  );
  const intent = scalar(raw.intent) === "scores";
  const live = byTime.find(
    (g) => getGamePresentation(g, now).authoritativeLive,
  );
  const finals = [...byTime]
    .reverse()
    .find((g) =>
      ["verified_final", "verified_exceptional"].includes(
        getGamePresentation(g, now).kind,
      ),
    );
  const upcoming = byTime.find(
    (g) => getGamePresentation(g, now).kind === "scheduled",
  );
  const currentWeek = currentScheduleWeek(
    slate.map((g) => toDiscoveryGame(g, g.locationInfo)),
    now,
  );
  const legacyArchive =
    !!q ||
    status === "final" ||
    status === "upcoming" ||
    status === "district" ||
    view === "completed" ||
    view === "current";
  const week = explicit
    ? requested
    : legacyArchive
      ? "all"
      : String(
          (intent
            ? (live ?? finals ?? upcoming)?.week
            : (currentWeek ?? upcoming?.week ?? byTime.at(-1)?.week)) ?? "all",
        );
  return {
    season,
    week,
    q,
    filter,
    mode: scalar(raw.mode) === "nearby" ? "nearby" : "all",
    classification: scalar(raw.classification).slice(0, 80),
    district: scalar(raw.district) === "1" || status === "district",
    following: scalar(raw.following) === "1",
    radius: [10, 25, 50, 100, 150].includes(Number(scalar(raw.radius)))
      ? Number(scalar(raw.radius))
      : 50,
    current,
    verified:
      scalar(raw.result) === "verified" ||
      (!filterValue && status === "final" && view !== "current"),
    intent,
  };
}
export function weeklyUrl(
  p: WeeklyParams,
  updates: Partial<WeeklyParams> = {},
) {
  const n = { ...p, ...updates };
  const q = new URLSearchParams();
  q.set("season", n.season);
  q.set("week", n.week);
  if (n.q) q.set("q", n.q);
  if (n.filter !== "all") q.set("filter", n.filter);
  if (n.mode !== "all") q.set("mode", n.mode);
  if (n.classification) q.set("classification", n.classification);
  if (n.district) q.set("district", "1");
  if (n.following) q.set("following", "1");
  if (n.radius !== 50) q.set("radius", String(n.radius));
  if (n.current) q.set("state", "current");
  if (n.verified) q.set("result", "verified");
  if (n.intent) q.set("intent", "scores");
  return `/games?${q}`;
}
export function scoresDestination(
  raw: Record<string, string | string[] | undefined>,
) {
  const q = new URLSearchParams();
  for (const key of publicKeys) {
    const v = scalar(raw[key]);
    if (v) q.set(key, v.slice(0, key === "q" ? 200 : 80));
  }
  q.set("intent", "scores");
  return `/games?${q}`;
}
export function safeGamesReturn(value: unknown, fallback = "/games") {
  if (
    typeof value !== "string" ||
    !value.startsWith("/games?") ||
    value.includes("\\")
  )
    return fallback;
  try {
    const url = new URL(value, "https://varsityvue.com");
    if (url.origin !== "https://varsityvue.com" || url.pathname !== "/games")
      return fallback;
    const raw = Object.fromEntries(url.searchParams);
    const q = new URLSearchParams();
    for (const key of publicKeys)
      if (raw[key]) q.set(key, raw[key].slice(0, key === "q" ? 200 : 80));
    return `/games?${q}`;
  } catch {
    return fallback;
  }
}
export function isFollowed(g: Game, followed: ReadonlySet<string>) {
  return (
    followed.has(g.homeSchoolSlug ?? "") || followed.has(g.awaySchoolSlug ?? "")
  );
}
export function selectWeeklyGames(
  games: readonly WeeklyGame[],
  p: WeeklyParams,
  followed: ReadonlySet<string>,
  now = new Date(),
  center?: GeographicPoint | null,
) {
  const unique = [...new Map(games.map((g) => [g.id, g])).values()];
  const rows = unique
    .filter(
      (g) =>
        g.gameType !== "bye" &&
        String(g.season) === p.season &&
        (p.week === "all" || String(g.week) === p.week),
    )
    .flatMap((game) => {
      const kind = getGamePresentation(game, now).kind;
      if (
        (p.current && completed.has(kind)) ||
        (p.verified &&
          !["verified_final", "verified_exceptional"].includes(kind))
      )
        return [];
      if (
        (p.filter === "live" && kind !== "verified_live") ||
        (p.filter === "upcoming" && kind !== "scheduled") ||
        (p.filter === "completed" && !completed.has(kind))
      )
        return [];
      if (
        (p.district && !game.districtGame) ||
        (p.classification && game.classification !== p.classification) ||
        (p.following && !isFollowed(game, followed)) ||
        !game.searchText.includes(p.q.toLowerCase())
      )
        return [];
      if (p.mode === "nearby") {
        if (
          !center ||
          game.gameType === "scrimmage" ||
          game.locationInfo.locationQuality !== "verified"
        )
          return [];
        const distance = distanceMiles(center, game.locationInfo);
        return distance <= p.radius ? [{ game, distance }] : [];
      }
      return [{ game, distance: undefined as number | undefined }];
    });
  const order = [
    "verified_live",
    "kickoff_window",
    "scheduled",
    "awaiting_verification",
    "postponed",
    "verified_final",
    "verified_exceptional",
    "cancelled",
  ];
  rows.sort((a, b) =>
    p.mode === "nearby"
      ? a.distance! - b.distance! || a.game.id.localeCompare(b.game.id)
      : order.indexOf(getGamePresentation(a.game, now).kind) -
          order.indexOf(getGamePresentation(b.game, now).kind) ||
        (p.filter === "completed" ? -1 : 1) *
          ((Date.parse(a.game.kickoff ?? "") || 0) -
            (Date.parse(b.game.kickoff ?? "") || 0)) ||
        a.game.id.localeCompare(b.game.id),
  );
  return rows;
}
export function weekDateLabel(
  games: readonly Game[],
  season: string,
  week: string,
) {
  const dates = games
    .filter((g) => String(g.season) === season && String(g.week) === week)
    .flatMap((g) => (g.kickoff ? [g.kickoff] : []))
    .sort();
  if (!dates.length)
    return week === "all" ? "Season archive" : "No scheduled dates";
  const format = (s: string) =>
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      timeZone: s.includes("T") ? "America/Chicago" : "UTC",
    }).format(new Date(s.includes("T") ? s : s + "T12:00:00Z"));
  return `${format(dates[0])} – ${format(dates.at(-1)!)}`;
}
