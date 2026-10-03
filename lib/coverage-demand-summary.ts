import {selectWeeklyGames, type WeeklyGame, type WeeklyParams} from "./unified-games";
import {toDiscoveryGame} from "./game-location";
import {getGamePresentation} from "./game-presentation";
import type { DiscoveryGame } from "@/types/game-location";
import type { CenterSource, GamesNearMeSearchSummary, ZeroResultReason } from "@/types/coverage-demand";
import { coverageBucket, GRID_VERSION, validCoverageBucket } from "./coverage-grid";
import { nearbyGames, NEARBY_RADII, pilotGate, realGame, type DiscoveryFilter } from "./game-discovery";
import { distanceMiles, type GeographicPoint } from "./geo-distance";
import { LOCATION_CATALOG_VERSION, SCHEDULE_CATALOG_VERSION } from "./coverage-catalog-versions";

export const MAX_SUMMARY_BYTES = 2048;
export const SUMMARY_FIELDS = ["schema_version", "grid_version", "coarse_bucket_id", "center_source", "season", "week", "initial_radius_miles", "final_radius_miles", "radius_expansion_steps", "radius_expanded", "filter_scope", "district_only", "additional_filters_present", "current_only", "verified_only", "held_results", "query_present", "week_real_game_count", "week_located_game_count", "week_unlocated_game_count", "in_radius_real_game_count", "in_radius_default_eligible_count", "returned_game_count", "live_game_count", "kickoff_window_game_count", "upcoming_game_count", "final_game_count", "other_game_count", "game_selected", "zero_result_reason", "location_catalog_version", "schedule_catalog_version"] as const;
const counts = ["week_real_game_count", "week_located_game_count", "week_unlocated_game_count", "in_radius_real_game_count", "in_radius_default_eligible_count", "returned_game_count", "live_game_count", "kickoff_window_game_count", "upcoming_game_count", "final_game_count", "other_game_count"] as const;
const reasons: ZeroResultReason[] = ["none", "no_games_in_radius", "status_filter_excluded", "query_filter_excluded", "week_unapproved", "week_location_incomplete", "no_real_games", "other_bounded_case"];

export function validSummary(value: unknown): value is GamesNearMeSearchSummary {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const s = value as GamesNearMeSearchSummary;
  const keys = Object.keys(s);
  if (keys.length !== SUMMARY_FIELDS.length || keys.some(k => !SUMMARY_FIELDS.includes(k as typeof SUMMARY_FIELDS[number]))) return false;
  if (s.schema_version !== 2 || s.grid_version !== GRID_VERSION || !validCoverageBucket(s.coarse_bucket_id)
    || !["browser_location", "school_center"].includes(s.center_source) || s.season !== 2026
    || !Number.isInteger(s.week) || s.week < 1 || s.week > 11
    || !NEARBY_RADII.some(r => r === s.initial_radius_miles) || !NEARBY_RADII.some(r => r === s.final_radius_miles)
    || !Number.isInteger(s.radius_expansion_steps) || s.radius_expansion_steps < 0 || s.radius_expansion_steps > 4
    || typeof s.radius_expanded !== "boolean" || s.radius_expanded !== (s.radius_expansion_steps > 0)
    || (s.final_radius_miles > s.initial_radius_miles && !s.radius_expanded)
    || !["all", "live", "upcoming", "completed"].includes(s.filter_scope)
    || [s.query_present, s.game_selected, s.district_only, s.additional_filters_present, s.current_only, s.verified_only, s.held_results].some(b => typeof b !== "boolean")
    || !reasons.includes(s.zero_result_reason)
    || s.location_catalog_version !== LOCATION_CATALOG_VERSION || s.schedule_catalog_version !== SCHEDULE_CATALOG_VERSION
    || counts.some(k => !Number.isInteger(s[k]) || s[k] < 0 || s[k] > 512)) return false;
  if (s.week_located_game_count + s.week_unlocated_game_count !== s.week_real_game_count
    || s.in_radius_real_game_count > s.week_located_game_count
    || s.in_radius_default_eligible_count !== s.in_radius_real_game_count
    || s.returned_game_count > s.in_radius_real_game_count
    || s.live_game_count + s.kickoff_window_game_count + s.upcoming_game_count + s.final_game_count + s.other_game_count !== s.returned_game_count
    || s.game_selected && s.returned_game_count === 0
    || (s.returned_game_count > 0) !== (s.zero_result_reason === "none")) return false;
  if (!s.held_results && s.filter_scope === "completed" && s.live_game_count + s.kickoff_window_game_count + s.upcoming_game_count !== 0) return false;
  if (!s.held_results && (s.filter_scope === "live" && s.live_game_count !== s.returned_game_count
    || s.filter_scope === "upcoming" && s.upcoming_game_count !== s.returned_game_count)) return false;
  if (!s.held_results && (s.current_only && s.final_game_count !== 0
    || s.verified_only && s.final_game_count !== s.returned_game_count)) return false;
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
  const result = nearbyGames(games, center, radius, week, query, filter).games.filter(g => filter !== "live" || g.livePresentation === "score_available");
  const withoutQuery = nearbyGames(games, center, radius, week, "", filter).games;
  const reason: ZeroResultReason = result.length ? "none" : !slate.length ? "no_real_games"
    : gate.unresolved ? "week_location_incomplete" : !inRadius.length ? "no_games_in_radius"
    : !withoutQuery.length ? "status_filter_excluded" : query.trim() ? "query_filter_excluded" : "other_bounded_case";
  // Explicit allowlist: neither point, query text nor any game identity is copied.
  return { schema_version: 2, grid_version: GRID_VERSION, coarse_bucket_id: bucket, center_source: centerSource,
    season: 2026, week, initial_radius_miles: radius, final_radius_miles: radius, radius_expansion_steps: 0,
    radius_expanded: false, filter_scope: filter === "final" ? "completed" : filter === "district" ? "all" : filter, district_only: filter === "district", additional_filters_present: false, current_only: false, verified_only: false, held_results: false, query_present: Boolean(query.trim()),
    week_real_game_count: slate.length, week_located_game_count: slate.length - gate.unresolved,
    week_unlocated_game_count: gate.unresolved, in_radius_real_game_count: inRadius.length,
    in_radius_default_eligible_count: inRadius.length,
    returned_game_count: result.length, live_game_count: result.filter(g => g.status === "live" && g.livePresentation === "score_available").length,
    kickoff_window_game_count: result.filter(g => g.status === "live" && g.livePresentation === "kickoff_inferred").length,
    upcoming_game_count: result.filter(g => g.status === "upcoming").length, final_game_count: result.filter(g => g.status === "final").length,
    other_game_count: 0, game_selected: false, zero_result_reason: reason, location_catalog_version: LOCATION_CATALOG_VERSION,
    schedule_catalog_version: SCHEDULE_CATALOG_VERSION };
}

// Shared weekly renderer's actual results, including rows held during score refresh.
// Modifier presence is bounded; classification text and followed school identities never leave memory.
export function buildWeeklySearchSummary(games: readonly WeeklyGame[], center: GeographicPoint, source: CenterSource,
  params: WeeklyParams, followed: ReadonlySet<string>, now: Date, displayed: readonly WeeklyGame[], held = false): GamesNearMeSearchSummary | null {
  const discovery = games.map(g => toDiscoveryGame(g, g.locationInfo));
  const base = buildSearchSummary(discovery, center, source, Number(params.week), params.radius, "", "all");
  if (!base || params.mode !== "nearby" || params.season !== "2026") return null;
  const kinds = displayed.map(g => getGamePresentation(g, now).kind);
  const withoutQuery = selectWeeklyGames(games, {...params, q: ""}, followed, now, center);
  const reason: ZeroResultReason = displayed.length ? "none" : !base.in_radius_real_game_count ? "no_games_in_radius"
    : withoutQuery.length && params.q ? "query_filter_excluded" : "other_bounded_case";
  return {...base, filter_scope: params.filter, district_only: params.district,
    additional_filters_present: Boolean(params.classification || params.following), current_only: params.current,
    verified_only: params.verified, held_results: held, query_present: Boolean(params.q), returned_game_count: displayed.length,
    live_game_count: kinds.filter(k => k === "verified_live").length,
    kickoff_window_game_count: kinds.filter(k => k === "kickoff_window").length,
    upcoming_game_count: kinds.filter(k => k === "scheduled").length,
    final_game_count: kinds.filter(k => k === "verified_final" || k === "verified_exceptional").length,
    other_game_count: kinds.filter(k => ["awaiting_verification", "postponed", "cancelled"].includes(k)).length,
    zero_result_reason: reason};
}
