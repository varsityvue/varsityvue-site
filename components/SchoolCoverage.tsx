import Link from "next/link";

import { getArticlesForSchool } from "@/lib/articles";
import { getSchoolBySlug } from "@/lib/schools";

type Props = { schoolSlug: string; enhanced?: boolean };

export default function SchoolCoverage({ schoolSlug, enhanced = false }: Props) {
  const school = getSchoolBySlug(schoolSlug);
  const articles = getArticlesForSchool(schoolSlug).slice(0, 3);
  if (articles.length === 0) return null;
  const [featured, ...remaining] = articles;

  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04] shadow-xl sm:rounded-[1.75rem]">
      <div className="h-1" style={{ backgroundColor: school?.colors.primary ?? "#8B1020" }} />
      <div className="p-4 sm:p-6 md:p-7">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${enhanced ? "text-white/70" : "text-white/40"} sm:text-xs sm:tracking-[0.22em]`}>Program Coverage</p>
            <h2 className="mt-1.5 break-words text-xl font-black text-white sm:mt-2 sm:text-2xl">Latest {school?.name ?? "School"} stories</h2>
            <p className="mt-2 hidden max-w-2xl text-sm leading-6 text-white/45 sm:block">Game coverage, program updates, and local stories connected to this team.</p>
          </div>
          <Link href="/coverage" className="shrink-0 text-[9px] font-black uppercase tracking-[0.1em] text-white/45 transition hover:text-white sm:rounded-xl sm:border sm:border-white/10 sm:bg-white/5 sm:px-4 sm:py-3 sm:text-xs sm:tracking-[0.14em] sm:text-white/60 sm:hover:bg-white/10">Coverage →</Link>
        </div>

        {enhanced && <article className="mt-4 overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-white/[0.08] to-black/30 sm:mt-5">
          <Link href={`/coverage/${featured.slug}`} className="group block focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-white">
            {featured.featuredImageUrl && <div className="bg-black/40">
              {/* Existing published editorial media retains its credits below. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={featured.featuredImageUrl} alt={featured.featuredImageAlt ?? featured.title} width={1200} height={675} loading="lazy" className="max-h-[420px] w-full object-contain" />
            </div>}
            <div className="p-5 sm:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/70">{featured.editorialLabel ?? featured.type} · <time dateTime={featured.publishedAt}>{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Chicago" }).format(new Date(featured.publishedAt))}</time></p>
              <h3 className="mt-3 break-words text-xl font-black leading-tight text-white sm:text-3xl">{featured.title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/75">{featured.excerpt}</p>
              <p className="mt-4 text-sm font-bold text-white/70">By {featured.author}</p>
              <p className="mt-4 text-xs font-bold uppercase tracking-widest text-white group-hover:underline">Read story →</p>
            </div>
          </Link>
          {featured.featuredImageCaption && <p className="border-t border-white/10 px-5 py-3 text-xs leading-5 text-white/70 sm:px-7">{featured.featuredImageCaption}</p>}
        </article>}
        {(!enhanced || remaining.length > 0) && <div className="mt-4 grid gap-2.5 sm:mt-5 sm:gap-3 md:grid-cols-3">
          {(enhanced ? remaining : articles).map((article) => (
            <Link key={article.id} href={`/coverage/${article.slug}`} className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-white/10 bg-black/35 p-3.5 transition hover:border-white/20 hover:bg-white/[0.07] sm:block sm:rounded-2xl sm:p-5">
              <div className="min-w-0">
                <p className={`text-[8px] font-black uppercase tracking-[0.14em] ${enhanced ? "text-white/70" : "text-white/35"} sm:text-[10px] sm:tracking-[0.16em]`}>{article.type}</p>
                {enhanced && <time dateTime={article.publishedAt} className="mt-1 block text-xs text-white/70">{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Chicago" }).format(new Date(article.publishedAt))}</time>}
                <h3 className="mt-1.5 break-words text-sm font-black leading-5 text-white transition group-hover:text-white/80 sm:mt-2 sm:text-base sm:leading-6">{article.title}</h3>
              </div>
              <span className="text-lg text-white/30 sm:hidden">→</span>
              <p className={`mt-4 hidden text-xs font-black uppercase tracking-[0.12em] ${enhanced ? "text-white/70" : "text-white/35"} sm:block`}>Read Story →</p>
            </Link>
          ))}
        </div>}
      </div>
    </section>
  );
}
