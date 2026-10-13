import type { SupabaseClient } from "@supabase/supabase-js";
import type { OwnPickemSummary, PublicSeasonStanding, PublicWeekStanding } from "@/lib/public-read-contracts";

export type PickemWeek = { id: string; season: number; week: number; title: string; status: string;
  closes_at: string; tiebreaker_game_id: string | null; entry_deadline_at: string | null; presenting_sponsor_name: string | null };
export type PickemCard = { id: string; game_id: string; sort_order: number; lock_at: string;
  away_school_slug: string; home_school_slug: string; is_locked: boolean };
export type MemberPick = { pickem_game_id: string; picked_school_slug: string; is_correct: boolean | null; submitted_at: string };
export type MemberEntry = { completed_at: string; status: string };
export type HistoryGame = { id: string; game_id: string; week_id: string; result_winner_school_slug: string | null; graded_at: string | null };
export type HistoryWeek = { id: string; season: number; week: number; title: string; status: string };
export class PickemReadUnavailable extends Error {
  constructor() { super("Pick ’Em information is temporarily unavailable. Your saved entries have not been changed."); }
}

// Scope this object to a single render/recovery. Queued thenables do not start a request.
// At most four reads, including optional sections, run concurrently.
export function createPickemReadScope(client: SupabaseClient, maxConcurrent = 4) {
  let active = 0;
  const queue: Array<() => void> = [];
  async function run<T>(query: PromiseLike<{ data: T; error: unknown }>): Promise<T> {
    if (active >= maxConcurrent) await new Promise<void>(resolve => queue.push(resolve));
    else active++;
    try {
      const result = await query;
      if (result.error) throw new PickemReadUnavailable();
      return result.data;
    } catch { throw new PickemReadUnavailable(); }
    finally { const next = queue.shift(); if (next) next(); else active--; }
  }
  // The client must have a bounded READ-only fetch. Never use it for mutations.
  const read = <T>(query: PromiseLike<{ data: T; error: unknown }> & { retry(enabled: boolean): PromiseLike<{ data: T; error: unknown }> }) =>
    run(query.retry(false));
  return { client, read };
}
export type PickemReadScope = ReturnType<typeof createPickemReadScope>;

export async function loadPickemWeek({ client, read }: PickemReadScope) {
  return await read(client.from("pickem_weeks")
    .select("id,season,week,title,status,closes_at,tiebreaker_game_id,entry_deadline_at,presenting_sponsor_name")
    .in("status", ["open", "locked", "graded"]).order("season", { ascending: false })
    .order("week", { ascending: false }).limit(1).maybeSingle()) as PickemWeek | null;
}
export function isContestWeek(week: PickemWeek | null) {
  return Boolean(week && (week.season > 2026 || (week.season === 2026 && week.week >= 6)));
}

export async function loadPickemCore(scope: PickemReadScope, week: PickemWeek, userId?: string) {
  const { client, read } = scope;
  const contest = isContestWeek(week);
  const [slateRows, voidGames, memberEntry, memberPrediction] = await Promise.all([
    read(client.from("pickem_game_cards").select("id,game_id,sort_order,lock_at,away_school_slug,home_school_slug,is_locked")
      .eq("week_id", week.id).order("sort_order", { ascending: true })) as Promise<PickemCard[]>,
    contest ? read(client.from("pickem_contest_void_games").select("pickem_game_id,reason").eq("week_id", week.id)) as
      Promise<Array<{ pickem_game_id: string; reason: string }>> : Promise.resolve([]),
    userId && contest ? read(client.from("pickem_contest_entries").select("completed_at,status")
      .eq("week_id", week.id).eq("user_id", userId).maybeSingle()) as Promise<MemberEntry | null> : Promise.resolve(null),
    userId && week.tiebreaker_game_id ? read(client.from("pickem_week_tiebreakers").select("predicted_total")
      .eq("week_id", week.id).eq("user_id", userId).maybeSingle()) as Promise<{ predicted_total: number } | null> : Promise.resolve(null),
  ]);
  // A known week with no usable slate is unavailable, not a nonexistent future contest.
  if (!slateRows?.length || slateRows.some(row => !row.away_school_slug || !row.home_school_slug ||
    !Number.isFinite(Date.parse(row.lock_at)) || typeof row.is_locked !== "boolean")) throw new PickemReadUnavailable();
  const [memberPickRows, draftPicks, draftPrediction] = await Promise.all([
    userId ? read(client.from("pickem_picks").select("pickem_game_id,picked_school_slug,is_correct,submitted_at")
      .eq("user_id", userId).in("pickem_game_id", slateRows.map(row => row.id))) as Promise<MemberPick[]> : Promise.resolve([]),
    userId && contest && !memberEntry ? read(client.rpc("get_pickem_contest_draft", { p_week_id: week.id })) as Promise<Array<{ pickem_game_id: string; picked_school_slug: string }>> : Promise.resolve([]),
    userId && contest && !memberEntry ? read(client.rpc("get_pickem_contest_draft_prediction", { p_week_id: week.id })) as Promise<number | null> : Promise.resolve(null),
  ]);
  return { slateRows, voidGames, memberPickRows, memberPrediction, memberEntry, draftPicks, draftPrediction };
}

export async function loadPickemHistory({ client, read }: PickemReadScope, userId: string, season: number) {
  const [memberPickRows, rawMemberTotal] = await Promise.all([
    read(client.from("pickem_picks").select("pickem_game_id,picked_school_slug,is_correct,submitted_at")
      .eq("user_id", userId).order("submitted_at", { ascending: false })) as Promise<MemberPick[]>,
    read(client.rpc("own_pickem_season_summary", { p_season: season }).maybeSingle()) as Promise<OwnPickemSummary | null>,
  ]);
  const ids = [...new Set(memberPickRows.map(pick => pick.pickem_game_id))];
  const memberGameRows = ids.length ? await read(client.from("pickem_games")
    .select("id,game_id,week_id,result_winner_school_slug,graded_at").in("id", ids)) as HistoryGame[] : [];
  const weekIds = [...new Set(memberGameRows.map(game => game.week_id))];
  const [memberWeekRows, memberWeekGameRows] = weekIds.length ? await Promise.all([
    read(client.from("pickem_weeks").select("id,season,week,title,status").in("id", weekIds)) as Promise<HistoryWeek[]>,
    read(client.from("pickem_games").select("id,week_id,result_winner_school_slug,graded_at").in("week_id", weekIds)) as Promise<HistoryGame[]>,
  ]) : [[], []];
  return { memberPickRows, rawMemberTotal, memberGameRows, memberWeekRows, memberWeekGameRows };
}

export async function loadPickemStandings({ client, read }: PickemReadScope, week: PickemWeek, closed: boolean) {
  const [leaderboardRows, weeklyStandings] = await Promise.all([
    read(client.rpc("public_pickem_season_standings", { p_season: week.season }).limit(10)) as Promise<PublicSeasonStanding[]>,
    closed ? read(client.rpc("public_pickem_week_standings", { p_week_id: week.id }).limit(20)) as Promise<PublicWeekStanding[]> : Promise.resolve([]),
  ]);
  return { leaderboardRows, weeklyStandings };
}
