import type { Metadata } from "next";
import Link from "next/link";
import { articles } from "../../data/articles";
import { sponsors } from "../../data/sponsors";
import type { Article } from "@/types/platform";

export const metadata: Metadata = {
  title: "Texas High School Football Coverage, Previews & Recaps | VarsityVue",
  description:
    "Read VarsityVue Texas high school football coverage including game previews, recaps, athlete spotlights, district outlooks, legacy stories, and local sports features.",
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

export default function CoveragePage() {
  const sortedArticles = [...articles].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  const featuredArticle = sortedArticles[0];
  const latestArticles = sortedArticles.slice(1);

  const previewCount = articles.filter((article) => article.type === "preview").length;
  const recapCount = articles.filter((article) => article.type === "recap").length;
  const featureCount = articles.filter((article) => article.type === "feature").length;

  const coverageSponsor = sponsors.find(
    (sponsor) =>
      sponsor.active &&
      sponsor.placementTypes.includes("directory")
  );

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(122,16,34,0.62),transparent_34%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_30%)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-[#d65a6d]">
              VarsityVue Coverage
            </p>

            <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <h1 className="text-5xl font-black leading-tight tracking-tight sm:text-7xl">
                  Coverage Hub
                </h1>

                <p className="mt-4 max-w-3xl text-base leading-7 text-white/60 sm:text-lg">
                  Texas high school football previews, recaps, features,
                  district outlooks, player spotlights, and legacy stories
                  built around the VarsityVue school and game ecosystem.
                </p>
              </div>

              <Link
                href="/sponsor-inquiry"
                className="rounded-xl border border-[#d65a6d]/30 bg-[#7A1022]/25 px-6 py-4 text-center text-sm font-black uppercase tracking-[0.16em] text-[#f3a3af] transition hover:bg-[#7A1022]/40 hover:text-white"
              >
                Sponsor Coverage
              </Link>
            </div>
          </div>

          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <CoverageStat label="Stories" value={articles.length.toString()} />
            <CoverageStat label="Previews" value={previewCount.toString()} />
            <CoverageStat label="Recaps" value={recapCount.toString()} />
            <CoverageStat label="Features" value={featureCount.toString()} />
          </section>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
            {featuredArticle && (
              <Link
                href={`/coverage/${featuredArticle.slug}`}
                className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl transition hover:-translate-y-1 hover:border-[#d65a6d]/40 hover:bg-white/[0.075] md:p-8"
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(122,16,34,0.48),transparent_55%)] opacity-55 transition group-hover:opacity-75" />

                <div className="relative">
                  <p className="text-xs font-black uppercase tracking-[0.32em] text-[#d65a6d]">
                    Featured Story
                  </p>

                  <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-white/45">
                    {formatArticleType(featuredArticle.type)} ·{" "}
                    {formatArticleDate(featuredArticle.publishedAt)}
                  </p>

                  <h2 className="mt-5 max-w-4xl text-4xl font-black leading-tight text-white sm:text-5xl">
                    {featuredArticle.title}
                  </h2>

                  {featuredArticle.subtitle && (
                    <p className="mt-4 max-w-3xl text-lg font-semibold leading-7 text-white/55">
                      {featuredArticle.subtitle}
                    </p>
                  )}

                  <p className="mt-5 max-w-3xl leading-7 text-white/65">
                    {featuredArticle.excerpt}
                  </p>

                  <p className="mt-8 text-sm font-black uppercase tracking-[0.14em] text-[#d65a6d]">
                    Read full story →
                  </p>
                </div>
              </Link>
            )}

            <aside className="rounded-[2rem] border border-[#7A1022]/40 bg-gradient-to-br from-[#7A1022]/45 via-black to-black p-6 shadow-2xl md:p-8">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#f3a3af]">
                Coverage Sponsor
              </p>

              <h3 className="mt-4 text-3xl font-black text-white">
                {coverageSponsor
                  ? `Presented by ${coverageSponsor.name}`
                  : "This placement is available"}
              </h3>

              <p className="mt-4 text-sm leading-6 text-white/55">
                Weekly previews, recaps, player features, district outlooks,
                and editorial coverage sponsor inventory for local businesses.
              </p>

              <Link
                href="/sponsor-inquiry"
                className="mt-8 block rounded-xl border border-white/15 bg-white/10 px-5 py-4 text-center text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/15"
              >
                Claim Coverage Inventory
              </Link>
            </aside>
          </section>

          <section className="mt-8 rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl sm:p-6">
            <div className="flex flex-wrap gap-3">
              <FilterPill label="All Coverage" active />
              <FilterPill label="Previews" />
              <FilterPill label="Recaps" />
              <FilterPill label="Features" />
              <FilterPill label="Legacy" />
            </div>
          </section>

          <section className="mt-10">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-[#d65a6d]">
                  Latest Coverage
                </p>

                <h2 className="mt-2 text-3xl font-black text-white">
                  Recent Stories
                </h2>
              </div>

              <p className="text-sm font-bold text-white/45">
                {latestArticles.length} stories shown
              </p>
            </div>

            {latestArticles.length === 0 ? (
              <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-8 shadow-2xl">
                <h2 className="text-2xl font-black text-white">
                  More coverage coming soon.
                </h2>
                <p className="mt-2 text-white/50">
                  Game previews, recaps, features, and district stories will
                  appear here as the season builds.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {latestArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </section>

          <section className="mt-10 rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#d65a6d]">
              Search Visibility
            </p>

            <h2 className="mt-3 text-3xl font-black text-white">
              Built for game-week discovery.
            </h2>

            <p className="mt-4 max-w-4xl leading-7 text-white/60">
              VarsityVue coverage connects game previews, recaps, school hubs,
              district standings, sponsor visibility, and local football
              storylines into a searchable Texas high school sports ecosystem.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/coverage/${article.slug}`}
      className="group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-xl transition hover:-translate-y-1 hover:border-[#d65a6d]/40 hover:bg-white/[0.075]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(122,16,34,0.38),transparent_55%)] opacity-45 transition group-hover:opacity-70" />

      <div className="relative">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#d65a6d]">
          {formatArticleType(article.type)}
        </p>

        <h3 className="mt-4 text-2xl font-black leading-tight text-white">
          {article.title}
        </h3>

        {article.subtitle && (
          <p className="mt-3 text-sm font-semibold leading-6 text-white/50">
            {article.subtitle}
          </p>
        )}

        <p className="mt-4 line-clamp-3 text-sm leading-6 text-white/60">
          {article.excerpt}
        </p>

        <div className="mt-6 flex items-center justify-between gap-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#d65a6d]">
            Read story
          </p>

          <p className="text-xs font-bold text-white/35">
            {formatArticleDate(article.publishedAt)}
          </p>
        </div>
      </div>
    </Link>
  );
}

function CoverageStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 shadow-xl">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-white/40">
        {label}
      </p>
      <p className="mt-3 text-4xl font-black text-white">{value}</p>
    </div>
  );
}

function FilterPill({
  label,
  active = false,
}: {
  label: string;
  active?: boolean;
}) {
  return (
    <span
      className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.14em] ${
        active
          ? "border-white/20 bg-white text-black"
          : "border-white/10 bg-black/30 text-white/60"
      }`}
    >
      {label}
    </span>
  );
}