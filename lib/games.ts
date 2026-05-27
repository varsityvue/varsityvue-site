import { games } from "@/data/games";

export function getGames() {
  return games;
}

export function getGameById(id: string) {
  return games.find((game) => game.id === id);
}

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
        new Date(b.kickoff ?? "").getTime() -
        new Date(a.kickoff ?? "").getTime()
    );
}