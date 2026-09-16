import { gameStats } from "@/lib/all-game-stats";
import { getCategoryCompleteness } from "@/data/stat-completeness";
import { getPlayerSeasonStats } from "@/lib/player-stats";
import { getSeasonCategoryCompleteness, isDefinitiveRanking } from "@/lib/stat-completeness-public";

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
function game(id: string) { const found = gameStats.find((entry) => entry.gameId === id); assert(found, `Missing game ${id}`); return found; }

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
for (const [gameId, school, category] of partialCases) assert(getCategoryCompleteness(game(gameId), school, category).status === "partial", `${gameId} ${school} ${category} must remain partial`);

const stamfordHaskell = game("stamford-at-haskell-2026-week-1");
const stamfordReceivers = stamfordHaskell.receiving.filter((line) => line.schoolSlug === "stamford");
assert(stamfordReceivers.length > 0, "Stamford verified receiver lines must remain visible");
assert(stamfordReceivers.every((line) => line.touchdowns === undefined), "Stamford-Haskell receiver TD attribution must remain undefined, not zero");
assert(stamfordReceivers.some((line) => /slayden young/i.test(line.player)), "Slayden Young verified receiving line must remain on file");

const santo = game("santo-at-chilton-2026-week-1");
assert(getCategoryCompleteness(santo, "santo", "quarterScoring").status === "complete", "Santo quarter scoring is the complete control");
for (const category of ["rushing", "passing", "receiving"] as const) assert(getCategoryCompleteness(santo, "santo", category).status === "unavailable", `Santo ${category} must remain unavailable`);
assert(santo.rushing.filter((line) => line.schoolSlug === "santo").length === 0, "Unavailable Santo rushing must not become zero rows");

const unknown = getCategoryCompleteness(game("de-leon-at-stamford-2026-week-2"), "de-leon", "receiving");
assert(unknown.status === "unknown", "Unclassified control must remain unknown");

const seasonPlayers = getPlayerSeasonStats(2026);
const stamfordPlayers = seasonPlayers.filter((player) => player.schoolSlug === "stamford" && player.receiving.receptions > 0);
assert(stamfordPlayers.length > 0, "Stamford verified season receiving values must remain visible");
assert(stamfordPlayers.every((player) => player.coverage.receiving !== "complete"), "Stamford receiving season totals must not be represented as complete");
assert(!isDefinitiveRanking(stamfordPlayers.map((player) => player.coverage.receiving)), "Mixed/incomplete coverage must not be a definitive ranking");
assert(getSeasonCategoryCompleteness(gameStats, "san-saba", "receiving", 2026).status !== "complete", "San Saba receiving aggregate must not become complete");

console.log("Public completeness validation passed: partial values visible, unavailable stays unavailable, unknown stays unknown, complete control preserved, and incomplete rankings are non-definitive.");
