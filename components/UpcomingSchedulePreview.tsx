import Link from "next/link";
import { getGamesForSchool } from "@/lib/games";

type Props = {
    schoolSlug: string;
};

type SchoolGame = ReturnType<typeof getGamesForSchool>[number];

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
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone: "America/Chicago",
    }).format(parsedDate);
}

function getGameTimestamp(game: SchoolGame) {
    const parsedDate = parseGameDate(game.kickoff);
    return parsedDate ? parsedDate.getTime() : Number.MAX_SAFE_INTEGER;
}

function getWeekLabel(game: SchoolGame) {
    if (game.gameType === "scrimmage") return "Scrimmage";
    if (game.gameType === "playoff") return "Playoff";
    if (game.gameType === "bye") return "BYE";
    return game.week === undefined ? "Week TBD" : `Week ${game.week}`;
}

function getOpponent(game: SchoolGame, schoolSlug: string) {
    const isHome = game.homeSchoolSlug === schoolSlug;

    return {
        name: isHome ? game.awayTeam ?? "Opponent TBD" : game.homeTeam ?? "Opponent TBD",
        location: game.isNeutralSite ? "Neutral" : isHome ? "Home" : "Away",
    };
}

export default function UpcomingSchedulePreview({ schoolSlug }: Props) {
    const games = getGamesForSchool(schoolSlug)
        .filter((game) => game.status === "upcoming")
        .sort((a, b) => getGameTimestamp(a) - getGameTimestamp(b))
        .slice(0, 3);

    if (games.length === 0) return null;

    return (
        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-white/45">
                        Upcoming Schedule
                    </p>

                    <h2 className="mt-2 text-2xl font-black text-white">
                        Next on the calendar
                    </h2>
                </div>

                <Link
                    href={`/schools/${schoolSlug}/schedule`}
                    className="text-xs font-black uppercase tracking-[0.16em] text-white/55 transition hover:text-white"
                >
                    Full Schedule →
                </Link>
            </div>

            <div className="mt-5 grid gap-3">
                {games.map((game) => {
                    const opponent = getOpponent(game, schoolSlug);

                    return (
                        <Link
                            key={game.id}
                            href={`/games/${game.id}`}
                            className="rounded-2xl border border-white/10 bg-black/35 p-4 transition hover:bg-white/10"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
                                        {getWeekLabel(game)} · {opponent.location}
                                    </p>

                                    <h3 className="mt-2 text-lg font-black text-white">
                                        {opponent.name}
                                    </h3>

                                    {game.venue && (
                                        <p className="mt-1 line-clamp-1 text-xs font-semibold text-white/40">
                                            {game.venue}
                                        </p>
                                    )}
                                </div>

                                <p className="shrink-0 text-xs font-black uppercase tracking-[0.14em] text-white/45">
                                    {formatGameDate(game.kickoff)}
                                </p>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}