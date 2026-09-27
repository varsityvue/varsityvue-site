import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getArticles } from "@/lib/articles";
import { getGames } from "@/lib/games";
import { featureTypes, type HomepageFeature } from "@/lib/homepage-feature";
import { requireActiveMember } from "@/lib/member-access";
import { saveHomepageFeature } from "./actions";

export const metadata: Metadata = { title: "Homepage Feature | VarsityVue", robots: { index: false, follow: false } };

export default async function HomepageFeatureAdmin({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const { supabase, userId } = await requireActiveMember();
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (!roles?.some((row) => row.role === "admin")) redirect("/account");
  const [{ data, error }, params] = await Promise.all([
    supabase.from("homepage_editorial_features").select("*").order("season", { ascending: false }).order("week", { ascending: false }),
    searchParams,
  ]);
  const features = (data ?? []) as HomepageFeature[];
  const games = getGames().filter((game) => game.week !== undefined);
  const articles = getArticles();
  return <main className="min-h-screen bg-[#050505] px-4 py-8 text-white sm:px-6">
    <div className="mx-auto max-w-4xl">
      <p className="text-xs font-black uppercase tracking-widest text-[var(--vv-accent)]">Admin · Editorial</p>
      <h1 className="mt-2 text-3xl font-black">Homepage feature</h1>
      <p className="mt-2 text-sm leading-6 text-white/60">Save one feature per season and week. Only the active feature appears in the homepage hero. A game is needed only for the matchup treatment. This setting does not change Pick ’Em.</p>
      {params.message && <p role="status" className="mt-4 rounded-xl border border-white/20 p-3 text-sm">{params.message}</p>}
      {error && <p role="alert" className="mt-4 text-red-300">Feature configuration is unavailable. Do not submit until the database migration is applied.</p>}
      {!error && <><div className="mt-6 space-y-4">{features.map((feature) => <FeatureForm key={feature.id} feature={feature} games={games} articles={articles} />)}</div>
      <div className="mt-7"><h2 className="text-xl font-black">Add a weekly feature</h2><FeatureForm games={games} articles={articles} /></div></>}
    </div>
  </main>;
}

function FeatureForm({ feature, games, articles }: { feature?: HomepageFeature; games: ReturnType<typeof getGames>; articles: ReturnType<typeof getArticles> }) {
  const field = "mt-1 w-full min-w-0 rounded-lg border border-white/15 bg-[#151515] px-3 py-2 text-sm text-white";
  return <form action={saveHomepageFeature} className="mt-3 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:grid-cols-2 sm:p-6">
    {feature && <p className="sm:col-span-2 text-sm font-bold">{feature.season} · Week {feature.week} · {feature.active ? "LIVE" : "Inactive"}</p>}
    <label className="text-xs text-white/70">Season<input required name="season" type="number" min="2020" max="2100" defaultValue={feature?.season ?? 2026} className={field} /></label>
    <label className="text-xs text-white/70">Week<input required name="week" type="number" min="0" max="30" defaultValue={feature?.week ?? 6} className={field} /></label>
    <label className="text-xs text-white/70">Feature type<select name="feature_type" defaultValue={feature?.feature_type ?? "district_preview"} className={field}>{featureTypes.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}</select></label>
    <label className="text-xs text-white/70">Eyebrow<input required maxLength={70} name="eyebrow" defaultValue={feature?.eyebrow} className={field} /></label>
    <label className="text-xs text-white/70 sm:col-span-2">Headline<input required maxLength={160} name="headline" defaultValue={feature?.headline} className={field} /></label>
    <label className="text-xs text-white/70 sm:col-span-2">Short description<textarea required maxLength={500} name="description" rows={3} defaultValue={feature?.description} className={field} /></label>
    <label className="text-xs text-white/70">Image path (optional, e.g. /images/coverage/graphic.png)<input name="image_path" defaultValue={feature?.image_path ?? ""} className={field} /></label>
    <label className="text-xs text-white/70">CTA label<input required maxLength={70} name="cta_label" defaultValue={feature?.cta_label ?? "View Feature →"} className={field} /></label>
    <label className="text-xs text-white/70">Published article (optional)<select name="article_slug" defaultValue={feature?.article_slug ?? ""} className={field}><option value="">No article yet</option>{articles.map((article) => <option key={article.slug} value={article.slug}>{article.title}</option>)}</select></label>
    <label className="text-xs text-white/70">Local destination path (optional; use instead of article)<input name="destination_path" defaultValue={feature?.destination_path ?? ""} placeholder="/districts" className={field} /></label>
    <label className="text-xs text-white/70 sm:col-span-2">Associated game (required for Game of the Week)<select name="game_id" defaultValue={feature?.game_id ?? ""} className={field}><option value="">No game</option>{games.map((game) => <option key={game.id} value={game.id}>Week {game.week}: {game.awayTeam} at {game.homeTeam} ({game.id})</option>)}</select></label>
    <label className="flex items-center gap-2 text-sm text-white/80 sm:col-span-2"><input type="checkbox" name="active" defaultChecked={feature?.active ?? false} /> Show this feature on the homepage now</label>
    <button className="rounded-full bg-white px-5 py-3 text-xs font-black uppercase text-black sm:col-span-2">Save feature</button>
  </form>;
}
