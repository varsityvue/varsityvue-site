import Link from "next/link";
import { getGamesForSchool } from "@/lib/games";

type Props = {
    schoolSlug: string;
};

type SchoolGame = ReturnType<typeof getGamesForSchool>[number];

const CENTRAL_TIME_ZONE = "America/Chicago";

function getDateOnlyParts(kickoff: string) {
    const [year, month, day] = kickoff.split("-").map(Number);
    if (!year || !month || !day) return null;
    return { year, month, day };
}

function parseGameDate(kickoff?: string) {
    if (!kickoff) return null;

    if (!kickoff.includes("T")) {
        const parts = getDateOnlyParts(kickoff);
        if (!parts) return null;
        return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12));
    }

    const parsedDate = new Date(kickoff);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function formatGameDate(kickoff?: string) {
    if (!kickoff) return "Date TBD";

    if (!kickoff.includes("T")) {
        const parts = getDateOnlyParts(kickoff);
        if (!parts) return "Date TBD";

        return new Intl.DateTimeFormat("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            timeZone: "UTC",
        }).format(new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12)));
    }

    const parsedDate = parseGameDate(kickoff);
    if (!parsedDate) return "Date TBD";

    return new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone: CENTRAL_TIME_ZONE,
    }).format(parsedDate);
}

function formatKickoffTime(kickoff?: string) {
    if (!kickoff?.includes("T")) return "Time TBD";

    const parsedDate = parseGameDate(kickoff);
    if (!parsedDate) return "Time TBD";

    return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: CENTRAL_TIME_ZONE,
    }).format(parsedDate);
}

function getGameTimestamp(game: SchoolGame) {
    const parsedDate = parseGameDate(game.kickoff);
    return parsedDate ? parsedDate.getTime() : Number.MAX_SAFE_INTEGER;
}

function getCentralDateKey(date: Date) {
    const parts = new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone: CENTRAL_TIME_ZONE,
    }).formatToParts(date);

    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;

    return year && month && day ? `${year}-${month}-${day}` : "";
}

function isStillUpcoming(game: SchoolGame, todayKey: string) {
    if (game.status !== "upcoming") return false;
    if (!game.kickoff || !todayKey) return true;

    const gameDateKey = game.kickoff.slice(0, 10);
    return gameDateKey >= todayKey;
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
        location: game.isNeutralSite ? "Neutral Site" : isHome ? "Home" : "Away",
    };
}

export default function UpcomingSchedulePreview({ schoolSlug }: Props) {
    const todayKey = getCentralDateKey(new Date());
    const games = getGamesForSchool(schoolSlug)
        .filter((game) => isStillUpcoming(game, todayKey))
        .sort((a, b) => getGameTimestamp(a) - getGameTimestamp(b))
        .slice(0, 3);

    if (games.length === 0) return null;

    return (
        <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.04] shadow-2xl">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 px-6 py-5">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-white/45">
                        Upcoming Schedule
                    </p>
                    <h2 className="mt-2 text-2xl font-black text-white">
                        Next up
                    </h2>
                </div>

                <Link
                    href={`/schools/${schoolSlug}/schedule`}
                    className="shrink-0 text-xs font-black uppercase tracking-[0.16em] text-white/55 transition hover:text-white"
                >
                    Full Schedule →
                </Link>
            </div>

            <div className="divide-y divide-white/10">
                {games.map((game, index) => {
                    const opponent = getOpponent(game, schoolSlug);

                    return (
                        <Link
                            key={game.id}
                            href={`/games/${game.id}`}
                            className="group grid gap-4 px-6 py-5 transition hover:bg-white/[0.045] sm:grid-cols-[1fr_auto] sm:items-center"
                        >
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    {index === 0 && (
                                        <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-white/75">
                                            Next Game
                                        </span>
                                    )}
                                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
                                        {getWeekLabel(game)} · {opponent.location}
                                    </span>
                                    {game.districtGame && (
                                        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/55">
                                            District
                                        </span>
                                    )}
                                </div>

                                <h3 className="mt-2 truncate text-xl font-black text-white transition group-hover:text-white/80">
                                    {opponent.name}
                                </h3>

                                {game.venue && (
                                    <p className="mt-1 truncate text-xs font-semibold text-white/40">
                                        {game.venue}
                                    </p>
                                )}
                            </div>

                            <div className="sm:text-right">
                                <p className="text-sm font-black text-white/80">
                                    {formatGameDate(game.kickoff)}
                                </p>
                                <p className="mt-1 text-xs font-semibold text-white/40">
                                    {formatKickoffTime(game.kickoff)}
                                </p>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}