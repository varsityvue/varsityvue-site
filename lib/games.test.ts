import assert from "node:assert/strict";
import test from "node:test";

import { getGames } from "@/lib/games";
import { getGameOfTheWeek } from "@/lib/scoreboard";
import { gamePreviews, getGamePreview } from "@/data/game-previews";

test("Week 5 has exactly one Game of the Week", () => {
  const weekFiveGames = getGames().filter((game) => game.season === 2026 && game.week === 5);
  const gamesOfTheWeek = weekFiveGames.filter(
    (game) => game.specialEvent?.toLowerCase() === "game of the week",
  );

  assert.deepEqual(
    gamesOfTheWeek.map((game) => game.id),
    ["jacksboro-at-cisco-2026-week-5"],
  );

  const game = gamesOfTheWeek[0];
  assert.equal(game.awayTeam, "Jacksboro");
  assert.equal(game.homeTeam, "Cisco");
  assert.equal(game.kickoff, "2026-09-25T19:00:00-05:00");
  assert.equal(game.venue, "Chesley Field");
});

test("Tolar at Comanche remains a normal Week 5 matchup", () => {
  const game = getGames().find((candidate) => candidate.id === "tolar-at-comanche-2026-week-5");

  assert.ok(game);
  assert.equal(game.featured, undefined);
  assert.equal(game.specialEvent, undefined);
  assert.equal(game.status, "upcoming");
});

test("every designated Game of the Week has a short, written pregame matchup summary", () => {
  const featuredGames = getGames().filter(
    (game) => game.specialEvent?.toLowerCase() === "game of the week",
  );
  assert.ok(featuredGames.length > 0);

  for (const game of featuredGames) {
    const writtenPreview = gamePreviews.find((entry) => entry.gameId === game.id);
    const displayedPreview = getGamePreview(game.id);
    assert.ok(writtenPreview, `${game.id} needs a verified editorial Game Center preview`);
    assert.ok(displayedPreview, `${game.id} must show its Game Center preview`);
    assert.equal(displayedPreview.excerpt, writtenPreview.excerpt);
    assert.ok(writtenPreview.excerpt.length >= 60 && writtenPreview.excerpt.length <= 350, `${game.id} needs a concise summary`);
    assert.equal(writtenPreview.paragraphs.length, 0, `${game.id} should link to the full article instead of duplicating it`);
    assert.doesNotMatch(writtenPreview.excerpt, /VarsityVue is tracking this/i);
  }

  const homepageGame = getGameOfTheWeek();
  if (homepageGame?.specialEvent?.toLowerCase() === "game of the week") {
    assert.ok(getGamePreview(homepageGame.id));
  }
});
