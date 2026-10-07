import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import ScoreStripGames from "@/components/ScoreStripGames";
import { getScoreboardGames } from "@/lib/scoreboard";

const games = getScoreboardGames().filter((game) => game.week === 7).slice(0, 12);

for (const mode of ["upcoming", "finals"] as const) {
  test(`${mode}: server-rendered strip contains each matchup exactly once`, () => {
    assert.equal(games.length, 12);
    const html = renderToStaticMarkup(<ScoreStripGames mode={mode} games={games} />);
    const gameLinks = [...html.matchAll(/href="(\/games\/[^"?]+)"/g)].map((match) => match[1]);
    assert.deepEqual(gameLinks, games.map((game) => `/games/${game.id}`));
    for (const game of games) {
      assert.equal(gameLinks.filter((href) => href === `/games/${game.id}`).length, 1);
    }
    // No matchup text is emitted in the decorative slot, even with JS disabled.
    assert.match(html, /aria-hidden="true" inert="" class="vv-score-ticker-decoration[^"]*"><\/div>/);
  });
}
