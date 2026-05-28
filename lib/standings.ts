import { games } from "@/data/games";
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

function sortStandings(standings: Standing[]) {
  return [...standings].sort((a, b) => {
    if (b.districtWins !== a.districtWins) {
      return b.districtWins - a.districtWins;
    }

    if (a.districtLosses !== b.districtLosses) {
      return a.districtLosses - b.districtLosses;
    }

    if (b.overallWins !== a.overallWins) {
      return b.overallWins - a.overallWins;
    }

    const aDiff = a.pointsFor - a.pointsAgainst;
    const bDiff = b.pointsFor - b.pointsAgainst;

    return bDiff - aDiff;
  });
}

function buildStandingsForDistrict(districtId: string): Standing[] {
  const districtSchools = getSchoolsByDistrictId(districtId);
  const districtSchoolSlugs = new Set(
    districtSchools.map((school) => school.slug)
  );

  const standingsMap = new Map<string, Standing>();

  districtSchools.forEach((school) => {
    standingsMap.set(school.slug, emptyStanding(school.slug, school.name));
  });

  const finalGames = games.filter((game) => {
    if (game.status !== "final") return false;
    if (game.gameType === "bye" || game.gameType === "scrimmage") return false;
    if (typeof game.homeScore !== "number") return false;
    if (typeof game.awayScore !== "number") return false;

    return (
      districtSchoolSlugs.has(game.homeSchoolSlug ?? "") ||
      districtSchoolSlugs.has(game.awaySchoolSlug ?? "")
    );
  });

  finalGames.forEach((game) => {
    const homeSlug = game.homeSchoolSlug;
    const awaySlug = game.awaySchoolSlug;

    if (!homeSlug || !awaySlug) return;

    const homeStanding = standingsMap.get(homeSlug);
    const awayStanding = standingsMap.get(awaySlug);

    const homeScore = game.homeScore;
    const awayScore = game.awayScore;

    if (typeof homeScore !== "number" || typeof awayScore !== "number") return;
    if (homeScore === awayScore) return;

    const homeWon = homeScore > awayScore;
    const awayWon = awayScore > homeScore;

    if (homeStanding) {
      homeStanding.pointsFor += homeScore;
      homeStanding.pointsAgainst += awayScore;

      if (homeWon) homeStanding.overallWins += 1;
      if (awayWon) homeStanding.overallLosses += 1;

      if (game.districtGame) {
        if (homeWon) homeStanding.districtWins += 1;
        if (awayWon) homeStanding.districtLosses += 1;
      }
    }

    if (awayStanding) {
      awayStanding.pointsFor += awayScore;
      awayStanding.pointsAgainst += homeScore;

      if (awayWon) awayStanding.overallWins += 1;
      if (homeWon) awayStanding.overallLosses += 1;

      if (game.districtGame) {
        if (awayWon) awayStanding.districtWins += 1;
        if (homeWon) awayStanding.districtLosses += 1;
      }
    }
  });

  return sortStandings(Array.from(standingsMap.values()));
}

export function getStandingsForSchool(slug: string): Standing[] {
  const school = getSchoolBySlug(slug);

  if (!school) {
    return [];
  }

  return buildStandingsForDistrict(school.districtId);
}

export function getStandingsForDistrictId(districtId: string): Standing[] {
  return buildStandingsForDistrict(districtId);
}