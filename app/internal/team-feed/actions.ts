"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveMember } from "@/lib/member-access";
import { getSchoolById } from "@/lib/schools";
import { validateFeedRelationships } from "@/lib/team-feed-validation";
import { processTeamFeedImage } from "@/lib/team-feed-image";

const field = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const destination = (message: string) => `/internal/team-feed?message=${encodeURIComponent(message)}`;

async function adminClient() {
  const { supabase, userId } = await requireActiveMember();
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (error || !data) redirect("/account");
  return { supabase, userId };
}

function refresh(primary: string, secondary: string | null) {
  for (const id of [primary, secondary]) {
    if (!id) continue;
    const school = getSchoolById(id);
    if (school) { revalidatePath(`/schools/${school.slug}`); revalidatePath(`/schools/${school.slug}/feed`); }
  }
  revalidatePath("/internal/team-feed");
}

export async function saveTeamFeedPost(form: FormData) {
  const { supabase, userId } = await adminClient();
  const id = field(form, "id") || null;
  const primary = field(form, "primary_school_id");
  const secondary = field(form, "secondary_school_id") || null;
  const gameId = field(form, "game_id") || null;
  const caption = field(form, "caption") || null;
  const alt = field(form, "alt_text");
  const intent = field(form, "intent");
  if (!validateFeedRelationships(primary, secondary, gameId) || (caption?.length ?? 0) > 2000 || alt.length < 1 || alt.length > 300 || !["draft", "publish", "unpublish"].includes(intent)) redirect(destination("Check school, game, caption, and alt text."));
  const { data: existing } = id ? await supabase.from("team_feed_posts").select("id,status,primary_school_id,secondary_school_id,published_at").eq("id", id).maybeSingle() : { data: null };
  if (id && !existing) redirect(destination("Post not found."));
  const postId = existing?.id ?? randomUUID();
  const file = form.get("image");
  const isUpload = file instanceof File && file.size > 0;
  if (!existing && !isUpload) redirect(destination("Choose an image."));
  if (existing && isUpload) redirect(destination("Image replacement is not enabled; edit the post details or create a new post."));
  let processed: Awaited<ReturnType<typeof processTeamFeedImage>> | null = null;
  try { if (isUpload) processed = await processTeamFeedImage(file); } catch (error) { redirect(destination(error instanceof Error ? error.message : "Invalid image.")); }
  const { data: media } = existing ? await supabase.from("team_feed_media").select("id,public_path").eq("post_id", postId).single() : { data: null };
  const mediaId = media?.id ?? randomUUID();
  const objectPath = `${postId}/${mediaId}.webp`;
  if (processed) {
    const { error } = await supabase.storage.from("team-feed-private").upload(objectPath, processed.output, { contentType: "image/webp", upsert: false });
    if (error) redirect(destination("Private image upload failed."));
  }
  if (!existing) {
    const { error } = await supabase.from("team_feed_posts").insert({ id: postId, primary_school_id: primary, secondary_school_id: secondary, game_id: gameId, source_type: "varsityvue", caption, status: "draft", created_by: userId });
    if (error) { await supabase.storage.from("team-feed-private").remove([objectPath]); redirect(destination("Could not save post.")); }
    const { error: mediaError } = await supabase.from("team_feed_media").insert({ id: mediaId, post_id: postId, alt_text: alt, width: processed!.width, height: processed!.height, byte_size: processed!.output.length, mime_type: "image/webp" });
    if (mediaError) redirect(destination("Image record failed; draft needs administrator cleanup."));
  }
  const newPublication = intent === "publish" && existing?.status !== "published";
  if (newPublication) {
    const { data: original, error: downloadError } = await supabase.storage.from("team-feed-private").download(objectPath);
    if (downloadError || !original) redirect(destination("Could not read processed image; post remains unchanged."));
    const { error: uploadError } = await supabase.storage.from("team-feed-public").upload(objectPath, original, { contentType: "image/webp", upsert: true });
    if (uploadError) redirect(destination("Public image upload failed; post remains unchanged."));
  }
  const status = intent === "publish" ? "published" : intent === "unpublish" ? "unpublished" : existing?.status === "published" ? "published" : "draft";
  const publishedAt = intent === "publish" ? existing?.status === "published" ? existing.published_at : new Date().toISOString() : existing?.published_at ?? null;
  const { error: updateError } = await supabase.from("team_feed_posts").update({ primary_school_id: primary, secondary_school_id: secondary, game_id: gameId, caption, status, published_at: publishedAt }).eq("id", postId);
  if (updateError) {
    if (newPublication) await supabase.storage.from("team-feed-public").remove([objectPath]);
    redirect(destination("Could not update post; publication was cancelled."));
  }
  const { error: altError } = await supabase.from("team_feed_media").update({ alt_text: alt, public_path: status === "published" ? objectPath : null }).eq("id", mediaId);
  if (altError) {
    if (newPublication) {
      await supabase.from("team_feed_posts").update({ status: "unpublished" }).eq("id", postId);
      await supabase.storage.from("team-feed-public").remove([objectPath]);
    }
    redirect(destination(newPublication ? "Image record failed; publication was cancelled." : "Post saved, but image details need review."));
  }
  if (intent === "unpublish") {
    const { error: removalError } = await supabase.storage.from("team-feed-public").remove([objectPath]);
    if (removalError) redirect(destination("Post is hidden, but public image cleanup failed. Retry unpublish or contact an administrator."));
  }
  refresh(primary, secondary);
  if (existing) refresh(existing.primary_school_id, existing.secondary_school_id);
  redirect(destination(status === "published" ? "Post published." : status === "unpublished" ? "Post unpublished." : "Draft saved."));
}
