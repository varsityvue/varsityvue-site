import Link from "next/link";

import { getLatestArticles } from "@/lib/articles";
import { getSchoolBySlug } from "@/lib/schools";
import SchoolTeamLeaders from "@/components/SchoolTeamLeaders";

type Props = {
    schoolSlug: string;
};

export default function SchoolCoverage({
    schoolSlug,
}: Props) {
    const school = getSchoolBySlug(schoolSlug);
    const articles = getLatestArticles(20)
        .filter((article) =>
            article.schoolIds?.includes(schoolSlug)
        )
        .slice(0, 3);

    return (
        <div className="space-y-6">
            <SchoolTeamLeaders
                schoolSlug={schoolSlug}
                primaryColor={school?.colors.primary}
                secondaryColor={school?.colors.secondary}
            />

            {articles.length > 0 && (
                <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/45">
                                Coverage
                            </p>

                            <h2 className="mt-2 text-2xl font-black text-white">
                                Latest Stories
                            </h2>
                        </div>

                        <Link
                            href="/coverage"
                            className="text-xs font-black uppercase tracking-[0.16em] text-white/55 hover:text-white"
                        >
                            View All →
                        </Link>
                    </div>

                    <div className="mt-5 space-y-3">
                        {articles.map((article) => (
                            <Link
                                key={article.id}
                                href={`/coverage/${article.slug}`}
                                className="block rounded-xl border border-white/10 bg-black/35 p-4 transition hover:bg-white/10"
                            >
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/40">
                                    {article.type}
                                </p>

                                <h3 className="mt-2 font-black text-white">
                                    {article.title}
                                </h3>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
