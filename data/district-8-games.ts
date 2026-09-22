import type { Game } from "@/types/platform";

type FinalGameInput = {
  id: string;
  week: number;
  homeSchoolSlug: string;
  awaySchoolSlug: string;
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
  homeScore: number;
  awayScore: number;
  period?: string;
};

type DistrictGameInput = Omit<
  FinalGameInput,
  "homeScore" | "awayScore" | "period"
>;

function finalGame({ period = "Final", ...game }: FinalGameInput): Game {
  return {
    ...game,
    season: 2026,
    gameType: "regular",
    status: "final",
    districtGame: false,
    homeScore: game.homeScore,
    awayScore: game.awayScore,
    score: { home: game.homeScore, away: game.awayScore, period },
    coverageStatus: "none",
    sourceStatus: "verified",
    sourceLabel: "MaxPreps",
  };
}

function districtGame(game: DistrictGameInput): Game {
  return {
    ...game,
    season: 2026,
    gameType: "district",
    status: "upcoming",
    districtGame: true,
    coverageStatus: "none",
    sourceStatus: "uploaded-schedule",
    sourceLabel: "MaxPreps",
  };
}

// MaxPreps-sourced 2026 schedules for UIL 2A Division II District 8.
// A single canonical game is shared by both participating district schools.
export const district8Games: Game[] = [
  finalGame({ id: "hubbard-at-milano-2026-week-1", week: 1, homeSchoolSlug: "milano", awaySchoolSlug: "hubbard", homeTeam: "Milano", awayTeam: "Hubbard", kickoff: "2026-08-28T19:00:00-05:00", homeScore: 18, awayScore: 21 }),
  finalGame({ id: "frost-at-blooming-grove-2026-week-1", week: 1, homeSchoolSlug: "blooming-grove", awaySchoolSlug: "frost", homeTeam: "Blooming Grove", awayTeam: "Frost", kickoff: "2026-08-28T19:00:00-05:00", homeScore: 0, awayScore: 31 }),
  finalGame({ id: "crawford-at-mcgregor-2026-week-1", week: 1, homeSchoolSlug: "mcgregor", awaySchoolSlug: "crawford", homeTeam: "McGregor", awayTeam: "Crawford", kickoff: "2026-08-28T19:30:00-05:00", homeScore: 0, awayScore: 14 }),
  finalGame({ id: "whitney-at-mart-2026-week-1", week: 1, homeSchoolSlug: "mart", awaySchoolSlug: "whitney", homeTeam: "Mart", awayTeam: "Whitney", kickoff: "2026-08-28T19:00:00-05:00", homeScore: 0, awayScore: 40 }),
  finalGame({ id: "dawson-at-meridian-2026-week-1", week: 1, homeSchoolSlug: "meridian", awaySchoolSlug: "dawson", homeTeam: "Meridian", awayTeam: "Dawson", kickoff: "2026-08-28T19:00:00-05:00", homeScore: 25, awayScore: 19 }),
  finalGame({ id: "santo-at-chilton-2026-week-1", week: 1, homeSchoolSlug: "chilton", awaySchoolSlug: "santo", homeTeam: "Chilton", awayTeam: "Santo", kickoff: "2026-08-28T19:00:00-05:00", homeScore: 13, awayScore: 22 }),
  finalGame({ id: "wortham-at-valley-mills-2026-week-1", week: 1, homeSchoolSlug: "valley-mills", awaySchoolSlug: "wortham", homeTeam: "Valley Mills", awayTeam: "Wortham", kickoff: "2026-08-28T19:00:00-05:00", homeScore: 54, awayScore: 14 }),

  finalGame({ id: "snook-at-hubbard-2026-week-2", week: 2, homeSchoolSlug: "hubbard", awaySchoolSlug: "snook", homeTeam: "Hubbard", awayTeam: "Snook", kickoff: "2026-09-04T19:00:00-05:00", homeScore: 40, awayScore: 24 }),
  finalGame({ id: "itasca-at-frost-2026-week-2", week: 2, homeSchoolSlug: "frost", awaySchoolSlug: "itasca", homeTeam: "Frost", awayTeam: "Itasca", kickoff: "2026-09-04T19:00:00-05:00", homeScore: 33, awayScore: 29 }),
  finalGame({ id: "centerville-at-crawford-2026-week-2", week: 2, homeSchoolSlug: "crawford", awaySchoolSlug: "centerville", homeTeam: "Crawford", awayTeam: "Centerville", kickoff: "2026-09-04T19:30:00-05:00", homeScore: 14, awayScore: 20 }),
  finalGame({ id: "mart-at-axtell-2026-week-2", week: 2, homeSchoolSlug: "axtell", awaySchoolSlug: "mart", homeTeam: "Axtell", awayTeam: "Mart", kickoff: "2026-09-04T19:00:00-05:00", homeScore: 44, awayScore: 0 }),
  finalGame({ id: "cross-roads-at-meridian-2026-week-2", week: 2, homeSchoolSlug: "meridian", awaySchoolSlug: "cross-roads", homeTeam: "Meridian", awayTeam: "Cross Roads", kickoff: "2026-09-04T19:00:00-05:00", homeScore: 20, awayScore: 39 }),
  finalGame({ id: "santo-at-dublin-2026-week-2", week: 2, homeSchoolSlug: "dublin", awaySchoolSlug: "santo", homeTeam: "Dublin", awayTeam: "Santo", kickoff: "2026-09-04T19:00:00-05:00", homeScore: 0, awayScore: 61 }),
  finalGame({ id: "dawson-at-wortham-2026-week-2", week: 2, homeSchoolSlug: "wortham", awaySchoolSlug: "dawson", homeTeam: "Wortham", awayTeam: "Dawson", kickoff: "2026-09-04T19:00:00-05:00", homeScore: 49, awayScore: 0 }),

  finalGame({ id: "hubbard-at-dawson-2026-week-3", week: 3, homeSchoolSlug: "dawson", awaySchoolSlug: "hubbard", homeTeam: "Dawson", awayTeam: "Hubbard", kickoff: "2026-09-11T19:00:00-05:00", homeScore: 19, awayScore: 13 }),
  finalGame({ id: "riesel-at-frost-2026-week-3", week: 3, homeSchoolSlug: "frost", awaySchoolSlug: "riesel", homeTeam: "Frost", awayTeam: "Riesel", kickoff: "2026-09-11T19:00:00-05:00", homeScore: 10, awayScore: 34 }),
  finalGame({ id: "valley-mills-at-crawford-2026-week-3", week: 3, homeSchoolSlug: "crawford", awaySchoolSlug: "valley-mills", homeTeam: "Crawford", awayTeam: "Valley Mills", kickoff: "2026-09-11T19:30:00-05:00", homeScore: 39, awayScore: 6 }),
  finalGame({ id: "tolar-at-mart-2026-week-3", week: 3, homeSchoolSlug: "mart", awaySchoolSlug: "tolar", homeTeam: "Mart", awayTeam: "Tolar", kickoff: "2026-09-11T19:00:00-05:00", homeScore: 26, awayScore: 41 }),
  finalGame({ id: "itasca-at-meridian-2026-week-3", week: 3, homeSchoolSlug: "meridian", awaySchoolSlug: "itasca", homeTeam: "Meridian", awayTeam: "Itasca", kickoff: "2026-09-11T19:00:00-05:00", homeScore: 27, awayScore: 62 }),
  finalGame({ id: "haskell-at-santo-2026-week-3", week: 3, homeSchoolSlug: "santo", awaySchoolSlug: "haskell", homeTeam: "Santo", awayTeam: "Haskell", kickoff: "2026-09-11T19:00:00-05:00", homeScore: 42, awayScore: 44 }),
  finalGame({ id: "wortham-at-blooming-grove-2026-week-3", week: 3, homeSchoolSlug: "blooming-grove", awaySchoolSlug: "wortham", homeTeam: "Blooming Grove", awayTeam: "Wortham", kickoff: "2026-09-11T19:00:00-05:00", homeScore: 30, awayScore: 39 }),

  finalGame({ id: "bruceville-eddy-at-hubbard-2026-week-4", week: 4, homeSchoolSlug: "hubbard", awaySchoolSlug: "bruceville-eddy", homeTeam: "Hubbard", awayTeam: "Bruceville-Eddy", kickoff: "2026-09-18T19:00:00-05:00", homeScore: 6, awayScore: 48 }),
  finalGame({ id: "frost-at-dawson-2026-week-4", week: 4, homeSchoolSlug: "dawson", awaySchoolSlug: "frost", homeTeam: "Dawson", awayTeam: "Frost", kickoff: "2026-09-18T19:00:00-05:00", homeScore: 14, awayScore: 17 }),
  finalGame({ id: "crawford-at-marlin-2026-week-4", week: 4, homeSchoolSlug: "marlin", awaySchoolSlug: "crawford", homeTeam: "Marlin", awayTeam: "Crawford", kickoff: "2026-09-18T19:30:00-05:00", homeScore: 26, awayScore: 25, period: "Final (OT)" }),
  finalGame({ id: "mart-at-centerville-2026-week-4", week: 4, homeSchoolSlug: "centerville", awaySchoolSlug: "mart", homeTeam: "Centerville", awayTeam: "Mart", kickoff: "2026-09-18T19:30:00-05:00", homeScore: 14, awayScore: 28 }),
  finalGame({ id: "hico-at-meridian-2026-week-4", week: 4, homeSchoolSlug: "meridian", awaySchoolSlug: "hico", homeTeam: "Meridian", awayTeam: "Hico", kickoff: "2026-09-18T19:00:00-05:00", homeScore: 7, awayScore: 57 }),
  finalGame({ id: "roscoe-at-santo-2026-week-4", week: 4, homeSchoolSlug: "santo", awaySchoolSlug: "roscoe", homeTeam: "Santo", awayTeam: "Roscoe", kickoff: "2026-09-18T19:00:00-05:00", homeScore: 48, awayScore: 0 }),
  finalGame({ id: "rice-at-wortham-2026-week-4", week: 4, homeSchoolSlug: "wortham", awaySchoolSlug: "rice", homeTeam: "Wortham", awayTeam: "Rice", kickoff: "2026-09-18T19:00:00-05:00", homeScore: 35, awayScore: 39 }),

  districtGame({ id: "meridian-at-hubbard-2026-week-5", week: 5, homeSchoolSlug: "hubbard", awaySchoolSlug: "meridian", homeTeam: "Hubbard", awayTeam: "Meridian", kickoff: "2026-09-25T19:00:00-05:00" }),
  districtGame({ id: "crawford-at-santo-2026-week-5", week: 5, homeSchoolSlug: "santo", awaySchoolSlug: "crawford", homeTeam: "Santo", awayTeam: "Crawford", kickoff: "2026-09-25T19:00:00-05:00" }),
  districtGame({ id: "wortham-at-mart-2026-week-5", week: 5, homeSchoolSlug: "mart", awaySchoolSlug: "wortham", homeTeam: "Mart", awayTeam: "Wortham", kickoff: "2026-09-25T19:00:00-05:00" }),

  districtGame({ id: "hubbard-at-wortham-2026-week-6", week: 6, homeSchoolSlug: "wortham", awaySchoolSlug: "hubbard", homeTeam: "Wortham", awayTeam: "Hubbard", kickoff: "2026-10-02T19:00:00-05:00" }),
  districtGame({ id: "santo-at-frost-2026-week-6", week: 6, homeSchoolSlug: "frost", awaySchoolSlug: "santo", homeTeam: "Frost", awayTeam: "Santo", kickoff: "2026-10-02T19:00:00-05:00" }),
  districtGame({ id: "mart-at-crawford-2026-week-6", week: 6, homeSchoolSlug: "crawford", awaySchoolSlug: "mart", homeTeam: "Crawford", awayTeam: "Mart", kickoff: "2026-10-02T19:00:00-05:00" }),

  districtGame({ id: "crawford-at-hubbard-2026-week-7", week: 7, homeSchoolSlug: "hubbard", awaySchoolSlug: "crawford", homeTeam: "Hubbard", awayTeam: "Crawford", kickoff: "2026-10-09T19:00:00-05:00" }),
  districtGame({ id: "frost-at-mart-2026-week-7", week: 7, homeSchoolSlug: "mart", awaySchoolSlug: "frost", homeTeam: "Mart", awayTeam: "Frost", kickoff: "2026-10-09T19:00:00-05:00" }),
  districtGame({ id: "wortham-at-meridian-2026-week-7", week: 7, homeSchoolSlug: "meridian", awaySchoolSlug: "wortham", homeTeam: "Meridian", awayTeam: "Wortham", kickoff: "2026-10-09T19:00:00-05:00" }),

  districtGame({ id: "hubbard-at-frost-2026-week-8", week: 8, homeSchoolSlug: "frost", awaySchoolSlug: "hubbard", homeTeam: "Frost", awayTeam: "Hubbard", kickoff: "2026-10-16T19:00:00-05:00" }),
  districtGame({ id: "meridian-at-crawford-2026-week-8", week: 8, homeSchoolSlug: "crawford", awaySchoolSlug: "meridian", homeTeam: "Crawford", awayTeam: "Meridian", kickoff: "2026-10-16T19:00:00-05:00" }),
  districtGame({ id: "mart-at-santo-2026-week-8", week: 8, homeSchoolSlug: "santo", awaySchoolSlug: "mart", homeTeam: "Santo", awayTeam: "Mart", kickoff: "2026-10-16T19:00:00-05:00" }),

  districtGame({ id: "santo-at-hubbard-2026-week-9", week: 9, homeSchoolSlug: "hubbard", awaySchoolSlug: "santo", homeTeam: "Hubbard", awayTeam: "Santo", kickoff: "2026-10-23T19:00:00-05:00" }),
  districtGame({ id: "frost-at-meridian-2026-week-9", week: 9, homeSchoolSlug: "meridian", awaySchoolSlug: "frost", homeTeam: "Meridian", awayTeam: "Frost", kickoff: "2026-10-23T19:00:00-05:00" }),
  districtGame({ id: "crawford-at-wortham-2026-week-9", week: 9, homeSchoolSlug: "wortham", awaySchoolSlug: "crawford", homeTeam: "Wortham", awayTeam: "Crawford", kickoff: "2026-10-23T19:30:00-05:00" }),

  districtGame({ id: "hubbard-at-mart-2026-week-10", week: 10, homeSchoolSlug: "mart", awaySchoolSlug: "hubbard", homeTeam: "Mart", awayTeam: "Hubbard", kickoff: "2026-10-30T19:00:00-05:00" }),
  districtGame({ id: "wortham-at-frost-2026-week-10", week: 10, homeSchoolSlug: "frost", awaySchoolSlug: "wortham", homeTeam: "Frost", awayTeam: "Wortham", kickoff: "2026-10-30T19:00:00-05:00" }),
  districtGame({ id: "meridian-at-santo-2026-week-10", week: 10, homeSchoolSlug: "santo", awaySchoolSlug: "meridian", homeTeam: "Santo", awayTeam: "Meridian", kickoff: "2026-10-30T19:00:00-05:00" }),

  districtGame({ id: "frost-at-crawford-2026-week-11", week: 11, homeSchoolSlug: "crawford", awaySchoolSlug: "frost", homeTeam: "Crawford", awayTeam: "Frost", kickoff: "2026-11-06T19:30:00-06:00" }),
  districtGame({ id: "mart-at-meridian-2026-week-11", week: 11, homeSchoolSlug: "meridian", awaySchoolSlug: "mart", homeTeam: "Meridian", awayTeam: "Mart", kickoff: "2026-11-06T19:00:00-06:00" }),
  districtGame({ id: "santo-at-wortham-2026-week-11", week: 11, homeSchoolSlug: "wortham", awaySchoolSlug: "santo", homeTeam: "Wortham", awayTeam: "Santo", kickoff: "2026-11-06T19:00:00-06:00" }),
];
