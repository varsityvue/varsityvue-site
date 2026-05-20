import Link from "next/link";
import type { Article } from "@/types/platform";
import type { SchoolTheme } from "../types/school-theme";

type NewsFeedProps = {
  articles: Article[];
  theme: SchoolTheme;
};

function formatArticleDate(publishedAt: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Chicago",
  }).format(new Date(publishedAt));
}

function formatArticleType(type: Article["type"]) {
  const labels: Record<Article["type"], string> = {
    preview: "Game Preview",
    recap: "Game Recap",
    news: "News",
    feature: "Feature",
    legacy: "Legacy",
  };

  return labels[type];
}

export default function NewsFeed({ articles, theme }: NewsFeedProps) {
  return (
    <section className="pb-20">
      <div>
        <h2 className="mb-6 text-3xl font-black">Latest Coverage</h2>

        {articles.length === 0 ? (
          <div
            className="rounded-3xl border bg-white/5 p-6 text-white/60"
            style={{ borderColor: `${theme.secondary}33` }}
          >
            No articles available yet.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/coverage/${article.slug}`}
                className="rounded-3xl border bg-white/5 p-6 shadow-lg transition hover:-translate-y-1 hover:bg-white/[0.08]"
                style={{
                  borderColor: `${theme.secondary}33`,
                  boxShadow: `0 18px 50px ${theme.primary}22`,
                }}
              >
                <p
                  className="text-sm font-bold uppercase tracking-[0.25em]"
                  style={{ color: theme.accent }}
                >
                  {formatArticleType(article.type)}
                </p>

                <h3 className="mt-4 text-2xl font-black leading-tight">
                  {article.title}
                </h3>

                <p className="mt-4 leading-7 text-white/70">
                  {article.excerpt}
                </p>

                <div
                  className="mt-6 h-1 w-20 rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})`,
                  }}
                />

                <p
                  className="mt-6 text-sm font-bold transition"
                  style={{ color: theme.accent }}
                >
                  Read story →
                </p>

                <p className="mt-3 text-sm text-white/40">
                  {formatArticleDate(article.publishedAt)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}