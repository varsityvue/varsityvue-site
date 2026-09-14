"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSchoolBySlug } from "@/lib/schools";
import { createClient } from "@/lib/supabase/server";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function requireRosterAccess(schoolSlug: string) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) redirect(`/login?next=${encodeURIComponent(`/manage-roster?school=${schoolSlug}`)}`);

  const [{ data: roles }, { data: assignment }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", userId),
    supabase
      .from("contributor_school_assignments")
      .select("assignment_role, active")
      .eq("user_id", userId)
      .eq("school_slug", schoolSlug)
      .eq("assignment_role", "coach")
      .eq("active", true)
      .maybeSingle(),
  ]);

  const isAdmin = roles?.some((row) => row.role === "admin") ?? false;
  if (!isAdmin && !assignment) redirect("/account");

  return { supabase, userId };
}

export async function addRosterPlayer(formData: FormData) {
  const schoolSlug = text(formData, "school_slug");
  const firstName = text(formData, "first_name");
  const lastName = text(formData, "last_name");
  const jerseyRaw = text(formData, "jersey_number");
  const position = text(formData, "position");
  const grade = text(formData, "grade");

  if (!schoolSlug || !getSchoolBySlug(schoolSlug)) redirect("/manage-roster?message=Choose%20a%20valid%20school.");
  if (!firstName || !lastName) redirect(`/manage-roster?school=${encodeURIComponent(schoolSlug)}&message=First%20and%20last%20name%20are%20required.`);

  const jerseyNumber = jerseyRaw === "" ? null : Number(jerseyRaw);
  if (jerseyNumber !== null && (!Number.isInteger(jerseyNumber) || jerseyNumber < 0 || jerseyNumber > 99)) {
    redirect(`/manage-roster?school=${encodeURIComponent(schoolSlug)}&message=Jersey%20number%20must%20be%200-99.`);
  }
  if (grade && !["Fr", "So", "Jr", "Sr"].includes(grade)) {
    redirect(`/manage-roster?school=${encodeURIComponent(schoolSlug)}&message=Choose%20a%20valid%20grade.`);
  }

  const { supabase, userId } = await requireRosterAccess(schoolSlug);
  const { error } = await supabase.from("school_roster_players").insert({
    school_slug: schoolSlug,
    season: 2026,
    first_name: firstName,
    last_name: lastName,
    jersey_number: jerseyNumber,
    position: position || null,
    grade: grade || null,
    created_by: userId,
  });

  if (error) {
    const message = error.code === "23505" ? "That jersey number is already assigned on this roster." : error.message;
    redirect(`/manage-roster?school=${encodeURIComponent(schoolSlug)}&message=${encodeURIComponent(message)}`);
  }

  revalidatePath("/manage-roster");
  revalidatePath(`/schools/${schoolSlug}`);
  redirect(`/manage-roster?school=${encodeURIComponent(schoolSlug)}&updated=player-added`);
}

export async function removeRosterPlayer(formData: FormData) {
  const schoolSlug = text(formData, "school_slug");
  const playerId = text(formData, "player_id");
  if (!schoolSlug || !playerId) redirect("/manage-roster?message=Missing%20roster%20player.");

  const { supabase } = await requireRosterAccess(schoolSlug);
  const { error } = await supabase
    .from("school_roster_players")
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq("id", playerId)
    .eq("school_slug", schoolSlug);

  if (error) redirect(`/manage-roster?school=${encodeURIComponent(schoolSlug)}&message=${encodeURIComponent(error.message)}`);

  revalidatePath("/manage-roster");
  revalidatePath(`/schools/${schoolSlug}`);
  redirect(`/manage-roster?school=${encodeURIComponent(schoolSlug)}&updated=player-removed`);
}
