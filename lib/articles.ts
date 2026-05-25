import { articles } from "@/data/articles";

export function getArticles() {
  return articles;
}

export function getLatestArticles(limit = 3) {
  return articles.slice(0, limit);
}

export function getArticleBySlug(slug: string) {
  return articles.find((article) => article.slug === slug);
}
export function getArticlesForSchool(schoolIdOrSlug: string) {
  return articles.filter((article) =>
    article.schoolIds?.includes(schoolIdOrSlug)
  );
}