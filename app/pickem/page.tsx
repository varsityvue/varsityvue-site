import { Suspense } from "react";
import ReadRecovery from "@/components/ReadRecovery";
import PickemEntryStatus from "@/components/PickemEntryStatus";
import PickemLocalNavigation from "@/components/PickemLocalNavigation";
import { PickemHistory, PickemStandings } from "@/components/PickemOptionalSections";
import { createPickemReadScope, loadPickemCore, loadPickemWeek, loadPickemHistory, isContestWeek, PickemReadUnavailable, type PickemReadScope } from "@/lib/pickem-page-loader";
import type { Metadata } from "next";
import Link from "next/link";
import ShareAction from "@/components/ShareAction";
import PickemGuestSlate from "@/components/PickemGuestSlate";
import PickemSlateForm, { type PickemSlateGame } from "@/components/PickemSlateForm";
import PickemPrizeCounter from "@/components/PickemPrizeCounter";
import PickemContestHeader from "@/components/PickemContestHeader";
import { logoForPickemWeek } from "@/data/pickem-sponsor-logos";
import { getPickemLogoFilter, getPickemLogoPath } from "@/data/school-logos";
import { getGameById } from "@/lib/games";
import { memberAccountStatus } from "@/lib/member-access";
import { isPickemEntryClosed, isPickemWeekClosed } from "@/lib/pickem-week-state";
import { centralContestDeadline } from "@/lib/pickem-contest-display";
import { orderPickemSlateRows } from "@/lib/pickem-display-order";
import { getSchoolBySlug } from "@/lib/schools";
import { createClient } from "@/lib/supabase/server";

const pickemTitle = "VarsityVue Pick ’Em | Texas High School Football";
const pickemDescription =
  "Make your weekly Texas high school football picks. The winner receives $1 per valid accepted entry, up to $100. Free to play for Texas residents 18+.";

export const metadata: Metadata = {
  title: { absolute: pickemTitle },
  description: pickemDescription,
  alternates: { canonical: "/pickem" },
  openGraph: {
    title: pickemTitle,
    description: pickemDescription,
    url: "/pickem",
    siteName: "VarsityVue",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: pickemTitle,
    description: pickemDescription,
  },
};

type PageProps = { searchParams: Promise<{ intent?: string }> };

function parsePickIntent(value?: string) {
  const picks = new Map<string, string>();
  for (const entry of (value ?? "").split("|").slice(0, 12)) {
    const [gameId, schoolSlug] = entry.split("~");
    if (/^[a-z0-9-]+$/.test(gameId ?? "") && /^[a-z0-9-]+$/.test(schoolSlug ?? "")) {
      picks.set(gameId, schoolSlug);
    }
  }
  return picks;
}

function kickoffLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Kickoff TBD";
  return date.toLocaleString("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  });
}

async function PickemContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const intendedPicks = parsePickIntent(params.intent);
  const supabase = await createClient(true);
  const scope = createPickemReadScope(supabase);
  const [week, identity] = await Promise.all([
    loadPickemWeek(scope),
    (async () => {
      const { data, error } = await supabase.auth.getClaims();
      if (error && error.name !== "AuthSessionMissingError") throw new PickemReadUnavailable();
      const userId = data?.claims?.sub;
      if (userId && (await memberAccountStatus(supabase, userId)) !== "active") throw new PickemReadUnavailable();
      return userId;
    })(),
  ]);
  const userId = identity;
  const isActiveMember = Boolean(userId);
  const contestWeek = isContestWeek(week);
  const core = week ? await loadPickemCore(scope, week, userId) : {
    slateRows: [], memberPickRows: [], memberPrediction: null, memberEntry: null,
    draftPicks: [], draftPrediction: null, voidGames: [],
  };
  const { slateRows, memberPickRows, memberPrediction, memberEntry, draftPicks, draftPrediction, voidGames } = core;
  const voidGameIds = new Set(voidGames.map(row => row.pickem_game_id));
  const allPicksLocked = Boolean(week && (slateRows ?? []).filter((row) => !voidGameIds.has(row.id))
    .every((row) => row.is_locked === true));
  const weekClosed = week ? (contestWeek ? week.status !== "open" || allPicksLocked : isPickemWeekClosed(week)) : true;
  const firstKickoff = (slateRows ?? []).reduce<number>((minimum, row) => Math.min(minimum, new Date(row.lock_at).getTime()), Infinity);
  const newEntriesClosed = contestWeek && isPickemEntryClosed(
    week?.entry_deadline_at ? new Date(week.entry_deadline_at).getTime() : firstKickoff,
  );
  const typedDraftPicks = (draftPicks ?? []) as Array<{ pickem_game_id: string; picked_school_slug: string }>;
  const selections = new Map<string, string>([
    ...(memberPickRows ?? []).map((pick) => [pick.pickem_game_id, pick.picked_school_slug] as const),
    ...typedDraftPicks.map((pick) => [pick.pickem_game_id, pick.picked_school_slug] as const),
  ]);
  if (contestWeek && week && (!week.tiebreaker_game_id || !slateRows?.some(row => row.id === week.tiebreaker_game_id))) {
    console.error("Pick ’Em tiebreaker configuration missing or outside the slate", { season: week.season, week: week.week });
  }
  const displayRows = week
    ? orderPickemSlateRows(slateRows ?? [], week.tiebreaker_game_id)
    : slateRows ?? [];
  const games: PickemSlateGame[] = displayRows.flatMap((row) => {
    if (voidGameIds.has(row.id)) return [];
    const game = getGameById(row.game_id);
    if (!game || !row.away_school_slug || !row.home_school_slug) throw new PickemReadUnavailable();
    const awaySchool = getSchoolBySlug(row.away_school_slug);
    const homeSchool = getSchoolBySlug(row.home_school_slug);
    return [{
      id: row.id,
      gameId: row.game_id,
      isTiebreaker: row.id === week?.tiebreaker_game_id,
      awayName: game.awayTeam ?? "Away Team",
      awaySlug: row.away_school_slug,
      awayMark: awaySchool?.abbreviation ?? game.awayTeam?.slice(0, 3).toUpperCase() ?? "AWY",
      awayColor: awaySchool?.colors.primary ?? "#7a1022",
      awayLogoUrl: awaySchool ? getPickemLogoPath(awaySchool.slug) : undefined,
      awayLogoFilter: getPickemLogoFilter(row.away_school_slug),
      homeName: game.homeTeam ?? "Home Team",
      homeSlug: row.home_school_slug,
      homeMark: homeSchool?.abbreviation ?? game.homeTeam?.slice(0, 3).toUpperCase() ?? "HME",
      homeColor: homeSchool?.colors.primary ?? "#7a1022",
      homeLogoUrl: homeSchool ? getPickemLogoPath(homeSchool.slug) : undefined,
      homeLogoFilter: getPickemLogoFilter(row.home_school_slug),
      kickoffLabel: kickoffLabel(row.lock_at),
      locked: weekClosed || row.is_locked === true,
      savedSlug: selections.get(row.id),
      selectedSlug: selections.get(row.id) ?? (
        [row.away_school_slug, row.home_school_slug].includes(intendedPicks.get(row.game_id) ?? "")
          ? intendedPicks.get(row.game_id)
          : undefined
      ),
    }];
  });
  const tiebreakerGame = games.find((game) => game.id === week?.tiebreaker_game_id);

  // Share one optional read between the compact overview and full history.
  // A contained failure must never block the authoritative entry form.
  const historyData = isActiveMember && userId && week
    ? loadPickemHistory(scope, userId, week.season).catch(() => null) : null;
  const entryAvailable = Boolean(week && !newEntriesClosed && !weekClosed);

  return (
    <main className="min-h-screen bg-[var(--vv-bg)] px-4 py-4 text-white sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        {contestWeek && week ? <PickemContestHeader season={week.season} week={week.week} deadline={week.entry_deadline_at} sponsorName={week.presenting_sponsor_name} sponsorLogo={logoForPickemWeek(week.season, week.week, week.presenting_sponsor_name)} /> : (
        <section className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(139,16,32,0.42),transparent_40%),linear-gradient(135deg,rgba(255,255,255,0.07),rgba(255,255,255,0.025))] p-4 shadow-2xl sm:rounded-[2rem] sm:p-8">
          <p className="pr-28 text-[10px] font-black uppercase tracking-[0.24em] text-[var(--vv-accent)] sm:pr-32 sm:text-xs">VarsityVue</p>
          {week ? <span className="absolute right-5 top-5 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white/45 sm:right-8 sm:top-8">{week.season} · Week {week.week}</span> : null}
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:mt-3 sm:text-5xl">Pick ’Em</h1>
          {contestWeek ? <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-white/80">Free to play · Texas 18+</p> : <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55 sm:text-base">Pick every winner. Each correct pick earns one point, and games lock individually at kickoff.</p>}
          <ShareAction title="Pick ’Em | VarsityVue" text="Make your weekly Texas high school football picks on VarsityVue." url="https://varsityvue.com/pickem" label="Share" className="mt-3" />
        </section>
        )}

        <PickemLocalNavigation key={week?.id ?? "no-contest"} defaultView={week && (weekClosed || (newEntriesClosed && !memberEntry)) ? "standings" : "picks"} picks={<>
        {contestWeek && isActiveMember && !memberEntry && (newEntriesClosed || weekClosed) && <div className="mt-4"><PickemEntryStatus title="Entry closed — not entered" detail="Saved drafts do not qualify as accepted entries. You can review available results below." /></div>}
        {week && weekClosed ? <div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm font-bold text-amber-50">{contestWeek ? `Week ${week.week}: ALL PICKS LOCKED. Saved picks remain visible while verified results are graded.` : `Week ${week.week} Pick ’Em is CLOSED. Saved picks remain visible while verified results are graded.`}</div> : null}

        {voidGames?.length ? <div className="mt-5 rounded-xl border border-sky-300/20 bg-sky-300/10 p-4 text-sm text-sky-50">{voidGames.length} included {voidGames.length === 1 ? "matchup is" : "matchups are"} VOID for this contest. No pick is required or graded for {voidGames.length === 1 ? "it" : "them"}.{voidGameIds.has(week?.tiebreaker_game_id ?? "") ? " The Tiebreaker Game prediction is skipped." : ""}</div> : null}
        {contestWeek && newEntriesClosed && !weekClosed ? <div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-50">Week {week?.week}: ENTRY CLOSED. No new entries can qualify. Existing valid entrants may still edit individual games that have not locked.</div> : null}
        {!week || games.length === 0 ? (
          <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center text-white/55">The next Pick ’Em slate is not open yet.</section>
        ) : isActiveMember ? (
          <>
            {intendedPicks.size > 0 ? <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm text-emerald-50">Your pre-registration picks were restored. {memberEntry?.status === "valid" ? "Your existing valid entry remains accepted; restored changes are not saved automatically." : "Restored selections are not an accepted entry."} {weekClosed ? "Picks are locked. Review your saved picks and available results below." : newEntriesClosed && !memberEntry ? "New entries are closed. Review available results below." : <>Select <strong>{contestWeek && !memberEntry ? `Submit Week ${week.week} Picks` : "Save My Picks"}</strong> below to save your selections.</>}</div> : null}
            {(!newEntriesClosed || memberEntry || !contestWeek) && <PickemSlateForm key={`${week.id}:${userId}`} weekNumber={week.week} weekId={week.id} games={games} entryClosed={newEntriesClosed} contest={contestWeek ? { entered: Boolean(memberEntry), completedAt: memberEntry?.completed_at, status: memberEntry?.status } : undefined} tiebreaker={week.tiebreaker_game_id && !voidGameIds.has(week.tiebreaker_game_id) ? { matchup: (() => { const selected = games.find((game) => game.id === week.tiebreaker_game_id); return selected ? `${selected.awayName} at ${selected.homeName}` : "Game of the Week"; })(), savedPrediction: memberPrediction?.predicted_total ?? draftPrediction ?? undefined, locked: games.find((game) => game.id === week.tiebreaker_game_id)?.locked ?? false } : undefined} />}
          </>
        ) : (
          !newEntriesClosed ? <PickemGuestSlate games={games} /> : null
        )}

        {contestWeek ? <details className="mt-3 rounded-xl border border-white/15 bg-white/[0.04] p-3 text-sm text-white/80 sm:mt-5 sm:p-4">
          <summary className="cursor-pointer text-sm font-black text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Contest rules &amp; prize details</summary>
          <Suspense fallback={<p role="status">Loading provisional prize…</p>}><PickemPrize scope={scope} weekId={week!.id} /></Suspense>
          <p className="mt-2 font-bold text-white">$1 per valid accepted entry · up to $100 this week</p>
          <p className="mt-0.5 text-xs text-white/70">Count and prize are provisional, subject to eligibility and disqualification review.</p>
          <div className="mt-3 rounded-lg border border-amber-300/25 bg-amber-300/10 p-3 text-amber-50"><strong>New-entry deadline: {week?.entry_deadline_at ? centralContestDeadline(week.entry_deadline_at) : "Pending configuration"}</strong><p className="mt-1 text-xs">Complete your entry before this time. Existing entrants may edit picks until each game locks.</p></div>
          <p className="mt-3">Pick every game; each correct pick earns 1 point. Predict {tiebreakerGame ? `${tiebreakerGame.awayName}–${tiebreakerGame.homeName}` : "the Pick ’Em Tiebreaker Game"} combined points. Closest prediction breaks a tie, then earliest valid completed entry.</p>
          <p className="mt-2 text-xs text-white/70">A U.S. mobile number is required to help enforce one entry per person and contact the winner. It is not publicly displayed, and entering does not consent to marketing texts. Number ownership and mobile-line type are not verified. Age and residency are self-attested, not independently verified at entry.</p>
          <p className="mt-1 text-xs text-white/70">One entry per person · Mobile number and eligibility attestation required · No purchase necessary</p>
          <p className="mt-2 text-xs text-white/70"><Link href="/pickem/rules" className="font-bold text-white underline underline-offset-2">Official Rules</Link> · <Link href="/pickem/privacy" className="font-bold text-white underline underline-offset-2">Privacy Notice</Link> · Questions: <a href="mailto:info@varsityvue.com" className="font-bold text-white underline underline-offset-2">info@varsityvue.com</a></p>
        </details> : null}
        </>} results={isActiveMember && userId && week ? <Suspense fallback={<p role="status" className="mt-5">Loading your Pick ’Em history…</p>}>
          <PickemHistory scope={scope} userId={userId} week={week} games={games} voidGameIds={voidGameIds} weekClosed={weekClosed} entryAvailable={entryAvailable} dataPromise={historyData ?? undefined} />
        </Suspense> : <section id="my-picks" className="py-6"><h2 className="text-xl font-black">My Results</h2><p className="mt-2 text-sm text-white/80">Sign in to see your picks, weekly results and season rank. You can explore this week’s picks and public standings without an account.</p><Link href="/login?next=%2Fpickem%23results" className="mt-4 inline-flex min-h-11 items-center rounded-full bg-white px-5 font-bold text-black">Sign in</Link></section>} standings={week ? <Suspense fallback={<p role="status" className="mt-5">Loading standings…</p>}>
          <PickemStandings scope={scope} week={week} weekClosed={weekClosed} entryAvailable={entryAvailable} />
        </Suspense> : <p className="py-6">Standings will appear when a contest is available.</p>} />
      </div>
    </main>
  );
}

async function PickemPrize({ scope, weekId }: { scope: PickemReadScope; weekId: string }) {
 let prize;
 try {
  prize = await scope.read(scope.client.from("pickem_contest_prize").select("valid_entries,prize_dollars").eq("week_id", weekId).maybeSingle());
 } catch { return <p role="status">The provisional prize count is temporarily unavailable.</p>; }
 return <PickemPrizeCounter weekId={weekId} initialPrize={prize} />;
}
export default async function PickemPage(props: PageProps) {
 try { return await PickemContent(props); }
 catch { return <main className="min-h-[60vh] px-4 py-8 text-white"><div className="mx-auto max-w-[1200px]"><h1 className="text-3xl font-black">Pick ’Em</h1><ReadRecovery message="Pick ’Em could not load safely. Your saved entries have not been changed. Try loading again before editing." /></div></main>; }
}
