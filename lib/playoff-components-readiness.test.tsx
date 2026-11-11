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
