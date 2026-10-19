"use client";

import { useState } from "react";
import type { FeedPost } from "@/lib/team-feed";
import { isTeamHubV2Pilot } from "@/lib/team-hub-pilot";
import TeamFeedCard from "./TeamFeedCard";

export default function TeamFeedList({ initial, hasMore: firstHasMore, slug }: { initial: FeedPost[]; hasMore: boolean; slug: string }) {
  const [posts, setPosts] = useState(initial);
  const [hasMore, setHasMore] = useState(firstHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  async function loadMore() {
    const last = posts.at(-1);
    if (!last?.published_at || loading) return;
    setLoading(true); setError(false);
    try {
      const query = new URLSearchParams({ before: last.published_at, id: last.id });
      const response = await fetch(`/schools/${encodeURIComponent(slug)}/feed/more?${query}`);
      if (!response.ok) throw new Error("Could not load posts");
      const page = await response.json() as { posts: FeedPost[]; hasMore: boolean };
      setPosts(current => [...current, ...page.posts.filter(post => !current.some(previous => previous.id === post.id))]);
      setHasMore(page.hasMore);
    } catch { setError(true); } finally { setLoading(false); }
  }
  return <>{posts.length ? <div className="mt-6 min-w-0 space-y-6">{posts.map(post => <TeamFeedCard key={post.id} post={post} enhanced={isTeamHubV2Pilot(slug)} schoolSlug={slug} />)}</div> : <div className="mt-8 rounded-2xl border border-white/10 p-6"><h2 className="text-lg font-bold">Team Feed is just getting started.</h2><p className="mt-2 text-sm text-white/60">VarsityVue graphics and game-night media will appear here.</p></div>}
    {error && <p role="alert" className="mt-4 text-sm text-red-200">Could not load more posts. Please try again.</p>}
    {hasMore && <button type="button" disabled={loading} onClick={loadMore} className="mt-8 rounded-full border border-white/20 px-5 py-3 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:opacity-50">{loading ? "Loading…" : "Load more"}</button>}
  </>;
}
