import type { MetadataRoute } from "next";
import { schools } from "../data/schools";
import { games } from "../data/games";
import { articles } from "../data/articles";
import { districts } from "../data/districts";
import { getPlayerSeasonStats } from "../lib/player-stats";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://varsityvue.com";

  const now = new Date();
  const pilotSchoolSlugs = new Set(
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
      pilotSchoolSlugs.has(player.schoolSlug)
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
    "/school-request",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  const schoolRoutes = schools
    .filter((school) => school.status === "pilot")
    .map((school) => ({
      url: `${baseUrl}/schools/${school.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));

  const districtRoutes = districts
    .filter((district) => district.status === "pilot")
    .map((district) => ({
      url: `${baseUrl}/districts/${district.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  const gameRoutes = games
    .filter(
      (game) =>
        game.gameType !== "scrimmage" &&
        game.gameType !== "bye" &&
        ((game.homeSchoolSlug && pilotSchoolSlugs.has(game.homeSchoolSlug)) ||
          (game.awaySchoolSlug && pilotSchoolSlugs.has(game.awaySchoolSlug)))
    )
    .map((game) => ({
      url: `${baseUrl}/games/${game.id}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.85,
    }));

  const playerRoutes = verifiedPlayers.map((player) => ({
    url: `${baseUrl}/players/${player.playerId}`,
    lastModified: now,
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
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    }));

  const articleRoutes = articles.map((article) => ({
    url: `${baseUrl}/coverage/${article.slug}`,
    lastModified: article.publishedAt
      ? new Date(article.publishedAt)
      : now,
    changeFrequency: "weekly" as const,
    priority: 0.75,
  }));

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
