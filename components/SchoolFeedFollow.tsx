import type { School } from "@/types/platform";
import { createPublicReadClient, readPublicClaims } from "@/lib/supabase/server";
import SchoolFollowControl from "./SchoolFollowControl";

// Reuse the hub's session and follow actions; no new permissions or write path.
export default async function SchoolFeedFollow({ school }: { school: School }) {
  const { data, error } = await readPublicClaims();
  const userId = data?.claims?.sub;
  let following = false;
  let unavailable = Boolean(error);
  if (userId && !unavailable) {
    const client = await createPublicReadClient();
    const result = await client.from("school_follows").select("school_slug")
      .eq("user_id", userId).eq("school_slug", school.slug).maybeSingle().retry(false);
    following = Boolean(result.data);
    unavailable = Boolean(result.error);
  }
  return <SchoolFollowControl schoolName={school.name} schoolSlug={school.slug} isAuthenticated={Boolean(userId)} isFollowing={following} unavailable={unavailable} />;
}
