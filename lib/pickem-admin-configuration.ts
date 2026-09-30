import type { Game } from "@/types/platform";

export const PICKEM_ADMIN_WEEKS = [5, 6, 7, 8, 9, 10, 11] as const;
export const PICKEM_RULES_VERSION = "2026-pickem-cash-v1";
export const PICKEM_RULES_PUBLISHED_AT = "2026-09-27T05:08:44.209029Z";
export const PICKEM_PRESENTING_SPONSOR = "Gilder Storage";

export function eligiblePickemGames(games: Game[], week: number) {
  return games.filter((game) => game.season === 2026 && game.week === week
    && game.gameType !== "bye" && game.gameType !== "scrimmage"
    && game.kickoff?.includes("T") && game.awaySchoolSlug && game.homeSchoolSlug);
}

export function parsePickemDraft(form: FormData, games: Game[]) {
  const season = Number(form.get("season"));
  const week = Number(form.get("week"));
  const revisionText = String(form.get("configuration_revision") ?? "");
  const revision = Number(revisionText);
  if (season !== 2026 || !PICKEM_ADMIN_WEEKS.some((value) => value === week)
    || !revisionText || !Number.isSafeInteger(revision) || revision < -1) {
    throw new Error("Enter a supported 2026 week and refresh the draft before saving.");
  }
  const ids = form.getAll("game_id").map(String);
  const tiebreakers = form.getAll("tiebreaker_game_id").map(String);
  if (ids.length < 1 || ids.length > 12 || new Set(ids).size !== ids.length) {
    throw new Error("Select between 1 and 12 unique canonical games.");
  }
  if (tiebreakers.length !== 1 || !tiebreakers[0] || !ids.includes(tiebreakers[0])) {
    throw new Error("Select exactly one Pick ’Em tiebreaker from the selected slate.");
  }
  const canonical = new Map(eligiblePickemGames(games, week).map((game) => [game.id, game]));
  const selections = ids.map((id) => {
    if (!canonical.has(id)) throw new Error("A selected game is outside this canonical week.");
    const text = String(form.get(`schedule_revision:${id}`) ?? "");
    const expected = Number(text);
    if (!text || !Number.isSafeInteger(expected) || expected < 0) {
      throw new Error("Refresh to load every canonical schedule revision.");
    }
    return { game_id: id, schedule_revision: expected };
  });
  const title = String(form.get("title") ?? "").trim();
  if (!title || title.length > 150) throw new Error("Enter a slate title of 1–150 characters.");
  return { p_season: season, p_week: week, p_expected_revision: revision, p_title: title,
    p_games: selections, p_tiebreaker_game_ids: tiebreakers };
}
