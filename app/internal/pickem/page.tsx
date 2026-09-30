import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { savePickemWeek, openPickemWeek } from "./actions";
import { PickemWeekSetup, type ConfiguredPickemWeek } from "./PickemWeekSetup";
import { getDynamicGames } from "@/lib/dynamic-games";
import { requireActiveMember } from "@/lib/member-access";
import { eligiblePickemGames, PICKEM_ADMIN_WEEKS } from "@/lib/pickem-admin-configuration";

export const metadata: Metadata = { title: "Pick ’Em Management", robots: { index: false, follow: false, nocache: true } };

export default async function PickemManagementPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const { supabase, userId } = await requireActiveMember();
  const { data: roles, error: roleError } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (roleError || !roles?.some((row) => row.role === "moderator" || row.role === "admin")) redirect("/account");
  const [params, dynamicGames, { data: configuredWeeks, error: weekError }, { data: scheduleStates, error: scheduleError }] = await Promise.all([
    searchParams, getDynamicGames(),
    supabase.from("pickem_weeks").select("id, week, title, status, configuration_revision, tiebreaker_game_id, opens_at, closes_at, entry_deadline_at, outcome_resolution_at, official_rules_version, official_rules_published_at, presenting_sponsor_name, pickem_games(id, game_id, sort_order, lock_at, graded_at)")
      .eq("season", 2026).gte("week", 5).lte("week", 11),
    supabase.from("game_state").select("game_id, schedule_revision"),
  ]);
  const configuredByWeek = new Map((configuredWeeks as ConfiguredPickemWeek[] | null ?? []).map((week) => [week.week, week]));
  const revisions = Object.fromEntries((scheduleStates ?? []).map((state) => [state.game_id, state.schedule_revision]));
  const unavailable = Boolean(weekError || scheduleError);
  const now = new Date().getTime();
  return <main className="min-h-screen bg-[#050505] px-4 py-8 text-white sm:px-6 sm:py-12">
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-widest text-white/45">Internal tool · 2026</p><h1 className="mt-2 text-3xl font-black sm:text-5xl">Pick ’Em management</h1><p className="mt-3 max-w-3xl text-sm text-white/60">Prepare future weeks as drafts. Opening is a separate, deliberate transition. Published contests are read-only here.</p></div>
        <div className="flex flex-wrap gap-3 text-sm">{roles.some((row) => row.role === "admin") && <Link href="/internal/pickem/submissions" className="underline">Member submissions</Link>}<Link href="/pickem" className="underline">Public Pick ’Em</Link></div>
      </div>
      {unavailable && <p role="alert" className="mt-6 rounded-xl border border-amber-300/30 p-4 text-sm text-amber-100">Configuration could not be loaded. Setup is read-only until its database and schedule are available.</p>}
      {params.message && <p role="status" className="mt-6 rounded-xl border border-white/20 p-4 text-sm">{params.message}</p>}
      <div className="mt-7 space-y-5">{PICKEM_ADMIN_WEEKS.map((week) => {
        const configured = configuredByWeek.get(week);
        const order = new Map(configured?.pickem_games.map((game) => [game.game_id, game.sort_order]));
        const games = eligiblePickemGames(dynamicGames, week).sort((a,b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999) || (a.kickoff ?? "").localeCompare(b.kickoff ?? "") || a.id.localeCompare(b.id));
        return <PickemWeekSetup now={now} key={week} week={week} games={games} configured={configured} revisions={revisions} unavailable={unavailable} saveAction={savePickemWeek} openAction={openPickemWeek} />;
      })}</div>
    </div>
  </main>;
}
