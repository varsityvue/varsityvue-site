import { getSchoolBySlug, getSchoolsByDistrictId } from "@/lib/pilotData";

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

const mockRecords: Record<
  string,
  {
    districtWins: number;
    districtLosses: number;
    overallWins: number;
    overallLosses: number;
    pointsFor: number;
    pointsAgainst: number;
  }
> = {
  "de-leon": {
    districtWins: 3,
    districtLosses: 1,
    overallWins: 7,
    overallLosses: 2,
    pointsFor: 284,
    pointsAgainst: 147,
  },
  comanche: {
    districtWins: 4,
    districtLosses: 0,
    overallWins: 8,
    overallLosses: 1,
    pointsFor: 326,
    pointsAgainst: 121,
  },
  hamilton: {
    districtWins: 2,
    districtLosses: 2,
    overallWins: 5,
    overallLosses: 4,
    pointsFor: 221,
    pointsAgainst: 209,
  },
  goldthwaite: {
    districtWins: 1,
    districtLosses: 3,
    overallWins: 4,
    overallLosses: 5,
    pointsFor: 198,
    pointsAgainst: 252,
  },
  "san-saba": {
    districtWins: 0,
    districtLosses: 4,
    overallWins: 2,
    overallLosses: 7,
    pointsFor: 143,
    pointsAgainst: 311,
  },
};

export function getStandingsForSchool(slug: string): Standing[] {
  const school = getSchoolBySlug(slug);

  if (!school) {
    return [];
  }

  const districtSchools = getSchoolsByDistrictId(school.districtId);

  const standings = districtSchools.map((districtSchool) => {
    const record = mockRecords[districtSchool.slug] ?? {
      districtWins: 0,
      districtLosses: 0,
      overallWins: 0,
      overallLosses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
    };

    return {
      schoolSlug: districtSchool.slug,
      team: districtSchool.name,
      ...record,
    };
  });

  return standings.sort((a, b) => {
    if (b.districtWins !== a.districtWins) {
      return b.districtWins - a.districtWins;
    }

    const aDiff = a.pointsFor - a.pointsAgainst;
    const bDiff = b.pointsFor - b.pointsAgainst;

    return bDiff - aDiff;
  });
}