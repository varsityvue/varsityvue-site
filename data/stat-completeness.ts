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
  "stamford-at-hawley-2026-week-3": [
    noBoxScore("hawley", true),
    {
      schoolSlug: "stamford",
      categories: {
        quarterScoring: missingQuarterSplits,
        scoringPlays: missingScoringPlays,
        rushing: partial("Rushing attempts and yards are complete in the supplied box score, but rushing touchdown attribution is not visible in the retained source."),
        receiving: partial("The supplied receiving table accounts for 23 receptions and all 350 receiving yards, while the passing table records 24 completions. Receiving touchdown attribution is not visible in the retained source."),
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
  "stephenville-at-abilene-wylie-2026-week-4": [
    {
      schoolSlug: "stephenville",
      categories: {
        quarterScoring: suppliedQuarterSplits,
        scoringPlays: missingScoringPlays,
        teamStats: complete("The supplied offensive team totals reconcile to 451 total yards."),
        rushing: complete("All supplied Stephenville rushing attempts and yards reconcile to the team totals."),
        passing: complete("The supplied passer line matches the team passing totals."),
        receiving: complete("The supplied receiving lines reconcile to 18 receptions for 197 yards and four touchdowns."),
      },
    },
    {
      ...noBoxScore("abilene-wylie"),
      categories: { ...noBoxScore("abilene-wylie").categories, quarterScoring: suppliedQuarterSplits },
    },
  ],
  "cisco-at-stamford-2026-week-4": [
    {
      schoolSlug: "cisco",
      categories: {
        quarterScoring: suppliedQuarterSplits,
        scoringPlays: missingScoringPlays,
        teamStats: complete("Cisco's supplied offensive team totals reconcile to 378 total yards."),
        rushing: complete("Cisco's player rushing lines reconcile to the team totals."),
        passing: complete("Cisco's passer lines reconcile to the team totals."),
        receiving: complete("Cisco's receiver lines reconcile to the team totals."),
      },
    },
    {
      schoolSlug: "stamford",
      categories: {
        quarterScoring: suppliedQuarterSplits,
        scoringPlays: missingScoringPlays,
        teamStats: partial("The supplied offensive totals reconcile to 425 yards, but the team interception total is unconfirmed."),
        rushing: complete("The supplied Stamford rushing attempts and yards reconcile to the team totals."),
        passing: partial("Miles Follis's completions, attempts, yards, and touchdowns are supplied; interceptions are unconfirmed."),
        receiving: partial("All 15 receptions and 214 yards are attributed, but the two receiving touchdown recipients are unknown."),
      },
    },
  ],
  "de-leon-at-goldthwaite-2026-week-4": [
    {
      schoolSlug: "de-leon",
      categories: {
        quarterScoring: suppliedQuarterSplits,
        scoringPlays: missingScoringPlays,
        teamStats: complete("The supplied De Leon offensive totals reconcile to 326 total yards."),
        rushing: complete("The supplied player lines reconcile to 41 carries for 220 yards and zero rushing touchdowns."),
        passing: complete("Hud Price's line matches the supplied team passing totals."),
        receiving: complete("The supplied receiver lines reconcile to 16 receptions for 106 yards and two touchdowns."),
      },
    },
    {
      schoolSlug: "goldthwaite",
      categories: {
        quarterScoring: suppliedQuarterSplits,
        scoringPlays: missingScoringPlays,
        teamStats: partial("Passing totals are supplied; a complete Goldthwaite rushing or total-offense line was not independently confirmed."),
        rushing: partial("Only the supplied Landry Sanderson and Hayes Greenway rushing lines are stored; they are not labeled as a complete team total."),
        passing: complete("Hayes Greenway's corrected 6-of-11 line supplies all Goldthwaite passing totals."),
        receiving: complete("The supplied receiving lines reconcile to six receptions for 61 yards."),
      },
    },
  ],
  "albany-at-coleman-2026-week-4": [
    {
      schoolSlug: "albany",
      categories: {
        quarterScoring: suppliedQuarterSplits,
        scoringPlays: missingScoringPlays,
        teamStats: partial("The supplied rushing and passing team totals are stored, but Albany's interception total is unconfirmed."),
        rushing: complete("All supplied Albany rushing attempts, yards, and touchdowns reconcile to the team totals."),
        passing: partial("Clay Chapman's completions, attempts, yards, and touchdowns are supplied; interceptions are unconfirmed."),
        receiving: complete("All supplied Albany receptions, yards, and touchdowns reconcile to the team totals."),
      },
    },
    {
      ...noBoxScore("coleman"),
      categories: { ...noBoxScore("coleman").categories, quarterScoring: suppliedQuarterSplits },
    },
  ],
  "clyde-at-comanche-2026-week-3": [
    noBoxScore("clyde", true),
    {
      schoolSlug: "comanche",
      categories: {
        quarterScoring: missingQuarterSplits,
        scoringPlays: missingScoringPlays,
        teamStats: complete("The supplied Comanche rushing and passing team totals are stored without deriving unsupplied fields."),
        rushing: complete("All supplied Comanche rushing attempts, yards, and touchdowns reconcile to the team totals."),
        passing: complete("Cooper Welch's line matches the supplied team passing totals."),
        receiving: complete("All supplied Comanche receptions, yards, and touchdowns reconcile to the team totals."),
      },
    },
  ],
  "comanche-at-clifton-2026-week-4": [
    {
      schoolSlug: "comanche",
      categories: {
        quarterScoring: suppliedQuarterSplits,
        scoringPlays: missingScoringPlays,
        teamStats: complete("The supplied Comanche rushing and passing team totals are stored without deriving unsupplied fields."),
        rushing: complete("All supplied Comanche rushing attempts, yards, and touchdowns reconcile to the team totals."),
        passing: complete("The supplied passer lines reconcile to the team totals, including zero passing touchdowns."),
        receiving: complete("All supplied Comanche receptions and yards reconcile to the team totals, with zero receiving touchdowns."),
      },
    },
    {
      ...noBoxScore("clifton"),
      categories: { ...noBoxScore("clifton").categories, quarterScoring: suppliedQuarterSplits },
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
