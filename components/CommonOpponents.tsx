import { getSchoolBySlug } from "@/lib/schools";

type CommonOpponentsProps = {
    awaySchoolSlug?: string;
    homeSchoolSlug?: string;
};

export default function CommonOpponents({
    awaySchoolSlug,
    homeSchoolSlug,
}: CommonOpponentsProps) {
    const awaySchool = awaySchoolSlug ? getSchoolBySlug(awaySchoolSlug) : undefined;
    const homeSchool = homeSchoolSlug ? getSchoolBySlug(homeSchoolSlug) : undefined;

    const awayName = awaySchool?.name ?? "Away Team";
    const homeName = homeSchool?.name ?? "Home Team";

    return (
        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-7 shadow-2xl">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--vv-accent)]">
                Common Opponents
            </p>

            <h2 className="mt-3 text-3xl font-black text-white">
                Shared results will sharpen the matchup.
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">
                As VarsityVue score data builds through the season, this section will
                compare how {awayName} and {homeName} performed against the same
                opponents.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
                <CommonOpponentCard
                    label="Shared Opponents"
                    value="Coming Soon"
                    body="Common opponent tracking will appear once both teams have overlapping results."
                />

                <CommonOpponentCard
                    label={`${awayName} Result`}
                    value="TBD"
                    body="Scores and margins will help show how the away team stacks up."
                />

                <CommonOpponentCard
                    label={`${homeName} Result`}
                    value="TBD"
                    body="Home team results will appear beside the same opponent for quick comparison."
                />
            </div>
        </section>
    );
}

function CommonOpponentCard({
    label,
    value,
    body,
}: {
    label: string;
    value: string;
    body: string;
}) {
    return (
        <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
                {label}
            </p>

            <h3 className="mt-3 text-2xl font-black text-white">{value}</h3>

            <p className="mt-3 text-sm leading-6 text-white/55">{body}</p>
        </div>
    );
}