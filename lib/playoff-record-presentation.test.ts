import assert from "node:assert/strict";
import test from "node:test";
import recordData from "../data/playoff-records-through-area-2026.json";
import schedule from "../data/playoff-regional-semifinals-2026.json";
import { getGames } from "./games";
import { completePostseasonStanding } from "./playoff-record-presentation";
import { formatOverallRecord } from "./school-record-presentation";
import { getStandingForSchoolFromGames } from "./standings";

const games = getGames(new Date("2026-11-25T12:00:00-06:00"));
const record = (slug: string, feed = games, season = 2026) =>
  formatOverallRecord(completePostseasonStanding(getStandingForSchoolFromGames(slug, feed), feed, slug, season));

test("every Regional Semifinal team has one sourced overall record through Area", () => {
  const advancing = new Map(schedule.flatMap(row => row.bracketOrderSchoolSlugs.map(slug => [slug, row.division] as const)));
  const sourceRows = recordData.records;
  assert.equal(sourceRows.length, 96);
  assert.equal(new Set(sourceRows.map(row => row.schoolSlug)).size, 96);
  assert.equal(advancing.size, 96);
  for (const row of sourceRows) {
    assert.equal(row.division, advancing.get(row.schoolSlug));
    assert.match(row.scheduleSource, /^https:\/\/www\.maxpreps\.com\//);
    assert.ok(Number.isSafeInteger(row.wins) && row.wins >= 2);
    assert.ok(Number.isSafeInteger(row.losses) && row.losses >= 0);
    assert.ok(row.wins + row.losses <= 12);
    assert.equal(record(row.schoolSlug), `${row.wins}-${row.losses}`, row.schoolSlug);
  }
  assert.equal(record("mason"), "12-0");
  assert.equal(record("de-leon"), "10-2");
  assert.equal(record("santo"), "11-1");
  assert.equal(record("wellington"), "11-1");
  assert.equal(record("yoakum"), "10-2");
  assert.equal(record("el-campo"), "10-2");
  assert.equal(record("wimberley"), "11-0");
  assert.notEqual(record("mason", games, 2027), "12-0");
});

test("later finals extend the baseline once and only after verification", () => {
  const game = games.find(g => g.id === "2026-regional-semifinal-2a-d1-ii-2")!;
  const base = games.filter(g => g.id !== game.id);
  const scored = { ...game, status: "final" as const, homeScore: 14, awayScore: 28 };
  assert.equal(game.awaySchoolSlug, "mason");
  assert.equal(record("mason", [...base, scored]), "12-0");
  const final = { ...scored, publicScoreVerified: true };
  assert.equal(record("mason", [...base, final, final]), "13-0");
  assert.equal(record("de-leon", [...base, final]), "10-3");
  assert.equal(record("mason", [...base, { ...final, homeScore: 35 }]), "12-1");
  assert.equal(record("mason", [...base, final, { ...final, homeScore: 35 }]), "12-0");
  assert.equal(record("mason", [...base, { ...final, resultType: "no_contest" }]), "12-0");
  assert.equal(record("mason", [...base, { ...final, resultType: "forfeit", officialWinnerSchoolSlug: "mason" }]), "13-0");
});

test("records without a baseline keep the existing incomplete-record guard", () => {
  assert.equal(record("nocona"), "—");
});
