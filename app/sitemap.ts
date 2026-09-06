import type { MetadataRoute } from "next";
import { schools } from "../data/schools";
import { districts } from "../data/districts";
import { getGames } from "../lib/games";
import { getArticles } from "../lib/articles";
import { getPlayerSeasonStats } from "../lib/player-stats";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://varsityvue.com";
  const games = getGames();
  const articles = getArticles();

  const featuredSchoolSlugs = new Set(
    schools
      .filter((school) => school.status === "pilot")
      .map((school) => school.slug)
  );
  const featuredDistrictIds = new Set(
    districts
      .filter((district) => district.status === "pilot")
      .map((district) => district.id)
  );
  const schoolDistrictBySlug = new Map(
    schools.map((school) => [school.slug, school.districtId])
  );
  const verifiedPlayers = getPlayerSeasonStats(2026).filter(
    (player) =>
      player.gamesRecorded > 0 &&
      featuredSchoolSlugs.has(player.schoolSlug)
  );
  const districtIdsWithVerifiedStats = new Set(
    verifiedPlayers
      .map((player) => schoolDistrictBySlug.get(player.schoolSlug))
      .filter((districtId): districtId is string => Boolean(districtId))
  );

  const staticRoutes = [
    "",
    "/scoreboard",
    "/schools",
    "/districts",
    "/games",
    "/coverage",
    "/stats",
    "/legacy",
    "/about",
    "/contact",
    "/submit",
    "/school-request",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: "daily" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  const schoolRoutes = schools
    .filter((school) => school.status === "pilot")
    .map((school) => ({
      url: `${baseUrl}/schools/${school.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));

  const districtRoutes = districts
    .filter((district) => district.status === "pilot")
    .map((district) => ({
      url: `${baseUrl}/districts/${district.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  const gameRoutes = games
    .filter(
      (game) =>
        game.gameType !== "scrimmage" &&
        game.gameType !== "bye" &&
        game.status !== "cancelled" &&
        game.status !== "postponed" &&
        ((game.homeSchoolSlug && featuredSchoolSlugs.has(game.homeSchoolSlug)) ||
          (game.awaySchoolSlug && featuredSchoolSlugs.has(game.awaySchoolSlug)))
    )
    .map((game) => ({
      url: `${baseUrl}/games/${game.id}`,
      changeFrequency: "daily" as const,
      priority: 0.85,
    }));

  const playerRoutes = verifiedPlayers.map((player) => ({
    url: `${baseUrl}/players/${player.playerId}`,
    changeFrequency: "weekly" as const,
    priority: 0.75,
  }));

  const districtStatRoutes = districts
    .filter(
      (district) =>
        featuredDistrictIds.has(district.id) &&
        districtIdsWithVerifiedStats.has(district.id)
    )
    .map((district) => ({
      url: `${baseUrl}/stats/districts/${district.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    }));

  const articleRoutes = articles.map((article) => {
    const publishedAt = new Date(article.publishedAt);
    const hasValidPublishedAt = !Number.isNaN(publishedAt.getTime());

    return {
      url: `${baseUrl}/coverage/${article.slug}`,
      ...(hasValidPublishedAt ? { lastModified: publishedAt } : {}),
      changeFrequency: "weekly" as const,
      priority: 0.75,
    };
  });

  return [
    ...staticRoutes,
    ...schoolRoutes,
    ...districtRoutes,
    ...gameRoutes,
    ...playerRoutes,
    ...districtStatRoutes,
    ...articleRoutes,
  ];
}
