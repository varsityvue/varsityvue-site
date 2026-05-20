export type GameStatus = "upcoming" | "live" | "final";
export type GameType = "scrimmage" | "regular" | "playoff" | "bye";

export type Game = {
  id: string;
  season: number;
  week: number;

  gameType: GameType;

  homeSchoolSlug: string;
  awaySchoolSlug: string;

  homeTeam: string;
  awayTeam: string;

  venue: string;
  kickoff: string;

  status: GameStatus;

  districtGame?: boolean;
  specialEvent?: string;
  livestreamUrl?: string;
  recapArticleSlug?: string;

  homeScore?: number;
  awayScore?: number;
};

export const games: Game[] = [
  {
    id: "de-leon-at-santo-2026-scrimmage-1",
    season: 2026,
    week: 0,
    gameType: "scrimmage",
    homeSchoolSlug: "santo",
    awaySchoolSlug: "de-leon",
    homeTeam: "Santo",
    awayTeam: "De Leon",
    venue: "Santo",
    kickoff: "2026-08-14T18:00:00-05:00",
    status: "upcoming",
    districtGame: false,
  },
  {
    id: "rio-vista-at-de-leon-2026-scrimmage-2",
    season: 2026,
    week: 0,
    gameType: "scrimmage",
    homeSchoolSlug: "de-leon",
    awaySchoolSlug: "rio-vista",
    homeTeam: "De Leon",
    awayTeam: "Rio Vista",
    venue: "Bearcat Stadium",
    kickoff: "2026-08-20T18:00:00-05:00",
    status: "upcoming",
    districtGame: false,
  },
  {
    id: "san-saba-at-de-leon-2026-week-1",
    season: 2026,
    week: 1,
    gameType: "regular",
    homeSchoolSlug: "de-leon",
    awaySchoolSlug: "san-saba",
    homeTeam: "De Leon",
    awayTeam: "San Saba",
    venue: "Bearcat Stadium",
    kickoff: "2026-08-28T19:00:00-05:00",
    status: "upcoming",
    districtGame: false,
    specialEvent: "Sr. Night",
  },
  {
    id: "de-leon-at-stamford-2026-week-2",
    season: 2026,
    week: 2,
    gameType: "regular",
    homeSchoolSlug: "stamford",
    awaySchoolSlug: "de-leon",
    homeTeam: "Stamford",
    awayTeam: "De Leon",
    venue: "Stamford",
    kickoff: "2026-09-04T19:00:00-05:00",
    status: "upcoming",
    districtGame: false,
  },
  {
    id: "albany-at-de-leon-2026-week-3",
    season: 2026,
    week: 3,
    gameType: "regular",
    homeSchoolSlug: "de-leon",
    awaySchoolSlug: "albany",
    homeTeam: "De Leon",
    awayTeam: "Albany",
    venue: "Bearcat Stadium",
    kickoff: "2026-09-11T19:00:00-05:00",
    status: "upcoming",
    districtGame: false,
    specialEvent: "First Responders Night",
  },
  {
    id: "de-leon-at-goldthwaite-2026-week-4",
    season: 2026,
    week: 4,
    gameType: "regular",
    homeSchoolSlug: "goldthwaite",
    awaySchoolSlug: "de-leon",
    homeTeam: "Goldthwaite",
    awayTeam: "De Leon",
    venue: "Goldthwaite",
    kickoff: "2026-09-18T19:00:00-05:00",
    status: "upcoming",
    districtGame: false,
  },
  {
    id: "early-at-de-leon-2026-week-5",
    season: 2026,
    week: 5,
    gameType: "regular",
    homeSchoolSlug: "de-leon",
    awaySchoolSlug: "early",
    homeTeam: "De Leon",
    awayTeam: "Early",
    venue: "Bearcat Stadium",
    kickoff: "2026-09-25T19:00:00-05:00",
    status: "upcoming",
    districtGame: false,
    specialEvent: "Homecoming",
  },
  {
    id: "de-leon-bye-2026-week-6",
    season: 2026,
    week: 6,
    gameType: "bye",
    homeSchoolSlug: "de-leon",
    awaySchoolSlug: "bye",
    homeTeam: "De Leon",
    awayTeam: "BYE",
    venue: "N/A",
    kickoff: "2026-10-02T19:00:00-05:00",
    status: "upcoming",
    districtGame: false,
  },
  {
    id: "de-leon-at-hawley-2026-week-7",
    season: 2026,
    week: 7,
    gameType: "regular",
    homeSchoolSlug: "hawley",
    awaySchoolSlug: "de-leon",
    homeTeam: "Hawley",
    awayTeam: "De Leon",
    venue: "Hawley",
    kickoff: "2026-10-09T19:00:00-05:00",
    status: "upcoming",
    districtGame: true,
  },
  {
    id: "hico-at-de-leon-2026-week-8",
    season: 2026,
    week: 8,
    gameType: "regular",
    homeSchoolSlug: "de-leon",
    awaySchoolSlug: "hico",
    homeTeam: "De Leon",
    awayTeam: "Hico",
    venue: "Bearcat Stadium",
    kickoff: "2026-10-16T19:00:00-05:00",
    status: "upcoming",
    districtGame: true,
    specialEvent: "Pink Out",
  },
  {
    id: "de-leon-at-anson-2026-week-9",
    season: 2026,
    week: 9,
    gameType: "regular",
    homeSchoolSlug: "anson",
    awaySchoolSlug: "de-leon",
    homeTeam: "Anson",
    awayTeam: "De Leon",
    venue: "Anson",
    kickoff: "2026-10-23T19:00:00-05:00",
    status: "upcoming",
    districtGame: true,
  },
  {
    id: "abilene-texas-leadership-at-de-leon-2026-week-10",
    season: 2026,
    week: 10,
    gameType: "regular",
    homeSchoolSlug: "de-leon",
    awaySchoolSlug: "abilene-texas-leadership",
    homeTeam: "De Leon",
    awayTeam: "Abilene Texas Leadership",
    venue: "Bearcat Stadium",
    kickoff: "2026-10-30T19:00:00-05:00",
    status: "upcoming",
    districtGame: true,
    specialEvent: "5/6th Official Visit",
  },
  {
    id: "de-leon-at-cisco-2026-week-11",
    season: 2026,
    week: 11,
    gameType: "regular",
    homeSchoolSlug: "cisco",
    awaySchoolSlug: "de-leon",
    homeTeam: "Cisco",
    awayTeam: "De Leon",
    venue: "Cisco",
    kickoff: "2026-11-06T19:00:00-06:00",
    status: "upcoming",
    districtGame: true,
  },
];

export function getGamesForSchool(slug: string) {
  return games.filter(
    (game) => game.homeSchoolSlug === slug || game.awaySchoolSlug === slug
  );
}

export function getUpcomingGamesForSchool(slug: string) {
  return getGamesForSchool(slug).filter(
    (game) => game.status === "upcoming" && game.gameType !== "bye"
  );
}

export function getRecentScoresForSchool(slug: string) {
  return getGamesForSchool(slug)
    .filter((game) => game.status === "final" && game.gameType !== "bye")
    .sort(
      (a, b) =>
        new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime()
    );
}

export function getGameById(id: string) {
  return games.find((game) => game.id === id);
}