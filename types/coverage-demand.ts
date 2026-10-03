export type CoverageChoice = "enabled" | "disabled" | null;
export type CenterSource = "browser_location" | "school_center";
export type ZeroResultReason = "none" | "no_games_in_radius" | "status_filter_excluded" | "query_filter_excluded" | "week_unapproved" | "week_location_incomplete" | "no_real_games" | "other_bounded_case";
export type GamesNearMeSearchSummary = {
  schema_version: 1; grid_version: "tx25-v1"; coarse_bucket_id: string; center_source: CenterSource;
  season: number; week: number; initial_radius_miles: number; final_radius_miles: number;
  radius_expansion_steps: number; radius_expanded: boolean;
  filter_scope: "all" | "live" | "upcoming" | "final" | "district"; query_present: boolean;
  week_real_game_count: number; week_located_game_count: number; week_unlocated_game_count: number;
  in_radius_real_game_count: number; in_radius_default_eligible_count: number; returned_game_count: number;
  live_game_count: number; upcoming_game_count: number; final_game_count: number;
  game_selected: boolean; zero_result_reason: ZeroResultReason;
  location_catalog_version: string; schedule_catalog_version: string;
};
