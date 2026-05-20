import Link from "next/link";
import { articles } from "../../data/articles";
import { sponsors } from "../../data/sponsors";
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
  const featuredArticle = articles[0];
  const latestArticles = articles.slice(1);
  const coverageSponsor = sponsors.find(
    (sponsor) =>
      sponsor.active &&
      sponsor.placementTypes.includes("directory")
  );

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#d65a6d] sm:text-sm">
            VarsityVue Coverage
          </p>

          <h1 className="mt-4 text-4xl font-black leading-tight sm:text-6xl lg:text-7xl">
            Coverage Hub
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/60 sm:text-xl">
            Game previews, recaps, athlete spotlights, rankings, and searchable
            sports coverage across the VarsityVue network.
          </p>
        </section>

        <section className="mt-12 grid gap-8 lg:grid-cols-[1.5fr_0.5fr]">
          {featuredArticle && (
            <Link
              href={`/coverage/${featuredArticle.slug}`}
              className="rounded-[2rem] border border-white/10 bg-white/5 p-8 transition hover:bg-white/[0.08]"
            >
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#d65a6d]">
                Featured Story
              </p>

              <p className="mt-4 text-sm font-bold uppercase tracking-[0.25em] text-white/45">
                {formatArticleType(featuredArticle.type)}
              </p>

              <h2 className="mt-5 text-4xl font-black leading-tight">
                {featuredArticle.title}
              </h2>

              {featuredArticle.subtitle && (
                <p className="mt-4 text-xl text-white/55">
                  {featuredArticle.subtitle}
                </p>
              )}

              <p className="mt-5 max-w-3xl leading-8 text-white/70">
                {featuredArticle.excerpt}
              </p>

              <p className="mt-8 text-sm font-bold text-[#d65a6d]">
                Read full story →
              </p>
            </Link>
          )}

          <aside className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#d65a6d]">
              Coverage Sponsor
            </p>

            <h3 className="mt-4 text-2xl font-black">
              {coverageSponsor
                ? coverageSponsor.name
                : "This placement is available"}
            </h3>

            <p className="mt-4 leading-7 text-white/60">
              Weekly rankings, previews, recaps, and editorial coverage sponsor
              inventory.
            </p>

            <Link
              href="/sponsors"
              className="mt-8 inline-flex rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold transition hover:bg-white/15"
            >
              Learn More
            </Link>
          </aside>
        </section>

        <section className="mt-12">
          <div className="flex flex-wrap gap-3">
            <FilterPill label="All Coverage" />
            <FilterPill label="Previews" />
            <FilterPill label="Recaps" />
            <FilterPill label="Features" />
            <FilterPill label="Legacy" />
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#d65a6d]">
                Latest Coverage
              </p>

              <h2 className="mt-3 text-3xl font-black">
                Recent Stories
              </h2>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {latestArticles.map((article) => (
              <Link
                key={article.id}
                href={`/coverage/${article.slug}`}
                className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg transition hover:-translate-y-1 hover:bg-white/[0.08]"
              >
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d65a6d]">
                  {formatArticleType(article.type)}
                </p>

                <h3 className="mt-4 text-2xl font-black leading-tight">
                  {article.title}
                </h3>

                {article.subtitle && (
                  <p className="mt-3 text-white/55">
                    {article.subtitle}
                  </p>
                )}

                <p className="mt-4 leading-7 text-white/70">
                  {article.excerpt}
                </p>

                <p className="mt-6 text-sm font-bold text-[#d65a6d]">
                  Read story →
                </p>

                <p className="mt-3 text-sm text-white/40">
                  {formatArticleDate(article.publishedAt)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function FilterPill({ label }: { label: string }) {
  return (
    <button
      className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white/70 transition hover:bg-white/10 hover:text-white"
      type="button"
    >
      {label}
    </button>
  );
}