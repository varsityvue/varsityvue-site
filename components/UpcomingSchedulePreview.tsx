import Link from "next/link";
import { getGamesForSchool } from "@/lib/games";
import type { SchoolTheme } from "@/types/school-theme";

type Props = {
    schoolSlug: string;
    theme: SchoolTheme;
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
    if (!kickoff) return { month: "TBD", day: "—", full: "Date TBD" };

    const parsedDate = parseGameDate(kickoff);
    if (!parsedDate) return { month: "TBD", day: "—", full: "Date TBD" };
    const timeZone = kickoff.includes("T") ? CENTRAL_TIME_ZONE : "UTC";

    return {
        month: new Intl.DateTimeFormat("en-US", { month: "short", timeZone }).format(parsedDate).toUpperCase(),
        day: new Intl.DateTimeFormat("en-US", { day: "numeric", timeZone }).format(parsedDate),
        full: new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone }).format(parsedDate),
    };
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
    if (game.status !== "upcoming" || game.gameType === "bye") return false;
    if (!game.kickoff || !todayKey) return true;

    const gameDateKey = game.kickoff.slice(0, 10);
    return gameDateKey >= todayKey;
}

function getWeekLabel(game: SchoolGame) {
    if (game.gameType === "scrimmage") return "Scrimmage";
    if (game.gameType === "playoff") return "Playoff";
    return game.week === undefined ? "Week TBD" : `Week ${game.week}`;
}

function getOpponent(game: SchoolGame, schoolSlug: string) {
    const isHome = game.homeSchoolSlug === schoolSlug;

    return {
        name: isHome ? game.awayTeam ?? "Opponent TBD" : game.homeTeam ?? "Opponent TBD",
        location: game.isNeutralSite ? "Neutral Site" : isHome ? "Home" : "Away",
    };
}

export default function UpcomingSchedulePreview({ schoolSlug, theme }: Props) {
    const todayKey = getCentralDateKey(new Date());
    const upcoming = getGamesForSchool(schoolSlug)
        .filter((game) => isStillUpcoming(game, todayKey))
        .sort((a, b) => getGameTimestamp(a) - getGameTimestamp(b));

    // The immediate next matchup is already featured in Season Overview.
    // This section intentionally looks beyond it so the hub does not repeat itself.
    const games = upcoming.slice(1, 4);

    if (games.length === 0) return null;

    return (
        <section
            className="overflow-hidden rounded-[1.75rem] border shadow-2xl"
            style={{
                borderColor: `${theme.primary}44`,
                background: "linear-gradient(135deg, rgba(255,255,255,0.045), rgba(0,0,0,0.97) 62%)",
                boxShadow: `0 18px 50px ${theme.primary}12`,
            }}
        >
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-6">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/45 sm:text-xs">
                        Road Ahead
                    </p>
                    <h2 className="mt-2 text-2xl font-black text-white">Coming up after this week</h2>
                    <p className="mt-1 text-xs text-white/35">A quick look at the next stretch of the schedule.</p>
                </div>

                <Link
                    href={`/schools/${schoolSlug}/schedule`}
                    className="shrink-0 text-xs font-black uppercase tracking-[0.16em] text-white/55 transition hover:text-white"
                >
                    Full Schedule →
                </Link>
            </div>

            <div className="divide-y divide-white/10">
                {games.map((game) => {
                    const opponent = getOpponent(game, schoolSlug);
                    const date = formatGameDate(game.kickoff);

                    return (
                        <Link
                            key={game.id}
                            href={`/games/${game.id}`}
                            className="group relative grid grid-cols-[3.6rem_minmax(0,1fr)_auto] items-center gap-3 overflow-hidden px-4 py-4 transition hover:bg-white/[0.045] sm:grid-cols-[4rem_minmax(0,1fr)_auto] sm:gap-4 sm:px-6 sm:py-5"
                        >
                            <div
                                className="absolute inset-y-0 left-0 w-1 opacity-80"
                                style={{ backgroundColor: theme.primary }}
                            />

                            <div className="rounded-2xl border border-white/10 bg-black/35 px-2 py-2.5 text-center">
                                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/35">{date.month}</p>
                                <p className="mt-0.5 text-xl font-black leading-none text-white">{date.day}</p>
                            </div>

                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[9px] font-black uppercase tracking-[0.16em] text-white/40">
                                        {getWeekLabel(game)} · {opponent.location}
                                    </span>
                                    {game.districtGame && (
                                        <span
                                            className="rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em]"
                                            style={{ borderColor: `${theme.primary}66`, color: theme.accent ?? theme.primary }}
                                        >
                                            District
                                        </span>
                                    )}
                                </div>
                                <h3 className="mt-1.5 truncate text-lg font-black text-white transition group-hover:text-white/80 sm:text-xl">
                                    {opponent.name}
                                </h3>
                                <p className="mt-1 truncate text-[11px] text-white/35">
                                    {game.venue ?? "Venue TBD"}
                                </p>
                            </div>

                            <div className="text-right">
                                <p className="text-xs font-black text-white/70 sm:text-sm">{formatKickoffTime(game.kickoff)}</p>
                                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.1em] text-white/30">Game Center →</p>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}