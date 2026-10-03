import assert from "node:assert/strict";
import test from "node:test";
import { getGamePresentation } from "@/lib/game-presentation";
import type { Game } from "@/types/platform";

const base: Game = {
  id: "test-game",
  season: 2026,
  week: 6,
  gameType: "regular",
  status: "upcoming",
  districtGame: false,
  homeTeam: "Home",
  awayTeam: "Away",
  homeSchoolSlug: "home",
  awaySchoolSlug: "away",
  kickoff: "2026-10-02T19:00:00-05:00",
};

const at = (iso: string) => new Date(iso);

test("future kickoff is scheduled for upcoming and scheduled source states", () => {
  assert.equal(getGamePresentation(base, at("2026-10-02T18:00:00-05:00")).kind, "scheduled");
  assert.equal(getGamePresentation({ ...base, status: "scheduled" }, at("2026-10-02T18:00:00-05:00")).kind, "scheduled");
});

test("timing-only kickoff window never claims live authority or score", () => {
  const game = { ...base, status: "live" as const, homeScore: 14, awayScore: 7 };
  const presentation = getGamePresentation(game, at("2026-10-02T20:00:00-05:00"));
  assert.equal(presentation.kind, "kickoff_window");
  assert.equal(presentation.authoritativeLive, false);
  assert.equal(presentation.showScore, false);
});

test("verified live 0-0 remains a legitimate authoritative score", () => {
  const game = { ...base, status: "live" as const, publicScoreVerified: true, homeScore: 0, awayScore: 0 };
  const presentation = getGamePresentation(game, at("2026-10-02T20:00:00-05:00"));
  assert.equal(presentation.kind, "verified_live");
  assert.equal(presentation.authoritativeScore, true);
  assert.equal(presentation.showScore, true);
});

test("verified LIVE remains live beyond the four-hour window", () => {
  const game = { ...base, status: "live" as const, publicScoreVerified: true, homeScore: 21, awayScore: 14 };
  assert.equal(getGamePresentation(game, at("2026-10-03T00:30:00-05:00")).kind, "verified_live");
});

test("date-only kickoff does not infer live status", () => {
  const upcoming = { ...base, kickoff: "2026-10-02", status: "upcoming" as const };
  const scheduled = { ...base, kickoff: "2026-10-02", status: "scheduled" as const };
  assert.equal(getGamePresentation(upcoming, at("2026-10-02T20:00:00-05:00")).kind, "scheduled");
  assert.equal(getGamePresentation(scheduled, at("2026-10-02T20:00:00-05:00")).kind, "scheduled");
});

test("elapsed exact kickoff becomes result awaiting verification after the window", () => {
  const game = { ...base, status: "scheduled" as const };
  assert.equal(getGamePresentation(game, at("2026-10-03T00:30:00-05:00")).kind, "awaiting_verification");
});

test("verified final and exceptional outcomes are distinct", () => {
  const final = { ...base, status: "final" as const, homeScore: 28, awayScore: 21, resultType: "played" as const };
  assert.equal(getGamePresentation(final).kind, "verified_final");
  const forfeit = { ...base, status: "final" as const, resultType: "forfeit" as const, officialWinnerSchoolSlug: "home", homeScore: undefined, awayScore: undefined };
  const presentation = getGamePresentation(forfeit);
  assert.equal(presentation.kind, "verified_exceptional");
  assert.equal(presentation.showScore, false);
});

test("postponed and cancelled are preserved", () => {
  assert.equal(getGamePresentation({ ...base, status: "postponed" }).kind, "postponed");
  assert.equal(getGamePresentation({ ...base, status: "cancelled" }).kind, "cancelled");
});

test("pending or contributor-derived numeric scores remain non-authoritative without verified public state", () => {
  const game = {
    ...base,
    status: "live" as const,
    homeScore: 14,
    awayScore: 7,
    publicScoreVerified: undefined,
  };
  const presentation = getGamePresentation(game, at("2026-10-02T20:00:00-05:00"));
  assert.equal(presentation.kind, "kickoff_window");
  assert.equal(presentation.authoritativeScore, false);
  assert.equal(presentation.showScore, false);
});
