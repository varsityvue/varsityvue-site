import Link from "next/link";
import { articles } from "../../data/articles";
import type { Article } from "@/types/platform";

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

export default function CoveragePage() {
  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#d65a6d] sm:text-sm">
          VarsityVue Coverage
        </p>

        <h1 className="mt-4 text-4xl font-black leading-tight sm:text-6xl lg:text-7xl">
          Coverage
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-white/60 sm:text-xl">
          Game previews, recaps, athlete spotlights, and weekly storylines from
          the VarsityVue network.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/coverage/${article.slug}`}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg transition hover:-translate-y-1 hover:bg-white/[0.08]"
            >
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#d65a6d]">
                {formatArticleType(article.type)}
              </p>

              <h2 className="mt-4 text-3xl font-black leading-tight">
                {article.title}
              </h2>

              {article.subtitle && (
                <p className="mt-3 text-lg text-white/55">
                  {article.subtitle}
                </p>
              )}

              <p className="mt-4 leading-7 text-white/70">
                {article.excerpt}
              </p>

              <div className="mt-6 h-1 w-20 rounded-full bg-gradient-to-r from-[#7A1022] to-[#d65a6d]" />

              <p className="mt-6 text-sm font-bold text-[#d65a6d]">
                Read story →
              </p>

              <p className="mt-3 text-sm text-white/40">
                {formatArticleDate(article.publishedAt)}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}