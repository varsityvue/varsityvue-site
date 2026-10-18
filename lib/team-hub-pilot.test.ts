import test from "node:test";
import assert from "node:assert/strict";
import type { Game } from "@/types/platform";
import { getHubGameFocus, isTeamHubV2Pilot } from "./team-hub-pilot";

const now = new Date("2026-10-18T12:00:00Z");
const game = (id: string, extra: Partial<Game> = {}) => ({ id, homeSchoolSlug: "de-leon", awaySchoolSlug: "hico", homeTeam: "De Leon", awayTeam: "Hico", gameType: "regular", status: "upcoming", kickoff: "2026-10-23T00:00:00Z", ...extra }) as Game;

test("pilot is limited to exactly the five authorized schools", () => {
  for (const slug of ["de-leon", "cisco", "goldthwaite", "albany", "stephenville"]) assert.equal(isTeamHubV2Pilot(slug), true);
  for (const slug of ["hico", "stamford", "jacksboro", "", "De-Leon"]) assert.equal(isTeamHubV2Pilot(slug), false);
});
test("verified live takes priority; an unverified live report does not", () => {
  const final = game("final", { status: "final", kickoff: "2026-10-16T00:00:00Z" });
  const live = game("live", { status: "live", publicScoreVerified: true, kickoff: "2026-10-18T11:00:00Z" });
  assert.equal(getHubGameFocus([final, live], "de-leon", now).featured?.id, "live");
  assert.equal(getHubGameFocus([final, { ...live, publicScoreVerified: false, kickoff: "2026-10-17T00:00:00Z" }], "de-leon", now).featured?.id, "final");
});
test("latest final and next future game remain distinct without changing input", () => {
  const games = [game("next"), game("old", { status: "final", kickoff: "2026-10-09T00:00:00Z" }), game("latest", { status: "final", kickoff: "2026-10-16T00:00:00Z" })];
  const before = JSON.stringify(games);
  assert.equal(getHubGameFocus(games, "de-leon", now).featured?.id, "latest");
  assert.equal(getHubGameFocus(games, "de-leon", now).next?.id, "next");
  assert.equal(JSON.stringify(games), before);
});
test("empty, unrelated, cancelled, bye and stale upcoming games are not promoted", () => {
  const games = [game("unrelated", { homeSchoolSlug: "cisco" }), game("cancelled", { status: "cancelled" }), game("bye", { gameType: "bye" }), game("stale", { kickoff: "2026-10-01T00:00:00Z" })];
  assert.equal(getHubGameFocus(games, "de-leon", now).featured, undefined);
});
test("kickoff window is distinguished from verified live and upcoming is a fallback", () => {
  const window = game("window", { kickoff: "2026-10-18T11:00:00Z" });
  assert.equal(getHubGameFocus([game("next"), window], "de-leon", now).featured?.id, "window");
  assert.equal(getHubGameFocus([game("next")], "de-leon", now).featured?.id, "next");
});

test("undated historical final cannot displace a dated result", () => {
  const games = [game("undated", { status: "final", kickoff: undefined }), game("dated", { status: "final", kickoff: "2026-10-16T00:00:00Z" })];
  assert.equal(getHubGameFocus(games, "de-leon", now).featured?.id, "dated");
});
