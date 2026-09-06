import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getArticleBySlug, getArticles } from "@/lib/articles";
import { getSchoolBySlug } from "@/lib/schools";
import type { Article } from "@/types/platform";
import SchoolBadge from "@/components/SchoolBadge";
import { getScoreboardGames } from "@/lib/scoreboard";
import { getDistrictById } from "@/lib/districts";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

function parseArticleDate(publishedAt: string) {
  const parsed = new Date(publishedAt);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatArticleDate(publishedAt: string) {
  const parsed = parseArticleDate(publishedAt);
  if (!parsed) return "Date TBD";

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Chicago",
  }).format(parsed);
}

function formatShortDate(publishedAt: string) {
  const parsed = parseArticleDate(publishedAt);
  if (!parsed) return "Date TBD";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/Chicago",
  }).format(parsed);
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

function stripVarsityVueBranding(title: string) {
  return title.replace(/\s*[|–—-]\s*VarsityVue\s*$/i, "").trim();
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    return {
      title: "Article Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = stripVarsityVueBranding(article.seo.title || article.title);
  const canonical = `/coverage/${article.slug}`;

  return {
    title,
    description: article.seo.description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${title} | VarsityVue`,
      description: article.seo.description,
      url: canonical,
      type: "article",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt ?? article.publishedAt,
    },
    twitter: {
      card: "summary",
      title: `${title} | VarsityVue`,
      description: article.seo.description,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const relatedSchools =
    article.schoolIds
      ?.map((schoolSlug) => getSchoolBySlug(schoolSlug))
      .filter(Boolean) ?? [];

  const relatedDistricts =
    article.districtIds
      ?.map((districtId) => getDistrictById(districtId))
      .filter(Boolean) ?? [];

  const relatedArticles = getArticles()
    .filter((item) => item.slug !== article.slug)
    .filter((item) => {
      const sharesSchool = item.schoolIds?.some((schoolId) =>
        article.schoolIds?.includes(schoolId)
      );
      const sharesDistrict = item.districtIds?.some((districtId) =>
        article.districtIds?.includes(districtId)
      );
      const sharesGame = article.gameId && item.gameId === article.gameId;

      return Boolean(sharesSchool || sharesDistrict || sharesGame);
    })
    .slice(0, 3);

  const relatedGames = getScoreboardGames()
    .filter((game) =>
      article.schoolIds?.some(
        (schoolSlug) =>
          game.homeSchoolSlug === schoolSlug || game.awaySchoolSlug === schoolSlug
      )
    )
    .filter((game) => game.gameType !== "scrimmage" && game.gameType !== "bye")
    .slice(0, 3);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": article.type === "news" ? "NewsArticle" : "Article",
    headline: article.title,
    description: article.excerpt,
    articleBody: article.body,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt ?? article.publishedAt,
    author: {
      "@type": "Organization",
      name: article.author,
    },
    publisher: {
      "@type": "Organization",
      name: "VarsityVue",
      url: "https://varsityvue.com",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://varsityvue.com/coverage/${article.slug}`,
    },
    keywords: article.tags?.join(", "),
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleSchema),
        }}
      />

      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(122,16,34,0.62),transparent_34%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_30%)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/coverage"
            className="text-sm font-black uppercase tracking-[0.14em] text-[var(--vv-accent)] transition hover:text-white"
          >
            ← Back to Coverage
          </Link>

          <div className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-[var(--vv-accent)]">
              {formatArticleType(article.type)}
            </p>

            <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight sm:text-6xl">
              {article.title}
            </h1>

            {article.subtitle && (
              <p className="mt-5 text-xl font-semibold leading-8 text-white/55">
                {article.subtitle}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3 text-sm font-bold text-white/45">
              <span>{formatArticleDate(article.publishedAt)}</span>
              <span>•</span>
              <span>{article.author}</span>
              {article.aiAssisted && (
                <>
                  <span>•</span>
                  <span>AI-assisted, human-reviewed</span>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_320px]">
          <article className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl md:p-8">
            <p className="text-xl font-bold leading-9 text-white/70">
              {article.excerpt}
            </p>

            <div className="mt-8 h-px bg-white/10" />

            <div className="mt-8 space-y-6 text-lg leading-8 text-white/75">
              {article.body
                .split("\n")
                .map((paragraph) => paragraph.trim())
                .filter(Boolean)
                .map((paragraph, index) => (
                  <p key={`${article.id}-paragraph-${index}`}>{paragraph}</p>
                ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/65"
                >
                  {tag}
                </span>
              ))}

              {relatedSchools.map(
                (school) =>
                  school && (
                    <Link
                      key={school.slug}
                      href={`/schools/${school.slug}`}
                      className="rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/65 transition hover:bg-white/10 hover:text-white"
                    >
                      {school.name}
                    </Link>
                  )
              )}

              {relatedDistricts.map(
                (district) =>
                  district && (
                    <Link
                      key={district.id}
                      href={`/districts/${district.slug}`}
                      className="rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/65 transition hover:bg-white/10 hover:text-white"
                    >
                      {district.name}
                    </Link>
                  )
              )}
            </div>
          </article>

          <aside className="space-y-6">
            {relatedSchools.length > 0 && (
              <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--vv-accent)]">
                  Related Schools
                </p>

                <div className="mt-5 flex flex-col gap-3">
                  {relatedSchools.map(
                    (school) =>
                      school && (
                        <Link
                          key={school.slug}
                          href={`/schools/${school.slug}`}
                          className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/35 p-4 transition hover:bg-white/10"
                        >
                          <SchoolBadge school={school} size="xs" />

                          <div>
                            <p className="text-sm font-black text-white">
                              {school.name}
                            </p>
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/40">
                              {school.mascot}
                            </p>
                          </div>
                        </Link>
                      )
                  )}
                </div>
              </section>
            )}

            {relatedDistricts.length > 0 && (
              <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--vv-accent)]">
                  Related District
                </p>

                <div className="mt-5 flex flex-col gap-3">
                  {relatedDistricts.map(
                    (district) =>
                      district && (
                        <Link
                          key={district.id}
                          href={`/districts/${district.slug}`}
                          className="rounded-2xl border border-white/10 bg-black/35 p-4 transition hover:bg-white/10"
                        >
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
                            District Hub
                          </p>

                          <h3 className="mt-2 text-sm font-black text-white">
                            {district.name}
                          </h3>

                          <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-white/40">
                            View Standings →
                          </p>
                        </Link>
                      )
                  )}
                </div>
              </section>
            )}

            {relatedGames.length > 0 && (
              <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--vv-accent)]">
                  Related Matchups
                </p>

                <div className="mt-5 flex flex-col gap-3">
                  {relatedGames.map((game) => (
                    <Link
                      key={game.id}
                      href={`/games/${game.id}`}
                      className="rounded-2xl border border-white/10 bg-black/35 p-4 transition hover:bg-white/10"
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
                        Week {game.week ?? "TBD"}
                      </p>

                      <h3 className="mt-2 text-sm font-black text-white">
                        {game.awayTeam} at {game.homeTeam}
                      </h3>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--vv-accent)]">
                More Coverage
              </p>

              <div className="mt-5 flex flex-col gap-3">
                {relatedArticles.length > 0 ? (
                  relatedArticles.map((related) => (
                    <Link
                      key={related.id}
                      href={`/coverage/${related.slug}`}
                      className="rounded-2xl border border-white/10 bg-black/35 p-4 transition hover:bg-white/10"
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
                        {formatArticleType(related.type)} ·{" "}
                        {formatShortDate(related.publishedAt)}
                      </p>

                      <h3 className="mt-2 text-sm font-black leading-5 text-white">
                        {related.title}
                      </h3>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
                    <p className="text-sm text-white/55">
                      More related coverage will appear here as stories are published.
                    </p>
                    <Link
                      href="/submit"
                      className="mt-3 inline-flex text-xs font-black uppercase tracking-[0.14em] text-white/55 transition hover:text-white"
                    >
                      Send a Story Tip →
                    </Link>
                  </div>
                )}
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
