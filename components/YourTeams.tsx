import Link from "next/link";
import ProgramLogo from "@/components/ProgramLogo";
import type { FollowedSchoolGame } from "@/lib/follow-personalization";
import type { Game } from "@/types/platform";

function kickoffLabel(kickoff?: string) {
  if (!kickoff) return "Kickoff TBD";
  const date = new Date(kickoff.includes("T") ? kickoff : `${kickoff}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return "Kickoff TBD";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short", month: "short", day: "numeric",
    ...(kickoff.includes("T") ? { hour: "numeric", minute: "2-digit" } : {}),
    timeZone: "America/Chicago",
  }).format(date);
}

function gameDetails(game: Game | undefined, schoolSlug: string) {
  if (!game) return { label: "School Hub", detail: "See schedules, scores, and coverage." };
  const isHome = game.homeSchoolSlug === schoolSlug;
  const opponent = isHome ? game.awayTeam : game.homeTeam;
  const matchup = `${isHome ? "vs" : "at"} ${opponent ?? "Opponent TBD"}`;
  if (game.status === "live") {
    const own = isHome ? game.homeScore ?? game.score?.home : game.awayScore ?? game.score?.away;
    const other = isHome ? game.awayScore ?? game.score?.away : game.homeScore ?? game.score?.home;
    return { label: "Live", detail: `${matchup}${own !== undefined && other !== undefined ? ` · ${own}–${other}` : ""}` };
  }
  if (game.status === "final") {
    const own = isHome ? game.homeScore ?? game.score?.home : game.awayScore ?? game.score?.away;
    const other = isHome ? game.awayScore ?? game.score?.away : game.homeScore ?? game.score?.home;
    return { label: "Latest result", detail: `${matchup}${own !== undefined && other !== undefined ? ` · ${own}–${other}` : ""}` };
  }
  return { label: "Next game", detail: `${matchup} · ${kickoffLabel(game.kickoff)}` };
}

export default function YourTeams({ teams }: { teams: FollowedSchoolGame<Game>[] }) {
  return (
    <section aria-labelledby="your-teams-title" className="border-b border-white/10 bg-[#090909] px-4 py-5 text-white sm:px-6 sm:py-7 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--vv-accent)]">Personalized for you</p>
            <h2 id="your-teams-title" className="mt-1 text-xl font-black uppercase sm:text-2xl">Your Teams</h2>
          </div>
          {teams.length > 3 && <Link href="/account#followed-schools" className="text-xs font-black text-white/75 underline underline-offset-4 hover:text-white">View all in My Teams →</Link>}
        </div>
        <div className="mt-3 grid gap-2 lg:grid-cols-3">
          {teams.slice(0, 3).map(({ school, game }) => {
            const details = gameDetails(game, school.slug);
            return (
              <article key={school.slug} className="flex min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.045] p-2.5 sm:p-3">
                <ProgramLogo school={school} size="xs" className="!h-14 !w-14 sm:!h-16 sm:!w-16" />
                <div className="min-w-0 flex-1">
                  <Link href={`/schools/${school.slug}`} className="block truncate text-sm font-black hover:text-[var(--vv-accent)]">{school.name} →</Link>
                  <p className="mt-1 text-[9px] font-black uppercase tracking-wider text-[var(--vv-accent)]">{details.label}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-4 text-white/60">{details.detail}</p>
                </div>
                {game && <Link href={`/games/${game.id}`} aria-label={`View ${school.name} game`} className="shrink-0 rounded-lg border border-white/10 px-2 py-2 text-xs text-white/65 hover:text-white">Game →</Link>}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
