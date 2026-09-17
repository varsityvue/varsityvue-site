"use server";

import { redirect } from "next/navigation";

import { hasCompleteScoreboardTeamIdentity } from "@/data/scoreboard-team-identities";
import { getDynamicGameById } from "@/lib/dynamic-games";
import { requireActiveMember } from "@/lib/member-access";
import { getSchoolBySlug } from "@/lib/schools";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function score(formData: FormData, key: string) {
  const value = Number(text(formData, key));
  return Number.isInteger(value) && value >= 0 && value <= 150 ? value : null;
}

function schoolHasCompleteIdentity(slug?: string) {
  if (!slug) return false;
  const school = getSchoolBySlug(slug);
  return Boolean(
    school?.abbreviation?.trim() &&
    school?.mascot?.trim() &&
    school?.colors?.primary?.trim() &&
    school?.colors?.secondary?.trim(),
  );
}

function teamHasCompleteIdentity(slug: string | undefined, team: string | undefined) {
  if (schoolHasCompleteIdentity(slug)) return true;
  return team ? hasCompleteScoreboardTeamIdentity(team) : false;
}

function reportRedirect(gameId: string, message: string): never {
  const params = new URLSearchParams({ message });
  if (gameId) params.set("game", gameId);
  redirect(`/report-score?${params.toString()}`);
}

export async function submitScore(formData: FormData) {
  const { supabase, userId } = await requireActiveMember({
    loginPath: "/login?message=Sign%20in%20to%20submit%20a%20score.",
  });

  const gameId = text(formData, "game_id");
  const game = await getDynamicGameById(gameId);
  const homeScore = score(formData, "home_score");
  const awayScore = score(formData, "away_score");
  const gameStatus = text(formData, "game_status");
  const sourceNote = text(formData, "source_note") || null;

  if (!game || game.gameType === "bye" || game.gameType === "scrimmage") {
    reportRedirect(gameId, "Choose a valid game.");
  }

  if (game.status === "final") {
    reportRedirect(gameId, "This game is already final and is no longer open for score reports.");
  }

  if (game.status !== "live" && game.status !== "scheduled") {
    reportRedirect(
      gameId,
      game.status === "upcoming"
        ? "Score reporting opens when this game is live or awaiting a result."
        : "This game is not currently open for score reports.",
    );
  }

  const awayReady = teamHasCompleteIdentity(game.awaySchoolSlug, game.awayTeam);
  const homeReady = teamHasCompleteIdentity(game.homeSchoolSlug, game.homeTeam);
  if (!awayReady || !homeReady) {
    reportRedirect(gameId, "This game is not available for reporting until both teams have complete identity data.");
  }

  const [{ data: roles }, { data: assignments }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", userId),
    supabase
      .from("contributor_school_assignments")
      .select("school_slug")
      .eq("user_id", userId)
      .eq("active", true),
  ]);

  const roleSet = new Set((roles ?? []).map((row) => row.role));
  const canModerate = roleSet.has("moderator") || roleSet.has("admin");
  const isRestrictedScorekeeper = roleSet.has("scorekeeper") && !canModerate;

  if (isRestrictedScorekeeper) {
    const assignedSchoolSlugs = new Set((assignments ?? []).map((assignment) => assignment.school_slug));
    const hasAssignedTeam = Boolean(
      (game.awaySchoolSlug && assignedSchoolSlugs.has(game.awaySchoolSlug)) ||
      (game.homeSchoolSlug && assignedSchoolSlugs.has(game.homeSchoolSlug)),
    );

    if (!hasAssignedTeam) {
      reportRedirect(gameId, "Your contributor account is not assigned to either team in this game.");
    }
  }

  if (homeScore === null || awayScore === null) {
    reportRedirect(gameId, "Enter valid scores for both teams.");
  }

  if (!["live", "final"].includes(gameStatus)) {
    reportRedirect(gameId, "Choose Live or Final for the game status.");
  }

  const period = gameStatus === "live" ? (text(formData, "period") || null) : null;
  const clock = gameStatus === "live" ? (text(formData, "clock") || null) : null;

  const { data: pendingReports } = await supabase
    .from("score_submissions")
    .select("home_score, away_score, game_status, period, clock")
    .eq("submitted_by", userId)
    .eq("game_id", gameId)
    .eq("status", "pending");

  const exactDuplicate = (pendingReports ?? []).some((pending) =>
    pending.home_score === homeScore &&
    pending.away_score === awayScore &&
    pending.game_status === gameStatus &&
    (pending.period ?? null) === period &&
    (pending.clock ?? null) === clock,
  );

  if (exactDuplicate) {
    reportRedirect(gameId, "That exact score update is already pending review. Send another report only if the score or game status has changed.");
  }

  const { data, error } = await supabase.rpc("submit_score_submission", {
    p_game_id: gameId,
    p_home_score: homeScore,
    p_away_score: awayScore,
    p_game_status: gameStatus,
    p_period: period,
    p_clock: clock,
    p_source_note: sourceNote,
  });

  if (error) {
    const message = error.message.includes("verified terminal state")
      ? "This game already has a verified final result and cannot be changed from score reporting."
      : "The score could not be saved. Check the game state and try again.";
    reportRedirect(gameId, message);
  }

  const submission = Array.isArray(data) ? data[0] : data;
  const outcome = submission?.submission_status === "approved" ? "approved" : "pending";
  redirect(`/report-score?submitted=${outcome}&game=${encodeURIComponent(gameId)}`);
}
