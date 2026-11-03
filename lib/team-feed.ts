import { isTeamFeedEnabled } from "@/lib/team-feed-eligibility";
import { teamFeedSchoolFilter } from "@/lib/team-feed-visibility";
import { createClient } from "@/lib/supabase/server";

export type FeedPost = {
  id: string;
  primary_school_id: string;
  secondary_school_id: string | null;
  game_id: string | null;
  show_on_secondary_school?: boolean;
  source_type: "varsityvue" | "community";
  status: "draft" | "published" | "unpublished" | "pending" | "rejected";
  caption: string | null;
  published_at: string | null;
  team_feed_media: { id: string; public_path: string | null; alt_text: string; width: number; height: number }[];
};

export { isTeamFeedEnabled };

export async function getFeedPosts(schoolId: string, cursor?: { at: string; id: string }, limit = 8) {
  const supabase = await createClient(true);
  let query = supabase.from("team_feed_posts")
    .select("id,primary_school_id,secondary_school_id,game_id,show_on_secondary_school,source_type,status,caption,published_at,team_feed_media(id,public_path,alt_text,width,height)")
    .eq("status", "published").lte("published_at", new Date().toISOString())
    .or(teamFeedSchoolFilter(schoolId))
    .order("published_at", { ascending: false }).order("id", { ascending: false }).limit(limit + 1);
  if (cursor) query = query.or(`published_at.lt.${cursor.at},and(published_at.eq.${cursor.at},id.lt.${cursor.id})`);
  const { data, error } = await query.abortSignal(AbortSignal.timeout(3000)).retry(false);
  if (error) throw error;
  const rows = (data ?? []) as FeedPost[];
  return { posts: rows.slice(0, limit), hasMore: rows.length > limit };
}
