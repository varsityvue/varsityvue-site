import type { Game } from "@/types/platform";

type GameInput = {
  id: string;
  week: number;
  kickoff: string;
  homeSchoolSlug: string;
  homeTeam: string;
  awaySchoolSlug: string;
  awayTeam: string;
  district?: boolean;
  homeScore?: number;
  awayScore?: number;
  period?: string;
  resultType?: "played" | "forfeit";
  officialWinnerSchoolSlug?: string;
};

const sourceLabel = "Owner-supplied 2026 schedule";

function game(input: GameInput): Game {
  const final = input.resultType === "forfeit" ||
    (typeof input.homeScore === "number" && typeof input.awayScore === "number");
  const districtGame = input.district ?? false;
  return {
    id: input.id,
    season: 2026,
    week: input.week,
    gameType: districtGame ? "district" : "regular",
    status: final ? "final" : "upcoming",
    homeSchoolSlug: input.homeSchoolSlug,
    homeTeam: input.homeTeam,
    awaySchoolSlug: input.awaySchoolSlug,
    awayTeam: input.awayTeam,
    kickoff: input.kickoff,
    districtGame,
    homeScore: input.homeScore,
    awayScore: input.awayScore,
    score: typeof input.homeScore === "number" && typeof input.awayScore === "number"
      ? { home: input.homeScore, away: input.awayScore, period: input.period ?? "Final" }
      : undefined,
    resultType: input.resultType ?? (final ? "played" : undefined),
    officialWinnerSchoolSlug: input.officialWinnerSchoolSlug,
    coverageStatus: "none",
    sourceStatus: final ? "verified" : "uploaded-schedule",
    sourceLabel,
  };
}

const g = (input: GameInput) => game(input);

// Existing IDs are retained for corrections. Existing editorial, venue, media,
// and source metadata are retained by the merge in lib/games.ts.
export const ownerVerifiedScheduleCorrections: Game[] = [
  g({ id: "bruceville-eddy-at-cross-plains-2026-week-1", week: 1, kickoff: "2026-08-28T19:00:00-05:00", homeSchoolSlug: "cross-plains", homeTeam: "Cross Plains", awaySchoolSlug: "bruceville-eddy", awayTeam: "Bruceville-Eddy", homeScore: 27, awayScore: 26, period: "Final (OT)" }),
  g({ id: "baird-vs-abilene-tlca-2026-week-1", week: 1, kickoff: "2026-08-28T19:00:00-05:00", homeSchoolSlug: "abilene-texas-leadership", homeTeam: "Abilene Texas Leadership", awaySchoolSlug: "baird", awayTeam: "Baird", homeScore: 46, awayScore: 22 }),
  g({ id: "comanche-at-cisco-2026-week-2", week: 2, kickoff: "2026-09-04T22:00:00-05:00", homeSchoolSlug: "cisco", homeTeam: "Cisco", awaySchoolSlug: "comanche", awayTeam: "Comanche", homeScore: 38, awayScore: 6 }),
  g({ id: "reagan-county-at-miles-2026-week-3", week: 3, kickoff: "2026-09-11T19:00:00-05:00", homeSchoolSlug: "miles", homeTeam: "Miles", awaySchoolSlug: "reagan-county", awayTeam: "Reagan County", homeScore: 43, awayScore: 45, period: "Final (OT)" }),
  g({ id: "winters-at-san-angelo-tlca-2026-week-3", week: 3, kickoff: "2026-09-10T19:00:00-05:00", homeSchoolSlug: "san-angelo-texas-leadership", homeTeam: "San Angelo Texas Leadership Charter Academy", awaySchoolSlug: "winters", awayTeam: "Winters", homeScore: 42, awayScore: 0 }),
  g({ id: "albany-at-coleman-2026-week-4", week: 4, kickoff: "2026-09-18T19:00:00-05:00", homeSchoolSlug: "coleman", homeTeam: "Coleman", awaySchoolSlug: "albany", awayTeam: "Albany", homeScore: 8, awayScore: 31 }),
  g({ id: "cisco-at-stamford-2026-week-4", week: 4, kickoff: "2026-09-18T19:00:00-05:00", homeSchoolSlug: "stamford", homeTeam: "Stamford", awaySchoolSlug: "cisco", awayTeam: "Cisco", homeScore: 27, awayScore: 7 }),
  g({ id: "comanche-at-clifton-2026-week-4", week: 4, kickoff: "2026-09-18T19:00:00-05:00", homeSchoolSlug: "clifton", homeTeam: "Clifton", awaySchoolSlug: "comanche", awayTeam: "Comanche", district: true, homeScore: 14, awayScore: 21 }),
  g({ id: "de-leon-at-goldthwaite-2026-week-4", week: 4, kickoff: "2026-09-18T19:00:00-05:00", homeSchoolSlug: "goldthwaite", homeTeam: "Goldthwaite", awaySchoolSlug: "de-leon", awayTeam: "De Leon", homeScore: 24, awayScore: 13 }),
  g({ id: "early-at-hawley-2026-week-4", week: 4, kickoff: "2026-09-18T19:00:00-05:00", homeSchoolSlug: "hawley", homeTeam: "Hawley", awaySchoolSlug: "early", awayTeam: "Early", homeScore: 14, awayScore: 21 }),
  g({ id: "stephenville-at-abilene-wylie-2026-week-4", week: 4, kickoff: "2026-09-18T19:00:00-05:00", homeSchoolSlug: "abilene-wylie", homeTeam: "Abilene Wylie", awaySchoolSlug: "stephenville", awayTeam: "Stephenville", homeScore: 23, awayScore: 42 }),
];

export const ownerVerifiedScheduleAdditions: Game[] = [
  // 2A Division II, Region II, District 7.
  g({ id: "cross-plains-at-baird-2026-week-4", week: 4, kickoff: "2026-09-18T19:00:00-05:00", homeSchoolSlug: "baird", homeTeam: "Baird", awaySchoolSlug: "cross-plains", awayTeam: "Cross Plains", resultType: "forfeit", officialWinnerSchoolSlug: "cross-plains" }),
  g({ id: "munday-at-hamlin-2026-week-4", week: 4, kickoff: "2026-09-18T19:00:00-05:00", homeSchoolSlug: "hamlin", homeTeam: "Hamlin", awaySchoolSlug: "munday", awayTeam: "Munday", homeScore: 23, awayScore: 57 }),
  g({ id: "miles-at-eldorado-2026-week-4", week: 4, kickoff: "2026-09-18T19:00:00-05:00", homeSchoolSlug: "eldorado", homeTeam: "Eldorado", awaySchoolSlug: "miles", awayTeam: "Miles", homeScore: 22, awayScore: 28 }),
  g({ id: "hamlin-at-cross-plains-2026-week-5", week: 5, kickoff: "2026-09-25T19:00:00-05:00", homeSchoolSlug: "cross-plains", homeTeam: "Cross Plains", awaySchoolSlug: "hamlin", awayTeam: "Hamlin", district: true }),
  g({ id: "miles-at-winters-2026-week-7", week: 7, kickoff: "2026-10-09T19:00:00-05:00", homeSchoolSlug: "winters", homeTeam: "Winters", awaySchoolSlug: "miles", awayTeam: "Miles", district: true }),
  g({ id: "winters-at-hamlin-2026-week-8", week: 8, kickoff: "2026-10-16T19:00:00-05:00", homeSchoolSlug: "hamlin", homeTeam: "Hamlin", awaySchoolSlug: "winters", awayTeam: "Winters", district: true }),
  g({ id: "hamlin-at-miles-2026-week-9", week: 9, kickoff: "2026-10-23T19:00:00-05:00", homeSchoolSlug: "miles", homeTeam: "Miles", awaySchoolSlug: "hamlin", awayTeam: "Hamlin", district: true }),
  g({ id: "winters-at-cross-plains-2026-week-10", week: 10, kickoff: "2026-10-30T19:00:00-05:00", homeSchoolSlug: "cross-plains", homeTeam: "Cross Plains", awaySchoolSlug: "winters", awayTeam: "Winters", district: true }),
  g({ id: "cross-plains-at-miles-2026-week-11", week: 11, kickoff: "2026-11-06T19:00:00-06:00", homeSchoolSlug: "miles", homeTeam: "Miles", awaySchoolSlug: "cross-plains", awayTeam: "Cross Plains", district: true }),

  // 3A Division II, Region II, District 5.
  g({ id: "eastland-at-dublin-2026-week-4", week: 4, kickoff: "2026-09-18T19:00:00-05:00", homeSchoolSlug: "dublin", homeTeam: "Dublin", awaySchoolSlug: "eastland", awayTeam: "Eastland", district: true, homeScore: 14, awayScore: 55 }),
  g({ id: "millsap-at-tolar-2026-week-4", week: 4, kickoff: "2026-09-18T19:00:00-05:00", homeSchoolSlug: "tolar", homeTeam: "Tolar", awaySchoolSlug: "millsap", awayTeam: "Millsap", district: true, homeScore: 40, awayScore: 44 }),
  g({ id: "rio-vista-at-hamilton-2026-week-4", week: 4, kickoff: "2026-09-18T19:00:00-05:00", homeSchoolSlug: "hamilton", homeTeam: "Hamilton", awaySchoolSlug: "rio-vista", awayTeam: "Rio Vista", district: true, homeScore: 34, awayScore: 38 }),
  g({ id: "dublin-at-millsap-2026-week-5", week: 5, kickoff: "2026-09-25T19:00:00-05:00", homeSchoolSlug: "millsap", homeTeam: "Millsap", awaySchoolSlug: "dublin", awayTeam: "Dublin", district: true }),
  g({ id: "hamilton-at-eastland-2026-week-5", week: 5, kickoff: "2026-09-25T19:00:00-05:00", homeSchoolSlug: "eastland", homeTeam: "Eastland", awaySchoolSlug: "hamilton", awayTeam: "Hamilton", district: true }),
  g({ id: "clifton-at-rio-vista-2026-week-5", week: 5, kickoff: "2026-09-25T19:00:00-05:00", homeSchoolSlug: "rio-vista", homeTeam: "Rio Vista", awaySchoolSlug: "clifton", awayTeam: "Clifton", district: true }),
  g({ id: "dublin-at-hamilton-2026-week-7", week: 7, kickoff: "2026-10-09T19:00:00-05:00", homeSchoolSlug: "hamilton", homeTeam: "Hamilton", awaySchoolSlug: "dublin", awayTeam: "Dublin", district: true }),
  g({ id: "eastland-at-clifton-2026-week-7", week: 7, kickoff: "2026-10-09T19:00:00-05:00", homeSchoolSlug: "clifton", homeTeam: "Clifton", awaySchoolSlug: "eastland", awayTeam: "Eastland", district: true }),
  g({ id: "rio-vista-at-tolar-2026-week-7", week: 7, kickoff: "2026-10-09T19:00:00-05:00", homeSchoolSlug: "tolar", homeTeam: "Tolar", awaySchoolSlug: "rio-vista", awayTeam: "Rio Vista", district: true }),
  g({ id: "tolar-at-eastland-2026-week-8", week: 8, kickoff: "2026-10-16T19:00:00-05:00", homeSchoolSlug: "eastland", homeTeam: "Eastland", awaySchoolSlug: "tolar", awayTeam: "Tolar", district: true }),
  g({ id: "clifton-at-hamilton-2026-week-8", week: 8, kickoff: "2026-10-16T19:00:00-05:00", homeSchoolSlug: "hamilton", homeTeam: "Hamilton", awaySchoolSlug: "clifton", awayTeam: "Clifton", district: true }),
  g({ id: "millsap-at-rio-vista-2026-week-8", week: 8, kickoff: "2026-10-16T19:00:00-05:00", homeSchoolSlug: "rio-vista", homeTeam: "Rio Vista", awaySchoolSlug: "millsap", awayTeam: "Millsap", district: true }),
  g({ id: "dublin-at-clifton-2026-week-9", week: 9, kickoff: "2026-10-23T19:00:00-05:00", homeSchoolSlug: "clifton", homeTeam: "Clifton", awaySchoolSlug: "dublin", awayTeam: "Dublin", district: true }),
  g({ id: "eastland-at-millsap-2026-week-9", week: 9, kickoff: "2026-10-23T19:00:00-05:00", homeSchoolSlug: "millsap", homeTeam: "Millsap", awaySchoolSlug: "eastland", awayTeam: "Eastland", district: true }),
  g({ id: "hamilton-at-tolar-2026-week-9", week: 9, kickoff: "2026-10-23T19:00:00-05:00", homeSchoolSlug: "tolar", homeTeam: "Tolar", awaySchoolSlug: "hamilton", awayTeam: "Hamilton", district: true }),
  g({ id: "rio-vista-at-dublin-2026-week-10", week: 10, kickoff: "2026-10-30T19:00:00-05:00", homeSchoolSlug: "dublin", homeTeam: "Dublin", awaySchoolSlug: "rio-vista", awayTeam: "Rio Vista", district: true }),
  g({ id: "millsap-at-hamilton-2026-week-10", week: 10, kickoff: "2026-10-30T19:00:00-05:00", homeSchoolSlug: "hamilton", homeTeam: "Hamilton", awaySchoolSlug: "millsap", awayTeam: "Millsap", district: true }),
  g({ id: "tolar-at-clifton-2026-week-10", week: 10, kickoff: "2026-10-30T19:00:00-05:00", homeSchoolSlug: "clifton", homeTeam: "Clifton", awaySchoolSlug: "tolar", awayTeam: "Tolar", district: true }),
  g({ id: "dublin-at-tolar-2026-week-11", week: 11, kickoff: "2026-11-06T19:00:00-06:00", homeSchoolSlug: "tolar", homeTeam: "Tolar", awaySchoolSlug: "dublin", awayTeam: "Dublin", district: true }),
  g({ id: "eastland-at-rio-vista-2026-week-11", week: 11, kickoff: "2026-11-06T19:00:00-06:00", homeSchoolSlug: "rio-vista", homeTeam: "Rio Vista", awaySchoolSlug: "eastland", awayTeam: "Eastland", district: true }),
  g({ id: "clifton-at-millsap-2026-week-11", week: 11, kickoff: "2026-11-06T19:00:00-06:00", homeSchoolSlug: "millsap", homeTeam: "Millsap", awaySchoolSlug: "clifton", awayTeam: "Clifton", district: true }),

  // 2A Division I, Region II, District 5.
  g({ id: "chico-at-abilene-texas-leadership-2026-week-5", week: 5, kickoff: "2026-09-25T19:00:00-05:00", homeSchoolSlug: "abilene-texas-leadership", homeTeam: "Abilene Texas Leadership", awaySchoolSlug: "chico", awayTeam: "Chico" }),
  g({ id: "breckenridge-at-anson-2026-week-5", week: 5, kickoff: "2026-09-25T19:00:00-05:00", homeSchoolSlug: "anson", homeTeam: "Anson", awaySchoolSlug: "breckenridge", awayTeam: "Breckenridge" }),
  g({ id: "anson-at-abilene-tlca-2026-week-8", week: 8, kickoff: "2026-10-16T19:00:00-05:00", homeSchoolSlug: "abilene-texas-leadership", homeTeam: "Abilene Texas Leadership", awaySchoolSlug: "anson", awayTeam: "Anson", district: true }),

  // 3A Division II, Region I, District 4.
  g({ id: "iowa-park-at-henrietta-2026-week-1", week: 1, kickoff: "2026-08-28T19:00:00-05:00", homeSchoolSlug: "henrietta", homeTeam: "Henrietta", awaySchoolSlug: "iowa-park", awayTeam: "Iowa Park", homeScore: 35, awayScore: 34 }),
  g({ id: "holliday-at-windthorst-2026-week-1", week: 1, kickoff: "2026-08-28T19:00:00-05:00", homeSchoolSlug: "windthorst", homeTeam: "Windthorst", awaySchoolSlug: "holliday", awayTeam: "Holliday", homeScore: 49, awayScore: 43 }),
  g({ id: "whitesboro-at-city-view-2026-week-1", week: 1, kickoff: "2026-08-28T19:00:00-05:00", homeSchoolSlug: "city-view", homeTeam: "City View", awaySchoolSlug: "whitesboro", awayTeam: "Whitesboro", homeScore: 26, awayScore: 40 }),
  g({ id: "early-at-breckenridge-2026-week-2", week: 2, kickoff: "2026-09-04T19:00:00-05:00", homeSchoolSlug: "breckenridge", homeTeam: "Breckenridge", awaySchoolSlug: "early", awayTeam: "Early", homeScore: 18, awayScore: 47 }),
  g({ id: "henrietta-at-marlow-2026-week-2", week: 2, kickoff: "2026-09-04T19:00:00-05:00", homeSchoolSlug: "marlow", homeTeam: "Marlow", awaySchoolSlug: "henrietta", awayTeam: "Henrietta", homeScore: 35, awayScore: 6 }),
  g({ id: "holliday-at-muenster-2026-week-2", week: 2, kickoff: "2026-09-04T19:00:00-05:00", homeSchoolSlug: "muenster", homeTeam: "Muenster", awaySchoolSlug: "holliday", awayTeam: "Holliday", homeScore: 54, awayScore: 21 }),
  g({ id: "windthorst-at-city-view-2026-week-2", week: 2, kickoff: "2026-09-04T19:00:00-05:00", homeSchoolSlug: "city-view", homeTeam: "City View", awaySchoolSlug: "windthorst", awayTeam: "Windthorst", homeScore: 14, awayScore: 48 }),
  g({ id: "merkel-at-colorado-city-2026-week-3", week: 3, kickoff: "2026-09-11T19:00:00-05:00", homeSchoolSlug: "colorado-city", homeTeam: "Colorado", awaySchoolSlug: "merkel", awayTeam: "Merkel", homeScore: 27, awayScore: 53 }),
  g({ id: "henrietta-at-boyd-2026-week-3", week: 3, kickoff: "2026-09-11T19:00:00-05:00", homeSchoolSlug: "boyd", homeTeam: "Boyd", awaySchoolSlug: "henrietta", awayTeam: "Henrietta", homeScore: 26, awayScore: 41 }),
  g({ id: "iowa-park-at-holliday-2026-week-3", week: 3, kickoff: "2026-09-11T19:00:00-05:00", homeSchoolSlug: "holliday", homeTeam: "Holliday", awaySchoolSlug: "iowa-park", awayTeam: "Iowa Park", homeScore: 8, awayScore: 27 }),
  g({ id: "city-view-at-vernon-2026-week-3", week: 3, kickoff: "2026-09-11T19:00:00-05:00", homeSchoolSlug: "vernon", homeTeam: "Vernon", awaySchoolSlug: "city-view", awayTeam: "City View", homeScore: 40, awayScore: 10 }),
  g({ id: "compass-academy-at-merkel-2026-week-4", week: 4, kickoff: "2026-09-18T19:00:00-05:00", homeSchoolSlug: "merkel", homeTeam: "Merkel", awaySchoolSlug: "compass-academy", awayTeam: "Compass Academy", homeScore: 47, awayScore: 30 }),
  g({ id: "windthorst-at-henrietta-2026-week-4", week: 4, kickoff: "2026-09-18T19:00:00-05:00", homeSchoolSlug: "henrietta", homeTeam: "Henrietta", awaySchoolSlug: "windthorst", awayTeam: "Windthorst", homeScore: 21, awayScore: 49 }),
  g({ id: "clyde-at-breckenridge-2026-week-4", week: 4, kickoff: "2026-09-18T19:00:00-05:00", homeSchoolSlug: "breckenridge", homeTeam: "Breckenridge", awaySchoolSlug: "clyde", awayTeam: "Clyde", homeScore: 18, awayScore: 42 }),
  g({ id: "childress-at-holliday-2026-week-4", week: 4, kickoff: "2026-09-18T19:00:00-05:00", homeSchoolSlug: "holliday", homeTeam: "Holliday", awaySchoolSlug: "childress", awayTeam: "Childress", homeScore: 45, awayScore: 46 }),
  g({ id: "city-view-at-iowa-park-2026-week-4", week: 4, kickoff: "2026-09-18T19:00:00-05:00", homeSchoolSlug: "iowa-park", homeTeam: "Iowa Park", awaySchoolSlug: "city-view", awayTeam: "City View", homeScore: 45, awayScore: 0 }),
  g({ id: "san-angelo-texas-leadership-at-merkel-2026-week-5", week: 5, kickoff: "2026-09-25T19:00:00-05:00", homeSchoolSlug: "merkel", homeTeam: "Merkel", awaySchoolSlug: "san-angelo-texas-leadership", awayTeam: "San Angelo Texas Leadership Charter Academy" }),
  g({ id: "bridgeport-at-henrietta-2026-week-5", week: 5, kickoff: "2026-09-25T19:00:00-05:00", homeSchoolSlug: "henrietta", homeTeam: "Henrietta", awaySchoolSlug: "bridgeport", awayTeam: "Bridgeport" }),
  g({ id: "holliday-at-whitesboro-2026-week-5", week: 5, kickoff: "2026-09-25T19:00:00-05:00", homeSchoolSlug: "whitesboro", homeTeam: "Whitesboro", awaySchoolSlug: "holliday", awayTeam: "Holliday" }),
  g({ id: "bowie-at-city-view-2026-week-5", week: 5, kickoff: "2026-09-25T19:00:00-05:00", homeSchoolSlug: "city-view", homeTeam: "City View", awaySchoolSlug: "bowie", awayTeam: "Bowie" }),
  g({ id: "city-view-at-breckenridge-2026-week-7", week: 7, kickoff: "2026-10-09T19:00:00-05:00", homeSchoolSlug: "breckenridge", homeTeam: "Breckenridge", awaySchoolSlug: "city-view", awayTeam: "City View", district: true }),
  g({ id: "henrietta-at-holliday-2026-week-7", week: 7, kickoff: "2026-10-09T19:00:00-05:00", homeSchoolSlug: "holliday", homeTeam: "Holliday", awaySchoolSlug: "henrietta", awayTeam: "Henrietta", district: true }),
  g({ id: "merkel-at-henrietta-2026-week-8", week: 8, kickoff: "2026-10-16T19:00:00-05:00", homeSchoolSlug: "henrietta", homeTeam: "Henrietta", awaySchoolSlug: "merkel", awayTeam: "Merkel", district: true }),
  g({ id: "holliday-at-city-view-2026-week-8", week: 8, kickoff: "2026-10-16T19:00:00-05:00", homeSchoolSlug: "city-view", homeTeam: "City View", awaySchoolSlug: "holliday", awayTeam: "Holliday", district: true }),
  g({ id: "breckenridge-at-holliday-2026-week-9", week: 9, kickoff: "2026-10-23T19:00:00-05:00", homeSchoolSlug: "holliday", homeTeam: "Holliday", awaySchoolSlug: "breckenridge", awayTeam: "Breckenridge", district: true }),
  g({ id: "city-view-at-merkel-2026-week-9", week: 9, kickoff: "2026-10-23T19:00:00-05:00", homeSchoolSlug: "merkel", homeTeam: "Merkel", awaySchoolSlug: "city-view", awayTeam: "City View", district: true }),
  g({ id: "merkel-at-breckenridge-2026-week-10", week: 10, kickoff: "2026-10-30T19:00:00-05:00", homeSchoolSlug: "breckenridge", homeTeam: "Breckenridge", awaySchoolSlug: "merkel", awayTeam: "Merkel", district: true }),
  g({ id: "henrietta-at-city-view-2026-week-10", week: 10, kickoff: "2026-10-30T19:00:00-05:00", homeSchoolSlug: "city-view", homeTeam: "City View", awaySchoolSlug: "henrietta", awayTeam: "Henrietta", district: true }),
  g({ id: "holliday-at-merkel-2026-week-11", week: 11, kickoff: "2026-11-06T19:00:00-06:00", homeSchoolSlug: "merkel", homeTeam: "Merkel", awaySchoolSlug: "holliday", awayTeam: "Holliday", district: true }),
  g({ id: "breckenridge-at-henrietta-2026-week-11", week: 11, kickoff: "2026-11-06T19:00:00-06:00", homeSchoolSlug: "henrietta", homeTeam: "Henrietta", awaySchoolSlug: "breckenridge", awayTeam: "Breckenridge", district: true }),
];

// A bye is intentionally represented by the absence of a game row.
export const removedRepositoryByeGameIds = new Set([
  "albany-bye-2026-week-5",
  "cisco-bye-2026-week-6",
  "comanche-bye-2026-week-6",
  "de-leon-bye-2026-week-6",
  "goldthwaite-bye-2026-week-11",
  "hawley-bye-2026-week-6",
  "hico-bye-2026-week-6",
  "jacksboro-bye-2026-week-6",
  "stamford-bye-2026-week-9",
]);
