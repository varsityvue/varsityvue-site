import Link from "next/link";
import type { School, UILClassification } from "@/types/platform";
import { getUpcomingGamesForSchool } from "@/lib/games";
import { getDistrictById } from "@/lib/districts";
import { getSchoolBySlug } from "@/lib/schools";
import SchoolBadge from "./SchoolBadge";

function formatClassification(classification: UILClassification) {
  if (!classification.division) return classification.conference;
  return `${classification.conference} Division ${classification.division === "D1" ? "I" : "II"}`;
}

function formatShortClassification(classification: UILClassification) {
  return `${classification.conference}${classification.division ? ` ${classification.division}` : ""}`;
}

function formatRegion(region: 1 | 2 | 3 | 4) {
  return { 1: "Region I", 2: "Region II", 3: "Region III", 4: "Region IV" }[region];
}

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
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "America/Chicago" }).format(parsedDate);
}

function formatGameTime(kickoff?: string) {
  if (!kickoff || !kickoff.includes("T")) return "Time TBD";
  const parsedDate = parseGameDate(kickoff);
  if (!parsedDate) return "Time TBD";
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" }).format(parsedDate);
}

function getWeekLabel(gameType: string, week?: number) {
  if (gameType === "playoff") return "Playoff";
  if (gameType === "scrimmage") return "Scrimmage";
  if (gameType === "bye") return "BYE";
  return week === undefined ? "Week TBD" : `Week ${week}`;
}

export default function SchoolHero({ school }: { school: School }) {
  const upcomingGames = getUpcomingGamesForSchool(school.slug);
  const nextGame = upcomingGames[0];
  const district = getDistrictById(school.districtId);
  const districtSlug = district?.slug ?? school.districtId;
  const districtName = district?.name ?? school.districtId;
  const nextAwaySchool = nextGame?.awaySchoolSlug ? getSchoolBySlug(nextGame.awaySchoolSlug) : undefined;
  const nextHomeSchool = nextGame?.homeSchoolSlug ? getSchoolBySlug(nextGame.homeSchoolSlug) : undefined;
  const primary = school.colors.primary;
  const secondary = school.colors.secondary;

  return (
    <section className="relative overflow-hidden border-b border-white/10 text-white" style={{ background: `radial-gradient(circle at top left, ${primary}66 0%, transparent 32%), radial-gradient(circle at top right, ${secondary}22 0%, transparent 34%), linear-gradient(120deg, #050505 0%, #080808 52%, #000000 100%)` }}>
      {school.stadiumImageUrl && <div className="absolute inset-0 bg-cover bg-center-top opacity-35" style={{ backgroundImage: `url(${school.stadiumImageUrl})` }} />}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.78),rgba(0,0,0,0.22))]" />
      <div className="absolute -right-24 top-16 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

      <div className="relative mx-auto grid min-h-[500px] max-w-[1440px] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
        <div className="flex flex-col justify-between">
          <div>
            <Link href="/schools" className="inline-flex text-xs font-black uppercase tracking-[0.18em] text-white/50 transition hover:text-white">← School Directory</Link>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <HeroChip label="VarsityVue School Hub" color={primary} />
              <HeroChip label={school.status === "pilot" ? "2026 Pilot Program" : "Watchlist"} color={secondary} />
            </div>

            <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center">
              <SchoolBadge school={school} size="md" />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-white/40">{school.fullName}</p>
                <h1 className="mt-2 text-6xl font-black uppercase leading-[0.9] tracking-tight text-white sm:text-8xl">{school.name}</h1>
                <p className="mt-3 text-2xl font-black text-white/70">{school.mascot}</p>
                {school.headCoach && <p className="mt-2 text-sm font-black uppercase tracking-[0.18em] text-white/45">Head Coach: {school.headCoach}</p>}
                {school.athleticDirector && <p className="mt-2 text-sm font-black uppercase tracking-[0.18em] text-white/45">Athletic Director: {school.athleticDirector}</p>}
              </div>
            </div>

            <p className="mt-7 max-w-3xl text-base leading-7 text-white/65 sm:text-lg">
              Your local home for schedules, scores, standings, matchup coverage, player statistics, and program updates as verified information becomes available.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <MetaBadge label={formatClassification(school.classification)} />
              <MetaBadge label={formatRegion(school.uilRegion)} />
              <MetaBadge label={districtName} />
              {school.officialWebsite && <a href={school.officialWebsite} target="_blank" rel="noopener noreferrer" className="rounded-full border px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-white/15" style={{ borderColor: `${secondary}44`, backgroundColor: "rgba(255,255,255,0.08)" }}>Official Website ↗</a>}
              <Link href={`/districts/${districtSlug}`} className="rounded-full border px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-white/15" style={{ borderColor: `${secondary}44`, backgroundColor: "rgba(255,255,255,0.08)" }}>District Standings →</Link>
              <Link href={`/schools/${school.slug}/schedule`} className="rounded-full border px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-white/15" style={{ borderColor: `${secondary}44`, backgroundColor: "rgba(255,255,255,0.08)" }}>Full Schedule →</Link>
            </div>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <Stat value={formatShortClassification(school.classification)} label="Class" />
            <Stat value={districtName.replace(" Division ", " D")} label="District" />
            <Stat value={upcomingGames.length.toString()} label="Upcoming" />
          </div>
        </div>

        <div className="flex items-end">
          <div className="w-full rounded-[1.75rem] border p-6 shadow-2xl backdrop-blur-sm" style={{ borderColor: `${primary}55`, background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(0,0,0,0.94))", boxShadow: `inset 4px 0 0 ${primary}, 0 24px 70px rgba(0,0,0,0.45)` }}>
            <p className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white/80">Next Matchup</p>
            {nextGame ? <>
              <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-4xl">{nextGame.awayTeam} at {nextGame.homeTeam}</h2>
              <div className="mt-7 grid grid-cols-3 items-center gap-4 text-center"><div className="flex justify-center">{nextAwaySchool ? <SchoolBadge school={nextAwaySchool} size="sm" /> : <FallbackTeamBadge team={nextGame.awayTeam ?? "Away"} />}</div><div className="text-2xl font-black text-white/30">VS</div><div className="flex justify-center">{nextHomeSchool ? <SchoolBadge school={nextHomeSchool} size="sm" /> : <FallbackTeamBadge team={nextGame.homeTeam ?? "Home"} />}</div></div>
              <div className="mt-7 grid gap-3 sm:grid-cols-2"><InfoCard label="Date" value={formatGameDate(nextGame.kickoff)} /><InfoCard label="Kickoff" value={formatGameTime(nextGame.kickoff)} /><InfoCard label="Venue" value={nextGame.venue ?? "Venue TBD"} /><InfoCard label="Game" value={getWeekLabel(nextGame.gameType, nextGame.week)} /></div>
              <Link href={`/games/${nextGame.id}`} className="mt-6 block rounded-xl border px-5 py-4 text-center text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-white/15" style={{ borderColor: `${secondary}44`, backgroundColor: "rgba(255,255,255,0.08)" }}>View Matchup →</Link>
            </> : <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-6 text-white/55">No upcoming game is currently listed.</div>}
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroChip({ label, color }: { label: string; color: string }) { return <p className="inline-flex items-center rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-white" style={{ borderColor: `${color}55`, backgroundColor: "rgba(0,0,0,0.35)", boxShadow: `inset 3px 0 0 ${color}` }}>{label}</p>; }
function MetaBadge({ label }: { label: string }) { return <div className="rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white/85">{label}</div>; }
function Stat({ value, label }: { value: string; label: string }) { return <div className="rounded-2xl border border-white/10 bg-black/35 p-4"><p className="text-xl font-black text-white">{value}</p><p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/35">{label}</p></div>; }
function FallbackTeamBadge({ team }: { team: string }) { return <div className="flex min-h-24 w-24 items-center justify-center rounded-2xl border border-white/10 bg-white/10 p-4 text-center text-xs font-black text-white">{team.slice(0, 3).toUpperCase()}</div>; }
function InfoCard({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/10 bg-white/5 p-4"><p className="text-xs uppercase tracking-[0.2em] text-white/35">{label}</p><p className="mt-2 font-bold text-white">{value}</p></div>; }
