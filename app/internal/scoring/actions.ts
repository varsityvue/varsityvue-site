"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isScoreConflict } from "@/lib/score-conflict";
import { getGameById } from "@/lib/games";
import { requireActiveMember } from "@/lib/member-access";
import { normalizeLivePeriod } from "@/lib/live-period";

function value(form: FormData, key: string) { return String(form.get(key) ?? "").trim(); }

export async function submitOperationalScore(form: FormData) {
  const { supabase, userId } = await requireActiveMember();
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (!roles?.some(({ role }) => role === "admin" || role === "moderator")) redirect("/account");

  const gameId = value(form, "game_id");
  const game = getGameById(gameId);
  const week = Number(value(form, "week"));
  const base = `/internal/scoring?week=${Number.isSafeInteger(week) ? week : ""}&game=${encodeURIComponent(gameId)}`;
  const away = Number(value(form, "away_score"));
  const home = Number(value(form, "home_score"));
  const intent = value(form, "intent");
  const periodRaw = value(form, "period");
  const period = periodRaw ? normalizeLivePeriod(periodRaw) : null;
  const sourceNote = value(form, "source_note");
  const expected = value(form, "expected_updated_at");
  const revisionRaw = value(form, "expected_revision");
  const revision = revisionRaw === "" ? null : Number(revisionRaw);
  const absent = value(form, "expected_absent") === "true";
  if (!game || game.gameType === "bye" || game.gameType === "scrimmage" || !game.awaySchoolSlug || !game.homeSchoolSlug ||
      !["live", "final"].includes(intent) ||
      !Number.isSafeInteger(away) || !Number.isSafeInteger(home) || away < 0 || home < 0 || away > 150 || home > 150 ||
      (periodRaw && !period) || sourceNote.length > 1000 || (absent && (expected || revision !== null)) ||
      (!absent && (!expected || revision === null || !Number.isSafeInteger(revision) || revision < 0))) {
    redirect(`${base}&error=1`);
  }
  // The FINAL button is only rendered after the separate client-side review step.
  // The server also requires a distinct confirmation field, independent of the live action.
  if (intent === "final" && value(form, "confirm_final") !== "yes") redirect(`${base}&error=1`);
  const { error } = await supabase.rpc("submit_trusted_score_update", {
    p_game_id: gameId,
    p_home_score: home,
    p_away_score: away,
    p_game_status: intent,
    p_period: intent === "live" ? period : null,
    p_clock: intent === "live" ? value(form, "clock") : null,
    p_source_note: sourceNote || null,
    p_expected_state_updated_at: absent ? null : expected,
    p_expected_state_revision: absent ? null : revision,
    p_expected_state_absent: absent,
  }).retry(false);
  if (error) redirect(`${base}&${isScoreConflict(error) ? "stale" : "error"}=1`);
  for (const path of ["/", "/scores", "/scoreboard", "/games", `/games/${gameId}`, "/internal/scoring", "/internal/score-review", "/pickem", `/schools/${game.awaySchoolSlug}`, `/schools/${game.homeSchoolSlug}`]) {
    revalidatePath(path);
  }
  redirect(`${base}&saved=1`);
}
