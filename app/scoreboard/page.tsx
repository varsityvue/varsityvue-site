import type { Metadata } from "next";
import Link from "next/link";
import {
  getFinalScoreboardGames,
  getGameOfTheWeek,
  getLiveGames,
  getScoreboardGames,
  getUpcomingScoreboardGames,
  type DynamicScoreState,
} from "@/lib/scoreboard";
import { getSchoolBySlug } from "@/lib/schools";
import { getStandingForSchoolFromGames } from "@/lib/standings";
import { createClient } from "@/lib/supabase/server";
import { getGameStatAvailability, getStatAvailabilityLabel } from "@/data/stat-availability";
import { getCanonicalScoreboardTeamName, getScoreboardTeamIdentity } from "@/data/scoreboard-team-identities";
import SchoolBadge from "@/components/SchoolBadge";
import PageHero from "@/components/PageHero";

const scoreboardTitle = "Texas High School Football Scores";
const scoreboardDescription =
  "Verified Texas high school football final scores, live games, featured matchups, and upcoming kickoffs from programs tracked by VarsityVue.";

export const metadata: Metadata = {
  title: scoreboardTitle,
  description: scoreboardDescription,
  alternates: { canonical: "/scoreboard" },
  openGraph: {
    title: `${scoreboardTitle} | VarsityVue`,
    description: scoreboardDescription,
    url: "/scoreboard",
    type: "website",
    images: [{ url: "/scoreboard/opengraph-image", width: 1200, height: 630, alt: "VarsityVue Texas high school football scores" }],
  },
  twitter: { card: "summary_large_image", title: `${scoreboardTitle} | VarsityVue`, description: scoreboardDescription, images: ["/scoreboard/twitter-image"] },
};

type ScoreboardGame = ReturnType<typeof getUpcomingScoreboardGames>[number];

function parseGameDate(kickoff?: string) {
  if (!kickoff) return null;
  if (!kickoff.includes("T")) {
    const [year, month, day] = kickoff.split("-").map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day, 12));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const parsedDate = new Date(kickoff);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function formatKickoff(kickoff?: string) {
  const parsedDate = parseGameDate(kickoff);
  if (!parsedDate) return "TBD";
  const hasTime = kickoff?.includes("T");
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(hasTime ? { hour: "numeric" as const, minute: "2-digit" as const } : {}),
    timeZone: "America/Chicago",
  }).format(parsedDate);
}

function getTeamName(team?: string, fallback = "Team TBD") {
  return team ? getCanonicalScoreboardTeamName(team) : fallback;
}

function getWeekLabel(week?: number) {
  return week === undefined ? "Week TBD" : `Week ${week}`;
}

function getReportScoreLabel(game: ScoreboardGame) {
  if (game.gameType === "bye" || game.gameType === "scrimmage") return null;
  if (game.status === "live") return "Report Live Score";
  if (game.status === "scheduled") return "Report Final Score";
  return null;
}

function getMapUrl(game: { venue?: string; venueAddress?: string; homeTeam?: string }) {
  if (game.venueAddress) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(game.venueAddress)}`;
  if (!game.venue) return null;
  const homeTeam = getTeamName(game.homeTeam, "");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${game.venue} ${homeTeam} Texas`)}`;
}

function StatStatusBadge({ gameId }: { gameId: string }) {
  const availability = getGameStatAvailability(gameId);
  if (!availability || availability.status === "verified") return null;
  return <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.1em] text-amber-100/75 sm:px-2.5 sm:py-1 sm:text-[9px]">{getStatAvailabilityLabel(availability.status)}</span>;
}

export default async function ScoreboardPage() {
  const supabase = await createClient();
  const [{ data: dynamicRows }, { data: claimsData }] = await Promise.all([
    supabase
      .from("game_state")
      .select("game_id, status, home_score, away_score, period, clock, verified")
      .eq("verified", true),
    supabase.auth.getClaims(),
  ]);

  const pendingGameIds = new Set<string>();
  const userId = claimsData?.claims?.sub;
  if (userId) {
    const { data: pendingRows } = await supabase
      .from("score_submissions")
      .select("game_id")
      .eq("submitted_by", userId)
      .eq("status", "pending");
    for (const row of pendingRows ?? []) pendingGameIds.add(row.game_id);
  }

  const dynamicState = new Map(
    ((dynamicRows ?? []) as DynamicScoreState[]).map((state) => [state.game_id, state]),
  );

  const featuredGame = getGameOfTheWeek(dynamicState);
  const scoreboardGames = getScoreboardGames(dynamicState);
  const liveGames = getLiveGames(dynamicState);
  const upcomingGames = getUpcomingScoreboardGames(8, dynamicState);
  const finalGames = getFinalScoreboardGames(500, dynamicState);

  return <main className="min-h-screen bg-[var(--vv-bg)] text-white">
    <PageHero eyebrow="VarsityVue Scoreboard · 2026 Football" title="Texas High School Football Scores" description="Verified final scores, featured matchups, and upcoming kickoffs from programs currently tracked by VarsityVue." aside={<div className="rounded-2xl border border-white/10 bg-black/25 px-5 py-4 lg:max-w-sm"><p className="text-xs font-black uppercase tracking-[0.2em] text-white/45">Latest Results</p><p className="mt-1 text-lg font-black text-white">Verified finals stay easy to find.</p><p className="mt-1 text-sm leading-5 text-white/50">The scoreboard updates as new results and approved community reports are verified.</p></div>} />
    <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      {featuredGame && <FeaturedScoreboardGame game={featuredGame} games={scoreboardGames} hasPendingReport={pendingGameIds.has(featuredGame.id)} />}
      <section className="mt-5 grid items-start gap-3 sm:mt-8 sm:gap-6 lg:grid-cols-3">
        <ScoreboardColumn id="live-now" title="Live Now" description="Games currently marked in progress." games={liveGames} emptyText="No games are currently marked live." collapsibleWhenEmpty pendingGameIds={pendingGameIds} />
        <ScoreboardColumn id="final-scores" title="Final Scores" description="Latest verified results from across the coverage area." games={finalGames} emptyText="No final scores posted yet." mobileLimit={10} collapsible pendingGameIds={pendingGameIds} />
        <ScoreboardColumn id="upcoming" title="Upcoming" description="The next scheduled kickoffs currently on file." games={upcomingGames} emptyText="No upcoming games listed." pendingGameIds={pendingGameIds} />
      </section>
    </div>
  </main>;
}

function FeaturedScoreboardGame({ game, games, hasPendingReport }: { game: ScoreboardGame; games: ScoreboardGame[]; hasPendingReport: boolean }) {
  const awayStanding = game.awaySchoolSlug ? getStandingForSchoolFromGames(game.awaySchoolSlug, games) : undefined;
  const homeStanding = game.homeSchoolSlug ? getStandingForSchoolFromGames(game.homeSchoolSlug, games) : undefined;
  const awayScore = game.awayScore ?? game.score?.away;
  const homeScore = game.homeScore ?? game.score?.home;
  const isFinal = game.status === "final";
  const isLive = game.status === "live";
  const hasScore = (isFinal || isLive) && awayScore !== undefined && homeScore !== undefined;
  const mapUrl = getMapUrl(game);
  const reportScoreLabel = getReportScoreLabel(game);
  const actionLabel = hasPendingReport && reportScoreLabel ? "Pending Review" : reportScoreLabel;
  const isGameOfTheWeek = game.specialEvent?.toLowerCase() === "game of the week";

  return <section className="rounded-[1.4rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl sm:rounded-3xl sm:p-6 md:p-8">
    <div className="flex flex-wrap items-start justify-between gap-2 sm:items-center sm:gap-3"><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/55 sm:text-xs sm:tracking-[0.3em]">{isGameOfTheWeek ? "Game of the Week" : "Featured Matchup"}</p><p className="mt-1 text-[11px] font-bold leading-4 text-white/45 sm:mt-2 sm:text-sm">{getWeekLabel(game.week)} · {formatKickoff(game.kickoff)}{game.venue ? ` · ${game.venue}` : ""}</p></div><div className="flex flex-wrap items-center justify-end gap-2"><span className="rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white/75 sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.18em]">{game.displayStatus}</span>{isFinal && <StatStatusBadge gameId={game.id} />}</div></div>
    <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:mt-8 sm:gap-6"><TeamResult team={getTeamName(game.awayTeam, "Away Team")} standing={awayStanding} /><div className="text-center">{hasScore ? <><p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40 sm:text-[10px] sm:tracking-[0.28em]">{isFinal ? "Final" : game.score?.period ?? "Live"}</p><p className="mt-1 text-3xl font-black tracking-tight text-white sm:mt-2 sm:text-5xl md:text-6xl">{awayScore}<span className="mx-1.5 text-white/25 sm:mx-3">—</span>{homeScore}</p></> : <p className="text-sm font-black uppercase tracking-[0.2em] text-white/45 sm:text-2xl sm:tracking-[0.3em]">VS</p>}</div><TeamResult team={getTeamName(game.homeTeam, "Home Team")} standing={homeStanding} /></div>
    <div className="mt-4 flex flex-wrap justify-center gap-2 border-t border-white/10 pt-4 sm:mt-8 sm:gap-3 sm:pt-6"><Link href={`/games/${game.id}`} className="rounded-full bg-white px-4 py-2 text-center text-[10px] font-black uppercase tracking-[0.1em] text-black transition hover:bg-white/85 sm:px-7 sm:py-4 sm:text-base sm:normal-case sm:tracking-normal">{isFinal ? "View Final Result →" : "Matchup Center →"}</Link>{actionLabel && <Link href={`/report-score?game=${encodeURIComponent(game.id)}`} className={`rounded-full border px-4 py-2 text-center text-[10px] font-black uppercase tracking-[0.1em] transition sm:px-7 sm:py-4 sm:text-base sm:normal-case sm:tracking-normal ${hasPendingReport ? "border-amber-300/30 bg-amber-300/10 text-amber-100 hover:bg-amber-300/15" : "border-[var(--vv-accent)]/30 bg-[var(--vv-primary)]/40 text-white hover:bg-[var(--vv-primary)]/60"}`}>{actionLabel} →</Link>}{mapUrl && <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-center text-[10px] font-black uppercase tracking-[0.1em] text-white/75 transition hover:bg-white/10 hover:text-white sm:px-7 sm:py-4 sm:text-base sm:normal-case sm:tracking-normal">Venue Map →</a>}</div>
  </section>;
}

function TeamResult({ team, standing }: { team: string; standing?: ReturnType<typeof getStandingForSchoolFromGames> }) {
  const hasOverallResult = !!standing && (standing.overallWins > 0 || standing.overallLosses > 0);
  const districtRecord = standing && standing.districtWins + standing.districtLosses > 0 ? ` · ${standing.districtWins}-${standing.districtLosses} District` : "";
  return <div className="min-w-0 text-center"><h2 className="break-words text-base font-black leading-[1.05] text-white sm:text-3xl md:text-4xl">{team}</h2><p className="mt-1 text-[8px] font-black uppercase tracking-[0.08em] text-white/40 sm:mt-2 sm:text-sm sm:tracking-[0.16em]">{hasOverallResult ? `${standing!.overallWins}-${standing!.overallLosses} Overall${districtRecord}` : "Overall —"}</p></div>;
}

function ScoreboardColumn({ id, title, description, games, emptyText, collapsibleWhenEmpty = false, collapsible = false, mobileLimit, pendingGameIds }: { id: string; title: string; description: string; games: ScoreboardGame[]; emptyText: string; collapsibleWhenEmpty?: boolean; collapsible?: boolean; mobileLimit?: number; pendingGameIds: Set<string> }) {
  if (collapsibleWhenEmpty && games.length === 0) return <details id={id} className="group scroll-mt-24 rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-3.5 sm:rounded-3xl sm:p-5"><summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden"><div className="flex items-start justify-between gap-3 sm:gap-4"><div><h2 className="text-2xl font-black sm:text-3xl">{title}</h2><p className="mt-1 text-xs text-white/50 sm:mt-2 sm:text-sm">{description}</p></div><span className="mt-1 text-sm font-black text-white/45 transition group-open:rotate-180">⌄</span></div></summary><p className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/50 sm:mt-6 sm:rounded-2xl sm:p-4 sm:text-sm">{emptyText}</p></details>;

  const hasMobileOverflow = mobileLimit !== undefined && games.length > mobileLimit;
  const visibleGames = hasMobileOverflow ? games.slice(0, mobileLimit) : games;
  const overflowGames = hasMobileOverflow ? games.slice(mobileLimit) : [];

  const gameList = <div className="mt-4 space-y-2.5 sm:mt-6 sm:space-y-4">
    {games.length === 0 ? <p className="rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/50 sm:rounded-2xl sm:p-4 sm:text-sm">{emptyText}</p> : <>
      {visibleGames.map((game) => <ScoreboardGameCard key={game.id} game={game} hasPendingReport={pendingGameIds.has(game.id)} />)}
      {hasMobileOverflow && <>
        <div className="hidden space-y-4 md:block">{overflowGames.map((game) => <ScoreboardGameCard key={game.id} game={game} hasPendingReport={pendingGameIds.has(game.id)} />)}</div>
        <details className="group md:hidden">
          <summary className="mt-3 cursor-pointer list-none rounded-full border border-white/15 bg-white/[0.06] px-4 py-3 text-center text-[10px] font-black uppercase tracking-[0.14em] text-white/75 [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">View all {games.length} scores ↓</span>
            <span className="hidden group-open:inline">Show fewer ↑</span>
          </summary>
          <div className="mt-2.5 space-y-2.5">{overflowGames.map((game) => <ScoreboardGameCard key={`mobile-${game.id}`} game={game} hasPendingReport={pendingGameIds.has(game.id)} />)}</div>
        </details>
      </>}
    </>}
  </div>;

  if (collapsible) return <details id={id} open className="group scroll-mt-24 rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-3.5 sm:rounded-3xl sm:p-5">
    <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div><h2 className="text-2xl font-black sm:text-3xl">{title}</h2><p className="mt-1 text-xs text-white/50 sm:mt-2 sm:text-sm">{description}</p></div>
        <div className="flex items-center gap-2"><span className="text-[9px] font-black uppercase tracking-[0.12em] text-white/35 sm:text-[10px]">{games.length} games</span><span className="mt-1 text-sm font-black text-white/45 transition group-open:rotate-180">⌄</span></div>
      </div>
    </summary>
    {gameList}
  </details>;

  return <section id={id} className="scroll-mt-24 rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-3.5 sm:rounded-3xl sm:p-5">
    <h2 className="text-2xl font-black sm:text-3xl">{title}</h2>
    <p className="mt-1 text-xs text-white/50 sm:mt-2 sm:text-sm">{description}</p>
    {gameList}
  </section>;
}

function ScoreboardGameCard({ game, hasPendingReport }: { game: ScoreboardGame; hasPendingReport: boolean }) {
  const awaySchool = game.awaySchoolSlug ? getSchoolBySlug(game.awaySchoolSlug) : undefined;
  const homeSchool = game.homeSchoolSlug ? getSchoolBySlug(game.homeSchoolSlug) : undefined;
  const awayScore = game.awayScore ?? game.score?.away;
  const homeScore = game.homeScore ?? game.score?.home;
  const isFinal = game.status === "final";
  const reportScoreLabel = getReportScoreLabel(game);
  const actionLabel = hasPendingReport && reportScoreLabel ? "Pending Review" : reportScoreLabel;
  const showScore = (isFinal || game.status === "live") && awayScore !== undefined && homeScore !== undefined;

  return <div className={`rounded-xl p-3 transition hover:bg-white/10 sm:rounded-2xl sm:p-4 ${game.status === "live" ? "border border-white/30 bg-black/45 shadow-[0_0_28px_rgba(255,255,255,0.10)]" : "border border-white/10 bg-black/35"}`}>
    <Link href={`/games/${game.id}`} className="block">
      <div className="flex items-center justify-between gap-2 sm:gap-3"><div className="flex flex-wrap items-center gap-1.5"><span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-white/55 sm:px-3 sm:py-1 sm:text-[10px] sm:tracking-[0.16em]">{game.displayStatus}</span>{isFinal && <StatStatusBadge gameId={game.id} />}</div><span className="text-[9px] font-black uppercase tracking-[0.12em] text-white/35 sm:text-[10px] sm:tracking-[0.16em]">{getWeekLabel(game.week)}</span></div>
      <div className="mt-3 space-y-2.5 sm:mt-5 sm:space-y-4"><CompactTeamRow school={awaySchool} team={getTeamName(game.awayTeam, "Away")} score={showScore ? awayScore : undefined} /><CompactTeamRow school={homeSchool} team={getTeamName(game.homeTeam, "Home")} score={showScore ? homeScore : undefined} /></div>
      <div className="mt-3 border-t border-white/10 pt-3 sm:mt-5 sm:pt-4"><p className="text-[11px] font-semibold text-white/45 sm:text-xs">{formatKickoff(game.kickoff)}</p><p className="mt-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-white/60 sm:mt-2 sm:text-[10px] sm:tracking-[0.16em]">{isFinal ? "View Final →" : "View Matchup →"}</p></div>
    </Link>
    {actionLabel && <Link href={`/report-score?game=${encodeURIComponent(game.id)}`} className={`mt-3 block rounded-lg border px-3 py-2 text-center text-[9px] font-black uppercase tracking-[0.12em] transition sm:mt-4 sm:rounded-xl sm:text-[10px] ${hasPendingReport ? "border-amber-300/30 bg-amber-300/10 text-amber-100 hover:bg-amber-300/15" : "border-[var(--vv-accent)]/20 bg-[var(--vv-primary)]/35 text-white hover:bg-[var(--vv-primary)]/55"}`}>{actionLabel} →</Link>}
  </div>;
}

function CompactTeamRow({ school, team, score }: { school?: ReturnType<typeof getSchoolBySlug>; team: string; score?: number }) {
  return <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2.5 sm:gap-3">{school ? <SchoolBadge school={school} size="xs" /> : <FallbackBadge label={team} />}<p className="min-w-0 truncate text-sm font-black text-white sm:text-base">{team}</p>{score !== undefined && <p className="text-xl font-black leading-none text-white sm:text-2xl">{score}</p>}</div>;
}

function getFallbackInitials(label: string) {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) return words.slice(0, 3).map((word) => word[0]).join("").toUpperCase();
  return label.slice(0, 3).toUpperCase();
}

function FallbackBadge({ label }: { label: string }) {
  const identity = getScoreboardTeamIdentity(label);
  const initials = identity?.abbreviation ?? getFallbackInitials(label);
  const footer = identity?.mascot ?? label;
  const textColor = identity?.primary ?? "#FFFFFF";
  const strokeColor = identity?.secondary === "#000000" ? identity.accent : (identity?.secondary ?? "#FFFFFF");
  const footerColor = identity?.secondary === "#000000" ? identity.accent : (identity?.secondary ?? "#FFFFFF");

  return <div className="w-20 shrink-0 drop-shadow-2xl">
    <div className="relative overflow-hidden rounded-t-3xl border-[3px] border-black bg-[linear-gradient(180deg,#151515_0%,#050505_100%)] px-2 py-2">
      <div className="absolute inset-0 opacity-[0.08] [background-image:repeating-linear-gradient(45deg,rgba(255,255,255,0.6),rgba(255,255,255,0.6)_1px,transparent_1px,transparent_4px)]" />
      <div className="relative text-center text-xl font-black uppercase leading-none tracking-[-0.04em] [text-shadow:2px_2px_0_#000,-1px_-1px_0_#000,0_8px_14px_rgba(0,0,0,0.75)]" style={{ color: textColor, WebkitTextStroke: `1px ${strokeColor}` }}>{initials}</div>
    </div>
    <div className="relative -mt-1 flex min-h-7 items-center justify-center overflow-hidden rounded-b-3xl border-[3px] border-black bg-[linear-gradient(180deg,#111111_0%,#050505_100%)] px-1.5 py-1 text-center shadow-xl">
      <div className="max-w-full text-[6px] font-black uppercase leading-[1.05]" style={{ color: footerColor }}>{footer}</div>
    </div>
  </div>;
}
