import { publicKeys } from "./games-route-compatibility";
export { publicKeys, scoresDestination } from "./games-route-compatibility";
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
const completed = new Set([
  "verified_final",
  "verified_exceptional",
  "cancelled",
]);
const scalar = (v: string | string[] | undefined) =>
  typeof v === "string" ? v : "";
const statusFilters = ["all", "live", "upcoming", "completed"] as const;
function isStatusFilter(value: string): value is WeeklyParams["filter"] {
  return statusFilters.some((filter) => filter === value);
}
// Legacy scopes remain independent intersections, not approximate modern statuses.
export function weeklyStatusValue(p: WeeklyParams) {
  return p.current || p.verified
    ? `legacy-${p.filter}${p.current ? "-current" : ""}${p.verified ? "-verified" : ""}`
    : p.filter;
}
export function weeklyStatusLabel(p: WeeklyParams) {
  const scopes: string[] = [];
  if (p.filter !== "all" && !(p.filter === "completed" && p.verified))
    scopes.push(p.filter === "live" ? "LIVE" : p.filter === "upcoming" ? "Upcoming" : "Completed");
  if (p.verified) scopes.push("verified finals only");
  if (p.current) scopes.push("current and unresolved games");
  return scopes.join(" + ");
}
export function applyWeeklyStatus(p: WeeklyParams, value: string) {
  return isStatusFilter(value)
    ? { filter: value, current: false, verified: false }
    : { filter: p.filter, current: p.current, verified: p.verified };
}
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
  const explicitStatus = isStatusFilter(filterValue);
  // Self-contained form value: native GET can retain a scope without hidden
  // state/result fields that would survive an explicit modern selection.
  const legacyStatus = /^legacy-(all|live|upcoming|completed)(-current)?(-verified)?$/.exec(filterValue);
  const legacyFilter = legacyStatus?.[1] ?? "";
  const status = scalar(raw.status);
  const view = scalar(raw.view);
  const filter: WeeklyParams["filter"] = explicitStatus
    ? filterValue
    : isStatusFilter(legacyFilter)
      ? legacyFilter
      : view !== "current" && (status === "final" || view === "completed")
        ? "completed"
        : "all";
  const current =
    !explicitStatus && (scalar(raw.state) === "current" || Boolean(legacyStatus?.[2]) ||
      (!filterValue &&
        view !== "completed" &&
        ["upcoming", "district"].includes(status)) ||
      (!filterValue && view === "current"));
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
      !explicitStatus && (scalar(raw.result) === "verified" || Boolean(legacyStatus?.[3]) ||
        (!filterValue && status === "final" && view !== "current")),
    intent,
  };
}
export function weeklyUrl(
  p: WeeklyParams,
  updates: Partial<WeeklyParams> = {},
  route: "/games" | "/scoreboard" = "/games",
) {
  const n = { ...p, ...updates, ...(updates.filter ? applyWeeklyStatus(p, updates.filter) : {}) };
  const q = new URLSearchParams();
  q.set("season", n.season);
  q.set("week", n.week);
  if (n.q) q.set("q", n.q);
  if (n.filter !== "all" || n.current || n.verified) q.set("filter", weeklyStatusValue(n));
  if (n.mode !== "all") q.set("mode", n.mode);
  if (n.classification) q.set("classification", n.classification);
  if (n.district) q.set("district", "1");
  if (n.following) q.set("following", "1");
  if (n.radius !== 50) q.set("radius", String(n.radius));
  if (n.current) q.set("state", "current");
  if (n.verified) q.set("result", "verified");
  if (n.intent) q.set("intent", "scores");
  return `${route}?${q}`;
}
export function safeGamesReturn(value: unknown, fallback = "/games") {
  if (
    typeof value !== "string" ||
    !(value.startsWith("/games?") || value.startsWith("/scoreboard?")) ||
    value.includes("\\")
  )
    return fallback;
  try {
    const url = new URL(value, "https://varsityvue.com");
    if (url.origin !== "https://varsityvue.com" || !["/games", "/scoreboard"].includes(url.pathname))
      return fallback;
    const raw = Object.fromEntries(url.searchParams);
    const q = new URLSearchParams();
    for (const key of publicKeys)
      if (raw[key]) q.set(key, raw[key].slice(0, key === "q" ? 200 : 80));
    return `${url.pathname}?${q}`;
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
        (completed.has(getGamePresentation(a.game, now).kind) &&
        completed.has(getGamePresentation(b.game, now).kind)
          ? -1
          : 1) *
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
  const first = format(dates[0]), last = format(dates.at(-1)!);
  return first === last ? first : `${first} – ${last}`;
}
