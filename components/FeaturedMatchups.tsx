import Link from "next/link";
import { getScoreboardGames } from "@/lib/scoreboard";
import { getSchoolBySlug } from "@/lib/schools";
import SchoolBadge from "./SchoolBadge";

function parseGameDate(kickoff?: string) {
    if (!kickoff) return null;

    if (!kickoff.includes("T")) {
        const [year, month, day] = kickoff.split("-").map(Number);
        return new Date(year, month - 1, day);
    }

    const parsedDate = new Date(kickoff);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function formatGameDate(kickoff?: string) {
    const parsedDate = parseGameDate(kickoff);

    if (!parsedDate) return "TBD";

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "America/Chicago",
    }).format(parsedDate);
}

function getGameLabel(gameType: string, week?: number) {
    if (gameType === "scrimmage") return "Scrimmage";
    if (gameType === "playoff") return "Playoff";
    return week === undefined ? "Week TBD" : `Week ${week}`;
}

export default function FeaturedMatchups() {
    const games = getScoreboardGames()
        .filter((game) => game.status === "upcoming" && game.gameType !== "bye")
        .slice(0, 4);

    if (games.length === 0) return null;

    return (
        <section className="px-4 py-5 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[1440px] rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl md:p-8">
                <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-white/45">
                            Featured Matchups
                        </p>

                        <h2 className="mt-2 text-3xl font-black text-white md:text-4xl">
                            Upcoming games with VarsityVue coverage potential
                        </h2>
                    </div>

                    <Link
                        href="/scoreboard"
                        className="inline-flex rounded-full border border-white/10 bg-black/35 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white/60 transition hover:bg-white/10 hover:text-white"
                    >
                        Full Scoreboard →
                    </Link>
                </div>

                <div className="grid gap-4 lg:grid-cols-4">
                    {games.map((game) => {
                        const awaySchool = game.awaySchoolSlug
                            ? getSchoolBySlug(game.awaySchoolSlug)
                            : undefined;

                        const homeSchool = game.homeSchoolSlug
                            ? getSchoolBySlug(game.homeSchoolSlug)
                            : undefined;

                        const accentColor =
                            homeSchool?.colors.primary ??
                            awaySchool?.colors.primary ??
                            "var(--vv-primary)";

                        return (
                            <Link
                                key={game.id}
                                href={`/games/${game.id}`}
                                className="group overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/35 transition hover:-translate-y-1 hover:bg-white/[0.07]"
                            >
                                <div
                                    className="h-2"
                                    style={{ backgroundColor: accentColor }}
                                />

                                <div className="p-5">
                                    <div className="flex items-center justify-between gap-3">
                                        <Badge label={getGameLabel(game.gameType, game.week)} />
                                        {game.districtGame && <Badge label="District" />}
                                    </div>

                                    <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                                        <TeamBlock
                                            name={game.awayTeam ?? "Away"}
                                            school={awaySchool}
                                            align="left"
                                        />

                                        <span className="text-xs font-black uppercase tracking-[0.18em] text-white/35">
                                            VS
                                        </span>

                                        <TeamBlock
                                            name={game.homeTeam ?? "Home"}
                                            school={homeSchool}
                                            align="right"
                                        />
                                    </div>

                                    <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                                        <p className="text-sm font-black text-white">
                                            {formatGameDate(game.kickoff)}
                                        </p>

                                        {game.venue && (
                                            <p className="mt-1 line-clamp-1 text-xs text-white/45">
                                                {game.venue}
                                            </p>
                                        )}
                                    </div>

                                    <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-white/50 transition group-hover:text-white">
                                        View Matchup →
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

function TeamBlock({
    name,
    school,
    align,
}: {
    name: string;
    school?: ReturnType<typeof getSchoolBySlug>;
    align: "left" | "right";
}) {
    return (
        <div
            className={`min-w-0 ${align === "right" ? "text-right" : "text-left"
                }`}
        >
            <div className={`flex ${align === "right" ? "justify-end" : "justify-start"}`}>
                {school ? (
                    <SchoolBadge school={school} size="xs" />
                ) : (
                    <MiniBadge label={name} />
                )}
            </div>

            <p className="mt-3 line-clamp-2 text-sm font-black leading-tight text-white">
                {name}
            </p>

            {school?.mascot && (
                <p className="mt-1 line-clamp-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/35">
                    {school.mascot}
                </p>
            )}
        </div>
    );
}

function Badge({ label }: { label: string }) {
    return (
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/55">
            {label}
        </span>
    );
}

function MiniBadge({ label }: { label: string }) {
    return (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 p-2 text-center text-[10px] font-black uppercase text-white">
            {label.slice(0, 3)}
        </div>
    );
}