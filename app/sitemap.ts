import { schools } from "../data/schools";
import { games } from "../data/games";
import { articles } from "../data/articles";
import { districts } from "../data/districts";

export default function sitemap() {
  const baseUrl = "https://varsityvue.com";

  const staticRoutes = [
    "",
    "/schools",
    "/districts",
    "/games",
    "/coverage",
    "/sponsors",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
  }));

  const schoolRoutes = schools.map((school) => ({
    url: `${baseUrl}/schools/${school.slug}`,
    lastModified: new Date(),
  }));

  const districtRoutes = districts.map((district) => ({
    url: `${baseUrl}/districts/${district.slug}`,
    lastModified: new Date(),
  }));

  const gameRoutes = games.map((game) => ({
    url: `${baseUrl}/games/${game.id}`,
    lastModified: new Date(),
  }));

  const articleRoutes = articles.map((article) => ({
    url: `${baseUrl}/coverage/${article.slug}`,
    lastModified: new Date(),
  }));

  return [
    ...staticRoutes,
    ...schoolRoutes,
    ...districtRoutes,
    ...gameRoutes,
    ...articleRoutes,
  ];
}