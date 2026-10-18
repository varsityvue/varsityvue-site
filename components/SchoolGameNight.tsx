import Link from "next/link";
import type { Game, School } from "@/types/platform";
import { getGamePresentation } from "@/lib/game-presentation";
import { getHubGameFocus } from "@/lib/team-hub-pilot";
import { liveGameContext } from "@/lib/live-period";
import ScoreAttribution from "./ScoreAttribution";

function gameDate(game: Game) {
  const value = game.kickoff ?? game.date;
  if (!value) return "Date TBD";
  const exact = value.includes("T");
  const date = new Date(exact ? value : `${value}T12:00:00Z`);
  if (!Number.isFinite(date.getTime())) return "Date TBD";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", ...(exact ? { weekday: "short", hour: "numeric", minute: "2-digit" } : {}), timeZone: exact ? "America/Chicago" : "UTC" }).format(date) + (exact ? " CT" : " · Time TBD");
}

export default function SchoolGameNight({ school, focus }: { school: School; focus: ReturnType<typeof getHubGameFocus> }) {
  const { featured, next } = focus;
  const presentation = featured ? getGamePresentation(featured) : null;
  return <section aria-label={`${school.name} game night`} className="overflow-hidden rounded-2xl border border-white/15 bg-white/[0.04]" style={{ boxShadow: `inset 4px 0 ${school.colors.primary}` }}>
    <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)]">
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">{presentation?.kind === "verified_live" ? "Live now" : presentation?.kind === "kickoff_window" ? "Game night" : featured?.status === "final" ? "Latest result" : "Next game"}</p>
        {featured ? <>
          <p className="mt-2 text-xs font-bold text-white/70">{presentation?.label} · {gameDate(featured)}</p>
          <h2 className="mt-3 break-words text-xl font-black leading-tight sm:text-2xl">{featured.awayTeam} at {featured.homeTeam}</h2>
          {presentation?.showScore && <p className="mt-3 text-4xl font-black tabular-nums"><span className="sr-only">{featured.awayTeam} </span>{featured.awayScore ?? featured.score?.away}<span className="px-3 text-white/50">–</span><span className="sr-only">{featured.homeTeam} </span>{featured.homeScore ?? featured.score?.home}</p>}
          {presentation?.kind === "verified_exceptional" && <p className="mt-3 font-bold">{featured.resultType === "forfeit" ? "Forfeit" : "No contest"}</p>}
          {presentation?.kind === "verified_live" && <p className="mt-2 text-sm text-white/80">{liveGameContext(featured.score?.period, featured.score?.clock)}</p>}
          <ScoreAttribution game={featured} detail />
          <Link href={`/games/${featured.id}`} className="mt-4 inline-flex min-h-11 items-center rounded-xl border border-white/25 bg-white/10 px-4 text-sm font-bold hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Game Center →</Link>
        </> : <p className="mt-3 text-sm text-white/70">No game is currently listed. Check back for schedule updates.</p>}
      </div>
      <div className="min-w-0 border-t border-white/10 pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
        {next && next.id !== featured?.id ? <><p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">Up next</p><Link href={`/games/${next.id}`} className="mt-3 block rounded-xl border border-white/10 p-4 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-white"><p className="break-words font-bold">{next.awayTeam} at {next.homeTeam}</p><p className="mt-2 text-sm text-white/70">{gameDate(next)}</p><p className="mt-2 text-sm text-white/70">{next.venue ?? "Venue TBD"}</p><span className="mt-3 block text-sm font-bold">View matchup →</span></Link></> : <><p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">Your team, all season</p><p className="mt-3 text-sm leading-6 text-white/70">Results, upcoming matchups and the stories behind {school.mascot} football.</p></>}
        <Link href={`/schools/${school.slug}/schedule`} className="mt-3 inline-flex min-h-11 items-center text-sm font-bold underline underline-offset-4">Full schedule →</Link>
      </div>
    </div>
  </section>;
}
