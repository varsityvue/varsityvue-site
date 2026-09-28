import Link from "next/link";
import { getSchoolById } from "@/lib/schools";
import { getGameById } from "@/lib/games";
import type { FeedPost } from "@/lib/team-feed";
import { getSupabaseConfig } from "@/lib/supabase/config";

export default function TeamFeedCard({ post }: { post: FeedPost }) {
  const school = getSchoolById(post.primary_school_id);
  const second = post.secondary_school_id ? getSchoolById(post.secondary_school_id) : null;
  const game = post.game_id ? getGameById(post.game_id) : undefined;
  const media = post.team_feed_media[0];
  if (!media?.public_path || !post.published_at) return null;
  const url = `${getSupabaseConfig().url}/storage/v1/object/public/team-feed-public/${media.public_path}`;
  return <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] text-white">
    <div className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm"><strong>{school?.name ?? "Team Feed"}{second ? ` · ${second.name}` : ""}</strong><span className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">{post.source_type === "varsityvue" ? "VarsityVue Official" : "Community"}</span></div>
    {/* A native image preserves the intrinsic aspect ratio and never crops a graphic. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={url} alt={media.alt_text} width={media.width} height={media.height} className="h-auto w-full bg-black object-contain" loading="lazy" />
    <div className="space-y-2 px-4 py-3">{post.caption && <p className="whitespace-pre-wrap text-sm leading-6">{post.caption}</p>}{game && <Link className="text-sm font-semibold text-[var(--vv-accent)] underline" href={`/games/${game.id}`}>{game.awayTeam} at {game.homeTeam} · Game Center</Link>}<time className="block text-xs text-white/50" dateTime={post.published_at}>{new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Chicago" }).format(new Date(post.published_at))} CT</time></div>
  </article>;
}
