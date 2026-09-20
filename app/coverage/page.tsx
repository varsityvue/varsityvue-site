import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import { getArticles } from "@/lib/articles";
import type { Article } from "@/types/platform";

const coverageTitle = "Texas High School Football Coverage, Previews & Recaps";
const coverageDescription =
  "Read VarsityVue Texas high school football coverage including game previews, recaps, athlete spotlights, district outlooks, legacy stories, and local sports features.";
const coverageSocialImage = "/coverage/opengraph-image";

export const metadata: Metadata = {
  title: coverageTitle,
  description: coverageDescription,
  alternates: { canonical: "/coverage" },
  openGraph: {
    title: `${coverageTitle} | VarsityVue`,
    description: coverageDescription,
    url: "/coverage",
    type: "website",
    images: [
      {
        url: coverageSocialImage,
        width: 1200,
        height: 630,
        alt: "VarsityVue Texas high school football stories, previews, recaps, and features",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${coverageTitle} | VarsityVue`,
    description: coverageDescription,
    images: [coverageSocialImage],
  },
};

function formatArticleDate(publishedAt: string) {
  const parsedDate = new Date(publishedAt);
  if (Number.isNaN(parsedDate.getTime())) return "Date TBD";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Chicago",
  }).format(parsedDate);
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

export default async function CoveragePage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const sortedArticles = getArticles();
  const validTypes: Article["type"][] = ["preview", "recap", "news", "feature", "legacy"];
  const activeType = validTypes.includes(type as Article["type"]) ? (type as Article["type"]) : undefined;
  const filteredArticles = activeType ? sortedArticles.filter((article) => article.type === activeType) : sortedArticles;
  const featuredArticle = filteredArticles[0];
  const latestArticles = filteredArticles.slice(1);
  const hasCoverage = sortedArticles.length > 0;

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <PageHero
        eyebrow="VarsityVue Coverage"
        title="Coverage"
        description="Local game coverage, verified results, program stories, and district context connected directly to VarsityVue school and matchup pages."
      />

      <section className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          {!hasCoverage ? (
            <section className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.045] shadow-2xl sm:rounded-[2rem]">
              <div className="bg-[radial-gradient(circle_at_top_left,rgba(139,16,32,0.5),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.06),rgba(0,0,0,0.96))] p-5 sm:p-7 md:p-10 lg:p-12">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--vv-accent-soft)] sm:text-xs sm:tracking-[0.3em]">2026 Coverage</p>
                <h2 className="mt-3 max-w-4xl text-3xl font-black leading-tight text-white sm:mt-4 sm:text-6xl">Coverage is building with the season.</h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60 sm:mt-5 sm:text-lg sm:leading-7">Published stories will appear here as VarsityVue adds verified results, matchup context, and program-specific coverage during the 2026 season.</p>
                <div className="mt-5 grid gap-2.5 sm:mt-8 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
                  <LaunchCard title="Matchup Previews" body="Context around selected games before kickoff." />
                  <LaunchCard title="Results & Recaps" body="Verified finals with postgame coverage when available." />
                  <LaunchCard title="Program Stories" body="Features connected to the schools and athletes we cover." />
                  <LaunchCard title="District Context" body="Stories around district races as verified results build." />
                </div>
                <div className="mt-5 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:gap-3">
                  <Link href="/scoreboard" className="rounded-xl bg-white px-5 py-3 text-center text-xs font-black uppercase tracking-[0.14em] text-black transition hover:bg-white/85 sm:px-6 sm:py-4 sm:text-sm sm:tracking-[0.16em]">View Scoreboard</Link>
                  <Link href="/submit" className="rounded-xl border border-white/15 bg-black/35 px-5 py-3 text-center text-xs font-black uppercase tracking-[0.14em] text-white/75 transition hover:bg-white/10 hover:text-white sm:px-6 sm:py-4 sm:text-sm sm:tracking-[0.16em]">Submit a Story Tip</Link>
                </div>
              </div>
            </section>
          ) : (
            <>
              <section>
                {featuredArticle && (
                  <Link href={`/coverage/${featuredArticle.slug}`} className="group relative block overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl transition hover:-translate-y-1 hover:border-[color:var(--vv-accent)]/40 hover:bg-white/[0.075] sm:rounded-[2rem] sm:p-6 md:p-8">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(122,16,34,0.48),transparent_55%)] opacity-55 transition group-hover:opacity-75" />
                    <div className="relative">
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--vv-accent)] sm:text-xs sm:tracking-[0.32em]">Featured Story</p>
                      <p className="mt-3 text-[10px] font-black uppercase tracking-[0.16em] text-white/45 sm:mt-5 sm:text-xs sm:tracking-[0.2em]">{formatArticleType(featuredArticle.type)} · {formatArticleDate(featuredArticle.publishedAt)}</p>
                      <h2 className="mt-3 max-w-4xl text-[1.8rem] font-black leading-[1.05] text-white sm:mt-5 sm:text-5xl sm:leading-tight">{featuredArticle.title}</h2>
                      {featuredArticle.subtitle && <p className="mt-3 max-w-3xl text-sm font-semibold leading-5 text-white/55 sm:mt-4 sm:text-lg sm:leading-7">{featuredArticle.subtitle}</p>}
                      <p className="mt-4 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--vv-accent)] sm:mt-8 sm:text-sm sm:tracking-[0.14em]">Read full story →</p>
                    </div>
                  </Link>
                )}
              </section>

              <section className="mt-5 rounded-[1.4rem] border border-white/10 bg-white/[0.045] p-3 shadow-2xl sm:mt-8 sm:rounded-[1.75rem] sm:p-5">
                <div className="flex items-center justify-between gap-2 sm:gap-3">
                  <div className="min-w-0 flex-1 overflow-x-auto pb-1 sm:pb-0">
                    <div className="flex w-max gap-2 sm:gap-2.5">
                      <FilterPill href="/coverage" label="All Coverage" active={!activeType} />
                      <FilterPill href="/coverage?type=preview" label="Previews" active={activeType === "preview"} />
                      <FilterPill href="/coverage?type=recap" label="Recaps" active={activeType === "recap"} />
                      <FilterPill href="/coverage?type=news" label="News" active={activeType === "news"} />
                      <FilterPill href="/coverage?type=feature" label="Features" active={activeType === "feature"} />
                      <FilterPill href="/coverage?type=legacy" label="Legacy" active={activeType === "legacy"} />
                    </div>
                  </div>
                  <Link href="/submit" className="shrink-0 rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.11em] text-white/60 transition hover:bg-white/10 hover:text-white sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.14em]">Story Tip →</Link>
                </div>
              </section>

              <section className="mt-7 sm:mt-10">
                <div className="mb-4 flex flex-col gap-2 sm:mb-6 sm:gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--vv-accent)] sm:text-xs sm:tracking-[0.28em]">Latest Coverage</p>
                    <h2 className="mt-1.5 text-2xl font-black text-white sm:mt-2 sm:text-3xl">Recent Stories</h2>
                  </div>
                </div>
                {latestArticles.length === 0 ? (
                  <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl sm:rounded-[1.75rem] sm:p-8">
                    <h2 className="text-xl font-black text-white sm:text-2xl">No additional stories in this view.</h2>
                    <p className="mt-2 text-sm leading-5 text-white/50 sm:leading-6">Browse another coverage type or check back as new stories are published.</p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">{latestArticles.map((article) => <ArticleCard key={article.id} article={article} />)}</div>
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
  return <div className="rounded-xl border border-white/10 bg-black/35 p-3.5 sm:rounded-2xl sm:p-5"><h3 className="text-sm font-black text-white sm:text-base">{title}</h3><p className="mt-1.5 text-xs leading-5 text-white/50 sm:mt-2 sm:text-sm sm:leading-6">{body}</p></div>;
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <Link href={`/coverage/${article.slug}`} className="group relative overflow-hidden rounded-[1.4rem] border border-white/10 bg-white/[0.045] p-4 shadow-xl transition hover:-translate-y-1 hover:border-[color:var(--vv-accent)]/40 hover:bg-white/[0.065] sm:rounded-[1.75rem] sm:p-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(122,16,34,0.18),transparent_52%)] opacity-35 transition group-hover:opacity-55" />
      <div className="relative">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--vv-accent)] sm:text-xs sm:tracking-[0.2em]">{formatArticleType(article.type)}</p>
        <h3 className="mt-2.5 text-xl font-black leading-tight text-white sm:mt-4 sm:text-2xl">{article.title}</h3>
        {article.subtitle && <p className="mt-2 text-xs font-semibold leading-5 text-white/50 sm:mt-3 sm:text-sm sm:leading-6">{article.subtitle}</p>}
        <div className="mt-4 flex items-center justify-between gap-3 sm:mt-6 sm:gap-4">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--vv-accent)] sm:text-xs sm:tracking-[0.14em]">Read story</p>
          <p className="text-[10px] font-bold text-white/35 sm:text-xs">{formatArticleDate(article.publishedAt)}</p>
        </div>
      </div>
    </Link>
  );
}

function FilterPill({ href, label, active = false }: { href: string; label: string; active?: boolean }) {
  return (
    <Link href={href} className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] transition sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.14em] ${active ? "border-white/20 bg-white text-black" : "border-white/10 bg-black/30 text-white/60 hover:bg-white/10 hover:text-white"}`}>
      {label}
    </Link>
  );
}
