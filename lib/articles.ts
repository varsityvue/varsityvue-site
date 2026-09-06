import { articles } from "@/data/articles";

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
