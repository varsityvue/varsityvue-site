import type { Metadata } from "next";
import Link from "next/link";
import { articles } from "../../data/articles";
import type { Article } from "@/types/platform";

const coverageTitle = "Texas High School Football Coverage, Previews & Recaps";
const coverageDescription =
  "Read VarsityVue Texas high school football coverage including game previews, recaps, athlete spotlights, district outlooks, legacy stories, and local sports features.";

export const metadata: Metadata = {
  title: coverageTitle,
  description: coverageDescription,
  alternates: {
    canonical: "/coverage",
  },
  openGraph: {
    title: `${coverageTitle} | VarsityVue`,
    description: coverageDescription,
    url: "/coverage",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: `${coverageTitle} | VarsityVue`,
    description: coverageDescription,
  },
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

export default async function CoveragePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const sortedArticles = [...articles].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  const validTypes: Article["type"][] = [
    "preview",
    "recap",
    "news",
    "feature",
    "legacy",
  ];

  const activeType = validTypes.includes(type as Article["type"])
    ? (type as Article["type"])
    : undefined;

  const filteredArticles = activeType
    ? sortedArticles.filter((article) => article.type === activeType)
    : sortedArticles;

  const featuredArticle = filteredArticles[0];
  const latestArticles = filteredArticles.slice(1);
  const hasCoverage = articles.length > 0;

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(122,16,34,0.62),transparent_34%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_30%)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-[var(--vv-accent)]">
              VarsityVue Coverage
            </p>

            <div className="mt-5">
              <h1 className="text-5xl font-black leading-tight tracking-tight sm:text-7xl">
                Coverage Hub
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-white/60 sm:text-lg">
                Local game coverage, verified results, program stories, and
                district context connected directly to VarsityVue school and
                matchup pages.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          {!hasCoverage ? (
            <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] shadow-2xl">
              <div className="bg-[radial-gradient(circle_at_top_left,rgba(139,16,32,0.5),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.06),rgba(0,0,0,0.96))] p-7 md:p-10 lg:p-12">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--vv-accent-soft)]">
                  2026 Coverage
                </p>

                <h2 className="mt-4 max-w-4xl text-4xl font-black leading-tight text-white sm:text-6xl">
                  Coverage is building with the season.
                </h2>

                <p className="mt-5 max-w-3xl text-base leading-7 text-white/60 sm:text-lg">
                  Published stories will appear here as VarsityVue adds
                  verified results, matchup context, and program-specific
                  coverage during the 2026 season.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <LaunchCard title="Matchup Previews" body="Context around selected games before kickoff." />
                  <LaunchCard title="Results & Recaps" body="Verified finals with postgame coverage when available." />
                  <LaunchCard title="Program Stories" body="Features connected to the schools and athletes we cover." />
                  <LaunchCard title="District Context" body="Stories around district races as verified results build." />
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/scoreboard"
                    className="rounded-xl bg-white px-6 py-4 text-center text-sm font-black uppercase tracking-[0.16em] text-black transition hover:bg-white/85"
                  >
                    View Scoreboard
                  </Link>
                  <Link
                    href="/schools"
                    className="rounded-xl border border-white/15 bg-black/35 px-6 py-4 text-center text-sm font-black uppercase tracking-[0.16em] text-white/75 transition hover:bg-white/10 hover:text-white"
                  >
                    Explore Schools
                  </Link>
                </div>
              </div>
            </section>
          ) : (
            <>
              <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
                {featuredArticle && (
                  <Link
                    href={`/coverage/${featuredArticle.slug}`}
                    className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl transition hover:-translate-y-1 hover:border-[color:var(--vv-accent)]/40 hover:bg-white/[0.075] md:p-8"
                  >
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(122,16,34,0.48),transparent_55%)] opacity-55 transition group-hover:opacity-75" />
                    <div className="relative">
                      <p className="text-xs font-black uppercase tracking-[0.32em] text-[var(--vv-accent)]">
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
                      <p className="mt-8 text-sm font-black uppercase tracking-[0.14em] text-[var(--vv-accent)]">
                        Read full story →
                      </p>
                    </div>
                  </Link>
                )}

                <aside className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl md:p-8">
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-white/45">
                    VarsityVue Coverage
                  </p>
                  <h3 className="mt-4 text-3xl font-black text-white">
                    Stories connected to the games and programs.
                  </h3>
                  <p className="mt-4 text-sm leading-6 text-white/55">
                    Coverage grows from verified results, matchup information,
                    and program details already connected across VarsityVue.
                  </p>
                </aside>
              </section>

              <section className="mt-8 rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl sm:p-6">
                <div className="flex flex-wrap gap-3">
                  <FilterPill href="/coverage" label="All Coverage" active={!activeType} />
                  <FilterPill href="/coverage?type=preview" label="Previews" active={activeType === "preview"} />
                  <FilterPill href="/coverage?type=recap" label="Recaps" active={activeType === "recap"} />
                  <FilterPill href="/coverage?type=feature" label="Features" active={activeType === "feature"} />
                  <FilterPill href="/coverage?type=legacy" label="Legacy" active={activeType === "legacy"} />
                </div>
              </section>

              <section className="mt-10">
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--vv-accent)]">
                      Latest Coverage
                    </p>
                    <h2 className="mt-2 text-3xl font-black text-white">
                      Recent Stories
                    </h2>
                  </div>
                </div>

                {latestArticles.length === 0 ? (
                  <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-8 shadow-2xl">
                    <h2 className="text-2xl font-black text-white">
                      No additional stories in this view.
                    </h2>
                    <p className="mt-2 text-white/50">
                      Browse another coverage type or check back as new stories are published.
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
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function LaunchCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
      <h3 className="font-black text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/50">{body}</p>
    </div>
  );
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/coverage/${article.slug}`}
      className="group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-xl transition hover:-translate-y-1 hover:border-[color:var(--vv-accent)]/40 hover:bg-white/[0.075]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(122,16,34,0.38),transparent_55%)] opacity-45 transition group-hover:opacity-70" />
      <div className="relative">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--vv-accent)]">
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
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--vv-accent)]">
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

function FilterPill({
  href,
  label,
  active = false,
}: {
  href: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${
        active
          ? "border-white/20 bg-white text-black"
          : "border-white/10 bg-black/30 text-white/60 hover:bg-white/10 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}
