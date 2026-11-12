import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import StatewideBracketExplorer from "../components/StatewideBracketExplorer";
import TeamPlayoffPath from "../components/TeamPlayoffPath";
import type { Game } from "../types/platform";

test("initial school selection renders the correct division and region without an effect", () => {
  const html = renderToStaticMarkup(<StatewideBracketExplorer games={[]} selectedSchool="Stephenville" />);
  assert.match(html, /4A Division I.*Region III/);
  assert.match(html, /value="4A-D1" selected/);
});

test("a verified elimination leaves all later school path rounds unreached", () => {
  const game = { id: "test", season: 2026, gameType: "playoff", status: "final", publicScoreVerified: true,
    homeTeam: "De Leon", awayTeam: "Alvord", homeScore: 7, awayScore: 21,
    playoff: { round: "Bi-District", division: "2A D1", region: "II" } } as Game;
  const html = renderToStaticMarkup(<TeamPlayoffPath games={[game]} selectedSchool="De Leon" />);
  assert.match(html, /Eliminated/);
  assert.equal((html.match(/Not reached/g) ?? []).length, 3);
  assert.doesNotMatch(html, />Advanced</);
});


test("regional brackets link exact qualified school identities and hold Sterling", () => {
  const cases = [
    { selected: "Andress", slug: "el-paso-austin", absent: "houston-austin", name: "Austin" },
    { selected: "Stephenville", slug: "houston-austin", absent: "el-paso-austin", name: "Austin" },
    { selected: "Lindsay", slug: "simms-bowie", absent: "el-paso-bowie", name: "Bowie" },
    { selected: "Shallowater", slug: "bowie", absent: "simms-bowie", name: "Bowie" },
    { selected: "Irvin", slug: "el-paso-bowie", absent: "bowie", name: "Bowie" },
  ];
  for (const item of cases) {
    const html = renderToStaticMarkup(<StatewideBracketExplorer games={[]} selectedSchool={item.selected} />);
    assert.ok(html.includes(`href="/schools/${item.slug}"`), item.selected);
    assert.ok(!html.includes(`href="/schools/${item.absent}"`), item.selected);
    assert.doesNotMatch(html, /href="\/games\//);
    assert.equal((html.match(/Schedule details pending verification\./g) ?? []).length, 8);
  }
  const held = renderToStaticMarkup(<StatewideBracketExplorer games={[]} selectedSchool="Stephenville" />);
  assert.match(held, />Sterling<\/p>/);
  assert.doesNotMatch(held, /href="\/schools\/houston-sterling"/);
});

test("a published game keeps its Game Center link while unpublished pairings stay pending", () => {
  const game = { id: "published-matchup", season: 2026, gameType: "playoff", status: "upcoming",
    homeTeam: "De Leon", awayTeam: "Alvord",
    playoff: { round: "Bi-District", division: "2A D1", region: "II" } } as Game;
  const html = renderToStaticMarkup(<StatewideBracketExplorer games={[game]} selectedSchool="De Leon" />);
  assert.match(html, /href="\/games\/published-matchup"/);
  assert.equal((html.match(/Schedule details pending verification\./g) ?? []).length, 7);
});
