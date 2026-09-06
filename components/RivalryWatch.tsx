import Link from "next/link";
import { getGamesForSchool } from "@/lib/games";
import { getSchoolBySlug } from "@/lib/schools";

type Props = {
  schoolSlug: string;
};

const RIVALRY_TERMS = ["rival", "rivalry", "classic", "battle", "showdown", "cup", "bowl"];

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

function formatDate(date?: string) {
  if (!date) return null;
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function RivalryWatch({ schoolSlug }: Props) {
  const school = getSchoolBySlug(schoolSlug);
  const rivalryGame = getUpcomingRivalryGame(schoolSlug);

  if (!school || !rivalryGame) return null;

  const isHome = rivalryGame.homeSchoolSlug === schoolSlug;
  const opponentSlug = isHome ? rivalryGame.awaySchoolSlug : rivalryGame.homeSchoolSlug;
  const opponent = opponentSlug ? getSchoolBySlug(opponentSlug) : undefined;
  const opponentName =
    opponent?.name ??
    (isHome ? rivalryGame.awayTeam : rivalryGame.homeTeam) ??
    "Opponent TBD";
  const date = formatDate(rivalryGame.date);
  const kickoff = rivalryGame.kickoff ?? rivalryGame.time;
  const venue = rivalryGame.venue ?? rivalryGame.location;

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl sm:rounded-[1.75rem] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/45 sm:text-xs sm:tracking-[0.22em]">
            Rivalry Watch
          </p>
          <h2 className="mt-1.5 break-words text-lg font-black leading-tight text-white sm:mt-2 sm:text-2xl">
            {school.name} vs {opponentName}
          </h2>
          {rivalryGame.specialEvent && (
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white/40 sm:text-xs sm:tracking-[0.12em]">
              {rivalryGame.specialEvent}
            </p>
          )}
        </div>

        {rivalryGame.week && (
          <span className="shrink-0 rounded-full border border-white/10 bg-black/35 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-white/45 sm:px-3 sm:py-1.5 sm:text-[10px] sm:tracking-[0.12em]">
            W{rivalryGame.week}
            <span className="hidden sm:inline">eek {rivalryGame.week}</span>
          </span>
        )}
      </div>

      {(date || kickoff || venue) && (
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-bold text-white/50 sm:mt-4 sm:gap-2 sm:text-xs">
          {date && <span>{date}</span>}
          {kickoff && <span>{kickoff}</span>}
          {venue && <span className="hidden sm:inline">{venue}</span>}
        </div>
      )}

      <Link
        href={`/games/${rivalryGame.id}`}
        className="mt-3 inline-flex items-center text-[10px] font-black uppercase tracking-[0.12em] text-white/55 transition hover:text-white sm:mt-4 sm:rounded-full sm:border sm:border-white/10 sm:bg-black/35 sm:px-4 sm:py-2.5 sm:text-xs sm:tracking-[0.14em] sm:text-white/65 sm:hover:bg-white/10"
      >
        Matchup →
      </Link>
    </section>
  );
}
