import schedule from "../data/playoff-regional-semifinals-2026.json";
import { gameOpponentPrefix, gameSiteLabel } from "./game-site-presentation";
import { formatPlayoffKickoff } from "./playoffs";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import { getGames, getGamesForSchool } from "./games";
import { getRegionalRoundReadiness } from "./regional-round-readiness";
import { buildBracketLayout } from "./playoff-bracket-layout";
import { verifiedWinner } from "./playoff-bracket-advancement";
// Synthetic advancement cases start with no registered Regional games.
const baseline = getGames().filter(game => game.playoff?.round !== "Regional Semifinal");
const completed = baseline.map(game => game.playoff?.round === "Area" ? {...game, status: "final" as const, publicScoreVerified: true, homeScore: 28, awayScore: 14} : game);
test("all six divisions progress from 96 Area finals to exactly 48 confirmed Regional slots", () => {
  assert.equal(getRegionalRoundReadiness(baseline).length, 48);
  assert.ok(getRegionalRoundReadiness(baseline).every(row => row.status === "awaiting-results" && row.teams.every(team => team === null)));
  const rows = getRegionalRoundReadiness(completed);
  assert.equal(rows.length, 48);
  assert.ok(rows.every(row => row.status === "needs-schedule" && row.teams.every(Boolean)));
  for (const division of new Set(rows.map(row => row.division))) {
    assert.equal(rows.filter(row => row.division === division).length, 8);
    const {nodes} = buildBracketLayout(division, completed);
    for (const node of nodes.filter(node => node.round === 2)) assert.deepEqual(node.teams, node.sources.map(id => verifiedWinner(nodes.find(source => source.id === id)?.game)));
  }
  assert.equal(baseline.filter(game => game.playoff?.round === "Regional Semifinal").length, 0);
});
test("pending, tied, partial and unverified Area results never confirm advancement", () => {
  const area = completed.find(game => game.playoff?.round === "Area")!;
  for (const override of [{status: "live" as const}, {homeScore:14}, {homeScore:undefined, score:undefined}, {publicScoreVerified:false}, {resultType:"no_contest" as const}]) {
    const games = completed.map(game => game.id === area.id ? {...game,...override} : game);
    assert.equal(getRegionalRoundReadiness(games).filter(row => row.status === "awaiting-results").length, 1);
  }
});
test("canonical Regional schedules activate once; corrections and duplicates fail closed", () => {
  const row = getRegionalRoundReadiness(completed)[0];
  const source = completed.find(game => game.playoff?.round === "Area")!;
  const regional = {...source, id:"regional-test", status:"upcoming" as const, publicScoreVerified:false, homeScore:undefined, awayScore:undefined,
    homeTeam:row.teams[0]!,awayTeam:row.teams[1]!,playoff:{round:"Regional Semifinal" as const,division:source.playoff!.division,region:row.region},kickoff:undefined,venue:undefined};
  assert.equal(getRegionalRoundReadiness([...completed,regional])[0].status,"needs-details");
  assert.equal(getRegionalRoundReadiness([...completed,regional,{...regional,id:"duplicate"}])[0].status,"duplicate-schedule");
  const corrected = completed.map(game => game.id === source.id ? {...game,homeScore:7,awayScore:21} : game);
  assert.equal(getRegionalRoundReadiness([...corrected,regional])[0].status,"needs-schedule");
  assert.equal(getRegionalRoundReadiness([...corrected,regional])[0].gameId,undefined);
});

test("all 48 published schedules reconcile to both Area winner slots and both school schedules", () => {
  const asOf = new Date("2026-11-23T12:00:00-06:00");
  const catalog = getGames(asOf);
  const regionals = catalog.filter(game => game.playoff?.round === "Regional Semifinal");
  const byId = new Map(regionals.map(game => [game.id, game]));
  assert.equal(regionals.length, 48);
  assert.equal(byId.size, 48);
  assert.equal(new Set(regionals.flatMap(g => [g.awaySchoolSlug, g.homeSchoolSlug])).size, 96);
  const winners = new Map<string, string>();
  for (const row of schedule) {
    assert.equal(row.gameId, ["2026-regional-semifinal", row.division.toLowerCase(), row.region.toLowerCase(), row.regionSlot].join("-"));
    assert.ok(row.primarySource && row.secondarySource);
    const game = byId.get(row.gameId)!;
    assert.equal(game.designatedSidesConfirmed, row.homeAwayConfirmed);
    assert.equal(game.isNeutralSite, row.neutralSite);
    assert.equal(game.kickoff, row.kickoff ?? row.date);
    assert.equal(game.venue, [row.venue, row.city, row.state].join(", "));
    assert.deepEqual(game.mediaLinks?.map(link => link.url), row.broadcastLinks.map(link => link.url));
    assert.equal(gameOpponentPrefix(game), "vs.");
    assert.equal(game.awaySchoolSlug, row.awaySchoolSlug ?? row.bracketOrderSchoolSlugs[0]);
    assert.equal(game.homeSchoolSlug, row.homeSchoolSlug ?? row.bracketOrderSchoolSlugs[1]);
    assert.equal(/designated home/i.test(gameSiteLabel(game, true)), row.homeAwayConfirmed);
    for (const [index, slug] of row.bracketOrderSchoolSlugs.entries()) {
      const parentSlot = (row.regionSlot - 1) * 2 + index + 1;
      winners.set(["2026-area", row.division.toLowerCase(), row.region.toLowerCase(), parentSlot].join("-"), slug);
      assert.equal(getGamesForSchool(slug, asOf).filter(g => g.id === game.id).length, 1);
    }
  }
  const withFinals = catalog.map(game => {
    const winner = winners.get(game.id);
    if (!winner) return game;
    assert.ok(game.homeSchoolSlug === winner || game.awaySchoolSlug === winner, game.id);
    return { ...game, status: "final" as const, publicScoreVerified: true,
      homeScore: Number(game.homeSchoolSlug === winner), awayScore: Number(game.awaySchoolSlug === winner) };
  });
  const queue = getRegionalRoundReadiness(withFinals);
  assert.equal(new Set(queue.map(row => row.gameId)).size, 48);
  for (const row of queue) {
    const source = schedule.find(g => g.division === row.division && g.region === row.region && g.regionSlot === row.slot)!;
    assert.equal(row.gameId, source.gameId);
    assert.equal(row.status, source.kickoff ? "scheduled" : "needs-details");
  }
  assert.deepEqual([...new Set(schedule.map(row => row.division))].map(d => schedule.filter(r => r.division === d).length), [8,8,8,8,8,8]);
  assert.equal(regionals.filter(g => g.designatedSidesConfirmed).length, 12);
  assert.equal(regionals.filter(g => g.isNeutralSite === true).length, 45);
  assert.equal(regionals.filter(g => g.isNeutralSite === null).length, 3);
  assert.equal(regionals.flatMap(g => g.mediaLinks ?? []).length, 6);
  assert.equal(regionals.filter(g => g.kickoff?.endsWith("-06:00")).length, 47);
  const shiner = regionals.find(g => [g.homeSchoolSlug, g.awaySchoolSlug].includes("shiner"))!;
  assert.equal(formatPlayoffKickoff(shiner.kickoff), "Fri, Nov 27 · Time TBD");
});

test("canonical registration checks both source winners, rejects collisions and is idempotent", async () => {
  const sql = readFileSync("docs/release-sql/2026-regional-semifinal-score-identities.sql", "utf8");
  const db = new PGlite();
  try {
    await db.exec(`
      create schema private;
      create table private.canonical_game_identity(game_id text primary key, away_school_slug text, home_school_slug text);
      create table public.game_state(game_id text primary key, away_school_slug text, home_school_slug text,
        status text, verified boolean, result_type text, away_score int, home_score int);
      create table public.score_submissions(game_id text);
      create table public.internal_score_submissions(game_id text);
    `);
    for (const row of schedule) {
      for (const [index, winner] of row.bracketOrderSchoolSlugs.entries()) {
        const parent = ["2026-area", row.division.toLowerCase(), row.region.toLowerCase(), 2 * row.regionSlot - 1 + index].join("-");
        const game = baseline.find(g => g.id === parent)!;
        const identity = [parent, game.awaySchoolSlug!, game.homeSchoolSlug!];
        await db.query("insert into private.canonical_game_identity values ($1,$2,$3)", identity);
        await db.query("insert into public.game_state values ($1,$2,$3,'final',true,'played',$4,$5)",
          [...identity, Number(game.awaySchoolSlug === winner), Number(game.homeSchoolSlug === winner)]);
      }
    }
    await db.exec(sql);
    await db.exec(sql);
    const actual = await db.query("select game_id,away_school_slug,home_school_slug from private.canonical_game_identity where game_id like '2026-regional-%' order by game_id");
    const expected = getGames().filter(g => g.playoff?.round === "Regional Semifinal").sort((a,b) => a.id.localeCompare(b.id));
    assert.deepEqual(actual.rows, expected.map(g => ({game_id:g.id,away_school_slug:g.awaySchoolSlug,home_school_slug:g.homeSchoolSlug})));
    await db.query("update private.canonical_game_identity set away_school_slug='other' where game_id=$1", [expected[0].id]);
    await assert.rejects(db.exec(sql), /identity conflicts/);
    await db.exec("rollback");
    await db.exec("update public.game_state set verified=false where game_id='2026-area-2a-d1-i-1'");
    await assert.rejects(db.exec(sql), /Area winners/);
    await db.exec("rollback");
  } finally {
    await db.close();
  }
});
