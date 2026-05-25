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
  const featuredArticle = articles[0];
  const secondaryArticles = articles.slice(1, 4);

  return (
    <section
      className="rounded-[1.75rem] border bg-white/[0.045] p-5 shadow-2xl sm:p-6"
      style={{
        borderColor: `${theme.secondary}22`,
        boxShadow: `0 18px 55px ${theme.primary}14`,
      }}
    >
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-white/70">
            School Coverage
          </p>
          <h2 className="mt-2 text-3xl font-black text-white">
            Latest Stories
          </h2>
        </div>

        <Link
          href="/coverage"
          className="rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white/70 transition hover:bg-white/10 hover:text-white"
          style={{
            borderColor: `${theme.secondary}33`,
            backgroundColor: "rgba(255,255,255,0.08)",
          }}
        >
          All Coverage →
        </Link>
      </div>

      {articles.length === 0 ? (
        <div
          className="rounded-3xl border bg-black/35 p-6"
          style={{ borderColor: `${theme.secondary}33` }}
        >
          <p className="text-lg font-black text-white">
            No school stories published yet.
          </p>
          <p className="mt-2 text-sm leading-6 text-white/50">
            Game previews, recaps, features, and school updates will appear here
            as coverage is added.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          {featuredArticle && (
            <Link
              href={`/coverage/${featuredArticle.slug}`}
              className="group relative overflow-hidden rounded-[1.75rem] border bg-black/35 p-6 shadow-2xl transition hover:-translate-y-1 hover:bg-white/[0.075]"
              style={{
                borderColor: `${theme.secondary}33`,
                boxShadow: `0 18px 55px ${theme.primary}18`,
              }}
            >
              <div
                className="absolute inset-0 opacity-30 transition group-hover:opacity-45"
                style={{
                  background: `radial-gradient(circle at top left, ${theme.primary}, transparent 55%)`,
                }}
              />

              <div className="relative">
                <p
                  className="inline-flex rounded-full border bg-black/35 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-white/75"
                  style={{ borderColor: `${theme.secondary}33` }}
                >
                  {formatArticleType(featuredArticle.type)}
                </p>

                <h3 className="mt-5 text-3xl font-black leading-tight text-white sm:text-4xl">
                  {featuredArticle.title}
                </h3>

                {featuredArticle.subtitle && (
                  <p className="mt-3 text-lg font-semibold text-white/55">
                    {featuredArticle.subtitle}
                  </p>
                )}

                <p className="mt-5 max-w-2xl leading-7 text-white/65">
                  {featuredArticle.excerpt}
                </p>

                <div
                  className="mt-7 h-1 w-24 rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})`,
                  }}
                />

                <div className="mt-7 flex flex-wrap items-center gap-4">
                  <p className="text-sm font-black uppercase tracking-[0.16em] text-white/70">
                    Read story →
                  </p>

                  <p className="text-sm text-white/40">
                    {formatArticleDate(featuredArticle.publishedAt)}
                  </p>
                </div>
              </div>
            </Link>
          )}

          <div className="grid gap-3">
            {secondaryArticles.length > 0 ? (
              secondaryArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/coverage/${article.slug}`}
                  className="rounded-2xl border bg-black/35 p-5 transition hover:bg-white/[0.07]"
                  style={{ borderColor: `${theme.secondary}22` }}
                >
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                    {formatArticleType(article.type)}
                  </p>

                  <h3 className="mt-3 text-xl font-black leading-tight text-white">
                    {article.title}
                  </h3>

                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/55">
                    {article.excerpt}
                  </p>

                  <p className="mt-4 text-xs text-white/35">
                    {formatArticleDate(article.publishedAt)}
                  </p>
                </Link>
              ))
            ) : (
              <div
                className="rounded-2xl border bg-black/35 p-5"
                style={{ borderColor: `${theme.secondary}22` }}
              >
                <p className="font-black text-white">
                  More school coverage coming soon.
                </p>
                <p className="mt-2 text-sm text-white/45">
                  Additional previews, recaps, and feature stories will appear
                  here.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}