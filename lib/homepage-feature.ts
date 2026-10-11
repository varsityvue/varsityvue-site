import { optionalRead } from "@/lib/public-read";
import { getArticleBySlug } from "@/lib/articles";
import { getGameById } from "@/lib/games";
import { createPublicReadClient } from "@/lib/supabase/server";

export const featureTypes = ["game_of_the_week", "district_preview", "district_predictions", "rivalry_week", "playoff_preview", "rankings", "general_feature"] as const;
export type FeatureType = (typeof featureTypes)[number];

export type HomepageFeature = {
  id: number;
  season: number;
  week: number;
  feature_type: FeatureType;
  eyebrow: string;
  headline: string;
  description: string;
  image_path: string | null;
  article_slug: string | null;
  destination_path: string | null;
  cta_label: string;
  game_id: string | null;
  active: boolean;
};

export function isSafeLocalPath(path: string) {
  return /^\/(?!\/)[A-Za-z0-9/_#?.=&%-]+$/.test(path);
}

export function featureDestination(feature: HomepageFeature) {
  if (feature.article_slug) {
    const article = getArticleBySlug(feature.article_slug);
    return article ? `/coverage/${article.slug}` : null;
  }
  if (feature.destination_path && isSafeLocalPath(feature.destination_path)) return feature.destination_path;
  if (feature.feature_type === "game_of_the_week" && feature.game_id && getGameById(feature.game_id)) return `/games/${feature.game_id}`;
  return null;
}

async function readActiveHomepageFeature(): Promise<HomepageFeature | null> {
  const supabase = await createPublicReadClient();
  const { data, error } = await supabase.from("homepage_editorial_features").select("*").eq("active", true).maybeSingle().retry(false);
  if (error) {
    console.error("Homepage editorial feature unavailable", error.code);
    return null;
  }
  return data as HomepageFeature | null;
}

export const getActiveHomepageFeature = () => optionalRead(readActiveHomepageFeature, null);
