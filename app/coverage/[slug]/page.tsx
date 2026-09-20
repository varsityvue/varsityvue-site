import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getArticleBySlug, getArticles } from "@/lib/articles";
import { getSchoolBySlug } from "@/lib/schools";
import type { Article } from "@/types/platform";
import ArticleShare from "@/components/ArticleShare";
import SchoolBadge from "@/components/SchoolBadge";
import SchoolFollowControl from "@/components/SchoolFollowControl";
import { getDynamicGames } from "@/lib/dynamic-games";
import { getDistrictById } from "@/lib/districts";
import { createClient } from "@/lib/supabase/server";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    followed?: string;
    unfollowed?: string;
    finishFollow?: string;
    followError?: string;
  }>;
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

function formatShortDate(publishedAt?: string) {
  const parsed = parseArticleDate(publishedAt);
  if (!parsed) return "Date TBD";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/Chicago",
  }).format(parsed);
}

function formatShortTime(kickoff?: string) {
  if (!kickoff?.includes("T")) return "Time TBD";
  const parsed = parseArticleDate(kickoff);
  if (!parsed) return "Time TBD";

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
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

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    return { title: "Article Not Found", robots: { index: false, follow: false } };
  }

  const title = stripVarsityVueBranding(article.seo.title || article.title);
  const canonical = `/coverage/${article.slug}`;
  const publishedTime = getValidArticleDate(article.publishedAt);
  const modifiedTime = getValidArticleDate(article.updatedAt) ?? publishedTime;
  const socialImageUrl = article.featuredImageSocialUrl ?? article.featuredImageUrl;

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
      ...(socialImageUrl ? { images: [{ url: socialImageUrl, alt: article.featuredImageAlt ?? article.title }] } : {}),
    },
    twitter: {
      card: socialImageUrl ? "summary_large_image" : "summary",
      title: `${title} | VarsityVue`,
      description: article.seo.description,
      ...(socialImageUrl ? { images: [socialImageUrl] } : {}),
    },
  };
}

export default async function ArticlePage({ params, searchParams }: ArticlePageProps) {
  const [{ slug }, followParams, followSupabase] = await Promise.all([params, searchParams, createClient()]);
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const relatedSchools = article.schoolIds?.map((schoolSlug) => getSchoolBySlug(schoolSlug)).filter((school): school is NonNullable<typeof school> => Boolean(school)) ?? [];
  const articleFollowSchools = relatedSchools.length <= 2 ? relatedSchools : [];
  const [{ data: followClaims }, scoreboardGamesResult] = await Promise.all([
    followSupabase.auth.getClaims(),
    getDynamicGames(),
  ]);
  const followUserId = followClaims?.claims?.sub;
  const followedSchoolSlugs = new Set<string>();
  if (followUserId && articleFollowSchools.length > 0) {
    const { data: followRows } = await followSupabase
      .from("school_follows")
      .select("school_slug")
      .eq("user_id", followUserId)
      .in("school_slug", articleFollowSchools.map((school) => school.slug));
    for (const row of followRows ?? []) followedSchoolSlugs.add(row.school_slug);
  }
  const relatedDistricts = article.districtIds?.map((districtId) => getDistrictById(districtId)).filter(Boolean) ?? [];
  const relatedArticles = getArticles()
    .filter((item) => item.slug !== article.slug)
    .filter((item) => {
      const sharesSchool = item.schoolIds?.some((schoolId) => article.schoolIds?.includes(schoolId));
      const sharesDistrict = item.districtIds?.some((districtId) => article.districtIds?.includes(districtId));
      const sharesGame = article.gameId && item.gameId === article.gameId;
      return Boolean(sharesSchool || sharesDistrict || sharesGame);
    })
    .slice(0, 3);

  const scoreboardGames = scoreboardGamesResult
    .filter((game) => game.gameType !== "bye" && game.gameType !== "scrimmage")
    .sort(
      (a, b) =>
        (parseArticleDate(a.kickoff)?.getTime() ?? Number.MAX_SAFE_INTEGER) -
        (parseArticleDate(b.kickoff)?.getTime() ?? Number.MAX_SAFE_INTEGER),
    );
  const relatedGames = scoreboardGames
    .filter((game) => article.schoolIds?.some((schoolSlug) => game.homeSchoolSlug === schoolSlug || game.awaySchoolSlug === schoolSlug))
    .filter((game) => game.gameType !== "scrimmage" && game.gameType !== "bye")
    .slice(0, 3);

  const primarySchoolSlug = article.schoolIds?.[0];
  const primarySchool = primarySchoolSlug ? getSchoolBySlug(primarySchoolSlug) : undefined;
  const nextPrimaryGame = primarySchoolSlug
    ? scoreboardGames.find(
        (game) =>
          (game.status === "upcoming" || game.status === "live") &&
          (game.homeSchoolSlug === primarySchoolSlug || game.awaySchoolSlug === primarySchoolSlug),
      )
    : undefined;

  const schoolNames = new Set(
    relatedSchools
      .filter((school): school is NonNullable<typeof school> => Boolean(school))
      .map((school) => school.name.toLowerCase())
  );
  const topicTags = article.tags.filter((tag) => !schoolNames.has(tag.toLowerCase()));

  const publishedDate = getValidArticleDate(article.publishedAt);
  const modifiedDate = getValidArticleDate(article.updatedAt) ?? publishedDate;
  const articleUrl = `https://varsityvue.com/coverage/${article.slug}`;
  const socialImageUrl = article.featuredImageSocialUrl ?? article.featuredImageUrl;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": article.type === "news" ? "NewsArticle" : "Article",
    headline: article.title,
    description: article.excerpt,
    articleBody: article.body,
    ...(socialImageUrl ? { image: socialImageUrl } : {}),
    ...(publishedDate ? { datePublished: publishedDate } : {}),
    ...(modifiedDate ? { dateModified: modifiedDate } : {}),
    author: { "@type": "Organization", name: article.author },
    publisher: { "@type": "Organization", name: "VarsityVue", url: "https://varsityvue.com" },
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
    keywords: article.tags?.join(", "),
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />

      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(122,16,34,0.62),transparent_34%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_30%)] px-4 py-3.5 sm:px-6 sm:py-7 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <Link href="/coverage" className="text-[10px] font-black uppercase tracking-[0.12em] text-white/45 transition hover:text-[var(--vv-accent)] sm:text-sm sm:tracking-[0.14em]">
            ← Back to Coverage
          </Link>

          <div className="mt-3 rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-3.5 shadow-2xl sm:mt-5 sm:rounded-[1.75rem] sm:p-6 md:p-8">
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[var(--vv-accent)] sm:text-xs sm:tracking-[0.32em]">
              {formatArticleType(article.type)}
            </p>
            <h1 className="mt-2 text-[1.72rem] font-black leading-[1.05] tracking-tight sm:mt-4 sm:text-5xl md:text-6xl">{article.title}</h1>
            {article.subtitle && <p className="mt-2.5 max-w-3xl text-sm font-semibold leading-[1.45] text-white/55 sm:mt-5 sm:text-xl sm:leading-8">{article.subtitle}</p>}
            <div className="mt-3.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[10px] font-bold text-white/45 sm:mt-6 sm:gap-x-3 sm:gap-y-2 sm:text-sm">
              <span>{formatArticleDate(article.publishedAt)}</span><span>•</span><span>{article.author}</span><span className="hidden sm:inline">•</span>
              <ArticleShare title={article.title} url={articleUrl} />
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-5 sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10">
          <article className="min-w-0">
            {article.featuredImageUrl && (
              <figure className="mb-5 overflow-hidden rounded-[1.2rem] border border-white/10 bg-white/[0.035] shadow-2xl sm:mb-9 sm:rounded-[1.75rem]">
                <Image src={article.featuredImageUrl} alt={article.featuredImageAlt ?? article.title} width={1600} height={900} priority className="h-auto w-full object-contain" />
                {article.featuredImageCaption && <figcaption className="border-t border-white/10 px-3.5 py-2.5 text-[10px] leading-4 text-white/40 sm:px-5 sm:py-3 sm:text-[11px] sm:leading-5">{article.featuredImageCaption}</figcaption>}
              </figure>
            )}

            <div className="border-t border-white/10 pt-5 sm:pt-8">
              <div className="space-y-4 text-[16px] leading-[1.75] text-white/78 sm:space-y-7 sm:text-lg sm:leading-8">
                {article.body
                  .split("\n")
                  .map((paragraph) => paragraph.trim())
                  .filter(Boolean)
                  .map((paragraph, index) =>
                    paragraph.startsWith("## ") ? (
                      <h2
                        key={`${article.id}-heading-${index}`}
                        className="mt-7 border-l-[3px] border-[var(--vv-accent)] pl-3 text-xl font-black leading-tight tracking-tight text-white sm:mt-10 sm:border-l-4 sm:pl-4 sm:text-3xl"
                      >
                        {paragraph.slice(3)}
                      </h2>
                    ) : (
                      <p key={`${article.id}-paragraph-${index}`}>{paragraph}</p>
                    )
                  )}
              </div>
            </div>

            {articleFollowSchools.length > 0 && (
              <section aria-label="Follow programs featured in this story" className="mt-6 rounded-[1.2rem] border border-white/10 bg-white/[0.045] p-3.5 shadow-xl sm:mt-10 sm:rounded-[1.5rem] sm:p-5">
                <p className="text-[8px] font-black uppercase tracking-[0.18em] text-[var(--vv-accent)] sm:text-[10px] sm:tracking-[0.2em]">Follow {articleFollowSchools.length === 1 ? "This Program" : "These Programs"}</p>
                <p className="mt-1.5 text-xs leading-5 text-white/50 sm:text-sm">Save {articleFollowSchools.map((school) => school.name).join(" and ")} to your account, then choose verified final-score alerts.</p>
                <div className={`mt-3 grid gap-2 ${articleFollowSchools.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                  {articleFollowSchools.map((school) => {
                    const isFollowing = followedSchoolSlugs.has(school.slug);
                    const finishFollowing = Boolean(followUserId) && !isFollowing && followParams.finishFollow === school.slug;
                    const message = isFollowing && followParams.followed === school.slug ? `You’re now following ${school.name}.` : !isFollowing && followParams.unfollowed === school.slug ? `You are no longer following ${school.name}.` : finishFollowing ? followParams.followError === "1" ? "Authentication succeeded, but the follow still needs your confirmation." : `Authentication succeeded. Select Finish Following to follow ${school.name}.` : "";
                    return <div key={school.slug} className="min-w-0 rounded-xl border border-white/10 bg-black/25 p-2.5 text-center sm:p-3"><p className="mb-2 truncate text-[10px] font-black text-white/65 sm:text-xs">{school.name}</p><SchoolFollowControl schoolName={school.name} schoolSlug={school.slug} isAuthenticated={Boolean(followUserId)} isFollowing={isFollowing} finishFollowing={finishFollowing} initialMessage={message} sourceSurface="article" sourceId={article.slug} compact /></div>;
                  })}
                </div>
              </section>
            )}

            {(primarySchool || nextPrimaryGame) && (
              <section className="mt-6 overflow-hidden rounded-[1.2rem] border border-[color:var(--vv-accent)]/25 bg-white/[0.055] shadow-xl sm:mt-12 sm:rounded-[1.75rem]">
                <div className="h-1 bg-[var(--vv-primary)]" />
                <div className="px-3.5 py-3 sm:p-6">
                  <p className="text-[8px] font-black uppercase tracking-[0.18em] text-[var(--vv-accent)] sm:text-[10px] sm:tracking-[0.2em]">Keep Following</p>

                  {nextPrimaryGame && (
                    <Link href={`/games/${nextPrimaryGame.id}`} className="mt-2 block rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 transition hover:bg-white/10 sm:mt-4 sm:rounded-2xl sm:p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[8px] font-black uppercase tracking-[0.13em] text-white/40 sm:text-[10px] sm:tracking-[0.15em]">Next Matchup</p>
                          <p className="mt-0.5 truncate text-[13px] font-black text-white sm:mt-1.5 sm:text-base">{nextPrimaryGame.awayTeam} at {nextPrimaryGame.homeTeam}</p>
                          <p className="mt-0.5 text-[10px] font-bold text-white/45 sm:mt-1 sm:text-xs">{formatShortDate(nextPrimaryGame.kickoff)} · {formatShortTime(nextPrimaryGame.kickoff)}</p>
                        </div>
                        <span className="shrink-0 text-base text-white/45 sm:text-xl">→</span>
                      </div>
                    </Link>
                  )}

                  <div className="mt-2 grid grid-cols-2 gap-1.5 sm:mt-3 sm:flex sm:flex-wrap sm:gap-2">
                    {primarySchool && (
                      <Link href={`/schools/${primarySchool.slug}`} className="rounded-lg border border-white/10 bg-white/[0.07] px-2 py-2 text-center text-[8px] font-black uppercase tracking-[0.06em] text-white/75 transition hover:bg-white/12 hover:text-white sm:rounded-xl sm:px-4 sm:py-3 sm:text-xs sm:tracking-[0.12em]">
                        {primarySchool.name} Hub →
                      </Link>
                    )}
                    <Link href="/scoreboard" className="rounded-lg border border-white/10 bg-white/[0.07] px-2 py-2 text-center text-[8px] font-black uppercase tracking-[0.06em] text-white/75 transition hover:bg-white/12 hover:text-white sm:rounded-xl sm:px-4 sm:py-3 sm:text-xs sm:tracking-[0.12em]">
                      Scoreboard →
                    </Link>
                  </div>
                </div>
              </section>
            )}

            <div className="mt-5 border-t border-white/10 pt-4 sm:mt-12 sm:pt-7">
              <div className="flex items-center">
                <ArticleShare title={article.title} url={articleUrl} />
              </div>
              {topicTags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5 sm:mt-6 sm:gap-2">
                  {topicTags.map((tag) => <span key={tag} className="rounded-full border border-white/10 bg-white/[0.055] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white/55 sm:px-3 sm:py-1.5 sm:text-[10px] sm:tracking-[0.14em]">{tag}</span>)}
                </div>
              )}
            </div>
          </article>

          <aside className="space-y-4 sm:space-y-6">
            {relatedSchools.length > 0 && (
              <section className="rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl sm:rounded-[1.75rem] sm:p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--vv-accent)] sm:text-xs sm:tracking-[0.28em]">Related Schools</p>
                <div className="mt-3 flex flex-col gap-2 sm:mt-5 sm:gap-3">
                  {relatedSchools.map((school) => school && (
                    <Link key={school.slug} href={`/schools/${school.slug}`} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/35 p-3 transition hover:bg-white/10 sm:gap-4 sm:rounded-2xl sm:p-4">
                      <SchoolBadge school={school} size="xs" />
                      <div><p className="text-[13px] font-black text-white sm:text-sm">{school.name}</p><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/40 sm:text-xs sm:tracking-[0.12em]">{school.mascot}</p></div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {relatedDistricts.length > 0 && (
              <section className="rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl sm:rounded-[1.75rem] sm:p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--vv-accent)] sm:text-xs sm:tracking-[0.28em]">Related District</p>
                <div className="mt-3 flex flex-col gap-2 sm:mt-5 sm:gap-3">
                  {relatedDistricts.map((district) => district && (
                    <Link key={district.id} href={`/districts/${district.slug}`} className="rounded-xl border border-white/10 bg-black/35 p-3 transition hover:bg-white/10 sm:rounded-2xl sm:p-4">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/40 sm:text-[10px] sm:tracking-[0.18em]">District Hub</p>
                      <h3 className="mt-1.5 text-[13px] font-black text-white sm:mt-2 sm:text-sm">{district.name}</h3>
                      <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/40 sm:mt-2 sm:text-xs sm:tracking-[0.14em]">View Standings →</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {relatedGames.length > 0 && (
              <section className="rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl sm:rounded-[1.75rem] sm:p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--vv-accent)] sm:text-xs sm:tracking-[0.28em]">Related Matchups</p>
                <div className="mt-3 flex flex-col gap-2 sm:mt-5 sm:gap-3">
                  {relatedGames.map((game) => {
                    const awaySchool = game.awaySchoolSlug ? getSchoolBySlug(game.awaySchoolSlug) : undefined;
                    const homeSchool = game.homeSchoolSlug ? getSchoolBySlug(game.homeSchoolSlug) : undefined;
                    const showScore = game.status === "live" || game.status === "final";
                    const awayScore = showScore ? game.awayScore ?? game.score?.away : undefined;
                    const homeScore = showScore ? game.homeScore ?? game.score?.home : undefined;
                    return (
                      <Link key={game.id} href={`/games/${game.id}`} className="block rounded-xl border border-white/10 bg-black/35 p-3 transition hover:bg-white/10 sm:rounded-2xl sm:p-4">
                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/40 sm:text-[10px] sm:tracking-[0.18em]">Week {game.week ?? "TBD"}</p>
                        <div className="mt-2 space-y-2 sm:mt-3 sm:space-y-2.5">
                          <div className="flex items-center gap-2.5 sm:gap-3">{awaySchool && <SchoolBadge school={awaySchool} size="xs" />}<p className="min-w-0 flex-1 truncate text-[13px] font-black text-white sm:text-sm">{game.awayTeam}</p>{awayScore !== undefined && <span className="text-[13px] font-black tabular-nums text-white sm:text-sm">{awayScore}</span>}</div>
                          <div className="flex items-center gap-2.5 sm:gap-3">{homeSchool && <SchoolBadge school={homeSchool} size="xs" />}<p className="min-w-0 flex-1 truncate text-[13px] font-black text-white sm:text-sm">{game.homeTeam}</p>{homeScore !== undefined && <span className="text-[13px] font-black tabular-nums text-white sm:text-sm">{homeScore}</span>}</div>
                        </div>
                        <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.12em] text-white/35 sm:mt-3 sm:text-[10px] sm:tracking-[0.14em]">{formatShortDate(game.kickoff ?? game.date ?? "")} · View Matchup →</p>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {relatedArticles.length > 0 && (
              <section className="rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl sm:rounded-[1.75rem] sm:p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--vv-accent)] sm:text-xs sm:tracking-[0.28em]">More Coverage</p>
                <div className="mt-3 flex flex-col gap-2 sm:mt-5 sm:gap-3">
                  {relatedArticles.map((item) => (
                    <Link key={item.id} href={`/coverage/${item.slug}`} className="rounded-xl border border-white/10 bg-black/35 p-3 transition hover:bg-white/10 sm:rounded-2xl sm:p-4">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/40 sm:text-[10px] sm:tracking-[0.18em]">{formatArticleType(item.type)} · {formatShortDate(item.publishedAt)}</p>
                      <h3 className="mt-1.5 text-[13px] font-black leading-5 text-white sm:mt-2 sm:text-sm">{item.title}</h3>
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
