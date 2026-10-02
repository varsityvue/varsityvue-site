export type PickemReportingWeek = {
  week: number;
  configured: boolean;
  status: string;
  game_count: number;
  required_game_count: number;
  valid_accepted_entries: number;
  disqualified_entries: number;
  prize_dollars: number | null;
  prize_state: "not_applicable" | "provisional" | "finalized" | "under_review";
  finalized_at: string | null;
  outstanding_draft_users: number;
  any_selection_users: number;
  complete_selection_users: number;
  complete_without_valid_entry: number;
};

export type PickemRetentionPair = {
  previous_week: number;
  current_week: number;
  previous_valid_cohort: number;
  repeat_valid_entries: number;
  measurable: boolean;
  finalized: boolean;
  repeat_rate_pct: number | null;
};

export type PickemConversionReport = {
  generated_at: string;
  season: number;
  summary: {
    unique_valid_participants: number;
    total_valid_entries: number;
    average_entries_per_participant: number | null;
    currently_following: number;
    no_current_follows: number;
    follow_adoption_pct: number | null;
    surviving_follow_before_or_at_first_entry: number;
    earliest_surviving_follow_after_first_entry: number;
  };
  weeks: PickemReportingWeek[];
  retention: PickemRetentionPair[];
};

export function retentionRateLabel(pair: PickemRetentionPair) {
  return pair.measurable && pair.repeat_rate_pct !== null
    ? `${pair.repeat_rate_pct.toFixed(1)}%`
    : "Not yet measurable";
}

export function reportingPrizeLabel(week: PickemReportingWeek) {
  if (week.prize_dollars === null || week.prize_state === "not_applicable") return "Not applicable";
  const label = week.prize_state === "finalized" ? "Finalized"
    : week.prize_state === "under_review" ? "Under review" : "Provisional";
  return `$${week.prize_dollars} · ${label}`;
}
