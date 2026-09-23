import assert from "node:assert/strict";
import test from "node:test";

import { getAllGameStats } from "@/lib/game-stats";
import { getGames } from "@/lib/games";
import { getSchoolsByDistrictId } from "@/lib/schools";
import { getStandingsForDistrictId } from "@/lib/standings";

const games = getGames();

const districts = [
  {
    id: "2a-d2-district-7",
    schools: ["albany", "cross-plains", "goldthwaite", "hamlin", "miles", "stamford", "winters"],
    records: { albany: "3-1", "cross-plains": "2-2", goldthwaite: "4-0", hamlin: "2-2", miles: "2-2", stamford: "2-2", winters: "1-3" },
  },
  {
    id: "3a-d2-district-5",
    schools: ["clifton", "comanche", "dublin", "eastland", "hamilton", "millsap", "rio-vista", "tolar"],
    records: { clifton: "3-1", comanche: "2-2", dublin: "1-3", eastland: "2-2", hamilton: "1-3", millsap: "3-1", "rio-vista": "3-1", tolar: "1-3" },
  },
  {
    id: "2a-d1-district-5",
    schools: ["abilene-texas-leadership", "anson", "cisco", "de-leon", "hawley", "hico"],
    records: { "abilene-texas-leadership": "1-3", anson: "2-2", cisco: "2-2", "de-leon": "3-1", hawley: "2-2", hico: "4-0" },
  },
  {
    id: "3a-d2-district-4",
    schools: ["breckenridge", "city-view", "henrietta", "holliday", "jacksboro", "merkel"],
    records: { breckenridge: "0-4", "city-view": "0-4", henrietta: "2-2", holliday: "0-4", jacksboro: "4-0", merkel: "2-2" },
  },
] as const;

function realSchedule(slug: string) {
  return games.filter((game) =>
    game.season === 2026 &&
    game.gameType !== "scrimmage" &&
    game.gameType !== "bye" &&
    (game.homeSchoolSlug === slug || game.awaySchoolSlug === slug)
  );
}

test("all four district membership groups are exact", () => {
  for (const district of districts) {
    assert.deepEqual(
      getSchoolsByDistrictId(district.id).map((school) => school.slug).sort(),
      [...district.schools].sort(),
      district.id,
    );
  }
});

test("all 27 featured district schools have ten real games and no fake bye", () => {
  for (const district of districts) {
    for (const slug of district.schools) {
      assert.equal(realSchedule(slug).length, 10, slug);
      assert.equal(
        games.some((game) => game.season === 2026 && game.gameType === "bye" && (game.homeSchoolSlug === slug || game.awaySchoolSlug === slug)),
        false,
        `${slug} pseudo-bye`,
      );
    }
  }
});

test("every district pairing exists once as one reciprocal canonical game", () => {
  for (const district of districts) {
    const members = new Set<string>(district.schools);
    const districtGames = games.filter((game) =>
      game.season === 2026 &&
      game.districtGame &&
      members.has(game.homeSchoolSlug ?? "") &&
      members.has(game.awaySchoolSlug ?? "")
    );
    assert.equal(districtGames.length, district.schools.length * (district.schools.length - 1) / 2, district.id);
    const pairs = districtGames.map((game) => [game.homeSchoolSlug, game.awaySchoolSlug].sort().join("|"));
    assert.equal(new Set(pairs).size, pairs.length, `${district.id} reciprocal duplicate`);
    for (const slug of district.schools) {
      assert.equal(districtGames.filter((game) => game.homeSchoolSlug === slug || game.awaySchoolSlug === slug).length, district.schools.length - 1, slug);
    }
  }
});

test("owner corrections retain canonical IDs and explicit timing and overtime details", () => {
  const tolarComanche = games.find((game) => game.id === "tolar-at-comanche-2026-week-5");
  assert.equal(tolarComanche?.kickoff, "2026-09-25T19:00:00-05:00");
  assert.equal(tolarComanche?.districtGame, true);
  assert.equal(realSchedule("tolar").some((game) => game.kickoff?.startsWith("2026-10-02")), false);
  assert.equal(realSchedule("comanche").some((game) => game.kickoff?.startsWith("2026-10-02")), false);

  assert.equal(games.find((game) => game.id === "comanche-at-cisco-2026-week-2")?.kickoff, "2026-09-04T22:00:00-05:00");
  assert.equal(games.find((game) => game.id === "reagan-county-at-miles-2026-week-3")?.score?.period, "Final (OT)");
  assert.equal(games.find((game) => game.id === "bruceville-eddy-at-cross-plains-2026-week-1")?.score?.period, "Final (OT)");
  assert.equal(games.find((game) => game.id === "hawley-at-abilene-tlca-2026-week-11")?.kickoff, "2026-11-05T19:00:00-06:00");
  assert.equal(games.find((game) => game.id === "winters-at-san-angelo-tlca-2026-week-3")?.kickoff, "2026-09-10T19:00:00-05:00");
  assert.equal(games.find((game) => game.id === "baird-vs-abilene-tlca-2026-week-1")?.homeScore, 46);
  assert.equal(games.find((game) => game.id === "baird-vs-abilene-tlca-2026-week-1")?.awayScore, 22);
});

test("Cross Plains at Baird is a scoreless official-winner forfeit", () => {
  const game = games.find((candidate) => candidate.id === "cross-plains-at-baird-2026-week-4");
  assert.equal(game?.status, "final");
  assert.equal(game?.homeSchoolSlug, "baird");
  assert.equal(game?.awaySchoolSlug, "cross-plains");
  assert.equal(game?.resultType, "forfeit");
  assert.equal(game?.officialWinnerSchoolSlug, "cross-plains");
  assert.equal(game?.homeScore, undefined);
  assert.equal(game?.awayScore, undefined);
});

test("overall and district records derive from the reconciled games", () => {
  for (const district of districts) {
    const standings = getStandingsForDistrictId(district.id);
    assert.deepEqual(standings.map((standing) => standing.schoolSlug).sort(), [...district.schools].sort(), district.id);
    for (const [slug, expected] of Object.entries(district.records)) {
      const standing = standings.find((candidate) => candidate.schoolSlug === slug);
      assert.equal(`${standing?.overallWins}-${standing?.overallLosses}`, expected, slug);
      if (district.id !== "3a-d2-district-5") assert.equal(`${standing?.districtWins}-${standing?.districtLosses}`, "0-0", slug);
    }
  }
  const district5 = new Map(getStandingsForDistrictId("3a-d2-district-5").map((standing) => [standing.schoolSlug, standing]));
  for (const slug of ["comanche", "eastland", "millsap", "rio-vista"]) assert.equal(`${district5.get(slug)?.districtWins}-${district5.get(slug)?.districtLosses}`, "1-0", slug);
  for (const slug of ["clifton", "dublin", "hamilton", "tolar"]) assert.equal(`${district5.get(slug)?.districtWins}-${district5.get(slug)?.districtLosses}`, "0-1", slug);
});

test("target schedules have no duplicate IDs or reversed same-date matchups", () => {
  const target = new Set<string>(districts.flatMap((district) => [...district.schools]));
  const affected = games.filter((game) => game.season === 2026 && game.gameType !== "scrimmage" && (target.has(game.homeSchoolSlug ?? "") || target.has(game.awaySchoolSlug ?? "")));
  assert.equal(new Set(affected.map((game) => game.id)).size, affected.length);
  const identities = affected.map((game) => {
    const date = game.kickoff?.slice(0, 10) ?? "unknown";
    return `${date}|${[game.homeSchoolSlug, game.awaySchoolSlug].sort().join("|")}`;
  });
  assert.equal(new Set(identities).size, identities.length);
});

test("external opponent identities remain controlled and distinct", () => {
  const atlas = games.find((game) => game.id === "atlas-homeschool-at-rio-vista-2026-week-3");
  assert.equal(atlas?.awaySchoolSlug, "atlas-homeschool");
  const abileneAtSanAngelo = games.find((game) => game.id === "abilene-texas-leadership-at-san-angelo-texas-leadership-2026-week-2");
  assert.equal(abileneAtSanAngelo?.awaySchoolSlug, "abilene-texas-leadership");
  assert.equal(abileneAtSanAngelo?.homeSchoolSlug, "san-angelo-texas-leadership");
  const wintersAtSanAngelo = games.find((game) => game.id === "winters-at-san-angelo-tlca-2026-week-3");
  assert.equal(wintersAtSanAngelo?.homeSchoolSlug, "san-angelo-texas-leadership");
  assert.equal(games.find((game) => game.id === "bruceville-eddy-at-cross-plains-2026-week-1")?.awaySchoolSlug, "bruceville-eddy");
});

function sum<T>(lines: T[], read: (line: T) => number) {
  return lines.reduce((total, line) => total + read(line), 0);
}

test("Week 4 quarter scores and offensive statistics reconcile without invented unknowns", () => {
  const statsById = new Map(getAllGameStats().map((entry) => [entry.gameId, entry]));
  const stephenville = statsById.get("stephenville-at-abilene-wylie-2026-week-4");
  assert.ok(stephenville);
  assert.equal(sum(stephenville.quarterScores, (line) => sum(line.quarters, (value) => value) - line.total), 0);
  assert.deepEqual(stephenville.teamStats.find((line) => line.schoolSlug === "stephenville"), { schoolSlug: "stephenville", rushingAttempts: 33, rushingYards: 254, passingYards: 197, totalYards: 451, completions: 18, passAttempts: 25, interceptionsThrown: 1 });

  const ciscoStamford = statsById.get("cisco-at-stamford-2026-week-4");
  assert.ok(ciscoStamford);
  assert.equal(ciscoStamford.teamStats.filter((line) => line.schoolSlug === "cisco").length, 1);
  assert.equal(sum(ciscoStamford.rushing.filter((line) => line.schoolSlug === "cisco"), (line) => line.yards), 270);
  const stamfordTeam = ciscoStamford.teamStats.find((line) => line.schoolSlug === "stamford");
  assert.equal(stamfordTeam?.rushingYards, 211);
  assert.equal(stamfordTeam?.passingYards, 214);
  assert.equal(stamfordTeam?.totalYards, 425);
  assert.equal(stamfordTeam?.interceptionsThrown, undefined);
  assert.equal(ciscoStamford.passing.find((line) => line.schoolSlug === "stamford")?.interceptions, undefined);
  assert.equal(ciscoStamford.receiving.filter((line) => line.schoolSlug === "stamford").every((line) => line.touchdowns === undefined), true);

  const deLeonGoldthwaite = statsById.get("de-leon-at-goldthwaite-2026-week-4");
  assert.ok(deLeonGoldthwaite);
  const deLeonRush = deLeonGoldthwaite.rushing.filter((line) => line.schoolSlug === "de-leon");
  assert.equal(sum(deLeonRush, (line) => line.attempts), 41);
  assert.equal(sum(deLeonRush, (line) => line.yards), 220);
  assert.equal(sum(deLeonRush, (line) => line.touchdowns ?? 0), 0);
  const goldPass = deLeonGoldthwaite.passing.find((line) => line.schoolSlug === "goldthwaite");
  assert.deepEqual(goldPass && { completions: goldPass.completions, attempts: goldPass.attempts, yards: goldPass.yards, touchdowns: goldPass.touchdowns, interceptions: goldPass.interceptions }, { completions: 6, attempts: 11, yards: 61, touchdowns: 0, interceptions: 1 });
  const goldTeam = deLeonGoldthwaite.teamStats.find((line) => line.schoolSlug === "goldthwaite");
  assert.equal(goldTeam?.rushingAttempts, undefined);
  assert.equal(goldTeam?.rushingYards, undefined);
  assert.equal(goldTeam?.totalYards, undefined);
});
