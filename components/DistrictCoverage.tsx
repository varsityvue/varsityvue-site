import Link from "next/link";
import { getArticlesForDistrict } from "@/lib/articles";

type Props = {
    districtId: string;
};

function formatArticleType(type: string) {
    return type.replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function DistrictCoverage({ districtId }: Props) {
    const articles = getArticlesForDistrict(districtId).slice(0, 3);

    if (articles.length === 0) return null;

    return (
        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.28em] text-white/70">
                        District Coverage
                    </p>

                    <h2 className="mt-2 text-3xl font-black text-white">
                        Latest District Stories
                    </h2>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
                        Stories, previews, standings updates, and district race coverage.
                    </p>
                </div>

                <Link
                    href="/coverage"
                    className="hidden rounded-full border border-white/10 bg-black/35 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white/60 transition hover:bg-white/10 hover:text-white sm:inline-flex"
                >
                    View Coverage →
                </Link>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
                {articles.map((article) => (
                    <Link
                        key={article.id}
                        href={`/coverage/${article.slug}`}
                        className="rounded-2xl border border-white/10 bg-black/35 p-5 transition hover:-translate-y-1 hover:bg-white/10"
                    >
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
                            {formatArticleType(article.type)}
                        </p>

                        <h3 className="mt-3 text-lg font-black leading-snug text-white">
                            {article.title}
                        </h3>

                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/55">
                            {article.excerpt}
                        </p>

                        <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-white/45">
                            Read Story →
                        </p>
                    </Link>
                ))}
            </div>

            <Link
                href="/coverage"
                className="mt-5 block rounded-xl border border-white/10 bg-black/35 px-5 py-4 text-center text-sm font-black uppercase tracking-[0.16em] text-white/65 transition hover:bg-white/10 hover:text-white sm:hidden"
            >
                View Coverage →
            </Link>
        </section>
    );
}