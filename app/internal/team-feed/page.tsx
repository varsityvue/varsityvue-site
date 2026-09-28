import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getFeaturedSchools, getSchools } from "@/lib/schools";
import { getGames } from "@/lib/games";
import { requireActiveMember } from "@/lib/member-access";
import { saveTeamFeedPost } from "./actions";

export const metadata: Metadata = { title: "Team Feed Admin", robots: { index: false, follow: false } };

export default async function TeamFeedAdmin({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const { supabase, userId } = await requireActiveMember();
  const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!role) redirect("/account");
  const [{ data: posts, error }, params] = await Promise.all([
    supabase.from("team_feed_posts").select("id,primary_school_id,secondary_school_id,game_id,caption,status,published_at,team_feed_media(alt_text)").order("created_at", { ascending: false }).limit(100),
    searchParams,
  ]);
  const schools = getFeaturedSchools().sort((a, b) => a.name.localeCompare(b.name));
  const secondarySchools = getSchools().filter(school => school.districtId !== "opponent").sort((a, b) => a.name.localeCompare(b.name));
  const games = getGames().filter(game => game.gameType !== "bye" && game.gameType !== "scrimmage" && game.homeSchoolSlug && game.awaySchoolSlug).sort((a, b) => (b.kickoff ?? "").localeCompare(a.kickoff ?? ""));
  const input = "mt-1 w-full rounded-lg border border-white/20 bg-[#181818] px-3 py-2 text-sm text-white";
  return <main className="min-h-screen bg-[#050505] px-4 py-8 text-white sm:px-6"><div className="mx-auto max-w-4xl">
    <p className="text-xs font-bold uppercase tracking-widest text-[var(--vv-accent)]">Admin · Editorial</p><h1 className="mt-2 text-3xl font-black">Team Feed posts</h1>
    <p className="mt-2 text-sm text-white/60">Create an official post once for a featured school and an optional second school. Drafts are private.</p>
    {params.message && <p role="status" className="mt-4 rounded-lg border border-white/20 p-3 text-sm">{params.message}</p>}
    {error ? <p role="alert" className="mt-4 text-red-300">Team Feed is unavailable until its migration is applied.</p> : <div className="mt-6 space-y-5">
      <PostForm schools={schools} secondarySchools={secondarySchools} games={games} input={input} />
      {posts?.map(post => <PostForm key={post.id} post={post} schools={schools} secondarySchools={secondarySchools} games={games} input={input} />)}
    </div>}
  </div></main>;
}

type Post = { id: string; primary_school_id: string; secondary_school_id: string | null; game_id: string | null; caption: string | null; status: string; published_at: string | null; team_feed_media: { alt_text: string }[] };
function PostForm({ post, schools, secondarySchools, games, input }: { post?: Post; schools: ReturnType<typeof getFeaturedSchools>; secondarySchools: ReturnType<typeof getSchools>; games: ReturnType<typeof getGames>; input: string }) {
  return <form action={saveTeamFeedPost} className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:grid-cols-2 sm:p-6">
    <h2 className="text-lg font-bold sm:col-span-2">{post ? `${post.status.toUpperCase()} · ${post.id}` : "Create Team Feed post"}</h2>
    {post && <input type="hidden" name="id" value={post.id} />}
    <label className="text-sm">Primary school<select required name="primary_school_id" defaultValue={post?.primary_school_id ?? ""} className={input}><option value="">Choose school</option>{schools.map(school => <option key={school.id} value={school.id}>{school.name}</option>)}</select></label>
    <label className="text-sm">Second school (optional)<select name="secondary_school_id" defaultValue={post?.secondary_school_id ?? ""} className={input}><option value="">None</option>{secondarySchools.map(school => <option key={school.id} value={school.id}>{school.name}</option>)}</select></label>
    <label className="text-sm sm:col-span-2">Game (optional)<select name="game_id" defaultValue={post?.game_id ?? ""} className={input}><option value="">No game</option>{games.map(game => <option key={game.id} value={game.id}>Week {game.week ?? "—"} · {game.awayTeam} at {game.homeTeam}</option>)}</select></label>
    {!post && <label className="text-sm sm:col-span-2">Image (JPEG, PNG, WebP; up to 3 MB)<input required type="file" name="image" accept="image/jpeg,image/png,image/webp" className={input} /></label>}
    <label className="text-sm sm:col-span-2">Alt text<input required maxLength={300} name="alt_text" defaultValue={post?.team_feed_media?.[0]?.alt_text ?? ""} className={input} /></label>
    <label className="text-sm sm:col-span-2">Caption<textarea name="caption" maxLength={2000} rows={3} defaultValue={post?.caption ?? ""} className={input} /></label>
    <div className="flex flex-wrap gap-2 sm:col-span-2"><button name="intent" value="draft" className="rounded-full border border-white/25 px-4 py-2 text-sm font-bold">{post?.status === "published" || post?.status === "unpublished" ? "Save edits" : "Save draft"}</button><button name="intent" value="publish" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-black">{post?.status === "unpublished" ? "Republish" : "Publish"}</button>{(post?.status === "published" || post?.status === "unpublished") && <button name="intent" value="unpublish" className="rounded-full border border-red-300/40 px-4 py-2 text-sm font-bold text-red-200">{post.status === "published" ? "Unpublish" : "Retry unpublish"}</button>}</div>
  </form>;
}
