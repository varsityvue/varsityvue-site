import Link from "next/link";
import { getLatestArticles } from "@/lib/articles";
import AreaLeaders from "@/components/AreaLeaders";

function formatArticleType(type: string) {
  return type.replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function FeaturedCoverage() {
  const articles = getLatestArticles(4);
  const featuredArticle = articles[0];
  const secondaryArticles = articles.slice(1, 4);

  if (!featuredArticle) {
    return (
      <>
        <AreaLeaders />
        <section className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
          <div className="mx-auto max-w-[1440px] overflow-hidden rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-3.5 shadow-2xl sm:rounded-[2rem] sm:p-6 md:p-8">
            <div className="rounded-[1.2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(139,16,32,0.42),transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.06),rgba(0,0,0,0.94))] p-4 sm:rounded-[1.75rem] sm:p-7 md:p-10">
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/45 sm:text-xs sm:tracking-[0.3em]">
                Featured Coverage
              </p>

              <h2 className="mt-2 text-[1.7rem] font-black leading-tight text-white sm:mt-4 sm:text-4xl md:text-5xl">
                Stories will build with the season.
              </h2>

              <p className="mt-2 max-w-3xl text-xs leading-5 text-white/60 sm:mt-4 sm:text-base sm:leading-7">
                Published coverage will appear here as VarsityVue adds verified
                results, matchup context, and program-specific stories during the
                2026 season. Fans, coaches, and community members can also send
                story ideas, photos, records, and program information for review.
              </p>

              <div className="mt-4 flex flex-wrap gap-2 sm:mt-7 sm:gap-3">
                <Link
                  href="/coverage"
                  className="inline-flex rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/75 transition hover:bg-white/15 hover:text-white sm:px-5 sm:py-3 sm:text-xs sm:tracking-[0.16em]"
                >
                  Explore Coverage →
                </Link>
                <Link
                  href="/submit"
                  className="inline-flex rounded-xl border border-white/10 bg-black/35 px-4 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/60 transition hover:bg-white/10 hover:text-white sm:px-5 sm:py-3 sm:text-xs sm:tracking-[0.16em]"
                >
                  Submit a Story Tip →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <AreaLeaders />
      <section className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        <div className="mx-auto max-w-[1440px] rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-3.5 shadow-2xl sm:rounded-[2rem] sm:p-6 md:p-8">
          <div className="mb-4 flex flex-col gap-2.5 sm:mb-6 sm:gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/45 sm:text-xs sm:tracking-[0.3em]">
                Featured Coverage
              </p>

              <h2 className="mt-1.5 text-[1.65rem] font-black leading-[1.05] text-white sm:mt-2 sm:text-3xl md:text-4xl">
                Latest stories from VarsityVue
              </h2>
            </div>

            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <Link
                href="/submit"
                className="inline-flex rounded-full border border-white/10 bg-black/35 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-white/60 transition hover:bg-white/10 hover:text-white sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.16em]"
              >
                Submit a Story Tip →
              </Link>
              <Link
                href="/coverage"
                className="inline-flex rounded-full border border-white/10 bg-black/35 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-white/60 transition hover:bg-white/10 hover:text-white sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.16em]"
              >
                View All Coverage →
              </Link>
            </div>
          </div>

          <div className="grid gap-2.5 sm:gap-5 lg:grid-cols-[1.25fr_0.75fr]">
            <Link
              href={`/coverage/${featuredArticle.slug}`}
              className="group overflow-hidden rounded-[1.2rem] border border-white/10 bg-black/35 transition hover:-translate-y-1 hover:bg-white/[0.07] sm:rounded-[1.75rem]"
            >
              <div className="bg-[radial-gradient(circle_at_top_left,rgba(139,16,32,0.65),transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(0,0,0,0.92))] p-4 sm:min-h-[260px] sm:p-6 md:p-8">
                <p className="inline-flex rounded-full border border-white/10 bg-white/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-white/60 sm:px-3 sm:py-1 sm:text-[10px] sm:tracking-[0.16em]">
                  {formatArticleType(featuredArticle.type)}
                </p>

                <h3 className="mt-2.5 max-w-3xl text-[1.6rem] font-black leading-[1.08] tracking-[-0.025em] text-white sm:mt-5 sm:text-4xl sm:leading-tight md:text-5xl">
                  {featuredArticle.title}
                </h3>

                <p className="mt-2 max-w-3xl text-xs leading-5 text-white/60 sm:mt-4 sm:text-sm sm:leading-6">
                  {featuredArticle.excerpt}
                </p>

                <p className="mt-3 text-[10px] font-black uppercase tracking-[0.12em] text-white/50 transition group-hover:text-white sm:mt-6 sm:text-xs sm:tracking-[0.16em]">
                  Read Featured Story →
                </p>
              </div>
            </Link>

            <div className="grid gap-2.5 sm:gap-4">
              {secondaryArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/coverage/${article.slug}`}
                  className="group rounded-[1.2rem] border border-white/10 bg-black/35 p-3.5 transition hover:-translate-y-1 hover:bg-white/[0.07] sm:rounded-[1.5rem] sm:p-5"
                >
                  <p className="text-[9px] font-black uppercase tracking-[0.15em] text-white/35 sm:text-[10px] sm:tracking-[0.18em]">
                    {formatArticleType(article.type)}
                  </p>

                  <h3 className="mt-2 text-base font-black leading-snug text-white sm:mt-3 sm:text-xl">
                    {article.title}
                  </h3>

                  <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-white/55 sm:mt-2 sm:text-sm sm:leading-6">
                    {article.excerpt}
                  </p>

                  <p className="mt-3 text-[10px] font-black uppercase tracking-[0.12em] text-white/45 transition group-hover:text-white sm:mt-4 sm:text-xs sm:tracking-[0.16em]">
                    Read Story →
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
