"use server";

import { revalidatePath } from "next/cache";

import { trackConversion } from "@/lib/conversion-analytics";
import { requireActiveMember } from "@/lib/member-access";

export type PickemActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function savePickemSlate(
  _previousState: PickemActionState,
  formData: FormData,
): Promise<PickemActionState> {
  const weekId = String(formData.get("week_id") ?? "").trim();
  if (!weekId) return { status: "error", message: "Pick ’Em week is missing." };

  const { supabase, userId } = await requireActiveMember({
    loginPath: `/login?next=${encodeURIComponent("/pickem")}`,
  });

  const { data: week, error: weekError } = await supabase
    .from("pickem_weeks")
    .select("id, season, week, status")
    .eq("id", weekId)
    .maybeSingle();

  if (weekError || !week || week.status !== "open") {
    return { status: "error", message: "This Pick ’Em slate is not open." };
  }

  const { data: games, error: gamesError } = await supabase
    .from("pickem_games")
    .select("id, away_school_slug, home_school_slug, lock_at")
    .eq("week_id", week.id);

  if (gamesError || !games) {
    return { status: "error", message: "The slate could not be loaded. Try again." };
  }

  const now = Date.now();
  const rows = games.flatMap((game) => {
    const pickedSchoolSlug = String(formData.get(`pick_${game.id}`) ?? "").trim();
    const validTeams = [game.away_school_slug, game.home_school_slug];
    if (!pickedSchoolSlug || !validTeams.includes(pickedSchoolSlug)) return [];
    if (new Date(game.lock_at).getTime() <= now) return [];
    return [{
      pickem_game_id: game.id,
      user_id: userId,
      picked_school_slug: pickedSchoolSlug,
    }];
  });

  if (rows.length === 0) {
    return { status: "error", message: "Select at least one unlocked game." };
  }

  const { error } = await supabase
    .from("pickem_picks")
    .upsert(rows, { onConflict: "pickem_game_id,user_id" });

  if (error) {
    console.error("Pick Em slate save failed.", { code: error.code });
    return {
      status: "error",
      message: error.message.includes("locked")
        ? "A game locked while you were submitting. Review the slate and try again."
        : "Your picks were not saved. Review the slate and try again.",
    };
  }

  trackConversion("Pick Submitted", {
    season: week.season,
    week: week.week,
    picks: rows.length,
  });
  revalidatePath("/pickem");

  return {
    status: "success",
    message: `${rows.length} pick${rows.length === 1 ? "" : "s"} saved. You can change unlocked picks until kickoff.`,
  };
}
