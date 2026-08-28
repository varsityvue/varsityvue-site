import type { Article } from "@/types/platform";

// Publish only real, reviewed VarsityVue coverage here. Keeping this empty
// intentionally prevents demo or historical placeholder stories from being
// presented as current coverage.
export const articles: Article[] = [];

export function getArticlesForSchool(slug: string) {
  return articles
    .filter((article) => article.schoolIds?.includes(slug))
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() -
        new Date(a.publishedAt).getTime()
    );
}

export function getArticleBySlug(slug: string) {
  return articles.find((article) => article.slug === slug);
}

export function getArticlesForDistrict(districtId: string) {
  return articles
    .filter((article) => article.districtIds?.includes(districtId))
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() -
        new Date(a.publishedAt).getTime()
    );
}
