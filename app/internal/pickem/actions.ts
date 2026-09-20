"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDynamicGames } from "@/lib/dynamic-games";
import { requireActiveMember } from "@/lib/member-access";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function resultUrl(message: string) {
  return `/internal/pickem?message=${encodeURIComponent(message)}`;
}

async function requireModerator() {
  const { supabase, userId } = await requireActiveMember();
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (!roles?.some((row) => row.role === "moderator" || row.role === "admin")) {
    redirect("/account");
  }

  return { supabase, userId };
}

export async function savePickemWeek(formData: FormData) {
  const season = Number(value(formData, "season"));
  const weekNumber = Number(value(formData, "week"));
  const title = value(formData, "title") || `Week ${weekNumber} Pick ’Em`;
  const status = value(formData, "status") === "open" ? "open" : "draft";
  const requestedGameIds = Array.from(new Set(formData.getAll("game_id").map(String)));
  const { supabase, userId } = await requireModerator();

  if (!Number.isInteger(season) || !Number.isInteger(weekNumber) || weekNumber < 0) {
    redirect(resultUrl("Enter a valid season and week."));
  }

  const canonicalGames = (await getDynamicGames())
    .filter((game) => game.season === season && game.week === weekNumber)
    .filter((game) => game.gameType !== "bye" && game.gameType !== "scrimmage")
    .filter((game) => game.kickoff?.includes("T") && game.awaySchoolSlug && game.homeSchoolSlug);
  const canonicalById = new Map(canonicalGames.map((game) => [game.id, game]));
  const selectedGames = requestedGameIds.flatMap((gameId) => {
    const game = canonicalById.get(gameId);
    return game ? [game] : [];
  });

  if (selectedGames.length < 1 || selectedGames.length > 12) {
    redirect(resultUrl("Select between 1 and 12 canonical games."));
  }

  const lockTimes = selectedGames.map((game) => new Date(game.kickoff!).getTime());
  if (lockTimes.some((lockTime) => Number.isNaN(lockTime))) {
    redirect(resultUrl("Every selected game must have a valid kickoff time."));
  }

  const { data: existingWeek } = await supabase
    .from("pickem_weeks")
    .select("id, status, created_by")
    .eq("season", season)
    .eq("week", weekNumber)
    .maybeSingle();

  if (existingWeek?.status === "graded") {
    redirect(resultUrl("A graded slate cannot be changed."));
  }
  if (existingWeek && existingWeek.status !== "draft" && status === "draft") {
    redirect(resultUrl("An opened slate cannot be moved back to draft."));
  }

  const { data: savedWeek, error: weekError } = await supabase
    .from("pickem_weeks")
    .upsert({
      season,
      week: weekNumber,
      title,
      status,
      opens_at: status === "open" ? new Date().toISOString() : null,
      closes_at: new Date(Math.max(...lockTimes)).toISOString(),
      created_by: existingWeek?.created_by ?? userId,
    }, { onConflict: "season,week" })
    .select("id")
    .single();

  if (weekError || !savedWeek) {
    console.error("Pick Em week save failed.", { code: weekError?.code });
    redirect(resultUrl("The Pick ’Em week could not be saved."));
  }

  const { data: existingGames } = await supabase
    .from("pickem_games")
    .select("id, game_id")
    .eq("week_id", savedWeek.id);
  const selectedIdSet = new Set(selectedGames.map((game) => game.id));
  const removals = (existingGames ?? []).filter((game) => !selectedIdSet.has(game.game_id));

  if (removals.length > 0) {
    const removalIds = removals.map((game) => game.id);
    const { count } = await supabase
      .from("pickem_picks")
      .select("id", { count: "exact", head: true })
      .in("pickem_game_id", removalIds);
    if ((count ?? 0) > 0) {
      redirect(resultUrl("A game with member picks cannot be removed from the slate."));
    }
    const { error: deleteError } = await supabase
      .from("pickem_games")
      .delete()
      .in("id", removalIds);
    if (deleteError) redirect(resultUrl("A deselected game could not be removed."));
  }

  const { error: gamesError } = await supabase
    .from("pickem_games")
    .upsert(selectedGames.map((game, index) => ({
      week_id: savedWeek.id,
      game_id: game.id,
      sort_order: index + 1,
      lock_at: game.kickoff,
      away_school_slug: game.awaySchoolSlug,
      home_school_slug: game.homeSchoolSlug,
    })), { onConflict: "week_id,game_id" });

  if (gamesError) {
    console.error("Pick Em games save failed.", { code: gamesError.code });
    redirect(resultUrl("The slate games could not be saved."));
  }

  revalidatePath("/pickem");
  revalidatePath("/internal/pickem");
  redirect(resultUrl(`Week ${weekNumber} saved as ${status}.`));
}
