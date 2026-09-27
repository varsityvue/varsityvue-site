"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getArticleBySlug } from "@/lib/articles";
import { getGameById } from "@/lib/games";
import { featureTypes, isSafeLocalPath } from "@/lib/homepage-feature";
import { requireActiveMember } from "@/lib/member-access";

const result = (message: string) => `/internal/homepage-feature?message=${encodeURIComponent(message)}`;
const value = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

export async function saveHomepageFeature(form: FormData) {
  const { supabase, userId } = await requireActiveMember();
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (!roles?.some((row) => row.role === "admin")) redirect("/account");

  const season = Number(value(form, "season"));
  const week = Number(value(form, "week"));
  const feature_type = value(form, "feature_type");
  const eyebrow = value(form, "eyebrow");
  const headline = value(form, "headline");
  const description = value(form, "description");
  const image_path = value(form, "image_path") || null;
  const article_slug = value(form, "article_slug") || null;
  const destination_path = value(form, "destination_path") || null;
  const cta_label = value(form, "cta_label");
  const game_id = value(form, "game_id") || null;
  const active = value(form, "active") === "on";
  if (!Number.isInteger(season) || season < 2020 || season > 2100 || !Number.isInteger(week) || week < 0 || week > 30 ||
      !featureTypes.includes(feature_type as (typeof featureTypes)[number]) || !eyebrow || eyebrow.length > 70 || !headline || headline.length > 160 ||
      !description || description.length > 500 || !cta_label || cta_label.length > 70 ||
      (image_path && !isSafeLocalPath(image_path)) ||
      (destination_path && !isSafeLocalPath(destination_path)) ||
      (article_slug && destination_path) || (article_slug && !getArticleBySlug(article_slug)) ||
      (game_id && !getGameById(game_id)) || (feature_type === "game_of_the_week" && !game_id)) {
    redirect(result("Check the feature fields, published article slug, and canonical game ID."));
  }

  const { data: existing, error: readError } = await supabase.from("homepage_editorial_features").select("id,active").eq("season", season).eq("week", week).maybeSingle();
  if (readError) redirect(result("Could not load this feature. No changes were made."));
  const fields = { season, week, feature_type, eyebrow, headline, description, image_path, article_slug, destination_path, cta_label, game_id, updated_at: new Date().toISOString() };
  const { error: saveError } = existing
    ? await supabase.from("homepage_editorial_features").update({ ...fields, active: active && existing.active }).eq("id", existing.id)
    : await supabase.from("homepage_editorial_features").insert({ ...fields, active: false });
  if (saveError) redirect(result("Save failed. The live feature was not changed."));

  if (active && !existing?.active) {
    const { error: deactivateError } = await supabase.from("homepage_editorial_features").update({ active: false }).eq("active", true);
    if (deactivateError) redirect(result("Saved as a draft; activation failed."));
    const { error: activateError } = await supabase.from("homepage_editorial_features").update({ active: true }).eq("season", season).eq("week", week);
    if (activateError) redirect(result("Saved as a draft; activation failed. Reactivate it from this page."));
  } else if (!active && existing?.active) {
    const { error } = await supabase.from("homepage_editorial_features").update({ active: false }).eq("id", existing.id);
    if (error) redirect(result("Feature saved, but deactivation failed."));
  }
  revalidatePath("/");
  revalidatePath("/internal/homepage-feature");
  redirect(result(active ? "Feature saved and activated." : "Feature saved as inactive."));
}
