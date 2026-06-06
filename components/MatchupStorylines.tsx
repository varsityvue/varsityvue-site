import { getSchoolBySlug } from "@/lib/schools";

type Props = {
    awaySchoolSlug?: string;
    homeSchoolSlug?: string;
};

export default function MatchupStorylines({
    awaySchoolSlug,
    homeSchoolSlug,
}: Props) {
    const awaySchool = awaySchoolSlug
        ? getSchoolBySlug(awaySchoolSlug)
        : undefined;

    const homeSchool = homeSchoolSlug
        ? getSchoolBySlug(homeSchoolSlug)
        : undefined;

    if (!awaySchool || !homeSchool) return null;

    return (
        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-7 shadow-2xl">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--vv-accent)]">
                Storylines
            </p>

            <h2 className="mt-3 text-3xl font-black text-white">
                What makes this matchup interesting?
            </h2>

            <div className="mt-6 grid gap-4">
                <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
                    <h3 className="font-black text-white">
                        Early Season Measuring Stick
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-white/60">
                        {awaySchool.name} and {homeSchool.name} both enter looking to build
                        momentum and establish identity before district play arrives.
                    </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
                    <h3 className="font-black text-white">
                        Playoff Implications
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-white/60">
                        Every quality opponent provides valuable playoff preparation and
                        helps reveal strengths and weaknesses that will matter later in the
                        season.
                    </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
                    <h3 className="font-black text-white">
                        Community Attention
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-white/60">
                        This is the type of game fans, parents, alumni, and local sponsors
                        will follow closely throughout the week.
                    </p>
                </div>
            </div>
        </section>
    );
}