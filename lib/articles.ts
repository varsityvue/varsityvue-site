import { goldthwaiteStamfordWeek10Gotw2026 } from "@/data/goldthwaite-stamford-week10-gotw-2026";
import { districtChampionshipChaseWeek9_2026 } from "@/data/district-championship-chase-week9-2026";
import { stephenvilleJarrellWeek9Gotw2026 } from "@/data/stephenville-jarrell-week9-gotw-2026";
import { articles as baseArticles } from "@/data/articles";
import { deLeonAlbanyFeature2026 } from "@/data/de-leon-albany-feature-2026";
import { district5Preview2026 } from "@/data/district-5-preview-2026";
import { week6DistrictRacesGuide2026 } from "@/data/week-6-district-races-guide-2026";
import { hicoDeLeonWeek8Gotw2026 } from "@/data/hico-de-leon-week8-gotw-2026";
import { albanyStamfordWeek7Gotw2026 } from "@/data/albany-stamford-week7-gotw-2026";

const articles = [goldthwaiteStamfordWeek10Gotw2026, districtChampionshipChaseWeek9_2026, stephenvilleJarrellWeek9Gotw2026, hicoDeLeonWeek8Gotw2026, albanyStamfordWeek7Gotw2026, week6DistrictRacesGuide2026, district5Preview2026, deLeonAlbanyFeature2026, ...baseArticles];

function getPublishedTimestamp(publishedAt: string) {
  const timestamp = new Date(publishedAt).getTime();
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
}

function sortNewestFirst<T extends { publishedAt: string }>(items: T[]) {
  return [...items].sort(
    (a, b) => getPublishedTimestamp(b.publishedAt) - getPublishedTimestamp(a.publishedAt)
  );
}

function getPublishedArticles() {
  return articles.filter((article) => article.humanReviewed === true);
}

export function getArticles() {
  return sortNewestFirst(getPublishedArticles());
}

export function getLatestArticles(limit = 3) {
  return sortNewestFirst(getPublishedArticles()).slice(0, limit);
}

export function getArticleBySlug(slug: string) {
  return getPublishedArticles().find((article) => article.slug === slug);
}

export function getPublishedGamePreview(gameId: string) {
  return sortNewestFirst(
    getPublishedArticles().filter((article) => article.gameId === gameId && article.type === "preview")
  )[0];
}

export function getArticlesForSchool(schoolIdOrSlug: string) {
  return sortNewestFirst(
    getPublishedArticles().filter((article) =>
      article.schoolIds?.includes(schoolIdOrSlug)
    )
  );
}

export function getArticlesForDistrict(districtId: string) {
  return sortNewestFirst(
    getPublishedArticles().filter((article) =>
      article.districtIds?.includes(districtId)
    )
  );
}

