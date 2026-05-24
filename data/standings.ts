import { getSchoolBySlug, getSchoolsByDistrictId } from "@/lib/pilotData";
import { games } from "@/data/games";

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

const demoRecords: Record<string, Omit<Standing, "schoolSlug" | "team">> = {
  "de-leon": {
    districtWins: 3,
    districtLosses: 1,
    overallWins: 7,
    overallLosses: 2,
    pointsFor: 284,
    pointsAgainst: 147,
  },
  cisco: {
    districtWins: 4,
    districtLosses: 0,
    overallWins: 8,
    overallLosses: 1,
    pointsFor: 326,
    pointsAgainst: 121,
  },
  hawley: {
    districtWins: 2,
    districtLosses: 2,
    overallWins: 6,
    overallLosses: 3,
    pointsFor: 244,
    pointsAgainst: 190,
  },
  hico: {
    districtWins: 1,
    districtLosses: 3,
    overallWins: 4,
    overallLosses: 5,
    pointsFor: 198,
    pointsAgainst: 252,
  },
  anson: {
    districtWins: 0,
    districtLosses: 4,
    overallWins: 2,
    overallLosses: 7,
    pointsFor: 143,
    pointsAgainst: 311,
  },
};

function emptyRecord(): Omit<Standing, "schoolSlug" | "team"> {
  return {
    districtWins: 0,
    districtLosses: 0,
    overallWins: 0,
    overallLosses: 0,
    pointsFor: 0,
    pointsAgainst: 0,
  };
}

function sortStandings(standings: Standing[]) {
  return standings.sort((a, b) => {
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
  const districtSchoolSlugs = districtSchools.map(
    (districtSchool) => districtSchool.slug
  );

  const baseStandings: Standing[] = districtSchools.map((districtSchool) => ({
    schoolSlug: districtSchool.slug,
    team: districtSchool.name,
    ...emptyRecord(),
  }));

  const finalGames = games.filter(
    (game) =>
      game.status === "final" &&
      game.gameType === "regular" &&
      game.homeScore !== undefined &&
      game.awayScore !== undefined &&
      (districtSchoolSlugs.includes(game.homeSchoolSlug) ||
        districtSchoolSlugs.includes(game.awaySchoolSlug))
  );

  if (finalGames.length === 0) {
    return sortStandings(
      districtSchools.map((districtSchool) => ({
        schoolSlug: districtSchool.slug,
        team: districtSchool.name,
        ...(demoRecords[districtSchool.slug] ?? emptyRecord()),
      }))
    );
  }

  finalGames.forEach((game) => {
    const homeStanding = baseStandings.find(
      (standing) => standing.schoolSlug === game.homeSchoolSlug
    );

    const awayStanding = baseStandings.find(
      (standing) => standing.schoolSlug === game.awaySchoolSlug
    );

    if (!homeStanding || !awayStanding) return;

    const homeWon = game.homeScore! > game.awayScore!;
    const awayWon = game.awayScore! > game.homeScore!;

    homeStanding.pointsFor += game.homeScore!;
    homeStanding.pointsAgainst += game.awayScore!;
    awayStanding.pointsFor += game.awayScore!;
    awayStanding.pointsAgainst += game.homeScore!;

    if (homeWon) {
      homeStanding.overallWins += 1;
      awayStanding.overallLosses += 1;
    }

    if (awayWon) {
      awayStanding.overallWins += 1;
      homeStanding.overallLosses += 1;
    }

    if (game.districtGame) {
      if (homeWon) {
        homeStanding.districtWins += 1;
        awayStanding.districtLosses += 1;
      }

      if (awayWon) {
        awayStanding.districtWins += 1;
        homeStanding.districtLosses += 1;
      }
    }
  });

  return sortStandings(baseStandings);
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