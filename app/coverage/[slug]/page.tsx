import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArticleBySlug } from "../../../data/articles";
import type { Article } from "@/types/platform";

function formatArticleDate(publishedAt: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
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

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": article.type === "news" ? "NewsArticle" : "Article",
    headline: article.title,
    description: article.excerpt,
    articleBody: article.body,
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
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
    <main className="min-h-screen bg-black px-4 py-10 text-white sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleSchema),
        }}
      />

      <article className="mx-auto max-w-4xl">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#d65a6d] sm:text-sm">
          {formatArticleType(article.type)}
        </p>

        <h1 className="mt-4 text-4xl font-black leading-tight sm:text-6xl lg:text-7xl">
          {article.title}
        </h1>

        {article.subtitle && (
          <p className="mt-5 text-2xl font-semibold text-white/60">
            {article.subtitle}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-4 text-sm text-white/50">
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

        <p className="mt-10 text-xl leading-9 text-white/70 sm:text-2xl">
          {article.excerpt}
        </p>

        <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
          <p className="text-lg leading-8 text-white/75">{article.body}</p>
        </div>
      </article>
    </main>
  );
}