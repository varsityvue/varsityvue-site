import assert from "node:assert/strict";

import { getGameStats } from "@/lib/game-stats";
import { getGames } from "@/lib/games";
import { getPlayerGameLog } from "@/lib/player-game-log";
import { getPlayerId } from "@/lib/player-identity";
import { getPlayerSeasonStats, getReceivingLeaders } from "@/lib/player-stats";
import {
  combineStatCompleteness,
  gameHasCategoryValues,
  getGameCategoryCompleteness,
  getPublicCompletenessLabel,
  getSchoolSeasonCategoryCompleteness,
  isDefinitiveRanking,
} from "@/lib/stat-completeness";

async function main() {
const partialCases = [
  ["hawley-at-albany-2026-week-1", "albany", "rushing"],
  ["de-leon-at-stamford-2026-week-2", "stamford", "receiving"],
  ["breckenridge-at-comanche-2026-week-1", "comanche", "receiving"],
  ["lubbock-cooper-at-stephenville-2026-week-3", "stephenville", "receiving"],
  ["goldthwaite-at-san-saba-2026-week-3", "san-saba", "passing"],
  ["goldthwaite-at-san-saba-2026-week-3", "san-saba", "receiving"],
  ["stamford-at-haskell-2026-week-1", "stamford", "rushing"],
  ["stamford-at-haskell-2026-week-1", "stamford", "receiving"],
] as const;

for (const [gameId, schoolSlug, category] of partialCases) {
  const game = getGameStats(gameId);
  assert.ok(game, `${gameId} must resolve.`);
  assert.equal(getGameCategoryCompleteness(game, schoolSlug, category).status, "partial", `${gameId} ${schoolSlug} ${category} must remain partial.`);
  assert.equal(getSchoolSeasonCategoryCompleteness(schoolSlug, 2026, category).status, "partial", `${schoolSlug} season ${category} must remain partial.`);
}

const albanyPlayers = getPlayerSeasonStats(2026).filter((player) => player.schoolSlug === "albany" && player.rushing.attempts > 0);
assert.ok(albanyPlayers.length > 0, "Albany's verified rushing player values must remain public.");
assert.ok(albanyPlayers.every((player) => player.completeness.rushing.status === "partial"), "Albany rushing totals must carry partial coverage.");

const slaydenId = getPlayerId("stamford", "Slayden Young", 2026);
const slayden = getPlayerSeasonStats(2026).find((player) => player.playerId === slaydenId);
assert.ok(slayden, "Slayden Young must resolve in season totals.");
assert.equal(slayden.receiving.touchdowns, undefined, "Slayden Young's unknown receiving touchdowns must remain undefined.");
assert.equal(slayden.completeness.receiving.status, "partial", "Slayden Young's season receiving coverage must be partial.");
const slaydenLog = await getPlayerGameLog(slaydenId, 2026, getGames());
const haskellLine = slaydenLog.find((entry) => entry.gameId === "stamford-at-haskell-2026-week-1");
assert.ok(haskellLine?.receiving, "Slayden Young's verified Haskell receiving line must remain visible.");
assert.equal(haskellLine.receiving.receptions, 9);
assert.equal(haskellLine.receiving.yards, 215);
assert.equal(haskellLine.receiving.touchdowns, undefined);
assert.equal(haskellLine.completeness.receiving.status, "partial");

const santoGame = getGameStats("santo-at-chilton-2026-week-1");
assert.ok(santoGame, "Santo-Chilton must resolve.");
assert.equal(getGameCategoryCompleteness(santoGame, "santo", "quarterScoring").status, "complete", "Santo's supplied quarter scoring must remain complete.");
assert.equal(getGameCategoryCompleteness(santoGame, "santo", "passing").status, "unavailable", "Santo offense must remain unavailable.");
assert.equal(gameHasCategoryValues(santoGame, "santo", "passing"), false, "Unavailable Santo passing must not become a zero-valued line.");
assert.equal(getSchoolSeasonCategoryCompleteness("santo", 2026, "passing").status, "unavailable", "Santo season passing must remain unavailable.");

const unknownGame = getGameStats("san-saba-at-de-leon-2026-week-1");
assert.ok(unknownGame, "San Saba-De Leon must resolve.");
const unknownPassing = getGameCategoryCompleteness(unknownGame, "de-leon", "passing");
assert.equal(unknownPassing.status, "unknown");
assert.ok(!getPublicCompletenessLabel(unknownPassing.status).includes("Complete"), "Unknown coverage must not be labeled complete.");
assert.equal(getPublicCompletenessLabel("complete"), "Verified · Complete", "Complete control must retain normal complete presentation.");

assert.equal(combineStatCompleteness([{ status: "complete" }, { status: "unknown" }], 2).status, "unknown");
assert.equal(combineStatCompleteness([{ status: "complete" }, { status: "unavailable" }], 1).status, "partial");
assert.equal(combineStatCompleteness([{ status: "unknown" }, { status: "unavailable" }], 0).status, "partial");
assert.equal(combineStatCompleteness([{ status: "complete" }, { status: "complete" }], 2).status, "complete");
assert.equal(isDefinitiveRanking([{ completeness: { status: "complete" } }, { completeness: { status: "complete" } }]), true, "All-complete control must retain ordinal ranking eligibility.");
assert.equal(isDefinitiveRanking(getReceivingLeaders({ season: 2026, minReceptions: 1 })), false, "Mixed completeness must not produce definitive ordinal rankings.");

console.log("Public statistics completeness validation passed.");
console.log(`Known partial game/team/categories checked: ${partialCases.length}`);
console.log("Verified partial values: visible");
console.log("Stamford touchdown attribution: undefined and partial");
console.log("Santo quarter scoring: complete");
console.log("Santo offense: unavailable, not zero");
console.log("Unknown coverage: not relabeled complete");
console.log("Mixed leaderboards: ordered without definitive ordinal ranks");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
