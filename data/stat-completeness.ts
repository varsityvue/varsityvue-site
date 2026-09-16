import type {
  CoreStatCategory,
  GameStats,
  StatCompletenessDetail,
  StatCompletenessStatus,
  TeamStatCompleteness,
} from "@/data/game-stats";

const detail = (status: StatCompletenessStatus, note: string): StatCompletenessDetail => ({ status, note });
const unavailable = (note: string) => detail("unavailable", note);
const partial = (note: string) => detail("partial", note);
const complete = (note: string) => detail("complete", note);

const missingQuarterSplits = unavailable("The retained source establishes the final score but does not provide quarter-by-quarter splits.");
const missingScoringPlays = unavailable("The retained source does not provide a scoring-play summary.");
const missingBoxScore = unavailable("The retained source does not provide this team's box-score category.");
const suppliedQuarterSplits = complete("The program-provided result includes all four quarter splits and the verified final.");

const noBoxScore = (schoolSlug: string, includeQuarterScoring = false): TeamStatCompleteness => ({
  schoolSlug,
  categories: {
    ...(includeQuarterScoring ? { quarterScoring: missingQuarterSplits } : {}),
    scoringPlays: missingScoringPlays,
    teamStats: missingBoxScore,
    rushing: missingBoxScore,
    passing: missingBoxScore,
    receiving: missingBoxScore,
  },
});

const scoringUnavailable = (schoolSlug: string, quarterScoring = false): TeamStatCompleteness => ({
  schoolSlug,
  categories: {
    ...(quarterScoring ? { quarterScoring: missingQuarterSplits } : {}),
    scoringPlays: missingScoringPlays,
  },
});

export const statCompletenessByGame: Record<string, TeamStatCompleteness[]> = {
  "hawley-at-albany-2026-week-1": [
    noBoxScore("hawley"),
    {
      schoolSlug: "albany",
      categories: {
        quarterScoring: missingQuarterSplits,
        scoringPlays: missingScoringPlays,
        rushing: partial("Team totals are 33 carries for 249 yards; represented player lines total 34 carries for 248 yards."),
      },
    },
  ],
  "cisco-at-clyde-2026-week-1": [
    noBoxScore("clyde", true),
    scoringUnavailable("cisco", true),
  ],
  "de-leon-at-stamford-2026-week-2": [
    {
      schoolSlug: "stamford",
      categories: {
        receiving: partial("Team totals are 21 receptions for 271 yards; represented receiver lines total 14 receptions for 241 yards."),
      },
    },
  ],
  "stephenville-at-brownwood-2026-week-2": [
    noBoxScore("brownwood"),
    scoringUnavailable("stephenville"),
  ],
  "stamford-at-haskell-2026-week-1": [
    noBoxScore("haskell", true),
    {
      schoolSlug: "stamford",
      categories: {
        quarterScoring: missingQuarterSplits,
        scoringPlays: missingScoringPlays,
        rushing: partial("Rushing attempts and yards are attributed, but rushing touchdown attribution is not established by the retained source."),
        receiving: partial("Receptions and yards are attributed, but the receivers for Miles Follis's five passing touchdowns are not established by the retained source."),
      },
    },
  ],
  "breckenridge-at-cisco-2026-week-3": [
    noBoxScore("breckenridge"),
    scoringUnavailable("cisco"),
  ],
  "breckenridge-at-comanche-2026-week-1": [
    noBoxScore("breckenridge", true),
    {
      schoolSlug: "comanche",
      categories: {
        quarterScoring: missingQuarterSplits,
        scoringPlays: missingScoringPlays,
        receiving: partial("Team totals are 6 receptions for 135 yards; represented receiver lines total 3 receptions for 88 yards."),
      },
    },
  ],
  "anson-at-albany-2026-week-2": [
    noBoxScore("anson", true),
    scoringUnavailable("albany", true),
  ],
  "midlothian-heritage-at-stephenville-2026-week-1": [
    noBoxScore("midlothian-heritage"),
    scoringUnavailable("stephenville"),
  ],
  "lubbock-cooper-at-stephenville-2026-week-3": [
    noBoxScore("lubbock-cooper", true),
    {
      schoolSlug: "stephenville",
      categories: {
        quarterScoring: missingQuarterSplits,
        scoringPlays: missingScoringPlays,
        receiving: partial("Team passing totals are 16 completions for 248 yards; represented receiver lines total 16 receptions for 244 yards."),
      },
    },
  ],
  "santo-at-chilton-2026-week-1": [
    {
      ...noBoxScore("santo"),
      categories: { ...noBoxScore("santo").categories, quarterScoring: suppliedQuarterSplits },
    },
    {
      ...noBoxScore("chilton"),
      categories: { ...noBoxScore("chilton").categories, quarterScoring: suppliedQuarterSplits },
    },
  ],
  "santo-at-dublin-2026-week-2": [
    {
      ...noBoxScore("santo"),
      categories: { ...noBoxScore("santo").categories, quarterScoring: suppliedQuarterSplits },
    },
    {
      ...noBoxScore("dublin"),
      categories: { ...noBoxScore("dublin").categories, quarterScoring: suppliedQuarterSplits },
    },
  ],
  "haskell-at-santo-2026-week-3": [
    {
      ...noBoxScore("haskell"),
      categories: { ...noBoxScore("haskell").categories, quarterScoring: suppliedQuarterSplits },
    },
    {
      ...noBoxScore("santo"),
      categories: { ...noBoxScore("santo").categories, quarterScoring: suppliedQuarterSplits },
    },
  ],
  "goldthwaite-at-san-saba-2026-week-3": [
    {
      schoolSlug: "san-saba",
      categories: {
        passing: partial("Team totals are 6 completions on 10 attempts for 39 yards; the represented passer line is 4-of-7 for 24 yards."),
        receiving: partial("Team totals are 6 receptions for 39 yards; no receiver attribution is stored."),
      },
    },
  ],
};

function mergeCompleteness(
  current: TeamStatCompleteness[] = [],
  additions: TeamStatCompleteness[] = []
) {
  const bySchool = new Map(current.map((entry) => [entry.schoolSlug, entry]));
  for (const addition of additions) {
    const existing = bySchool.get(addition.schoolSlug);
    bySchool.set(addition.schoolSlug, {
      schoolSlug: addition.schoolSlug,
      categories: { ...existing?.categories, ...addition.categories },
    });
  }
  return Array.from(bySchool.values());
}

export function applyStatCompleteness(game: GameStats): GameStats {
  const additions = statCompletenessByGame[game.gameId];
  if (!additions) return game;
  return { ...game, completeness: mergeCompleteness(game.completeness, additions) };
}

export function getCategoryCompleteness(
  game: GameStats,
  schoolSlug: string,
  category: CoreStatCategory
): StatCompletenessDetail {
  return game.completeness?.find((entry) => entry.schoolSlug === schoolSlug)?.categories[category] ?? { status: "unknown" };
}
