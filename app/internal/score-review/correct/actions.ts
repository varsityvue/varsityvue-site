"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getGameById } from "@/lib/games";
import { requireActiveMember } from "@/lib/member-access";

export async function correctScore(formData: FormData) {
  const { supabase, userId } = await requireActiveMember();
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const isAdmin = roles?.some(({ role }) => role === "admin") ?? false;
  const isModerator = roles?.some(({ role }) => role === "moderator") ?? false;
  if (!isAdmin && !isModerator) redirect("/account");

  const value = (key: string) => String(formData.get(key) ?? "").trim();
  const gameId = value("game_id");
  const status = value("status");
  const away = Number(value("away_score"));
  const home = Number(value("home_score"));
  const revision = Number(value("expected_outcome_revision"));
  const reason = value("reason");
  const priorFinal = value("prior_final") === "true";
  const path = `/internal/score-review/correct?game=${encodeURIComponent(gameId)}`;
  if (!getGameById(gameId) || !["upcoming", "live", "final"].includes(status) ||
      !Number.isSafeInteger(away) || !Number.isSafeInteger(home) || away < 0 || home < 0 || away > 150 || home > 150 ||
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
  });
  if (error) {
    const message = error.code === "40001" ? "The game changed after you opened the editor. Refresh and review the current score." : error.message;
    redirect(`${path}&message=${encodeURIComponent(message)}`);
  }
  const game = getGameById(gameId);
  for (const route of ["/", "/scores", "/scoreboard", "/games", `/games/${gameId}`, "/pickem", "/internal/score-review", `/schools/${game?.awaySchoolSlug}`, `/schools/${game?.homeSchoolSlug}`]) {
    if (!route.includes("undefined")) revalidatePath(route);
  }
  redirect(`${path}&saved=1`);
}
