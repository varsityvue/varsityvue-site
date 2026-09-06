import Link from "next/link";

import { getLatestArticles } from "@/lib/articles";
import { getSchoolBySlug } from "@/lib/schools";

type Props = {
  schoolSlug: string;
};

export default function SchoolCoverage({ schoolSlug }: Props) {
  const school = getSchoolBySlug(schoolSlug);
  const articles = getLatestArticles(20)
    .filter((article) => article.schoolIds?.includes(schoolSlug))
    .slice(0, 3);

  if (articles.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.04] shadow-xl">
      <div
        className="h-1.5"
        style={{ backgroundColor: school?.colors.primary ?? "#8B1020" }}
      />
      <div className="p-6 md:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/45">
              Program Coverage
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              Latest {school?.name ?? "School"} stories
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
              Game coverage, program updates, and local stories connected to this team.
            </p>
          </div>

          <Link
            href="/coverage"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            More Coverage →
          </Link>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/coverage/${article.slug}`}
              className="group block rounded-2xl border border-white/10 bg-black/35 p-5 transition hover:border-white/20 hover:bg-white/[0.07]"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/40">
                {article.type}
              </p>
              <h3 className="mt-2 font-black leading-6 text-white transition group-hover:text-white/80">
                {article.title}
              </h3>
              <p className="mt-4 text-xs font-black uppercase tracking-[0.12em] text-white/35">
                Read Story →
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
