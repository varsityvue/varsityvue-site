import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getProgramLogoPath } from "@/components/SchoolBadge";
import { getDynamicGames } from "@/lib/dynamic-games";
import { requireActiveMember } from "@/lib/member-access";
import { getSchoolBySlug } from "@/lib/schools";
import { attentionReasons, weekForOperations, type CanonicalScoreState, type PendingScoreReport } from "@/lib/scoring-operations";
import ScoringBoard, { type OperationalGame } from "./ScoringBoard";

export const metadata: Metadata = { title: "Friday-night scoring", robots: { index: false, follow: false, nocache: true } };

export default async function ScoringOperationsPage({ searchParams }: {
  searchParams: Promise<{ week?: string; game?: string; saved?: string; stale?: string; error?: string }>;
}) {
  const { supabase, userId } = await requireActiveMember();
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (!roles?.some(({ role }) => role === "admin" || role === "moderator")) redirect("/account");

  const params = await searchParams;
  const now = new Date();
  const [{ data: states, error: stateError }, { data: pending, error: reportError }, { data: intelligence, error: intelligenceError }, allGames] = await Promise.all([
    supabase.from("game_state").select("game_id,status,away_score,home_score,period,clock,updated_at,score_revision,away_school_slug,home_school_slug,verified"),
    supabase.from("internal_score_submissions").select("id,game_id,away_score,home_score,game_status,created_at").eq("status", "pending").order("created_at", { ascending: true }),
    supabase.from("missing_score_intelligence").select("game_id").eq("status", "open"),
    getDynamicGames(),
  ]);
  if (stateError || reportError || intelligenceError) throw new Error("Could not load current scoring operations data.");
  const playable = allGames.filter((game) => game.season === 2026 && game.week != null && game.gameType !== "bye" && game.gameType !== "scrimmage");
  const availableWeeks = [...new Set(playable.map((game) => game.week as number))].sort((a, b) => a - b);
  const chosenWeek = Number(params.week);
  const week = Number.isInteger(chosenWeek) && availableWeeks.includes(chosenWeek)
    ? chosenWeek : weekForOperations(playable, now) ?? availableWeeks[0];
  const stateById = new Map((states as CanonicalScoreState[] ?? []).map((state) => [state.game_id, state]));
  const pendingByGame = new Map<string, PendingScoreReport[]>();
  for (const report of (pending as PendingScoreReport[] ?? [])) {
    pendingByGame.set(report.game_id, [...(pendingByGame.get(report.game_id) ?? []), report]);
  }
  const openIntelligence = new Set((intelligence ?? []).map((item) => item.game_id));
  const games: OperationalGame[] = playable.filter((game) => game.week === week).map((game) => {
    const state = stateById.get(game.id);
    const reports = pendingByGame.get(game.id) ?? [];
    const awayName = game.awayTeam ?? game.awaySchoolSlug ?? "Away";
    const homeName = game.homeTeam ?? game.homeSchoolSlug ?? "Home";
    return {
      id: game.id, awayName, homeName, awayLogo: getProgramLogoPath(game.awaySchoolSlug ?? "") ?? null,
      homeLogo: getProgramLogoPath(game.homeSchoolSlug ?? "") ?? null,
      kickoff: game.kickoff ?? null, status: game.status,
      awayScore: state?.verified ? state.away_score : game.awayScore ?? null,
      homeScore: state?.verified ? state.home_score : game.homeScore ?? null,
      period: state?.verified ? state.period : game.score?.period ?? null,
      clock: state?.verified ? state.clock : game.score?.clock ?? null,
      updatedAt: state?.updated_at ?? null, scoreRevision: state?.score_revision ?? null, hasState: Boolean(state), verified: state?.verified ?? false,
      identityMissing: Boolean(state && (!state.away_school_slug || !state.home_school_slug)),
      featured: Boolean(getSchoolBySlug(game.awaySchoolSlug ?? "")?.status === "pilot" || getSchoolBySlug(game.homeSchoolSlug ?? "")?.status === "pilot"),
      reports, attention: attentionReasons(game, state, reports, openIntelligence.has(game.id), now),
      intelligenceOpen: openIntelligence.has(game.id),
    };
  }).sort((a, b) => Number(b.featured) - Number(a.featured) || Number(b.status === "live") - Number(a.status === "live") ||
    (a.kickoff ?? "").localeCompare(b.kickoff ?? "") || a.id.localeCompare(b.id));

  return <main className="min-h-screen bg-[#050505] px-3 py-5 text-white sm:px-6 sm:py-8">
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-xs font-black uppercase tracking-widest text-[var(--vv-accent)]">Internal scoring</p><h1 className="mt-1 text-2xl font-black sm:text-3xl">Friday-night scores</h1></div>
        <nav className="flex gap-2 text-xs font-bold"><Link className="rounded-xl border border-white/15 px-3 py-2.5" href="/internal/score-review">Score Review</Link><Link className="rounded-xl border border-white/15 px-3 py-2.5" href="/internal/score-intelligence">Missing Scores</Link></nav>
      </header>
      <ScoringBoard games={games} week={week} weeks={availableWeeks} initialGameId={params.game ?? ""} receipt={params.saved === "1"} stale={params.stale === "1"} error={params.error === "1"} now={now.toISOString()} />
    </div>
  </main>;
}
