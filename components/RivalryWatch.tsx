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
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl sm:rounded-[1.75rem] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45 sm:text-xs">
            Rivalry Watch
          </p>
          <h2 className="mt-2 text-xl font-black text-white sm:text-2xl">
            {school.name} vs {opponentName}
          </h2>
          {rivalryGame.specialEvent && (
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-white/40">
              {rivalryGame.specialEvent}
            </p>
          )}
        </div>

        {rivalryGame.week && (
          <span className="shrink-0 rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-white/45">
            Week {rivalryGame.week}
          </span>
        )}
      </div>

      {(date || kickoff || venue) && (
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-white/55">
          {date && <span className="rounded-full bg-white/[0.06] px-3 py-2">{date}</span>}
          {kickoff && <span className="rounded-full bg-white/[0.06] px-3 py-2">{kickoff}</span>}
          {venue && <span className="rounded-full bg-white/[0.06] px-3 py-2">{venue}</span>}
        </div>
      )}

      <Link
        href={`/games/${rivalryGame.id}`}
        className="mt-4 inline-flex rounded-full border border-white/10 bg-black/35 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/65 transition hover:bg-white/10 hover:text-white sm:text-xs"
      >
        Open Matchup →
      </Link>
    </section>
  );
}
