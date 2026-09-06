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

export function getArticles() {
  return sortNewestFirst(articles);
}

export function getLatestArticles(limit = 3) {
  return sortNewestFirst(articles).slice(0, limit);
}

export function getArticleBySlug(slug: string) {
  return articles.find((article) => article.slug === slug);
}

export function getArticlesForSchool(schoolIdOrSlug: string) {
  return sortNewestFirst(
    articles.filter((article) => article.schoolIds?.includes(schoolIdOrSlug))
  );
}

export function getArticlesForDistrict(districtId: string) {
  return sortNewestFirst(
    articles.filter((article) => article.districtIds?.includes(districtId))
  );
}
