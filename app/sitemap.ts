import type { MetadataRoute } from "next";
import { schools } from "../data/schools";
import { games } from "../data/games";
import { articles } from "../data/articles";
import { districts } from "../data/districts";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://varsityvue.com";

  const now = new Date();
  const pilotSchoolSlugs = new Set(
    schools
      .filter((school) => school.status === "pilot")
      .map((school) => school.slug)
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
    ...articleRoutes,
  ];
}
