import { getSchoolBySlug } from "@/lib/schools";

type MatchupPlayersProps = {
    awaySchoolSlug?: string;
    homeSchoolSlug?: string;
};

function getPlayersForSchool(schoolName: string) {
    return [
        {
            role: "Offensive Player",
            name: `${schoolName} QB`,
            position: "QB",
            note: "Sets the tone for tempo, execution, and explosive-play potential.",
        },
        {
            role: "Defensive Player",
            name: `${schoolName} Defensive Leader`,
            position: "LB",
            note: "A key presence in controlling field position and forcing tough downs.",
        },
    ];
}

export default function MatchupPlayers({
    awaySchoolSlug,
    homeSchoolSlug,
}: MatchupPlayersProps) {
    const awaySchool = awaySchoolSlug ? getSchoolBySlug(awaySchoolSlug) : undefined;
    const homeSchool = homeSchoolSlug ? getSchoolBySlug(homeSchoolSlug) : undefined;

    const teams = [
        awaySchool && {
            school: awaySchool.name,
            mascot: awaySchool.mascot,
            color: awaySchool.colors.primary,
            players: getPlayersForSchool(awaySchool.name),
        },
        homeSchool && {
            school: homeSchool.name,
            mascot: homeSchool.mascot,
            color: homeSchool.colors.primary,
            players: getPlayersForSchool(homeSchool.name),
        },
    ].filter(Boolean) as {
        school: string;
        mascot: string;
        color: string;
        players: ReturnType<typeof getPlayersForSchool>;
    }[];

    if (teams.length === 0) return null;

    return (
        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-7 shadow-2xl">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--vv-accent)]">
                Players To Watch
            </p>

            <h2 className="mt-3 text-3xl font-black text-white">
                Impact names for this matchup
            </h2>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {teams.map((team) => (
                    <div
                        key={team.school}
                        className="rounded-2xl border border-white/10 bg-black/35 p-5"
                        style={{ boxShadow: `inset 4px 0 0 ${team.color}` }}
                    >
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-white/40">
                            {team.mascot}
                        </p>

                        <h3 className="mt-2 text-2xl font-black text-white">
                            {team.school}
                        </h3>

                        <div className="mt-5 grid gap-3">
                            {team.players.map((player) => (
                                <div
                                    key={`${team.school}-${player.role}`}
                                    className="rounded-xl border border-white/10 bg-white/[0.04] p-4"
                                >
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
                                        {player.role}
                                    </p>

                                    <h4 className="mt-2 text-lg font-black text-white">
                                        {player.position} · {player.name}
                                    </h4>

                                    <p className="mt-2 text-sm leading-6 text-white/55">
                                        {player.note}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}