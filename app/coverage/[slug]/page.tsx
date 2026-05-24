import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getArticleBySlug, articles } from "../../../data/articles";
import { getSchoolBySlug } from "../../../data/schools";
import type { Article } from "@/types/platform";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

function formatArticleDate(publishedAt: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Chicago",
  }).format(new Date(publishedAt));
}

function formatShortDate(publishedAt: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
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

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    return {
      title: "Article Not Found | VarsityVue",
    };
  }

  return {
    title: article.seo.title,
    description: article.seo.description,
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

  const relatedArticles = articles
    .filter((item) => item.slug !== article.slug)
    .filter((item) =>
      item.schoolIds?.some((schoolId) => article.schoolIds?.includes(schoolId))
    )
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
            className="text-sm font-black uppercase tracking-[0.14em] text-[#d65a6d] transition hover:text-white"
          >
            ← Back to Coverage
          </Link>

          <div className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-[#d65a6d]">
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
              {article.body.split("\n").map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
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
            </div>
          </article>

          <aside className="space-y-6">
            <section className="rounded-[1.75rem] border border-[#7A1022]/40 bg-gradient-to-br from-[#7A1022]/45 via-black to-black p-6 shadow-2xl">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#f3a3af]">
                Coverage Sponsor
              </p>

              <h2 className="mt-3 text-2xl font-black text-white">
                This article placement is available
              </h2>

              <p className="mt-3 text-sm leading-6 text-white/55">
                Sponsor local previews, recaps, features, and game-week
                coverage across the VarsityVue ecosystem.
              </p>

              <Link
                href="/sponsor-inquiry"
                className="mt-6 block rounded-xl border border-white/15 bg-white/10 px-5 py-4 text-center text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/15"
              >
                Sponsor Coverage
              </Link>
            </section>

            {relatedSchools.length > 0 && (
              <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-[#d65a6d]">
                  Related Schools
                </p>

                <div className="mt-5 flex flex-col gap-3">
                  {relatedSchools.map(
                    (school) =>
                      school && (
                        <Link
                          key={school.slug}
                          href={`/schools/${school.slug}`}
                          className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm font-black text-white/75 transition hover:bg-white/10 hover:text-white"
                        >
                          {school.name} {school.mascot}
                        </Link>
                      )
                  )}
                </div>
              </section>
            )}

            <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#d65a6d]">
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
                  <p className="rounded-2xl border border-white/10 bg-black/35 p-4 text-sm text-white/55">
                    More related coverage coming soon.
                  </p>
                )}
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}