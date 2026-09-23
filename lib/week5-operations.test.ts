import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  getCanonicalScoreboardTeamName,
  hasCompleteScoreboardTeamIdentity,
} from "@/data/scoreboard-team-identities";
import { filterUpcomingGamesForSchool, getGames } from "@/lib/games";
import { getSchoolBySlug } from "@/lib/schools";

const WEEK_FIVE_IDS = [
  "bowie-at-city-view-2026-week-5",
  "breckenridge-at-anson-2026-week-5",
  "bridgeport-at-henrietta-2026-week-5",
  "chico-at-abilene-texas-leadership-2026-week-5",
  "clifton-at-rio-vista-2026-week-5",
  "crawford-at-santo-2026-week-5",
  "dublin-at-millsap-2026-week-5",
  "early-at-de-leon-2026-week-5",
  "florence-at-hico-2026-week-5",
  "hamilton-at-eastland-2026-week-5",
  "hamlin-at-cross-plains-2026-week-5",
  "hawley-at-post-2026-week-5",
  "holliday-at-whitesboro-2026-week-5",
  "jacksboro-at-cisco-2026-week-5",
  "meridian-at-hubbard-2026-week-5",
  "miles-at-stamford-2026-week-5",
  "san-angelo-texas-leadership-at-merkel-2026-week-5",
  "stephenville-vs-canyon-west-plains-2026-week-5",
  "tolar-at-comanche-2026-week-5",
  "winters-at-goldthwaite-2026-week-5",
  "wortham-at-mart-2026-week-5",
] as const;

const RESTORED_SCORE_ENTRY_IDS = [
  "bowie-at-city-view-2026-week-5",
  "bridgeport-at-henrietta-2026-week-5",
  "chico-at-abilene-texas-leadership-2026-week-5",
  "holliday-at-whitesboro-2026-week-5",
  "san-angelo-texas-leadership-at-merkel-2026-week-5",
] as const;

const games = getGames();

function teamIsIdentityReady(slug: string | undefined, team: string | undefined) {
  const school = slug ? getSchoolBySlug(slug) : undefined;
  if (school) {
    return Boolean(
      school.abbreviation?.trim() &&
      school.mascot?.trim() &&
      school.colors.primary?.trim() &&
      school.colors.secondary?.trim(),
    );
  }
  return team ? hasCompleteScoreboardTeamIdentity(team) : false;
}

function weekFiveIdsInSql(path: string) {
  const sql = readFileSync(path, "utf8");
  return [...sql.matchAll(/\('([^']+-2026-week-5)'/g)].map((match) => match[1]);
}

test("the canonical catalog retains exactly the 21 operable Week 5 games", () => {
  const weekFive = games
    .filter((game) => game.season === 2026 && game.week === 5 && game.gameType !== "bye" && game.gameType !== "scrimmage")
    .sort((a, b) => a.id.localeCompare(b.id));

  assert.deepEqual(weekFive.map((game) => game.id), [...WEEK_FIVE_IDS]);
  for (const game of weekFive) {
    assert.equal(game.kickoff, "2026-09-25T19:00:00-05:00", game.id);
    assert.equal(game.status, "upcoming", game.id);
    assert.ok(game.homeSchoolSlug, `${game.id} home identity`);
    assert.ok(game.awaySchoolSlug, `${game.id} away identity`);
  }
});

test("the five formerly blocked games have complete identities on both sides", () => {
  for (const gameId of RESTORED_SCORE_ENTRY_IDS) {
    const game = games.find((candidate) => candidate.id === gameId);
    assert.ok(game, gameId);
    assert.equal(teamIsIdentityReady(game.awaySchoolSlug, game.awayTeam), true, `${gameId} away`);
    assert.equal(teamIsIdentityReady(game.homeSchoolSlug, game.homeTeam), true, `${gameId} home`);
  }

  assert.equal(
    getCanonicalScoreboardTeamName("San Angelo Texas Leadership Charter Academy"),
    "San Angelo Texas Leadership",
  );
});

test("the reviewed migrations register every Week 5 game exactly once", () => {
  const original = weekFiveIdsInSql("supabase/migrations/20260917134403_verified_final_score_email.sql");
  const additionPath = "supabase/migrations/20260923072611_register_week5_final_score_notifications.sql";
  const additions = weekFiveIdsInSql(additionPath);
  const registered = [...original, ...additions].sort();

  assert.equal(original.length, 9);
  assert.equal(additions.length, 12);
  assert.deepEqual(registered, [...WEEK_FIVE_IDS]);
  assert.equal(new Set(registered).size, 21);

  const migration = readFileSync(additionPath, "utf8");
  assert.match(migration, /on conflict \(game_id\) do nothing;/);
  assert.doesNotMatch(migration, /insert into private\.(product_notification_events|product_email_deliveries)/);
});

test("homepage next-up selection follows canonical kickoff ordering", () => {
  const now = new Date("2026-09-23T12:00:00-05:00");
  const expected = new Map([
    ["de-leon", "early-at-de-leon-2026-week-5"],
    ["goldthwaite", "winters-at-goldthwaite-2026-week-5"],
    ["hico", "florence-at-hico-2026-week-5"],
  ]);

  for (const [slug, gameId] of expected) {
    assert.equal(filterUpcomingGamesForSchool(games, slug, now)[0]?.id, gameId, slug);
  }
});
