"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { playerProfiles } from "@/data/player-profiles";
import { getSchoolBySlug } from "@/lib/schools";
import { createClient } from "@/lib/supabase/server";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function rosterRedirect(schoolSlug: string, message: string): never {
  redirect(`/manage-roster?school=${encodeURIComponent(schoolSlug)}&message=${encodeURIComponent(message)}`);
}

function rosterFields(formData: FormData) {
  const firstName = text(formData, "first_name");
  const lastName = text(formData, "last_name");
  const jerseyRaw = text(formData, "jersey_number");
  const position = text(formData, "position");
  const grade = text(formData, "grade");
  const playerProfileId = text(formData, "player_profile_id") || null;
  const jerseyNumber = jerseyRaw === "" ? null : Number(jerseyRaw);

  return { firstName, lastName, jerseyNumber, position, grade, playerProfileId };
}

function verifiedProfileForFields(schoolSlug: string, fields: ReturnType<typeof rosterFields>) {
  if (fields.playerProfileId) {
    return playerProfiles.find(
      (player) => player.playerId === fields.playerProfileId && player.season === 2026 && player.schoolSlug === schoolSlug,
    );
  }

  const fullName = `${fields.firstName} ${fields.lastName}`.trim().toLowerCase();
  return playerProfiles.find((player) => {
    if (player.season !== 2026 || player.schoolSlug !== schoolSlug || player.name.trim().toLowerCase() !== fullName) return false;
    if (fields.jerseyNumber === null || player.jerseyNumber === undefined) return true;
    return Number(player.jerseyNumber) === fields.jerseyNumber;
  });
}

function verifiedName(name: string) {
  const parts = name.trim().split(/\s+/);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

function validateRosterFields(schoolSlug: string, fields: ReturnType<typeof rosterFields>) {
  if (!fields.firstName || !fields.lastName) rosterRedirect(schoolSlug, "First and last name are required.");
  if (fields.jerseyNumber !== null && (!Number.isInteger(fields.jerseyNumber) || fields.jerseyNumber < 0 || fields.jerseyNumber > 99)) {
    rosterRedirect(schoolSlug, "Jersey number must be 0-99.");
  }
  if (fields.grade && !["Fr", "So", "Jr", "Sr"].includes(fields.grade)) rosterRedirect(schoolSlug, "Choose a valid grade.");
  if (fields.playerProfileId) {
    const verifiedProfile = verifiedProfileForFields(schoolSlug, fields);
    if (!verifiedProfile) rosterRedirect(schoolSlug, "Choose a valid verified player profile for this school.");

    const submittedName = `${fields.firstName} ${fields.lastName}`.trim().toLowerCase();
    if (verifiedProfile.name.trim().toLowerCase() !== submittedName) {
      rosterRedirect(schoolSlug, "Verified player names cannot be changed from roster management.");
    }
  }
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
  if (!schoolSlug || !getSchoolBySlug(schoolSlug)) redirect("/manage-roster?message=Choose%20a%20valid%20school.");

  const fields = rosterFields(formData);
  const verifiedProfile = fields.playerProfileId ? verifiedProfileForFields(schoolSlug, fields) : undefined;
  if (fields.playerProfileId && !verifiedProfile) rosterRedirect(schoolSlug, "Choose a valid verified player profile for this school.");
  if (verifiedProfile) {
    const name = verifiedName(verifiedProfile.name);
    fields.firstName = name.firstName;
    fields.lastName = name.lastName;
  }
  validateRosterFields(schoolSlug, fields);
  const matchedProfile = verifiedProfile ?? verifiedProfileForFields(schoolSlug, fields);
  const playerProfileId = matchedProfile?.playerId ?? null;

  const { supabase, userId } = await requireRosterAccess(schoolSlug);

  if (playerProfileId) {
    const { data: linkedProfile } = await supabase
      .from("school_roster_players")
      .select("id")
      .eq("school_slug", schoolSlug)
      .eq("season", 2026)
      .eq("active", true)
      .eq("player_profile_id", playerProfileId)
      .limit(1)
      .maybeSingle();
    if (linkedProfile) rosterRedirect(schoolSlug, "That verified player is already linked to this roster.");
  }

  const { data: duplicate } = await supabase
    .from("school_roster_players")
    .select("id")
    .eq("school_slug", schoolSlug)
    .eq("season", 2026)
    .eq("active", true)
    .ilike("first_name", fields.firstName)
    .ilike("last_name", fields.lastName)
    .limit(1)
    .maybeSingle();

  if (duplicate) rosterRedirect(schoolSlug, `${fields.firstName} ${fields.lastName} is already on this roster.`);

  const { error } = await supabase.from("school_roster_players").insert({
    school_slug: schoolSlug,
    season: 2026,
    first_name: fields.firstName,
    last_name: fields.lastName,
    jersey_number: fields.jerseyNumber,
    position: fields.position || null,
    grade: fields.grade || null,
    player_profile_id: playerProfileId,
    created_by: userId,
  });

  if (error) {
    const message = error.code === "23505" ? "That jersey number is already assigned on this roster." : error.message;
    rosterRedirect(schoolSlug, message);
  }

  revalidatePath("/manage-roster");
  revalidatePath(`/schools/${schoolSlug}`);
  revalidatePath(`/schools/${schoolSlug}/roster`);
  redirect(`/manage-roster?school=${encodeURIComponent(schoolSlug)}&updated=player-added`);
}

export async function updateRosterPlayer(formData: FormData) {
  const schoolSlug = text(formData, "school_slug");
  const playerId = text(formData, "player_id");
  if (!schoolSlug || !getSchoolBySlug(schoolSlug) || !playerId) redirect("/manage-roster?message=Missing%20roster%20player.");

  const fields = rosterFields(formData);
  const { supabase } = await requireRosterAccess(schoolSlug);
  const { data: existingPlayer } = await supabase
    .from("school_roster_players")
    .select("first_name, last_name, player_profile_id")
    .eq("id", playerId)
    .eq("school_slug", schoolSlug)
    .eq("season", 2026)
    .eq("active", true)
    .maybeSingle();

  if (!existingPlayer) rosterRedirect(schoolSlug, "That roster player is no longer available.");
  fields.playerProfileId = existingPlayer.player_profile_id;
  if (existingPlayer.player_profile_id) {
    fields.firstName = existingPlayer.first_name;
    fields.lastName = existingPlayer.last_name;
  }
  validateRosterFields(schoolSlug, fields);

  const { data: duplicate } = await supabase
    .from("school_roster_players")
    .select("id")
    .eq("school_slug", schoolSlug)
    .eq("season", 2026)
    .eq("active", true)
    .ilike("first_name", fields.firstName)
    .ilike("last_name", fields.lastName)
    .neq("id", playerId)
    .limit(1)
    .maybeSingle();

  if (duplicate) rosterRedirect(schoolSlug, `${fields.firstName} ${fields.lastName} is already on this roster.`);

  const { error } = await supabase
    .from("school_roster_players")
    .update({
      first_name: fields.firstName,
      last_name: fields.lastName,
      jersey_number: fields.jerseyNumber,
      position: fields.position || null,
      grade: fields.grade || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", playerId)
    .eq("school_slug", schoolSlug)
    .eq("season", 2026)
    .eq("active", true);

  if (error) {
    const message = error.code === "23505" ? "That jersey number is already assigned on this roster." : error.message;
    rosterRedirect(schoolSlug, message);
  }

  revalidatePath("/manage-roster");
  revalidatePath(`/schools/${schoolSlug}`);
  revalidatePath(`/schools/${schoolSlug}/roster`);
  redirect(`/manage-roster?school=${encodeURIComponent(schoolSlug)}&updated=player-edited`);
}

export async function removeRosterPlayer(formData: FormData) {
  const schoolSlug = text(formData, "school_slug");
  const playerId = text(formData, "player_id");
  if (!schoolSlug || !getSchoolBySlug(schoolSlug) || !playerId) redirect("/manage-roster?message=Missing%20roster%20player.");

  const { supabase } = await requireRosterAccess(schoolSlug);
  const { error } = await supabase
    .from("school_roster_players")
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq("id", playerId)
    .eq("school_slug", schoolSlug)
    .eq("season", 2026)
    .eq("active", true);

  if (error) rosterRedirect(schoolSlug, error.message);

  revalidatePath("/manage-roster");
  revalidatePath(`/schools/${schoolSlug}`);
  revalidatePath(`/schools/${schoolSlug}/roster`);
  redirect(`/manage-roster?school=${encodeURIComponent(schoolSlug)}&updated=player-removed`);
}
