import Link from "next/link";
import { getGamesForSchool } from "@/lib/games";
import { getSchoolBySlug } from "@/lib/schools";

type Props = {
    schoolSlug: string;
};

const RIVALRY_TERMS = [
    "rival",
    "rivalry",
    "classic",
    "battle",
    "showdown",
    "cup",
    "bowl",
];

function getRivalryLabel(schoolName: string, opponentName: string) {
    return `${schoolName} vs ${opponentName}`;
}

function isExplicitRivalryGame(specialEvent?: string) {
    if (!specialEvent) return false;

    const normalized = specialEvent.toLowerCase();
    return RIVALRY_TERMS.some((term) => normalized.includes(term));
}

function getUpcomingRivalryGame(schoolSlug: string) {
    return getGamesForSchool(schoolSlug).find(
        (game) =>
            game.status === "upcoming" &&
            game.gameType !== "bye" &&
            isExplicitRivalryGame(game.specialEvent)
    );
}

export default function RivalryWatch({ schoolSlug }: Props) {
    const school = getSchoolBySlug(schoolSlug);
    const rivalryGame = getUpcomingRivalryGame(schoolSlug);

    if (!school || !rivalryGame) return null;

    const isHome = rivalryGame.homeSchoolSlug === schoolSlug;
    const opponentSlug = isHome
        ? rivalryGame.awaySchoolSlug
        : rivalryGame.homeSchoolSlug;

    const opponent = opponentSlug ? getSchoolBySlug(opponentSlug) : undefined;
    const opponentName =
        opponent?.name ??
        (isHome ? rivalryGame.awayTeam : rivalryGame.homeTeam) ??
        "Opponent TBD";

    return (
        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/45">
                Rivalry Watch
            </p>

            <h2 className="mt-2 text-2xl font-black text-white">
                {getRivalryLabel(school.name, opponentName)}
            </h2>

            <p className="mt-3 text-sm leading-6 text-white/55">
                VarsityVue will use this space for rivalry records, legacy notes,
                playoff history, memorable matchups, and community-submitted program
                history as the archive expands.
            </p>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/35 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
                    Next Meeting
                </p>

                <h3 className="mt-2 text-lg font-black text-white">
                    {rivalryGame.awayTeam} at {rivalryGame.homeTeam}
                </h3>

                <p className="mt-1 text-xs font-semibold text-white/45">
                    {rivalryGame.specialEvent ?? "Rivalry matchup"}
                </p>
            </div>

            <Link
                href={`/games/${rivalryGame.id}`}
                className="mt-5 block rounded-xl border border-white/10 bg-black/35 px-5 py-4 text-center text-xs font-black uppercase tracking-[0.16em] text-white/65 transition hover:bg-white/10 hover:text-white"
            >
                View Matchup →
            </Link>
        </section>
    );
}