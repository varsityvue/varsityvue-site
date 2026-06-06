import { getSchoolBySlug } from "@/lib/schools";

type MatchupKeysProps = {
    awaySchoolSlug?: string;
    homeSchoolSlug?: string;
};

export default function MatchupKeys({
    awaySchoolSlug,
    homeSchoolSlug,
}: MatchupKeysProps) {
    const awaySchool = awaySchoolSlug ? getSchoolBySlug(awaySchoolSlug) : undefined;
    const homeSchool = homeSchoolSlug ? getSchoolBySlug(homeSchoolSlug) : undefined;

    const awayTeam = awaySchool?.name ?? "Away Team";
    const homeTeam = homeSchool?.name ?? "Home Team";

    const keys = [
        {
            title: `${homeTeam} rhythm early`,
            body: `${homeTeam} needs to settle into the game quickly, avoid early mistakes, and force ${awayTeam} to play from behind.`,
        },
        {
            title: `${awayTeam} explosive plays`,
            body: `${awayTeam} can change the matchup if it creates chunk plays and keeps pressure on the home sideline.`,
        },
        {
            title: "Turnover battle",
            body: "In early-season and district-style matchups, short fields and extra possessions usually decide momentum.",
        },
    ];

    return (
        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-7 shadow-2xl">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--vv-accent)]">
                Keys To Watch
            </p>

            <h2 className="mt-3 text-3xl font-black text-white">
                What can swing this matchup?
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
                {keys.map((key, index) => (
                    <div
                        key={key.title}
                        className="rounded-2xl border border-white/10 bg-black/35 p-5"
                    >
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-white/35">
                            Key #{index + 1}
                        </p>

                        <h3 className="mt-3 text-xl font-black text-white">
                            {key.title}
                        </h3>

                        <p className="mt-3 text-sm leading-6 text-white/60">
                            {key.body}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}