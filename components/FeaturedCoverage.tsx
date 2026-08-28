import Link from "next/link";
import { getLatestArticles } from "@/lib/articles";

function formatArticleType(type: string) {
  return type.replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function FeaturedCoverage() {
  const articles = getLatestArticles(4);
  const featuredArticle = articles[0];
  const secondaryArticles = articles.slice(1, 4);

  if (!featuredArticle) {
    return (
      <section className="px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1440px] overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl md:p-8">
          <div className="rounded-[1.75rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(139,16,32,0.42),transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.06),rgba(0,0,0,0.94))] p-7 md:p-10">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-white/45">
              Featured Coverage
            </p>

            <h2 className="mt-4 text-4xl font-black text-white md:text-5xl">
              2026 coverage starts here.
            </h2>

            <p className="mt-4 max-w-3xl text-base leading-7 text-white/60">
              Game previews, player spotlights, weekly recaps and stories from
              around the VarsityVue coverage area will appear here throughout
              the season.
            </p>

            <Link
              href="/coverage"
              className="mt-7 inline-flex rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white/75 transition hover:bg-white/15 hover:text-white"
            >
              Explore Coverage →
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px] rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl md:p-8">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-white/45">
              Featured Coverage
            </p>

            <h2 className="mt-2 text-3xl font-black text-white md:text-4xl">
              Latest stories from around the VarsityVue coverage area
            </h2>
          </div>

          <Link
            href="/coverage"
            className="inline-flex rounded-full border border-white/10 bg-black/35 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            View All Coverage →
          </Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <Link
            href={`/coverage/${featuredArticle.slug}`}
            className="group overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/35 transition hover:-translate-y-1 hover:bg-white/[0.07]"
          >
            <div className="min-h-[260px] bg-[radial-gradient(circle_at_top_left,rgba(139,16,32,0.65),transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(0,0,0,0.92))] p-6 md:p-8">
              <p className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/60">
                {formatArticleType(featuredArticle.type)}
              </p>

              <h3 className="mt-5 max-w-3xl text-4xl font-black leading-tight text-white md:text-5xl">
                {featuredArticle.title}
              </h3>

              <p className="mt-4 max-w-3xl text-sm leading-6 text-white/60">
                {featuredArticle.excerpt}
              </p>

              <p className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-white/50 transition group-hover:text-white">
                Read Featured Story →
              </p>
            </div>
          </Link>

          <div className="grid gap-4">
            {secondaryArticles.map((article) => (
              <Link
                key={article.id}
                href={`/coverage/${article.slug}`}
                className="group rounded-[1.5rem] border border-white/10 bg-black/35 p-5 transition hover:-translate-y-1 hover:bg-white/[0.07]"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
                  {formatArticleType(article.type)}
                </p>

                <h3 className="mt-3 text-xl font-black leading-snug text-white">
                  {article.title}
                </h3>

                <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/55">
                  {article.excerpt}
                </p>

                <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-white/45 transition group-hover:text-white">
                  Read Story →
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
