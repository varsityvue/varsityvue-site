import type { Game } from '@/types/platform';
import { getGamePresentation, type GamePresentationKind } from '@/lib/game-presentation';
import { deduplicateGamesById, gamesInvolvingFollowedSchools } from '@/lib/follow-personalization';
export type GamesView = 'current' | 'completed';
export type GamesParams = { view: GamesView; q: string; status: string; week: string; season: string };
export const completedKinds = new Set<GamePresentationKind>(['verified_final','verified_exceptional','cancelled']);
export const groupLabels: Record<GamePresentationKind,string> = { verified_live:'Verified LIVE', kickoff_window:'Kickoff window · live score unavailable', scheduled:'Upcoming games', awaiting_verification:'Results awaiting verification', postponed:'Postponed games', cancelled:'Cancelled matchups', verified_final:'Verified finals', verified_exceptional:'Verified completed outcomes' };
const scalar = (v: string | string[] | undefined) => typeof v === 'string' ? v : '';
export function parseGamesParams(raw: Record<string,string|string[]|undefined>, games: readonly Game[]): GamesParams {
  const status = ['all','upcoming','final','district'].includes(scalar(raw.status)) ? scalar(raw.status) : 'all';
  return { view: scalar(raw.view) === 'completed' || (!scalar(raw.view) && status === 'final') ? 'completed':'current', q: scalar(raw.q).trim().slice(0,200), status,
    week: scalar(raw.week) === 'all' || games.some(g => String(g.week) === scalar(raw.week)) ? scalar(raw.week):'',
    season: games.some(g => String(g.season) === scalar(raw.season)) ? scalar(raw.season):'' };
}
export function gamesUrl(p: GamesParams, updates: Partial<GamesParams> = {}) {
  const next = {...p,...updates}; const query = new URLSearchParams();
  for (const key of ['view','q','status','week','season'] as const) if(next[key]) query.set(key,next[key]);
  return `/games?${query}#all-matchups`;
}
export function selectGames(games: readonly Game[], p: GamesParams, followed: ReadonlySet<string>, now = new Date()) {
  const catalog = deduplicateGamesById(games).filter(g => g.gameType !== 'bye');
  const season = p.season || String(Math.max(...catalog.map(g=>g.season)));
  const inSeason = catalog.filter(g=>String(g.season) === season);
  const inView = (g: Game, view: GamesView) => completedKinds.has(getGamePresentation(g,now).kind) === (view === 'completed');
  const matches = (g: Game) => (p.status !== 'district' || g.districtGame) &&
    (p.status !== 'final' || ['verified_final','verified_exceptional'].includes(getGamePresentation(g,now).kind)) &&
    (p.status !== 'upcoming' || !completedKinds.has(getGamePresentation(g,now).kind)) &&
    `${g.awayTeam} ${g.homeTeam} ${g.venue} ${g.specialEvent ?? ''} week ${g.week ?? ''}`.toLowerCase().includes(p.q.toLowerCase());
  const candidates = inSeason.filter(g=>inView(g,p.view));
  const weeks = [...new Set(candidates.flatMap(g=>g.week === undefined ? []:[g.week]))].sort((a,b)=>p.view === 'completed'?b-a:a-b);
  const requested = p.week && p.week !== 'all' ? Number(p.week):undefined;
  const incompatible = requested !== undefined && !weeks.includes(requested);
  const nextScheduled = candidates.filter(g=>getGamePresentation(g,now).kind === 'scheduled').sort((a,b)=>Date.parse(a.kickoff ?? '')-Date.parse(b.kickoff ?? ''))[0]?.week;
  const effectiveWeek = incompatible ? 'all' : p.week || (p.q || p.view === 'completed' ? 'all':String(nextScheduled ?? weeks[0] ?? 'all'));
  // Default current view keeps unresolved and active games visible alongside the nearest upcoming slate.
  const selected = candidates.filter(matches).filter(g=>effectiveWeek === 'all' || String(g.week) === effectiveWeek || (!p.week && !p.q && p.view==='current' && getGamePresentation(g,now).kind !== 'scheduled'));
  const order = ['verified_live','kickoff_window','scheduled','awaiting_verification','postponed','verified_final','verified_exceptional','cancelled'];
  selected.sort((a,b)=>p.view==='completed' ? (b.week ?? -1)-(a.week ?? -1) || a.id.localeCompare(b.id) : order.indexOf(getGamePresentation(a,now).kind)-order.indexOf(getGamePresentation(b,now).kind) || (Date.parse(a.kickoff ?? '')||Infinity)-(Date.parse(b.kickoff ?? '')||Infinity) || a.id.localeCompare(b.id));
  const followedGames = gamesInvolvingFollowedSchools(selected,followed);
  const following = followedGames.slice(0,4); const shown = new Set(followedGames.map(g=>g.id));
  const otherView: GamesView = p.view==='current'?'completed':'current';
  // A legacy status filter incompatible with the other view must not suppress cross-view search discovery.
  const otherCount = inSeason.filter(g=>inView(g,otherView)).filter(g=>(p.status!=='district'||g.districtGame) && `${g.awayTeam} ${g.homeTeam} ${g.venue} ${g.specialEvent ?? ''} week ${g.week ?? ''}`.toLowerCase().includes(p.q.toLowerCase())).length;
  return {season,weeks,effectiveWeek,incompatible,selected,following,followingExtra:followedGames.slice(4),followingCount:followedGames.length,general:selected.filter(g=>!shown.has(g.id)),otherView,otherCount};
}
