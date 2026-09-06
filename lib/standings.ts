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
};

type RecordOverride = Pick<
  Standing,
  "overallWins" | "overallLosses" | "districtWins" | "districtLosses"
>;

// Verified record-only data for teams whose complete game results have not yet
// been ingested into VarsityVue. These values affect W-L records only; points
// for/against continue to come exclusively from individual verified game data.
const verifiedRecordOverrides: Record<string, RecordOverride> = {
  hamlin: { overallWins: 1, overallLosses: 1, districtWins: 0, districtLosses: 0 },
  miles: { overallWins: 1, overallLosses: 1, districtWins: 0, districtLosses: 0 },
  winters: { overallWins: 0, overallLosses: 2, districtWins: 0, districtLosses: 0 },
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

  standing.pointsFor += pointsFor;
  standing.pointsAgainst += pointsAgainst;

  if (won) standing.overallWins += 1;
  else standing.overallLosses += 1;

  if (game.districtGame) {
    if (won) standing.districtWins += 1;
    else standing.districtLosses += 1;
  }
}

function applyVerifiedRecordOverride(standing: Standing) {
  const override = verifiedRecordOverrides[standing.schoolSlug];
  if (!override) return;

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

function buildStandingsForDistrict(districtId: string): Standing[] {
  const districtSchools = getSchoolsByDistrictId(districtId);
  const standingsMap = new Map<string, Standing>();

  districtSchools.forEach((school) => {
    standingsMap.set(school.slug, emptyStanding(school.slug, school.name));
  });

  games.forEach((game) => {
    standingsMap.forEach((standing, schoolSlug) => {
      applyGameToStanding(standing, schoolSlug, game);
    });
  });

  standingsMap.forEach((standing) => applyVerifiedRecordOverride(standing));

  return sortStandings(Array.from(standingsMap.values()));
}

function buildStandaloneStanding(slug: string): Standing | undefined {
  const school = getSchoolBySlug(slug);
  const matchingGames = games.filter(
    (game) => game.homeSchoolSlug === slug || game.awaySchoolSlug === slug
  );

  if (!school && matchingGames.length === 0) return undefined;

  const teamName =
    school?.name ??
    matchingGames.find((game) => game.homeSchoolSlug === slug)?.homeTeam ??
    matchingGames.find((game) => game.awaySchoolSlug === slug)?.awayTeam ??
    slug;

  const standing = emptyStanding(slug, teamName);
  matchingGames.forEach((game) => applyGameToStanding(standing, slug, game));
  applyVerifiedRecordOverride(standing);
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
