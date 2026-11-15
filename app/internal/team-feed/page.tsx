import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getFeaturedSchools, getSchools } from "@/lib/schools";
import { getGames } from "@/lib/games";
import { requireActiveMember } from "@/lib/member-access";
import TeamFeedPostForm from "@/components/TeamFeedPostForm";
import { saveTeamFeedPost } from "./actions";

export const metadata: Metadata = { title: "Team Feed Admin", robots: { index: false, follow: false } };

export default async function TeamFeedAdmin({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const { supabase, userId } = await requireActiveMember();
  const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!role) redirect("/account");
  const [{ data: posts, error }, params] = await Promise.all([
    supabase.from("team_feed_posts").select("id,primary_school_id,secondary_school_id,game_id,show_on_secondary_school,caption,status,published_at,team_feed_media(alt_text)").order("created_at", { ascending: false }).limit(100),
    searchParams,
  ]);
  const schools = getFeaturedSchools().sort((a, b) => a.name.localeCompare(b.name));
  const secondarySchools = getSchools().filter(school => school.districtId !== "opponent").sort((a, b) => a.name.localeCompare(b.name));
  const games = getGames().filter(game => game.gameType !== "bye" && game.gameType !== "scrimmage" && game.homeSchoolSlug && game.awaySchoolSlug).sort((a, b) => (b.kickoff ?? "").localeCompare(a.kickoff ?? ""));
  const input = "mt-1 min-w-0 w-full max-w-full rounded-lg border border-white/20 bg-[#181818] px-3 py-2 text-sm text-white";
  return <main className="min-h-screen bg-[#050505] px-4 py-8 text-white sm:px-6"><div className="mx-auto max-w-4xl">
    <p className="text-xs font-bold uppercase tracking-widest text-[var(--vv-accent)]">Admin · Editorial</p><h1 className="mt-2 text-3xl font-black">Team Feed posts</h1>
    <p className="mt-2 text-sm text-white/60">Create an official post for a featured school. Related schools and games describe the post; feed visibility controls where it appears. Drafts are private.</p>
    {params.message && <p role="status" className="mt-4 rounded-lg border border-white/20 p-3 text-sm">{params.message}</p>}
    {error ? <p role="alert" className="mt-4 text-red-300">Team Feed is unavailable until its migration is applied.</p> : <div className="mt-6 space-y-5">
      <TeamFeedPostForm saveAction={saveTeamFeedPost} schools={schools} secondarySchools={secondarySchools} games={games} input={input} />
      {posts?.map(post => <TeamFeedPostForm saveAction={saveTeamFeedPost} key={post.id} post={post} schools={schools} secondarySchools={secondarySchools} games={games} input={input} />)}
    </div>}
  </div></main>;
}
