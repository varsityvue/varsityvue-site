import type { DiscoveryGame } from "@/types/game-location";
import type { CenterSource, GamesNearMeSearchSummary, ZeroResultReason } from "@/types/coverage-demand";
import { coverageBucket, GRID_VERSION, validCoverageBucket } from "./coverage-grid";
import { nearbyGames, NEARBY_RADII, pilotGate, realGame, type DiscoveryFilter } from "./game-discovery";
import { distanceMiles, type GeographicPoint } from "./geo-distance";
import { LOCATION_CATALOG_VERSION, SCHEDULE_CATALOG_VERSION } from "./coverage-catalog-versions";

export const MAX_SUMMARY_BYTES = 2048;
export const SUMMARY_FIELDS = ["schema_version", "grid_version", "coarse_bucket_id", "center_source", "season", "week", "initial_radius_miles", "final_radius_miles", "radius_expansion_steps", "radius_expanded", "filter_scope", "query_present", "week_real_game_count", "week_located_game_count", "week_unlocated_game_count", "in_radius_real_game_count", "in_radius_default_eligible_count", "returned_game_count", "live_game_count", "kickoff_window_game_count", "upcoming_game_count", "final_game_count", "game_selected", "zero_result_reason", "location_catalog_version", "schedule_catalog_version"] as const;
const counts = ["week_real_game_count", "week_located_game_count", "week_unlocated_game_count", "in_radius_real_game_count", "in_radius_default_eligible_count", "returned_game_count", "live_game_count", "kickoff_window_game_count", "upcoming_game_count", "final_game_count"] as const;
const reasons: ZeroResultReason[] = ["none", "no_games_in_radius", "status_filter_excluded", "query_filter_excluded", "week_unapproved", "week_location_incomplete", "no_real_games", "other_bounded_case"];

export function validSummary(value: unknown): value is GamesNearMeSearchSummary {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const s = value as GamesNearMeSearchSummary;
  const keys = Object.keys(s);
  if (keys.length !== SUMMARY_FIELDS.length || keys.some(k => !SUMMARY_FIELDS.includes(k as typeof SUMMARY_FIELDS[number]))) return false;
  if (s.schema_version !== 1 || s.grid_version !== GRID_VERSION || !validCoverageBucket(s.coarse_bucket_id)
    || !["browser_location", "school_center"].includes(s.center_source) || s.season !== 2026
    || !Number.isInteger(s.week) || s.week < 1 || s.week > 11
    || !NEARBY_RADII.some(r => r === s.initial_radius_miles) || !NEARBY_RADII.some(r => r === s.final_radius_miles)
    || !Number.isInteger(s.radius_expansion_steps) || s.radius_expansion_steps < 0 || s.radius_expansion_steps > 4
    || typeof s.radius_expanded !== "boolean" || s.radius_expanded !== (s.radius_expansion_steps > 0)
    || (s.final_radius_miles > s.initial_radius_miles && !s.radius_expanded)
    || !["all", "live", "upcoming", "final", "district"].includes(s.filter_scope)
    || [s.query_present, s.game_selected].some(b => typeof b !== "boolean")
    || !reasons.includes(s.zero_result_reason)
    || s.location_catalog_version !== LOCATION_CATALOG_VERSION || s.schedule_catalog_version !== SCHEDULE_CATALOG_VERSION
    || counts.some(k => !Number.isInteger(s[k]) || s[k] < 0 || s[k] > 512)) return false;
  if (s.week_located_game_count + s.week_unlocated_game_count !== s.week_real_game_count
    || s.in_radius_real_game_count > s.week_located_game_count
    || s.in_radius_default_eligible_count > s.in_radius_real_game_count
    || s.returned_game_count > s.in_radius_real_game_count
    || s.live_game_count + s.kickoff_window_game_count + s.upcoming_game_count + s.final_game_count !== s.returned_game_count
    || s.game_selected && s.returned_game_count === 0
    || (s.returned_game_count > 0) !== (s.zero_result_reason === "none")) return false;
  if (s.filter_scope === "final" ? s.final_game_count !== s.returned_game_count : s.final_game_count !== 0) return false;
  if (s.filter_scope !== "final" && s.returned_game_count > s.in_radius_default_eligible_count
    || s.filter_scope === "live" && s.live_game_count + s.kickoff_window_game_count !== s.returned_game_count
    || s.filter_scope === "upcoming" && s.upcoming_game_count !== s.returned_game_count) return false;
  if (s.zero_result_reason === "no_real_games" && s.week_real_game_count !== 0
    || s.zero_result_reason === "no_games_in_radius" && (s.in_radius_real_game_count !== 0 || s.week_unlocated_game_count !== 0 || s.week_real_game_count === 0)
    || s.zero_result_reason === "query_filter_excluded" && (!s.query_present || s.in_radius_real_game_count === 0)
    || s.zero_result_reason === "status_filter_excluded" && s.in_radius_real_game_count === 0
    || s.zero_result_reason === "week_location_incomplete" && s.week_unlocated_game_count === 0) return false;
  return true;
}
export function buildSearchSummary(games: readonly DiscoveryGame[], center: GeographicPoint, centerSource: CenterSource,
  week: number, radius: number, query: string, filter: DiscoveryFilter): GamesNearMeSearchSummary | null {
  const bucket = coverageBucket(center), gate = pilotGate(games, week);
  if (!bucket || !gate.enabled) return null;
  const slate = games.filter(g => g.season === 2026 && g.week === week && realGame(g));
  const inRadius = slate.filter(g => g.location.locationQuality === "verified" && distanceMiles(center, g.location) <= radius);
  const result = nearbyGames(games, center, radius, week, query, filter).games;
  const withoutQuery = nearbyGames(games, center, radius, week, "", filter).games;
  const reason: ZeroResultReason = result.length ? "none" : !slate.length ? "no_real_games"
    : gate.unresolved ? "week_location_incomplete" : !inRadius.length ? "no_games_in_radius"
    : !withoutQuery.length ? "status_filter_excluded" : query.trim() ? "query_filter_excluded" : "other_bounded_case";
  // Explicit allowlist: neither point, query text nor any game identity is copied.
  return { schema_version: 1, grid_version: GRID_VERSION, coarse_bucket_id: bucket, center_source: centerSource,
    season: 2026, week, initial_radius_miles: radius, final_radius_miles: radius, radius_expansion_steps: 0,
    radius_expanded: false, filter_scope: filter, query_present: Boolean(query.trim()),
    week_real_game_count: slate.length, week_located_game_count: slate.length - gate.unresolved,
    week_unlocated_game_count: gate.unresolved, in_radius_real_game_count: inRadius.length,
    in_radius_default_eligible_count: inRadius.filter(g => g.status === "live" || g.status === "upcoming").length,
    returned_game_count: result.length, live_game_count: result.filter(g => g.status === "live" && g.livePresentation === "score_available").length,
    kickoff_window_game_count: result.filter(g => g.status === "live" && g.livePresentation === "kickoff_inferred").length,
    upcoming_game_count: result.filter(g => g.status === "upcoming").length, final_game_count: result.filter(g => g.status === "final").length,
    game_selected: false, zero_result_reason: reason, location_catalog_version: LOCATION_CATALOG_VERSION,
    schedule_catalog_version: SCHEDULE_CATALOG_VERSION };
}
