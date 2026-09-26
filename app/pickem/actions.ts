"use server";

import { revalidatePath } from "next/cache";

import { trackConversion } from "@/lib/conversion-analytics";
import { requireActiveMember } from "@/lib/member-access";
import { evaluatePickemSubmission } from "@/lib/pickem-lifecycle";
import { isPickemWeekClosed } from "@/lib/pickem-week-state";

export type PickemActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function savePickemDraft(
  _previousState: PickemActionState,
  formData: FormData,
): Promise<PickemActionState> {
  const weekId = String(formData.get("week_id") ?? "").trim();
  if (!weekId) return { status: "error", message: "Pick ’Em week is missing." };
  const { supabase } = await requireActiveMember({
    loginPath: `/login?next=${encodeURIComponent("/pickem")}`,
  });
  const { data: games, error: gameError } = await supabase.from("pickem_games")
    .select("id").eq("week_id", weekId);
  if (gameError || !games?.length) return { status: "error", message: "The slate could not be loaded." };
  const selections = Object.fromEntries(games.flatMap((game) => {
    const choice = formData.get(`pick_${game.id}`);
    return choice === null ? [] : [[game.id, String(choice)]];
  }));
  if (Object.keys(selections).length === 0) {
    return { status: "error", message: "Select at least one game to save a draft." };
  }
  const { data: savedCount, error } = await supabase.rpc("save_pickem_contest_draft", {
    p_week_id: weekId, p_selections: selections,
  });
  if (error) {
    console.error("Pick Em draft save failed.", { code: error.code });
    return { status: "error", message: "Your draft could not be saved. Check the entry deadline and try again." };
  }
  revalidatePath("/pickem");
  return { status: "success", message: `Draft saved — ${savedCount} picks. You are not entered. Complete the slate, prediction, and phone number before the first kickoff.` };
}

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
    .select("id, season, week, status, closes_at, tiebreaker_game_id")
    .eq("id", weekId)
    .maybeSingle();

  if (weekError || !week || isPickemWeekClosed(week)) {
    return { status: "error", message: "This Pick ’Em slate is not open." };
  }

  const { data: games, error: gamesError } = await supabase
    .from("pickem_games")
    .select("id, away_school_slug, home_school_slug, lock_at")
    .eq("week_id", week.id);

  if (gamesError || !games) {
    return { status: "error", message: "The slate could not be loaded. Try again." };
  }

  if (week.season > 2026 || (week.season === 2026 && week.week >= 6)) {
    const rawPrediction = String(formData.get("predicted_total") ?? "").trim();
    const predictedTotal = Number(rawPrediction);
    if (!/^\d{1,3}$/.test(rawPrediction) || predictedTotal > 300) {
      return { status: "error", message: "Enter the Game of the Week combined-points prediction (0–300)." };
    }
    const selections = Object.fromEntries(games.flatMap((game) => {
      const choice = formData.get(`pick_${game.id}`);
      return choice === null ? [] : [[game.id, String(choice)]];
    }));
    const phone = String(formData.get("mobile_phone") ?? "").trim();
    const { data: completedAt, error } = await supabase.rpc("submit_pickem_contest_entry", {
      p_week_id: week.id,
      p_phone: phone || null,
      p_predicted_total: predictedTotal,
      p_selections: selections,
    });
    if (error) {
      const detail = error.message.toLowerCase();
      const message = detail.includes("already used") ? "This number is already used for another entrant."
        : detail.includes("phone") || detail.includes("mobile") ? "Enter a valid U.S. mobile number."
        : detail.includes("first kickoff") ? "New entries closed when the first game kicked off."
        : detail.includes("locked") ? "A game or prediction locked while saving. Refresh and try again."
        : detail.includes("every game") ? "Select every game before entering."
        : "Your entry could not be saved. Refresh and review the slate.";
      console.error("Pick Em contest entry failed.", { code: error.code });
      return { status: "error", message };
    }
    trackConversion("Pick Slate Saved", { season: week.season, week: week.week, complete: true });
    revalidatePath("/pickem");
    return {
      status: "success",
      message: `Contest entry saved. Your original entry time is ${new Date(completedAt).toLocaleString("en-US", { timeZone: "America/Chicago", timeZoneName: "short" })}. You can edit unlocked picks without losing that time.`,
    };
  }

  const { data: existingPicks } = await supabase
    .from("pickem_picks")
    .select("pickem_game_id")
    .eq("user_id", userId)
    .in("pickem_game_id", games.map((game) => game.id));
  const existingGameIds = new Set((existingPicks ?? []).map((pick) => pick.pickem_game_id));

  const selections = new Map(games.map((game) => [
    game.id,
    String(formData.get(`pick_${game.id}`) ?? ""),
  ]));
  const { rows, lockedGameIds, invalidGameIds } = evaluatePickemSubmission({
    games: games.map((game) => ({
      id: game.id,
      awaySchoolSlug: game.away_school_slug,
      homeSchoolSlug: game.home_school_slug,
      lockAt: game.lock_at,
    })),
    selections,
    userId,
    nowMs: Date.now(),
  });

  if (invalidGameIds.length > 0) {
    return { status: "error", message: "A submitted pick does not belong to its matchup. Refresh and try again." };
  }

  // Reject the complete stale request so the client never labels a skipped,
  // newly locked choice as saved while accepting other rows from the same form.
  if (lockedGameIds.length > 0) {
    return {
      status: "error",
      message: `${lockedGameIds.length === 1 ? "A game locked" : `${lockedGameIds.length} games locked`} while you were submitting. Refresh the slate and save your remaining unlocked picks again.`,
    };
  }

  if (rows.length === 0 && !week.tiebreaker_game_id) {
    return { status: "error", message: "Select at least one unlocked game." };
  }
  if (week.tiebreaker_game_id) {
    const rawPrediction = String(formData.get("predicted_total") ?? "").trim();
    const prediction = Number(rawPrediction);
    if (!/^\d{1,3}$/.test(rawPrediction) || !Number.isInteger(prediction) || prediction > 300) {
      return { status: "error", message: "Enter your Game of the Week combined-points prediction (0–300)." };
    }
    const { error: predictionError } = await supabase.from("pickem_week_tiebreakers")
      .upsert({ week_id: week.id, user_id: userId, predicted_total: prediction }, { onConflict: "week_id,user_id" });
    if (predictionError) return { status: "error", message: "Your tiebreaker prediction could not be saved. Refresh and try again." };
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
  const savedGameIds = new Set([...existingGameIds, ...rows.map((row) => row.pickem_game_id)]);
  const complete = savedGameIds.size === games.length;
  trackConversion("Pick Slate Saved", {
    season: week.season,
    week: week.week,
    selected: savedGameIds.size,
    games: games.length,
    complete,
  });
  if (existingGameIds.size === 0) {
    trackConversion("First Pick Completed", {
      season: week.season,
      week: week.week,
      complete,
    });
  }
  revalidatePath("/pickem");

  return {
    status: "success",
    message: complete
      ? `Complete slate saved — ${savedGameIds.size} of ${games.length} picks. You can change unlocked picks until kickoff.`
      : `${savedGameIds.size} of ${games.length} picks saved. You can return and finish the slate before kickoff.`,
  };
}
