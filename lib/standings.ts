import { getGames } from "@/lib/games";
import { getSchoolBySlug, getSchoolsByDistrictId } from "@/lib/schools";

export type Standing = {
  schoolSlug: string;
  team: string;
  districtWins: number;
  districtLosses: number;
  overallWins: number;
  overallLosses: number;
  pointsFor: number;
  pointsAgainst: number;
  overallRecordKnown: boolean;
};

type RecordOverride = Pick<
  Standing,
  "overallWins" | "overallLosses" | "districtWins" | "districtLosses"
>;

type VerifiedStandingOverride = RecordOverride & {
  pointsFor?: number;
  pointsAgainst?: number;
  throughWeek?: number;
};

// Verified manual data for teams whose complete game results have not yet been
// ingested into VarsityVue. Record-only entries fill W-L gaps. Full snapshots
// provide a verified baseline through a specific week, then newer game rows are
// layered on top so the snapshot can never hide later results.
const verifiedStandingOverrides: Record<string, VerifiedStandingOverride> = {
  hamlin: { overallWins: 1, overallLosses: 1, districtWins: 0, districtLosses: 0 },
  miles: { overallWins: 1, overallLosses: 1, districtWins: 0, districtLosses: 0 },
  winters: { overallWins: 0, overallLosses: 2, districtWins: 0, districtLosses: 0 },

  // District 5-3A Division II, verified through Week 2.
  // Week 3+ finals are layered on top automatically from the game feed.
  comanche: { overallWins: 1, overallLosses: 1, districtWins: 0, districtLosses: 0, pointsFor: 34, pointsAgainst: 44, throughWeek: 2 },
  eastland: { overallWins: 0, overallLosses: 2, districtWins: 0, districtLosses: 0, pointsFor: 25, pointsAgainst: 61, throughWeek: 2 },
  hamilton: { overallWins: 0, overallLosses: 2, districtWins: 0, districtLosses: 0, pointsFor: 65, pointsAgainst: 72, throughWeek: 2 },
  tolar: { overallWins: 0, overallLosses: 2, districtWins: 0, districtLosses: 0, pointsFor: 52, pointsAgainst: 88, throughWeek: 2 },
  dublin: { overallWins: 0, overallLosses: 2, districtWins: 0, districtLosses: 0, pointsFor: 7, pointsAgainst: 103, throughWeek: 2 },
  clifton: { overallWins: 2, overallLosses: 0, districtWins: 0, districtLosses: 0, pointsFor: 56, pointsAgainst: 41, throughWeek: 2 },
  millsap: { overallWins: 1, overallLosses: 1, districtWins: 0, districtLosses: 0, pointsFor: 47, pointsAgainst: 65, throughWeek: 2 },
  "rio-vista": { overallWins: 1, overallLosses: 1, districtWins: 0, districtLosses: 0, pointsFor: 76, pointsAgainst: 56, throughWeek: 2 },

  // Santo 2026 schedule opponents, verified through Week 2.
  crawford: { overallWins: 1, overallLosses: 1, districtWins: 0, districtLosses: 0, pointsFor: 28, pointsAgainst: 20, throughWeek: 2 },
  frost: { overallWins: 2, overallLosses: 0, districtWins: 0, districtLosses: 0, pointsFor: 64, pointsAgainst: 29, throughWeek: 2 },
  hubbard: { overallWins: 2, overallLosses: 0, districtWins: 0, districtLosses: 0, pointsFor: 61, pointsAgainst: 42, throughWeek: 2 },
  mart: { overallWins: 0, overallLosses: 2, districtWins: 0, districtLosses: 0, pointsFor: 0, pointsAgainst: 84, throughWeek: 2 },
  meridian: { overallWins: 1, overallLosses: 1, districtWins: 0, districtLosses: 0, pointsFor: 45, pointsAgainst: 58, throughWeek: 2 },
  wortham: { overallWins: 1, overallLosses: 1, districtWins: 0, districtLosses: 0, pointsFor: 63, pointsAgainst: 54, throughWeek: 2 },
  haskell: { overallWins: 1, overallLosses: 1, districtWins: 0, districtLosses: 0, pointsFor: 124, pointsAgainst: 124, throughWeek: 2 },
  roscoe: { overallWins: 0, overallLosses: 2, districtWins: 0, districtLosses: 0, pointsFor: 41, pointsAgainst: 73, throughWeek: 2 },

  // Stephenville 2026 district opponents, verified through Week 2.
  lampasas: { overallWins: 1, overallLosses: 1, districtWins: 0, districtLosses: 0, pointsFor: 53, pointsAgainst: 33, throughWeek: 2 },
  jarrell: { overallWins: 2, overallLosses: 0, districtWins: 0, districtLosses: 0, pointsFor: 93, pointsAgainst: 31, throughWeek: 2 },
  "marble-falls": { overallWins: 1, overallLosses: 1, districtWins: 0, districtLosses: 0, pointsFor: 68, pointsAgainst: 81, throughWeek: 2 },
  burnet: { overallWins: 0, overallLosses: 2, districtWins: 0, districtLosses: 0, pointsFor: 61, pointsAgainst: 87, throughWeek: 2 },
  "china-spring": { overallWins: 1, overallLosses: 1, districtWins: 0, districtLosses: 0, pointsFor: 68, pointsAgainst: 41, throughWeek: 2 },
};

const games = getGames();

function emptyStanding(schoolSlug: string, team: string): Standing {
  return {
    schoolSlug,
    team,
    districtWins: 0,
    districtLosses: 0,
    overallWins: 0,
    overallLosses: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    overallRecordKnown: false,
  };
}

function isCountableFinal(game: (typeof games)[number]) {
  return (
    game.status === "final" &&
    game.gameType !== "bye" &&
    game.gameType !== "scrimmage" &&
    typeof game.homeScore === "number" &&
    typeof game.awayScore === "number" &&
    game.homeScore !== game.awayScore
  );
}

function applyGameToStanding(
  standing: Standing,
  schoolSlug: string,
  game: (typeof games)[number]
) {
  if (!isCountableFinal(game)) return;

  const isHome = game.homeSchoolSlug === schoolSlug;
  const isAway = game.awaySchoolSlug === schoolSlug;
  if (!isHome && !isAway) return;

  const homeScore = game.homeScore as number;
  const awayScore = game.awayScore as number;
  const pointsFor = isHome ? homeScore : awayScore;
  const pointsAgainst = isHome ? awayScore : homeScore;
  const won = pointsFor > pointsAgainst;

  standing.overallRecordKnown = true;
  standing.pointsFor += pointsFor;
  standing.pointsAgainst += pointsAgainst;

  if (won) standing.overallWins += 1;
  else standing.overallLosses += 1;

  if (game.districtGame) {
    if (won) standing.districtWins += 1;
    else standing.districtLosses += 1;
  }
}

function applyVerifiedStandingOverride(standing: Standing) {
  const override = verifiedStandingOverrides[standing.schoolSlug];
  if (!override) return;

  standing.overallRecordKnown = true;

  const throughWeek = override.throughWeek;
  if (
    typeof override.pointsFor === "number" &&
    typeof override.pointsAgainst === "number" &&
    typeof throughWeek === "number"
  ) {
    // Treat a full manual snapshot as the verified baseline through its week,
    // then add only newer finals. This prevents both double counting old games
    // and hiding Week 3+ results when earlier individual game rows are missing.
    standing.overallWins = override.overallWins;
    standing.overallLosses = override.overallLosses;
    standing.districtWins = override.districtWins;
    standing.districtLosses = override.districtLosses;
    standing.pointsFor = override.pointsFor;
    standing.pointsAgainst = override.pointsAgainst;

    for (const game of games) {
      if (typeof game.week === "number" && game.week > throughWeek) {
        applyGameToStanding(standing, standing.schoolSlug, game);
      }
    }
    return;
  }

  const derivedGames = standing.overallWins + standing.overallLosses;
  const overrideGames = override.overallWins + override.overallLosses;

  // Record-only overrides still fill gaps only while fewer complete results
  // are present. Once equal or newer game data exists, derived data wins.
  if (derivedGames >= overrideGames) return;

  standing.overallWins = override.overallWins;
  standing.overallLosses = override.overallLosses;
  standing.districtWins = override.districtWins;
  standing.districtLosses = override.districtLosses;
}

function hasDistrictResults(standings: Standing[]) {
  return standings.some(
    (standing) => standing.districtWins > 0 || standing.districtLosses > 0
  );
}

function sortStandings(standings: Standing[]) {
  if (!hasDistrictResults(standings)) {
    return [...standings].sort((a, b) => a.team.localeCompare(b.team));
  }

  return [...standings].sort((a, b) => {
    if (b.districtWins !== a.districtWins) return b.districtWins - a.districtWins;
    if (a.districtLosses !== b.districtLosses) return a.districtLosses - b.districtLosses;
    return a.team.localeCompare(b.team);
  });
}

function addScheduledDistrictOpponents(
  standingsMap: Map<string, Standing>,
  districtSchoolSlugs: Set<string>
) {
  for (const game of games) {
    if (!game.districtGame) continue;

    const homeIsDistrictSchool = Boolean(
      game.homeSchoolSlug && districtSchoolSlugs.has(game.homeSchoolSlug)
    );
    const awayIsDistrictSchool = Boolean(
      game.awaySchoolSlug && districtSchoolSlugs.has(game.awaySchoolSlug)
    );

    if (homeIsDistrictSchool && game.awaySchoolSlug && game.awayTeam) {
      if (!standingsMap.has(game.awaySchoolSlug)) {
        standingsMap.set(
          game.awaySchoolSlug,
          emptyStanding(game.awaySchoolSlug, game.awayTeam)
        );
      }
    }

    if (awayIsDistrictSchool && game.homeSchoolSlug && game.homeTeam) {
      if (!standingsMap.has(game.homeSchoolSlug)) {
        standingsMap.set(
          game.homeSchoolSlug,
          emptyStanding(game.homeSchoolSlug, game.homeTeam)
        );
      }
    }
  }
}

function buildStandingsForDistrict(districtId: string): Standing[] {
  const districtSchools = getSchoolsByDistrictId(districtId);
  const standingsMap = new Map<string, Standing>();

  districtSchools.forEach((school) => {
    standingsMap.set(school.slug, emptyStanding(school.slug, school.name));
  });

  addScheduledDistrictOpponents(
    standingsMap,
    new Set(districtSchools.map((school) => school.slug))
  );

  games.forEach((game) => {
    standingsMap.forEach((standing, schoolSlug) => {
      applyGameToStanding(standing, schoolSlug, game);
    });
  });

  standingsMap.forEach((standing) => applyVerifiedStandingOverride(standing));

  return sortStandings(Array.from(standingsMap.values()));
}

function buildStandaloneStanding(slug: string): Standing | undefined {
  const school = getSchoolBySlug(slug);
  const matchingGames = games.filter(
    (game) => game.homeSchoolSlug === slug || game.awaySchoolSlug === slug
  );

  const override = verifiedStandingOverrides[slug];
  if (!school && matchingGames.length === 0 && !override) return undefined;

  const teamName =
    school?.name ??
    matchingGames.find((game) => game.homeSchoolSlug === slug)?.homeTeam ??
    matchingGames.find((game) => game.awaySchoolSlug === slug)?.awayTeam ??
    slug;

  const standing = emptyStanding(slug, teamName);
  matchingGames.forEach((game) => applyGameToStanding(standing, slug, game));
  applyVerifiedStandingOverride(standing);
  return standing;
}

export function getStandingsForSchool(slug: string): Standing[] {
  const school = getSchoolBySlug(slug);

  if (!school) {
    const standing = buildStandaloneStanding(slug);
    return standing ? [standing] : [];
  }

  return buildStandingsForDistrict(school.districtId);
}

export function getStandingsForDistrictId(districtId: string): Standing[] {
  return buildStandingsForDistrict(districtId);
}

export function getStandingForSchool(slug: string): Standing | undefined {
  const school = getSchoolBySlug(slug);

  if (school) {
    const districtStanding = getStandingsForDistrictId(school.districtId).find(
      (standing) => standing.schoolSlug === slug
    );

    if (districtStanding) return districtStanding;
  }

  return buildStandaloneStanding(slug);
}
