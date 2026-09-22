import Link from "next/link";
import type { Game, School, UILClassification } from "@/types/platform";
import { getDistrictById } from "@/lib/districts";
import { filterUpcomingGamesForSchool } from "@/lib/games";
import { getSchoolBySlug } from "@/lib/schools";
import { getStandingForSchoolFromGames } from "@/lib/standings";
import SchoolBadge from "./SchoolBadge";
import ProgramLogo from "./ProgramLogo";
import SchoolFollowControl from "./SchoolFollowControl";

function formatShortClassification(classification: UILClassification) {
  if (!classification.division) return classification.conference;
  return `${classification.conference} ${classification.division === "D1" ? "DI" : "DII"}`;
}
function formatShortDistrict(districtName: string) {
  return districtName.match(/District\s+\d+$/)?.[0] ?? districtName;
}
function parseGameDate(kickoff?: string) { if (!kickoff) return null; if (!kickoff.includes("T")) { const [year, month, day] = kickoff.split("-").map(Number); return new Date(year, month - 1, day); } const parsedDate = new Date(kickoff); return Number.isNaN(parsedDate.getTime()) ? null : parsedDate; }
function formatGameDate(kickoff?: string) { const parsedDate = parseGameDate(kickoff); if (!parsedDate) return "TBD"; return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "America/Chicago" }).format(parsedDate); }
function formatGameTime(kickoff?: string) { if (!kickoff || !kickoff.includes("T")) return "Time TBD"; const parsedDate = parseGameDate(kickoff); if (!parsedDate) return "Time TBD"; return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" }).format(parsedDate); }
function getWeekLabel(gameType: string, week?: number) { if (gameType === "playoff") return "Playoff"; if (gameType === "scrimmage") return "Scrimmage"; if (gameType === "bye") return "BYE"; return week === undefined ? "Week TBD" : `Week ${week}`; }
function getStadiumMapUrl(school: School) {
  const stadiumAddress = school.stadiumAddress?.trim();
  if (!stadiumAddress) return undefined;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stadiumAddress)}`;
}
function getGameMapUrl(game: { venue?: string; venueAddress?: string; homeTeam?: string }) {
  const query = game.venueAddress?.trim() || [game.venue, game.homeTeam, "Texas"].filter(Boolean).join(" ");
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : undefined;
}

export default function SchoolHero({ school, games, isAuthenticated, isFollowing, finishFollowing = false, followMessage = "" }: { school: School; games: Game[]; isAuthenticated: boolean; isFollowing: boolean; finishFollowing?: boolean; followMessage?: string }) {
  const upcomingGames = filterUpcomingGamesForSchool(games, school.slug);
  const nextGame = upcomingGames[0];
  const standing = getStandingForSchoolFromGames(school.slug, games); const seasonRecord = `${standing?.overallWins ?? 0}-${standing?.overallLosses ?? 0}`;
  const district = getDistrictById(school.districtId); const districtName = district?.name ?? school.districtId;
  const nextAwaySchool = nextGame?.awaySchoolSlug ? getSchoolBySlug(nextGame.awaySchoolSlug) : undefined; const nextHomeSchool = nextGame?.homeSchoolSlug ? getSchoolBySlug(nextGame.homeSchoolSlug) : undefined;
  const primary = school.colors.primary; const secondary = school.colors.secondary;
  const longSchoolName = school.name.length > 10;
  const programDescription = school.description ?? "Schedules, scores, standings, matchup coverage, player statistics, and program updates in one place.";
  const stadiumMapUrl = getStadiumMapUrl(school);
  const nextGameMapUrl = nextGame ? getGameMapUrl(nextGame) : undefined;
  return (
    <section className="relative overflow-hidden border-b border-white/10 text-white" style={{ background: `radial-gradient(circle at top left, ${primary}66 0%, transparent 32%), radial-gradient(circle at top right, ${secondary}22 0%, transparent 34%), linear-gradient(120deg, #050505 0%, #080808 52%, #000000 100%)` }}>
      {school.stadiumImageUrl && <div className="absolute inset-0 bg-cover bg-center-top opacity-40" style={{ backgroundImage: `url(${school.stadiumImageUrl})` }} />}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.82),rgba(0,0,0,0.30))]" /><div className="absolute -right-24 top-16 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
      <div className="relative mx-auto grid max-w-[1440px] gap-4 px-4 py-4 sm:gap-5 sm:px-6 sm:py-8 lg:min-h-[500px] lg:grid-cols-[1.15fr_0.85fr] lg:gap-8 lg:px-8">
        <div className="flex min-w-0 flex-col justify-between"><div className="min-w-0">
          <Link href="/schools" className="inline-flex text-[10px] font-black uppercase tracking-[0.14em] text-white/50 transition hover:text-white sm:text-xs sm:tracking-[0.18em]">← School Directory</Link>
          <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5 sm:mt-6 sm:gap-3"><HeroChip label="2026 Football" /></div>
          <div className="mt-3 grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 sm:mt-8 sm:gap-x-6 sm:gap-y-3">
            <div className="shrink-0 self-center">
              <div className="sm:hidden"><ProgramLogo school={school} size="sm" /></div>
              <div className="hidden sm:block"><ProgramLogo school={school} size="md" /></div>
            </div>
            <div className="min-w-0">
              <h1 className={`font-black uppercase leading-[0.92] tracking-tight text-white ${longSchoolName ? "text-[2.15rem] sm:text-5xl lg:text-6xl xl:text-7xl" : "text-[2.35rem] sm:text-7xl xl:text-8xl"}`}>{school.name}</h1>
              <p className="mt-1 truncate text-[9px] font-black uppercase tracking-[0.14em] text-white/45 sm:mt-2 sm:text-xs sm:tracking-[0.24em]">{school.fullName}</p>
            </div>
            <div className="col-span-2 mt-1 sm:col-span-1 sm:col-start-2 sm:mt-0">
              <SchoolFollowControl schoolName={school.name} schoolSlug={school.slug} isAuthenticated={isAuthenticated} isFollowing={isFollowing} finishFollowing={finishFollowing} initialMessage={followMessage} />
              {!isFollowing && <p className="mt-1.5 max-w-sm text-[9px] leading-4 text-white/40 sm:text-[10px]">Save {school.name} to your account, then choose verified final-score alerts.</p>}
            </div>
            <div className="col-span-2 mt-1 text-[10px] font-semibold leading-5 text-white/50 sm:col-span-1 sm:col-start-2 sm:mt-0 sm:text-xs sm:leading-6">
              {school.headCoach && <p><span className="text-white/35">Coach</span> {school.headCoach}</p>}
              {(school.stadium || school.officialWebsite) && <p className="flex flex-wrap items-center gap-x-1.5">
                {school.stadium && stadiumMapUrl ? <a href={stadiumMapUrl} target="_blank" rel="noopener noreferrer" title={`Open ${school.stadium} in Google Maps`} className="underline decoration-white/20 underline-offset-4 transition hover:text-white hover:decoration-white/60">{school.stadium}</a> : school.stadium ? <span>{school.stadium}</span> : null}
                {school.stadium && school.officialWebsite && <span aria-hidden="true" className="text-white/25">·</span>}
                {school.officialWebsite && <a href={school.officialWebsite} target="_blank" rel="noopener noreferrer" className="font-bold text-white/60 underline decoration-white/20 underline-offset-4 transition hover:text-white hover:decoration-white/60">Official Site <span aria-hidden="true">{"↗\uFE0E"}</span><span className="sr-only"> (opens in a new tab)</span></a>}
              </p>}
              {school.athleticDirector && school.athleticDirector !== school.headCoach && <p className="text-white/35">Athletic Director · {school.athleticDirector}</p>}
            </div>
          </div>
          <p className="mt-6 hidden max-w-3xl text-base leading-7 text-white/62 sm:block">{programDescription}</p>
        </div><div className="mt-3 grid grid-cols-2 gap-1.5 sm:mt-10 sm:gap-3 lg:grid-cols-4"><Stat value={seasonRecord} label="2026 Record" /><Stat value={formatShortClassification(school.classification)} label="Class" /><Stat value={formatShortDistrict(districtName)} label="District" /><Stat value={upcomingGames.length.toString()} label="Upcoming" /></div></div>
        <div className="hidden items-end lg:flex"><div className="w-full rounded-[1.75rem] border p-6 shadow-2xl backdrop-blur-sm" style={{ borderColor: `${primary}55`, background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(0,0,0,0.94))", boxShadow: `inset 4px 0 0 ${primary}, 0 24px 70px rgba(0,0,0,0.45)` }}><p className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white/80">Next Matchup</p>{nextGame ? <><h2 className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-4xl">{nextGame.awayTeam} at {nextGame.homeTeam}</h2><div className="mt-7 grid grid-cols-3 items-center gap-4 text-center"><div className="flex justify-center">{nextAwaySchool ? <SchoolBadge school={nextAwaySchool} size="sm" /> : <FallbackTeamBadge team={nextGame.awayTeam ?? "Away"} />}</div><div className="text-2xl font-black text-white/30">VS</div><div className="flex justify-center">{nextHomeSchool ? <SchoolBadge school={nextHomeSchool} size="sm" /> : <FallbackTeamBadge team={nextGame.homeTeam ?? "Home"} />}</div></div><div className="mt-7 grid gap-3 sm:grid-cols-2"><InfoCard label="Date" value={formatGameDate(nextGame.kickoff)} /><InfoCard label="Kickoff" value={formatGameTime(nextGame.kickoff)} />{nextGame.venue && nextGameMapUrl ? <a href={nextGameMapUrl} target="_blank" rel="noopener noreferrer" title={`Open ${nextGame.venue} in Google Maps`}><InfoCard label="Venue" value={`${nextGame.venue} →`} /></a> : <InfoCard label="Venue" value={nextGame.venue ?? "Venue TBD"} />}<InfoCard label="Game" value={getWeekLabel(nextGame.gameType, nextGame.week)} /></div><Link href={`/games/${nextGame.id}`} className="mt-6 block rounded-xl border px-5 py-4 text-center text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-white/15" style={{ borderColor: `${secondary}44`, backgroundColor: "rgba(255,255,255,0.08)" }}>View Matchup →</Link></> : <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-6 text-white/55">No upcoming game is currently listed.</div>}</div></div>
      </div>
    </section>
  );
}
function HeroChip({ label }: { label: string }) { return <p className="inline-flex max-w-full items-center rounded-full border border-white/10 bg-black/25 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white/55 sm:px-3 sm:py-1.5 sm:text-[10px] sm:tracking-[0.18em]">{label}</p>; }
function Stat({ value, label }: { value: string; label: string }) { return <div className="min-w-0 rounded-lg border border-white/10 bg-black/35 p-2.5 sm:rounded-2xl sm:p-4"><p className="truncate text-base font-black text-white sm:text-xl">{value}</p><p className="mt-0.5 truncate text-[9px] uppercase tracking-[0.12em] text-white/35 sm:mt-1 sm:text-xs sm:tracking-[0.2em]">{label}</p></div>; }
function FallbackTeamBadge({ team }: { team: string }) { return <div className="flex min-h-24 w-24 items-center justify-center rounded-2xl border border-white/10 bg-white/10 p-4 text-center text-xs font-black text-white">{team.slice(0, 3).toUpperCase()}</div>; }
function InfoCard({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/[0.08]"><p className="text-xs uppercase tracking-[0.2em] text-white/35">{label}</p><p className="mt-2 font-bold text-white">{value}</p></div>; }
