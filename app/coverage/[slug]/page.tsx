import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getArticleBySlug, getArticles } from "@/lib/articles";
import { getSchoolBySlug } from "@/lib/schools";
import type { Article } from "@/types/platform";
import ArticleShare from "@/components/ArticleShare";
import SchoolBadge from "@/components/SchoolBadge";
import { getScoreboardGames } from "@/lib/scoreboard";
import { getDistrictById } from "@/lib/districts";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

function parseArticleDate(publishedAt?: string) {
  if (!publishedAt) return null;
  const parsed = new Date(publishedAt);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getValidArticleDate(publishedAt?: string) {
  return parseArticleDate(publishedAt)?.toISOString();
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
  const publishedTime = getValidArticleDate(article.publishedAt);
  const modifiedTime = getValidArticleDate(article.updatedAt) ?? publishedTime;

  return {
    title,
    description: article.seo.description,
    alternates: { canonical },
    openGraph: {
      title: `${title} | VarsityVue`,
      description: article.seo.description,
      url: canonical,
      type: "article",
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
      ...(article.featuredImageUrl
        ? { images: [{ url: article.featuredImageUrl, alt: article.featuredImageAlt ?? article.title }] }
        : {}),
    },
    twitter: {
      card: article.featuredImageUrl ? "summary_large_image" : "summary",
      title: `${title} | VarsityVue`,
      description: article.seo.description,
      ...(article.featuredImageUrl ? { images: [article.featuredImageUrl] } : {}),
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) notFound();

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

  const schoolNames = new Set(
    relatedSchools
      .filter((school): school is NonNullable<typeof school> => Boolean(school))
      .map((school) => school.name.toLowerCase())
  );
  const topicTags = article.tags.filter((tag) => !schoolNames.has(tag.toLowerCase()));

  const publishedDate = getValidArticleDate(article.publishedAt);
  const modifiedDate = getValidArticleDate(article.updatedAt) ?? publishedDate;
  const articleUrl = `https://varsityvue.com/coverage/${article.slug}`;
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": article.type === "news" ? "NewsArticle" : "Article",
    headline: article.title,
    description: article.excerpt,
    articleBody: article.body,
    ...(article.featuredImageUrl ? { image: article.featuredImageUrl } : {}),
    ...(publishedDate ? { datePublished: publishedDate } : {}),
    ...(modifiedDate ? { dateModified: modifiedDate } : {}),
    author: { "@type": "Organization", name: article.author },
    publisher: {
      "@type": "Organization",
      name: "VarsityVue",
      url: "https://varsityvue.com",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    keywords: article.tags?.join(", "),
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(122,16,34,0.62),transparent_34%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_30%)] px-4 py-4 sm:px-6 sm:py-7 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/coverage"
            className="text-[11px] font-black uppercase tracking-[0.14em] text-white/45 transition hover:text-[var(--vv-accent)] sm:text-sm"
          >
            ← Back to Coverage
          </Link>

          <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl sm:mt-5 sm:rounded-[1.75rem] sm:p-6 md:p-8">
            <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[var(--vv-accent)] sm:text-xs sm:tracking-[0.32em]">
              {formatArticleType(article.type)}
            </p>

            <h1 className="mt-2.5 text-[1.85rem] font-black leading-[1.06] tracking-tight sm:mt-4 sm:text-5xl md:text-6xl">
              {article.title}
            </h1>

            {article.subtitle && (
              <p className="mt-3 max-w-3xl text-[15px] font-semibold leading-[1.45] text-white/55 sm:mt-5 sm:text-xl sm:leading-8">
                {article.subtitle}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-bold text-white/45 sm:mt-6 sm:text-sm">
              <span>{formatArticleDate(article.publishedAt)}</span>
              <span>•</span>
              <span>{article.author}</span>
              <span className="hidden sm:inline">•</span>
              <ArticleShare title={article.title} url={articleUrl} />
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10">
          <article className="min-w-0">
            {article.featuredImageUrl && (
              <figure className="mb-7 overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.035] shadow-2xl sm:mb-9 sm:rounded-[1.75rem]">
                <Image
                  src={article.featuredImageUrl}
                  alt={article.featuredImageAlt ?? article.title}
                  width={1600}
                  height={900}
                  priority
                  className="aspect-[16/9] w-full object-cover"
                />
                {article.featuredImageCaption && (
                  <figcaption className="border-t border-white/10 px-4 py-3 text-[11px] leading-5 text-white/40 sm:px-5">
                    {article.featuredImageCaption}
                  </figcaption>
                )}
              </figure>
            )}

            <div className="border-t border-white/10 pt-6 sm:pt-8">
              <div className="space-y-5 text-[17px] leading-8 text-white/78 sm:space-y-7 sm:text-lg sm:leading-8">
                {article.body
                  .split("\n")
                  .map((paragraph) => paragraph.trim())
                  .filter(Boolean)
                  .map((paragraph, index) => (
                    <p key={`${article.id}-paragraph-${index}`}>{paragraph}</p>
                  ))}
              </div>
            </div>

            <div className="mt-9 border-t border-white/10 pt-6 sm:mt-12 sm:pt-7">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                  Share this story
                </p>
                <ArticleShare title={article.title} url={articleUrl} />
              </div>

              {topicTags.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {topicTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 bg-white/[0.055] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/55"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
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
                            <p className="text-sm font-black text-white">{school.name}</p>
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
                          <h3 className="mt-2 text-sm font-black text-white">{district.name}</h3>
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
                  {relatedGames.map((game) => {
                    const awaySchool = game.awaySchoolSlug
                      ? getSchoolBySlug(game.awaySchoolSlug)
                      : undefined;
                    const homeSchool = game.homeSchoolSlug
                      ? getSchoolBySlug(game.homeSchoolSlug)
                      : undefined;
                    const awayScore = game.awayScore ?? game.score?.away;
                    const homeScore = game.homeScore ?? game.score?.home;

                    return (
                      <Link
                        key={game.id}
                        href={`/games/${game.id}`}
                        className="block rounded-2xl border border-white/10 bg-black/35 p-4 transition hover:bg-white/10"
                      >
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
                          Week {game.week ?? "TBD"}
                        </p>
                        <div className="mt-3 space-y-2.5">
                          <div className="flex items-center gap-3">
                            {awaySchool && <SchoolBadge school={awaySchool} size="xs" />}
                            <p className="min-w-0 flex-1 truncate text-sm font-black text-white">
                              {game.awayTeam}
                            </p>
                            {awayScore !== undefined && (
                              <span className="text-sm font-black tabular-nums text-white">{awayScore}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            {homeSchool && <SchoolBadge school={homeSchool} size="xs" />}
                            <p className="min-w-0 flex-1 truncate text-sm font-black text-white">
                              {game.homeTeam}
                            </p>
                            {homeScore !== undefined && (
                              <span className="text-sm font-black tabular-nums text-white">{homeScore}</span>
                            )}
                          </div>
                        </div>
                        <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
                          {formatShortDate(game.date)} · View Matchup →
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {relatedArticles.length > 0 && (
              <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--vv-accent)]">
                  More Coverage
                </p>
                <div className="mt-5 flex flex-col gap-3">
                  {relatedArticles.map((item) => (
                    <Link
                      key={item.id}
                      href={`/coverage/${item.slug}`}
                      className="rounded-2xl border border-white/10 bg-black/35 p-4 transition hover:bg-white/10"
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
                        {formatArticleType(item.type)} · {formatShortDate(item.publishedAt)}
                      </p>
                      <h3 className="mt-2 text-sm font-black leading-5 text-white">{item.title}</h3>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}
