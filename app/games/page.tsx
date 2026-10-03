import type { Metadata } from 'next';
import Link from 'next/link';
import { getDynamicGamesSnapshot } from '@/lib/dynamic-games';
import { createClient } from '@/lib/supabase/server';
import GamesNearMe from '@/components/GamesNearMe';
import GamesNearbyDisclosure from '@/components/GamesNearbyDisclosure';
import ScorekeeperCta from '@/components/ScorekeeperCta';
import { getScorekeeperCtaState } from '@/lib/scorekeeper-cta-server';
import { resolveGameLocation, toDiscoveryGame } from '@/lib/game-location';
import { venues } from '@/data/venues';
import { schoolFootballVenues } from '@/data/school-football-venues';
import { gameVenueOverrides } from '@/data/game-venue-overrides';
import { getSchoolBySlug } from '@/lib/schools';
import { getGamePresentation } from '@/lib/game-presentation';
import { getCurrentUserFollowedSchoolSlugs } from '@/lib/followed-schools';
import { parseGamesParams, selectGames, gamesUrl, groupLabels } from '@/lib/games-page-organization';
import type { Game, MediaLink } from '@/types/platform';
export const metadata: Metadata = { title:'Texas High School Football Scores, Schedules & Matchups', description:'Browse Texas high school football schedules, verified results and upcoming matchups.' };
const control = 'min-h-11 min-w-0 rounded-xl border border-white/25 bg-black/40 px-3 py-2 text-sm text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white';
function parseGameDate(kickoff?: string) {
  if (!kickoff) return null;

  if (!kickoff.includes("T")) {
    const [year, month, day] = kickoff.split("-").map(Number);
    if (!year || !month || !day) return null;
    const parsed = new Date(Date.UTC(year, month - 1, day, 12));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(kickoff);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatGameDate(kickoff?: string) {
  const parsed = parseGameDate(kickoff);
  if (!parsed) return "Date TBD";

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: kickoff?.includes("T") ? "America/Chicago" : "UTC",
  }).format(parsed);
}

function formatGameTime(kickoff?: string) {
  if (!kickoff?.includes("T")) return "Time TBD";
  const parsed = parseGameDate(kickoff);
  if (!parsed) return "Time TBD";

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  }).format(parsed);
}

function getGameTypeLabel(gameType: string, week?: number) {
  if (gameType === "scrimmage") return "Scrimmage";
  if (gameType === "playoff") return "Playoff";
  if (gameType === "bye") return "BYE";
  return `Week ${week ?? "-"}`;
}

function getAwayTeam(game: { awayTeam?: string }) {
  return game.awayTeam ?? "Away Team";
}

function getHomeTeam(game: { homeTeam?: string }) {
  return game.homeTeam ?? "Home Team";
}

function getVenue(game: { venue?: string }) {
  return game.venue ?? "Venue TBD";
}

function getScoreReportLabel(game: { status: string; gameType: string }) {
  if (game.gameType === "scrimmage" || game.gameType === "bye") return null;
  if (game.status === "live") return "Report Live Score";
  if (game.status === "scheduled") return "Report Final Score";
  return null;
}

export default async function GamesPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const [snapshot, raw, cta] = await Promise.all([getDynamicGamesSnapshot(),searchParams,getScorekeeperCtaState()]);
  const p = parseGamesParams(raw,snapshot.games); const now = new Date();
  let followed = new Set<string>(); let followFailed=false;
  try { followed=(await getCurrentUserFollowedSchoolSlugs()).schoolSlugs; } catch { followFailed=true; }
  const supabase=await createClient(); const {data:claims}=await supabase.auth.getClaims();
  const pending=new Set<string>(); let pendingFailed=false;
  if(claims?.claims?.sub){const {data,error}=await supabase.from('score_submissions').select('game_id').eq('submitted_by',claims.claims.sub).eq('status','pending'); pendingFailed=Boolean(error); for(const row of data??[])pending.add(row.game_id);}
  const collection=selectGames(snapshot.games,p,followed,now);
  const groups=new Map<string,Game[]>();
  for(const game of collection.general){const kind=getGamePresentation(game,now).kind;const label=p.view==='completed'?`Week ${game.week ?? 'TBD'} · ${groupLabels[kind]}`:groupLabels[kind];groups.set(label,[...(groups.get(label)??[]),game]);}
  const discovery=snapshot.games.filter(g=>g.gameType!=='bye').map(g=>toDiscoveryGame(g,resolveGameLocation(g,venues,schoolFootballVenues,gameVenueOverrides)));
  const centers=Object.entries(schoolFootballVenues).flatMap(([schoolSlug,id])=>{const v=venues.find(v=>v.id===id&&v.verificationStatus==='verified');return v?[{schoolSlug,schoolName:getSchoolBySlug(schoolSlug)?.name??schoolSlug,venueName:v.name,latitude:v.latitude,longitude:v.longitude}]:[];}).sort((a,b)=>a.schoolName.localeCompare(b.schoolName));
  const otherParams={view:collection.otherView,week:'all',status:p.status==='district'?'district':'all'} as const;
  return <main className="min-h-screen bg-[var(--vv-bg)] px-4 py-6 text-white sm:px-6 lg:px-8">
    <div className="mx-auto max-w-[1440px] space-y-5">
      <header><h1 className="text-3xl font-black sm:text-4xl">Football Games</h1><p className="mt-2 text-base text-white/70">Upcoming matchups, verified scores and past results.</p></header>
      {snapshot.scoreLoadStatus==='failed'&&<p role="status" className="rounded-xl border border-amber-300/30 p-4 text-amber-100">Live score data could not be refreshed. Scheduled game information and previously verified repository results remain available.</p>}
      {followFailed&&<p role="status" className="text-amber-100">Your followed matchups could not be loaded. Browse the full collection below.</p>}
      {pendingFailed&&<p role="status" className="text-amber-100">Your pending score reports could not be loaded.</p>}
      <section id="all-matchups" aria-labelledby="matchups-heading" className="scroll-mt-28 space-y-4">
        <h2 id="matchups-heading" className="sr-only">Find a Matchup</h2>
        <nav aria-label="Game views" className="grid grid-cols-2 gap-2">
          {(['current','completed'] as const).map(view=><a key={view} aria-current={p.view===view?'page':undefined} href={gamesUrl(p,{view, status:p.status==='district'?'district':'all'})} className={`${control} flex items-center justify-center font-bold ${p.view===view?'border-[var(--vv-accent)] bg-white/15':''}`}>{view==='current'?'Current Games':'Completed Games'}</a>)}
        </nav>
        <GamesNearbyDisclosure><GamesNearMe games={discovery} centers={centers} initialQuery={p.q} initialFilter={p.status as 'all'|'upcoming'|'final'|'district'} now={now.toISOString()} recruitment={<ScorekeeperCta state={cta} prefetch={false}/>} /></GamesNearbyDisclosure>
        <form action="/games#all-matchups" method="get" className="space-y-3 rounded-2xl border border-white/15 p-4">
          <input type="hidden" name="view" value={p.view}/>
          <label className="block text-sm" htmlFor="matchup-search">Search matchups</label>
          <input id="matchup-search" name="q" type="search" defaultValue={p.q} placeholder="Team, venue, or week" className={`${control} w-full`}/>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <label className="flex min-w-0 flex-col gap-1 text-sm">Week<select name="week" defaultValue={collection.effectiveWeek} className={control}><option value="all">All weeks</option>{collection.weeks.map(w=><option key={w} value={w}>Week {w}</option>)}</select></label>
            <label className="flex min-w-0 flex-col gap-1 text-sm">Game filter<select name="status" defaultValue={p.status} className={control}><option value="all">All matchups</option><option value="district">District</option>{p.view==='current'?<option value="upcoming">Current / upcoming</option>:<option value="final">Verified finals</option>}</select></label>
            <label className="flex min-w-0 flex-col gap-1 text-sm">Season<select name="season" defaultValue={collection.season} className={control}>{[...new Set(snapshot.games.map(g=>g.season))].sort((a,b)=>b-a).map(y=><option key={y}>{y}</option>)}</select></label>
            <button className={`${control} self-end bg-white/10`} type="submit">Apply filters</button>
          </div>
          <a href={gamesUrl(p,{q:'',status:'all',week:'',season:''})} className="inline-flex min-h-11 items-center text-sm underline">Clear filters</a>
        </form>
        {collection.incompatible&&<p role="status" className="text-sm text-amber-100">Week {p.week} has no games in this view for season {collection.season}. Showing all available weeks; choose a week above.</p>}
        {p.q&&collection.otherCount>0&&<p className="text-sm"><a className="inline-flex min-h-11 items-center underline" href={gamesUrl(p,otherParams)}>{collection.otherCount} matching {collection.otherView==='completed'?'completed':'current'} games — view results</a></p>}
        <p className="text-sm text-white/70">{collection.selected.length} matching matchups · {p.view==='current'?'Current Games':'Completed Games'}</p>
        {collection.following.length>0&&<section aria-labelledby="following-heading" className="space-y-3"><h2 id="following-heading" className="text-xl font-bold">Following</h2><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{collection.following.map(g=><Matchup key={g.id} game={g} now={now} pending={pending.has(g.id)}/>)}</div>{collection.followingCount>4&&<details className="rounded-xl border border-white/15 p-3"><summary className="min-h-11 cursor-pointer text-sm">{collection.followingCount-4} more followed matchups</summary><div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{collection.followingExtra.map(g=><Matchup key={g.id} game={g} now={now} pending={pending.has(g.id)}/>)}</div></details>}</section>}
        {collection.selected.length===0&&<p className="rounded-xl border border-white/15 p-5">No matchups match these filters in {p.view==='current'?'Current Games':'Completed Games'}.{collection.otherCount>0&&' Matching games are available in the other view above.'}</p>}
        {[...groups].map(([label,games])=><section key={label} aria-label={label} className="space-y-3"><h2 className="text-xl font-bold">{label}</h2><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{(p.view==='current'&&!p.q&&!p.week&&label==='Results awaiting verification'?games.slice(0,6):games).map(g=><Matchup key={g.id} game={g} now={now} pending={pending.has(g.id)}/>)}</div>{p.view==='current'&&!p.q&&!p.week&&label==='Results awaiting verification'&&games.length>6&&<details className="rounded-xl border border-white/15 p-3"><summary className="min-h-11 cursor-pointer text-sm">{games.length-6} more results awaiting verification</summary><div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{games.slice(6).map(g=><Matchup key={g.id} game={g} now={now} pending={pending.has(g.id)}/>)}</div></details>}</section>)}
      </section>
    </div>
  </main>;
}
function Matchup({game,now,pending}:{game:Game;now:Date;pending:boolean}) {
 const presentation=getGamePresentation(game,now);
 return <article data-game-id={game.id} className="min-w-0 rounded-2xl border border-white/15 bg-white/[0.04] p-4">
 <Link prefetch={false} href={`/games/${game.id}`} className="block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
 <p className="text-sm font-bold text-[#FDA4AF]">{presentation.label} · {getGameTypeLabel(game.gameType,game.week)}</p>
 <h3 className="mt-2 break-words text-xl font-black">{getAwayTeam(game)} at {getHomeTeam(game)}</h3>
 {presentation.showScore&&<p className="mt-2 text-xl font-bold">{game.awayScore ?? game.score?.away}–{game.homeScore ?? game.score?.home}</p>}
 {game.resultType==='forfeit'&&<p className="mt-2 text-sm">Forfeit{game.officialWinnerSchoolSlug?` · Winner: ${getSchoolBySlug(game.officialWinnerSchoolSlug)?.name??game.officialWinnerSchoolSlug}`:''}</p>}
 {game.resultType==='no_contest'&&<p className="mt-2 text-sm">No contest</p>}
 <p className="mt-2 text-sm text-white/75">{formatGameDate(game.kickoff)} · {formatGameTime(game.kickoff)}</p>
 <p className="mt-1 break-words text-sm text-white/75">{getVenue(game)}{game.districtGame?' · District':''}</p>
 <p className="mt-3 text-sm font-bold underline">Game Center</p></Link>
 <BroadcastButtons links={game.mediaLinks}/><ScoreReportLink game={game} hasPendingReport={pending}/>
 </article>;
}
function ScoreReportLink({
  game,
  compact = false,
  hasPendingReport = false,
}: {
  game: { id: string; status: string; gameType: string };
  compact?: boolean;
  hasPendingReport?: boolean;
}) {
  const reportLabel = getScoreReportLabel(game);
  if (!reportLabel) return null;
  const label = hasPendingReport ? "Pending Review" : reportLabel;

  return (
    <Link
      href={`/report-score?game=${encodeURIComponent(game.id)}`}
      className={`${compact ? "mt-2.5 px-2.5 py-2 text-[9px] sm:px-3 sm:text-[10px]" : "mt-3 px-3 py-2.5 text-[10px] sm:mt-4 sm:px-4 sm:py-3 sm:text-xs"} block min-h-11 rounded-xl border text-center font-black uppercase tracking-[0.12em] transition ${hasPendingReport ? "border-amber-300/30 bg-amber-300/10 text-amber-100 hover:bg-amber-300/15" : "border-[var(--vv-accent)]/25 bg-[var(--vv-accent)]/10 text-[var(--vv-accent)] hover:bg-[var(--vv-accent)]/15"}`}
    >
      {label} →
    </Link>
  );
}

function BroadcastButtons({ links, compact = false }: { links?: MediaLink[]; compact?: boolean }) {
  const broadcasts = (links ?? []).filter((link) => ["stream", "radio", "tv"].includes(link.type));
  if (broadcasts.length === 0) return null;

  return (
    <div className={`${compact ? "mt-2.5" : "mt-3"} flex flex-wrap gap-2 sm:mt-4`}>
      {broadcasts.map((link) => (
        <a
          key={`${link.type}-${link.url}`}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${compact ? "px-2.5 py-1.5 text-[9px] sm:px-3 sm:py-2 sm:text-[10px]" : "px-3 py-2 text-[10px] sm:px-4 sm:py-3 sm:text-xs"} inline-flex min-h-11 items-center rounded-lg border border-white/15 bg-white/10 font-black uppercase tracking-[0.12em] text-white transition hover:bg-white/15 sm:rounded-xl sm:tracking-[0.14em]`}
        >
          {link.type === "radio" ? "Listen Live" : "Watch Live"}
        </a>
      ))}
    </div>
  );
}
