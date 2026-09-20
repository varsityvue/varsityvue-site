import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { savePickemWeek } from "./actions";
import { getDynamicGames } from "@/lib/dynamic-games";
import { requireActiveMember } from "@/lib/member-access";

export const metadata: Metadata = {
  title: "Pick ’Em Management",
  robots: { index: false, follow: false, nocache: true },
};

type PageProps = { searchParams: Promise<{ message?: string }> };

function kickoffLabel(kickoff?: string) {
  if (!kickoff) return "Kickoff missing";
  const date = new Date(kickoff);
  if (Number.isNaN(date.getTime())) return "Kickoff invalid";
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  });
}

export default async function PickemManagementPage({ searchParams }: PageProps) {
  const { supabase, userId } = await requireActiveMember();
  const [{ data: roles }, params, dynamicGames, { data: configuredWeeks }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", userId),
    searchParams,
    getDynamicGames(),
    supabase
      .from("pickem_weeks")
      .select("id, season, week, title, status, pickem_games(game_id, sort_order)")
      .eq("season", 2026)
      .gte("week", 5)
      .lte("week", 7),
  ]);

  if (!roles?.some((row) => row.role === "moderator" || row.role === "admin")) {
    redirect("/account");
  }

  const configuredByWeek = new Map((configuredWeeks ?? []).map((week) => [week.week, week]));
  const weekOptions = [5, 6, 7].map((weekNumber) => {
    const configured = configuredByWeek.get(weekNumber);
    const selectedOrder = new Map((configured?.pickem_games ?? []).map((game) => [game.game_id, game.sort_order]));
    const games = dynamicGames
      .filter((game) => game.season === 2026 && game.week === weekNumber)
      .filter((game) => game.gameType !== "bye" && game.gameType !== "scrimmage")
      .filter((game) => game.kickoff?.includes("T") && game.awaySchoolSlug && game.homeSchoolSlug)
      .sort((a, b) => {
        const aOrder = selectedOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER;
        const bOrder = selectedOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER;
        return aOrder - bOrder || (a.kickoff ?? "").localeCompare(b.kickoff ?? "") || a.id.localeCompare(b.id);
      });
    return { weekNumber, configured, selectedOrder, games };
  });

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-8 text-white sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--vv-accent)]">Internal Tool</p><h1 className="mt-2 text-3xl font-black sm:text-5xl">Pick ’Em management</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-white/50 sm:text-base">Build each slate from canonical VarsityVue games. Kickoff times become lock times automatically; this tool does not create or reschedule games.</p></div>
          <Link href="/pickem" className="rounded-full border border-white/15 px-4 py-2.5 text-xs font-black text-white/70 transition hover:bg-white/10 hover:text-white">View Public Pick ’Em →</Link>
        </div>

        {params.message ? <div className="mt-6 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm text-emerald-50">{params.message}</div> : null}

        <div className="mt-7 space-y-5">
          {weekOptions.map(({ weekNumber, configured, selectedOrder, games }) => (
            <form key={weekNumber} action={savePickemWeek} className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 shadow-xl sm:p-7">
              <input type="hidden" name="season" value="2026" />
              <input type="hidden" name="week" value={weekNumber} />
              <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/35">2026 Season</p><h2 className="mt-1 text-2xl font-black">Week {weekNumber}</h2></div><span className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white/50">{configured?.status ?? "Not configured"}</span></div>
              <label className="mt-4 block"><span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/40">Slate title</span><input name="title" defaultValue={configured?.title ?? `Week ${weekNumber} Pick ’Em`} className="mt-2 w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-white/30" /></label>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {games.map((game) => <label key={game.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/25 p-3 transition hover:bg-white/[0.06]"><input type="checkbox" name="game_id" value={game.id} defaultChecked={selectedOrder.has(game.id)} className="mt-1 h-4 w-4 accent-[var(--vv-primary)]" /><span className="min-w-0"><span className="block text-sm font-black">{game.awayTeam} at {game.homeTeam}</span><span className="mt-1 block text-[10px] text-white/40">{kickoffLabel(game.kickoff)}</span></span></label>)}
              </div>
              {games.length === 0 ? <p className="mt-4 rounded-xl border border-amber-300/15 bg-amber-300/[0.06] p-4 text-sm text-amber-100/70">No canonical games with complete team and kickoff data are available for this week.</p> : null}
              <div className="mt-5 flex flex-wrap gap-2"><button type="submit" name="status" value="draft" disabled={games.length === 0 || configured?.status === "graded"} className="rounded-full border border-white/15 px-5 py-2.5 text-xs font-black text-white/70 transition hover:bg-white/10 disabled:opacity-40">Save Draft</button><button type="submit" name="status" value="open" disabled={games.length === 0 || configured?.status === "graded"} className="rounded-full bg-white px-5 py-2.5 text-xs font-black text-black transition hover:bg-white/85 disabled:opacity-40">Open Slate</button></div>
            </form>
          ))}
        </div>
      </div>
    </main>
  );
}
