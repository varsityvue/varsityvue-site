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
    if (!kickoff) return { month: "TBD", day: "—" };

    const parsedDate = parseGameDate(kickoff);
    if (!parsedDate) return { month: "TBD", day: "—" };
    const timeZone = kickoff.includes("T") ? CENTRAL_TIME_ZONE : "UTC";

    return {
        month: new Intl.DateTimeFormat("en-US", { month: "short", timeZone }).format(parsedDate).toUpperCase(),
        day: new Intl.DateTimeFormat("en-US", { day: "numeric", timeZone }).format(parsedDate),
    };
}

function formatKickoffTime(kickoff?: string) {
    if (!kickoff?.includes("T")) return "TBD";

    const parsedDate = parseGameDate(kickoff);
    if (!parsedDate) return "TBD";

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
        location: game.isNeutralSite ? "Neutral" : isHome ? "Home" : "Away",
    };
}

export default function UpcomingSchedulePreview({ schoolSlug, theme }: Props) {
    const todayKey = getCentralDateKey(new Date());
    const upcoming = getGamesForSchool(schoolSlug)
        .filter((game) => isStillUpcoming(game, todayKey))
        .sort((a, b) => getGameTimestamp(a) - getGameTimestamp(b));

    // The immediate next matchup is already featured in Season Overview.
    const games = upcoming.slice(1, 4);

    if (games.length === 0) return null;

    return (
        <section
            className="overflow-hidden rounded-[1.5rem] border shadow-2xl sm:rounded-[1.75rem]"
            style={{
                borderColor: `${theme.primary}44`,
                background: "linear-gradient(135deg, rgba(255,255,255,0.045), rgba(0,0,0,0.97) 62%)",
                boxShadow: `0 18px 50px ${theme.primary}12`,
            }}
        >
            <div className="flex items-end justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5">
                <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/45 sm:text-xs sm:tracking-[0.24em]">Road Ahead</p>
                    <h2 className="mt-1.5 text-2xl font-black text-white sm:mt-2">Next on the schedule</h2>
                </div>
                <Link
                    href={`/schools/${schoolSlug}/schedule`}
                    className="shrink-0 text-[10px] font-black uppercase tracking-[0.12em] text-white/50 transition hover:text-white sm:text-xs sm:tracking-[0.16em]"
                >
                    Schedule →
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
                            className="group relative grid grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-2.5 overflow-hidden px-3.5 py-3 transition hover:bg-white/[0.045] sm:grid-cols-[4rem_minmax(0,1fr)_auto] sm:gap-4 sm:px-6 sm:py-5"
                        >
                            <div className="absolute inset-y-0 left-0 w-1 opacity-80" style={{ backgroundColor: theme.primary }} />

                            <div className="rounded-xl border border-white/10 bg-black/35 px-1.5 py-2 text-center sm:rounded-2xl sm:px-2 sm:py-2.5">
                                <p className="text-[8px] font-black uppercase tracking-[0.12em] text-white/35 sm:text-[9px] sm:tracking-[0.14em]">{date.month}</p>
                                <p className="mt-0.5 text-lg font-black leading-none text-white sm:text-xl">{date.day}</p>
                            </div>

                            <div className="min-w-0">
                                <div className="flex min-w-0 items-center gap-1.5">
                                    <span className="truncate text-[8px] font-black uppercase tracking-[0.12em] text-white/35 sm:text-[9px] sm:tracking-[0.16em]">{getWeekLabel(game)} · {opponent.location}</span>
                                    {game.districtGame && (
                                        <span className="shrink-0 rounded-full border px-1.5 py-0.5 text-[7px] font-black uppercase tracking-[0.08em] sm:px-2 sm:text-[9px] sm:tracking-[0.12em]" style={{ borderColor: `${theme.primary}66`, color: theme.accent ?? theme.primary }}>District</span>
                                    )}
                                </div>
                                <h3 className="mt-1 break-words text-[15px] font-black leading-5 text-white transition group-hover:text-white/80 sm:mt-1.5 sm:text-xl">{opponent.name}</h3>
                                {game.venue && <p className="mt-0.5 truncate text-[9px] text-white/30 sm:mt-1 sm:text-[11px]">{game.venue}</p>}
                            </div>

                            <div className="shrink-0 text-right">
                                <p className="text-[11px] font-black text-white/65 sm:text-sm">{formatKickoffTime(game.kickoff)}</p>
                                <p className="mt-1 hidden text-[10px] font-black uppercase tracking-[0.1em] text-white/30 sm:block">Game Center →</p>
                                <p className="mt-1 text-sm font-black text-white/25 sm:hidden">→</p>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}