import { games } from "@/data/games";

export function getSchoolRecord(slug: string) {
  const relevantGames = games.filter(
    (game) =>
      game.status === "final" &&
      game.gameType !== "bye" &&
      game.homeScore !== undefined &&
      game.awayScore !== undefined &&
      (game.homeSchoolSlug === slug || game.awaySchoolSlug === slug)
  );

  let wins = 0;
  let losses = 0;

  relevantGames.forEach((game) => {
    const isHome = game.homeSchoolSlug === slug;

    const teamScore = isHome ? game.homeScore! : game.awayScore!;
    const oppScore = isHome ? game.awayScore! : game.homeScore!;

    if (teamScore > oppScore) wins++;
    else if (teamScore < oppScore) losses++;
  });

  return {
    wins,
    losses,
    record: `${wins}-${losses}`,
  };
}