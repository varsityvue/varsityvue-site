import Link from "next/link";
import { redirect } from "next/navigation";
import { getGameById } from "@/lib/games";
import { requireActiveMember } from "@/lib/member-access";
import ScoreCorrectionForm from "./ScoreCorrectionForm";

export default async function ScoreCorrectionPage({ searchParams }: { searchParams: Promise<{ game?: string; message?: string; saved?: string }> }) {
  const { supabase, userId } = await requireActiveMember();
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const isAdmin = roles?.some(({ role }) => role === "admin") ?? false;
  if (!isAdmin && !roles?.some(({ role }) => role === "moderator")) redirect("/account");
  const params = await searchParams;
  const game = params.game ? getGameById(params.game) : undefined;
  const { data: state } = game ? await supabase.from("game_state").select("status,away_score,home_score,period,clock,updated_at,outcome_revision,result_type,verified").eq("game_id", game.id).maybeSingle() : { data: null };
  const eligible = state?.verified && ["scheduled", "upcoming", "live", "final"].includes(state.status) && !["forfeit", "no_contest"].includes(state.result_type ?? "") && (state.status !== "final" || isAdmin);
  return <main className="min-h-screen bg-[#050505] px-4 py-8 text-white sm:px-8"><div className="mx-auto max-w-4xl">
    <Link href="/internal/score-review" className="text-sm text-white/60">← Score review</Link>
    <h1 className="mt-5 text-3xl font-black">Edit Score / Correct Score</h1>
    <p className="mt-2 text-sm text-white/50">Select a game from the score review page. Existing values are prefilled; each save records who changed them and why.</p>
    {params.message && <p role="alert" className="mt-5 rounded-xl border border-amber-300/30 p-4 text-amber-100">{params.message}</p>}
    {params.saved && <p role="status" className="mt-5 rounded-xl border border-emerald-300/30 p-4 text-emerald-100">Correction saved. Current game state and dependent views have been refreshed.</p>}
    {game && eligible && state ? <><h2 className="mt-6 text-xl font-bold">{game.awayTeam} at {game.homeTeam}</h2><ScoreCorrectionForm key={`${game.id}:${state.updated_at}`} gameId={game.id} awayName={game.awayTeam ?? "Away"} homeName={game.homeTeam ?? "Home"} state={state} isAdmin={isAdmin}/></> : <p className="mt-6 rounded-xl border border-white/15 p-4 text-sm text-white/60">No eligible verified game state selected. Exceptional outcomes use the canonical outcome editor; finalized results require administrator access.</p>}
  </div></main>;
}
