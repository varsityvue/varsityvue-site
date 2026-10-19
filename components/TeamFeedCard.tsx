import Link from "next/link";
import ShareAction from "./ShareAction";
import { getSchoolById, getSchoolBySlug } from "@/lib/schools";
import { getGameById } from "@/lib/games";
import type { FeedPost } from "@/lib/team-feed";
import { getSupabaseConfig } from "@/lib/supabase/config";

export default function TeamFeedCard({ post, enhanced = false, schoolSlug }: { post: FeedPost; enhanced?: boolean; schoolSlug?: string }) {
  const school = getSchoolById(post.primary_school_id);
  const feedSchool = schoolSlug ? getSchoolBySlug(schoolSlug) : school;
  const second = post.secondary_school_id ? getSchoolById(post.secondary_school_id) : null;
  const game = post.game_id ? getGameById(post.game_id) : undefined;
  const media = post.team_feed_media[0];
  if (!media?.public_path || !post.published_at) return null;
  const url = `${getSupabaseConfig().url}/storage/v1/object/public/team-feed-public/${media.public_path}`;
  return <article id={`post-${post.id}`} className="min-w-0 scroll-mt-24 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] text-white">
    {enhanced ? <header className="flex min-w-0 items-start gap-3 border-b border-white/10 px-4 py-4 sm:px-6">
      <span aria-hidden="true" className="mt-1 h-10 w-1 shrink-0 rounded-full" style={{ backgroundColor: school?.colors.primary ?? "#8B1020" }} />
      <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
        <p className="text-base font-black">{school?.name ?? "Team Feed"}{second ? ` · ${second.name}` : ""}</p>
        <p className="mt-1 text-xs font-semibold text-white/75">{post.source_type === "varsityvue" ? "VarsityVue Official" : "Community"}</p>
        <time className="mt-1 block text-xs text-white/70" dateTime={post.published_at}>{new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Chicago" }).format(new Date(post.published_at))} CT</time>
      </div>
    </header> : <div className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm"><strong>{school?.name ?? "Team Feed"}{second ? ` · ${second.name}` : ""}</strong><span className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">{post.source_type === "varsityvue" ? "VarsityVue Official" : "Community"}</span></div>}
    {/* A native image preserves the intrinsic aspect ratio and never crops a graphic. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={url} alt={media.alt_text} width={media.width} height={media.height} className={enhanced ? "h-auto w-full bg-black object-contain" : "h-auto w-full bg-black object-contain"} loading="lazy" />
    <div className={enhanced ? "space-y-4 px-4 py-5 sm:px-6" : "space-y-2 px-4 py-3"}>
      {post.caption && <p className="whitespace-pre-wrap break-words text-sm leading-6 [overflow-wrap:anywhere]">{post.caption}</p>}
      {game && <Link className={enhanced ? "inline-flex min-h-11 items-center rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-bold [overflow-wrap:anywhere] hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white" : "text-sm font-semibold text-white/85 underline decoration-white/40 underline-offset-2 hover:text-white"} href={`/games/${game.id}`}>{game.awayTeam} at {game.homeTeam} · Game Center →</Link>}
      {enhanced && schoolSlug ? <div className="border-t border-white/10 pt-3"><ShareAction title={`${feedSchool?.name ?? "Football"} Team Feed | VarsityVue`} text={`See football graphics, photos and updates on the ${feedSchool?.name ?? "team"} feed.`} url={`https://varsityvue.com/schools/${encodeURIComponent(schoolSlug)}/feed`} label="Share team feed" compact /></div> : null}
      {!enhanced && <time className="block text-xs text-white/50" dateTime={post.published_at}>{new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Chicago" }).format(new Date(post.published_at))} CT</time>}
    </div>
  </article>;
}
