"use server";

import { isBusinessConflict } from "@/lib/business-conflict";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getGameById } from "@/lib/games";
import { requireActiveMember } from "@/lib/member-access";
import { parseScoreInput } from "@/lib/score-input";

export async function correctScore(formData: FormData) {
  const { supabase, userId } = await requireActiveMember();
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const isAdmin = roles?.some(({ role }) => role === "admin") ?? false;
  const isModerator = roles?.some(({ role }) => role === "moderator") ?? false;
  if (!isAdmin && !isModerator) redirect("/account");

  const value = (key: string) => String(formData.get(key) ?? "").trim();
  const gameId = value("game_id");
  const status = value("status");
  const away = parseScoreInput(formData.get("away_score"));
  const home = parseScoreInput(formData.get("home_score"));
  const revision = Number(value("expected_outcome_revision"));
  const reason = value("reason");
  const priorFinal = value("prior_final") === "true";
  const path = `/internal/score-review/correct?game=${encodeURIComponent(gameId)}`;
  if (!getGameById(gameId) || !["upcoming", "live", "final"].includes(status) ||
      away === null || home === null ||
      !Number.isSafeInteger(revision) || revision < 0 || !reason || reason.length > 500 ||
      !value("expected_updated_at") || (priorFinal && !isAdmin) || (status === "final" && !isAdmin) ||
      value("confirmed") !== "yes") {
    redirect(`${path}&message=${encodeURIComponent("Check the score and explicitly confirm the correction.")}`);
  }
  const { error } = await supabase.rpc("correct_game_score", {
    p_game_id: gameId,
    p_expected_updated_at: value("expected_updated_at"),
    p_expected_outcome_revision: revision,
    p_status: status,
    p_away_score: away,
    p_home_score: home,
    p_period: value("period"),
    p_clock: value("clock"),
    p_reason: reason,
  }).retry(false);
  if (error) {
    const message = isBusinessConflict(error) ? "The game changed after you opened the editor. Refresh and review the current score." : error.message;
    redirect(`${path}&message=${encodeURIComponent(message)}`);
  }
  const game = getGameById(gameId);
  for (const route of ["/", "/scores", "/scoreboard", "/games", `/games/${gameId}`, "/pickem", "/internal/score-review", "/internal/scoring", "/playoffs", "/admin/playoff-publishing", `/schools/${game?.awaySchoolSlug}`, `/schools/${game?.homeSchoolSlug}`, `/schools/${game?.awaySchoolSlug}/schedule`, `/schools/${game?.homeSchoolSlug}/schedule`]) {
    if (!route.includes("undefined")) revalidatePath(route);
  }
  redirect(`${path}&saved=1`);
}
