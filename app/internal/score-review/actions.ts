"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { hasCompleteScoreboardTeamIdentity } from "@/data/scoreboard-team-identities";
import { getDynamicGameById } from "@/lib/dynamic-games";
import { getGameById } from "@/lib/games";
import { requireActiveMember } from "@/lib/member-access";
import { getSchoolBySlug } from "@/lib/schools";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function scheduleSelection(formData: FormData) {
  const raw = text(formData, "game_schedule");
  const separator = raw.lastIndexOf("::");
  const gameId = separator > 0 ? raw.slice(0, separator) : "";
  const revision = separator > 0 ? Number(raw.slice(separator + 2)) : Number.NaN;
  return { gameId, revision };
}

function scheduleErrorMessage(code?: string, message?: string) {
  if (code === "40001" || message?.includes("Stale schedule revision")) {
    return "This schedule changed after the page loaded. Refresh and try again.";
  }
  if (code === "22007") return message ?? "Enter a valid, unambiguous Central Time kickoff.";
  if (code === "42501") return "You are not authorized to update this schedule.";
  return message ?? "The canonical kickoff could not be updated.";
}

function hasCompleteSchoolIdentity(slug?: string) {
  if (!slug) return false;
  const school = getSchoolBySlug(slug);
  return Boolean(
    school?.abbreviation?.trim() &&
    school?.mascot?.trim() &&
    school?.colors?.primary?.trim() &&
    school?.colors?.secondary?.trim(),
  );
}

function missingGameIdentity(gameId: string) {
  const game = getGameById(gameId);
  if (!game) return ["unknown game"];

  const sides = [
    { label: game.awayTeam ?? game.awaySchoolSlug ?? "Away team", slug: game.awaySchoolSlug, team: game.awayTeam },
    { label: game.homeTeam ?? game.homeSchoolSlug ?? "Home team", slug: game.homeSchoolSlug, team: game.homeTeam },
  ];

  return sides
    .filter(({ slug, team }) => {
      if (slug === "bye" || slug === "special-event") return false;
      return !hasCompleteSchoolIdentity(slug) && !(team && hasCompleteScoreboardTeamIdentity(team));
    })
    .map(({ label }) => label);
}

async function requireModerator() {
  const { supabase, userId } = await requireActiveMember();

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  const canModerate = roles?.some((row) => row.role === "moderator" || row.role === "admin");
  if (!canModerate) redirect("/account");

  return { supabase, userId };
}

async function requireAdministrator() {
  const { supabase, userId } = await requireActiveMember();
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (!roles?.some((row) => row.role === "admin")) redirect("/account");
  return { supabase };
}

function outcomeErrorMessage(code?: string, message?: string) {
  if (code === "40001" || message?.includes("Stale outcome revision")) {
    return "This outcome changed after the page loaded. Refresh and review the authoritative state before trying again.";
  }
  if (code === "42501") return "Only an active administrator can change a canonical outcome.";
  return message ?? "The canonical outcome could not be changed.";
}

function scorelessOutcomeErrorMessage(code?: string, message?: string) {
  if (code === "40001" || message?.includes("Stale outcome revision")) {
    return "This outcome changed after the page loaded. Refresh and review the authoritative state before trying again.";
  }
  if (code === "42501") return "Only an active administrator can originate an exceptional outcome.";
  return message ?? "The scoreless exceptional outcome could not be recorded.";
}

export async function approveScoreSubmission(formData: FormData) {
  const submissionId = text(formData, "submission_id");
  const reviewNote = text(formData, "review_note") || null;
  const { supabase, userId } = await requireModerator();

  const { data: submission, error: submissionError } = await supabase
    .from("score_submissions")
    .select("id, game_id, status")
    .eq("id", submissionId)
    .eq("status", "pending")
    .maybeSingle();

  if (submissionError) {
    redirect(`/internal/score-review?message=${encodeURIComponent(submissionError.message)}`);
  }

  if (!submission) {
    redirect(`/internal/score-review?message=${encodeURIComponent("Pending score submission not found.")}`);
  }

  const currentGame = await getDynamicGameById(submission.game_id);
  if (!currentGame) {
    redirect(
      `/internal/score-review?message=${encodeURIComponent(
        "Approval blocked. This report does not match a known VarsityVue game.",
      )}`,
    );
  }

  if (["final", "cancelled", "postponed"].includes(currentGame.status)) {
    redirect(
      `/internal/score-review?message=${encodeURIComponent(
        `Approval blocked. This game is already verified as ${currentGame.status} and cannot be changed by an older pending report.`,
      )}`,
    );
  }

  if (currentGame.status !== "live" && currentGame.status !== "scheduled") {
    redirect(
      `/internal/score-review?message=${encodeURIComponent(
        "Approval blocked. Score reports can be approved only while a game is live or awaiting a result.",
      )}`,
    );
  }

  const missingIdentity = missingGameIdentity(submission.game_id);
  if (missingIdentity.length) {
    redirect(
      `/internal/score-review?message=${encodeURIComponent(
        `Approval blocked. Add scoreboard identity metadata for: ${missingIdentity.join(", ")}. Required: abbreviation, mascot, primary color, and secondary color.`,
      )}`,
    );
  }

  const { error } = await supabase
    .from("score_submissions")
    .update({
      status: "approved",
      reviewed_by: userId,
      review_note: reviewNote,
    })
    .eq("id", submissionId)
    .eq("status", "pending");

  if (error) {
    redirect(`/internal/score-review?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/internal/score-review");
  revalidatePath("/scores");
  revalidatePath("/scoreboard");
  redirect("/internal/score-review?reviewed=approved");
}

export async function rejectScoreSubmission(formData: FormData) {
  const submissionId = text(formData, "submission_id");
  const reviewNote = text(formData, "review_note") || "Rejected during review.";
  const { supabase, userId } = await requireModerator();

  const { error } = await supabase
    .from("score_submissions")
    .update({
      status: "rejected",
      reviewed_by: userId,
      review_note: reviewNote,
    })
    .eq("id", submissionId)
    .eq("status", "pending");

  if (error) {
    redirect(`/internal/score-review?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/internal/score-review");
  redirect("/internal/score-review?reviewed=rejected");
}


export async function updateGameAvailability(formData: FormData) {
  const gameId = text(formData, "game_id");
  const nextStatus = text(formData, "game_status");
  const { supabase, userId } = await requireModerator();

  if (!gameId || !["upcoming", "postponed", "cancelled"].includes(nextStatus)) {
    redirect("/internal/score-review?message=Choose%20a%20valid%20game%20status.");
  }

  const currentGame = await getDynamicGameById(gameId);
  if (!currentGame) {
    redirect("/internal/score-review?message=Game%20not%20found.");
  }
  if (currentGame.status === "final") {
    redirect("/internal/score-review?message=Final%20games%20cannot%20be%20reopened%20from%20game%20status%20controls.");
  }

  const { error } = await supabase.from("game_state").upsert(
    {
      game_id: gameId,
      status: nextStatus,
      home_score: null,
      away_score: null,
      period: null,
      clock: null,
      source_submission_id: null,
      verified: true,
      verified_at: new Date().toISOString(),
      updated_by: userId,
      updated_at: new Date().toISOString(),
      result_type: null,
      official_winner_school_slug: null,
    },
    { onConflict: "game_id" },
  );

  if (error) {
    redirect(`/internal/score-review?message=${encodeURIComponent(error.message)}`);
  }

  if (nextStatus === "postponed" || nextStatus === "cancelled") {
    await supabase
      .from("score_submissions")
      .update({
        status: "superseded",
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
        review_note: `Superseded when game was marked ${nextStatus}.`,
      })
      .eq("game_id", gameId)
      .eq("status", "pending");
  }

  revalidatePath("/internal/score-review");
  revalidatePath("/games");
  revalidatePath("/scoreboard");
  revalidatePath(`/games/${gameId}`);
  redirect(`/internal/score-review?game-status=${encodeURIComponent(nextStatus)}`);
}


export async function rescheduleGame(formData: FormData) {
  const { gameId, revision } = scheduleSelection(formData);
  const kickoffLocal = text(formData, "kickoff_local");
  const reason = text(formData, "reason");
  const { supabase } = await requireModerator();

  if (!gameId || !Number.isSafeInteger(revision) || revision < 0 || !kickoffLocal || !reason) {
    redirect("/internal/score-review?message=Choose%20a%20game%2C%20new%20kickoff%2C%20and%20reason.");
  }
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(kickoffLocal)) {
    redirect("/internal/score-review?message=Enter%20a%20valid%20Central%20Time%20kickoff.");
  }

  const currentGame = await getDynamicGameById(gameId);
  if (!currentGame) redirect("/internal/score-review?message=Game%20not%20found.");
  if (currentGame.status === "final" || currentGame.status === "cancelled") {
    redirect("/internal/score-review?message=Final%20or%20cancelled%20games%20cannot%20be%20rescheduled.");
  }
  if (!currentGame.kickoff || !currentGame.awaySchoolSlug || !currentGame.homeSchoolSlug) {
    redirect("/internal/score-review?message=The%20canonical%20game%20is%20missing%20kickoff%20or%20team%20identity.");
  }

  const { error } = await supabase.rpc("update_canonical_game_kickoff", {
    p_game_id: gameId,
    p_expected_revision: revision,
    p_expected_current_kickoff: currentGame.kickoff,
    p_kickoff_local: `${kickoffLocal}:00`,
    p_reason: reason,
    p_away_school_slug: currentGame.awaySchoolSlug,
    p_home_school_slug: currentGame.homeSchoolSlug,
  });
  if (error) {
    redirect(`/internal/score-review?message=${encodeURIComponent(scheduleErrorMessage(error.code, error.message))}`);
  }

  revalidatePath("/internal/score-review");
  revalidatePath("/games");
  revalidatePath("/scoreboard");
  revalidatePath(`/games/${gameId}`);
  redirect("/internal/score-review?game-status=rescheduled");
}

export async function setCanonicalGameOutcome(formData: FormData) {
  const gameId = text(formData, "game_id");
  const resultType = text(formData, "result_type");
  const winnerSlug = text(formData, "official_winner_school_slug") || null;
  const reason = text(formData, "reason");
  const awayScoreText = text(formData, "away_score");
  const homeScoreText = text(formData, "home_score");
  const awayScore = awayScoreText === "" ? null : Number(awayScoreText);
  const homeScore = homeScoreText === "" ? null : Number(homeScoreText);
  const expectedRevision = Number(text(formData, "expected_outcome_revision"));
  const { supabase } = await requireAdministrator();

  if (!gameId || !["played", "tie", "forfeit", "no_contest"].includes(resultType)) {
    redirect("/internal/score-review?message=Choose%20a%20valid%20canonical%20outcome.");
  }
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0 || !reason) {
    redirect("/internal/score-review?message=Refresh%20the%20game%20and%20enter%20a%20reason%20before%20submitting.");
  }
  if (reason.length > 500) {
    redirect("/internal/score-review?message=Keep%20the%20outcome%20reason%20to%20500%20characters%20or%20fewer.");
  }
  if (["played", "tie"].includes(resultType) && (
    !Number.isSafeInteger(awayScore) || !Number.isSafeInteger(homeScore) ||
    (awayScore as number) < 0 || (homeScore as number) < 0
  )) {
    redirect("/internal/score-review?message=Played%20and%20tie%20outcomes%20require%20nonnegative%20whole-number%20scores.");
  }

  const { error } = await supabase.rpc("admin_set_canonical_game_outcome", {
    p_game_id: gameId,
    p_expected_outcome_revision: expectedRevision,
    p_result_type: resultType,
    p_official_winner_school_slug: winnerSlug,
    p_reason: reason,
    p_away_score: ["played", "tie"].includes(resultType) ? awayScore : null,
    p_home_score: ["played", "tie"].includes(resultType) ? homeScore : null,
  });

  if (error) {
    redirect(`/internal/score-review?message=${encodeURIComponent(outcomeErrorMessage(error.code, error.message))}`);
  }

  revalidatePath("/internal/score-review");
  revalidatePath("/pickem");
  revalidatePath("/games");
  revalidatePath("/scoreboard");
  revalidatePath(`/games/${gameId}`);
  redirect(`/internal/score-review?outcome-updated=${encodeURIComponent(gameId)}`);
}

export async function originateScorelessOutcome(formData: FormData) {
  const gameId = text(formData, "game_id");
  const resultType = text(formData, "result_type");
  const winnerSlug = text(formData, "official_winner_school_slug") || null;
  const source = text(formData, "source");
  const reason = text(formData, "reason");
  const expectedRevision = Number(text(formData, "expected_outcome_revision"));
  const { supabase } = await requireAdministrator();

  if (!gameId || !["forfeit", "no_contest"].includes(resultType)) {
    redirect("/internal/score-review?message=Choose%20a%20valid%20scoreless%20exceptional%20outcome.");
  }
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) {
    redirect("/internal/score-review?message=Refresh%20the%20game%20before%20submitting.");
  }
  if (!source || !reason) {
    redirect("/internal/score-review?message=Enter%20an%20authoritative%20source%20and%20reason.");
  }
  if (source.length > 300 || reason.length > 500) {
    redirect("/internal/score-review?message=Keep%20the%20source%20to%20300%20characters%20and%20the%20reason%20to%20500.");
  }

  const currentGame = await getDynamicGameById(gameId);
  if (!currentGame || currentGame.gameType === "bye" || currentGame.gameType === "scrimmage") {
    redirect("/internal/score-review?message=Canonical%20game%20not%20found.");
  }
  if (currentGame.status === "final") {
    redirect("/internal/score-review?message=A%20verified%20final%20already%20exists.%20Use%20the%20canonical%20correction%20workflow.");
  }
  if (
    !currentGame.awaySchoolSlug ||
    !currentGame.homeSchoolSlug ||
    currentGame.awaySchoolSlug === currentGame.homeSchoolSlug ||
    ["bye", "opponent", "special-event"].includes(currentGame.awaySchoolSlug) ||
    ["bye", "opponent", "special-event"].includes(currentGame.homeSchoolSlug)
  ) {
    redirect("/internal/score-review?message=The%20canonical%20matchup%20identity%20is%20incomplete.");
  }
  if (resultType === "forfeit" && ![currentGame.awaySchoolSlug, currentGame.homeSchoolSlug].includes(winnerSlug ?? "")) {
    redirect("/internal/score-review?message=Choose%20the%20official%20forfeit%20winner%20from%20the%20participating%20schools.");
  }
  if (resultType === "no_contest" && winnerSlug) {
    redirect("/internal/score-review?message=A%20no-contest%20cannot%20have%20an%20official%20winner.");
  }

  const { error } = await supabase.rpc("admin_originate_canonical_game_outcome", {
    p_game_id: gameId,
    p_expected_outcome_revision: expectedRevision,
    p_result_type: resultType,
    p_official_winner_school_slug: winnerSlug,
    p_source: source,
    p_reason: reason,
    p_away_school_slug: currentGame.awaySchoolSlug,
    p_home_school_slug: currentGame.homeSchoolSlug,
  });

  if (error) {
    redirect(`/internal/score-review?message=${encodeURIComponent(scorelessOutcomeErrorMessage(error.code, error.message))}`);
  }

  revalidatePath("/");
  revalidatePath("/internal/score-review");
  revalidatePath("/pickem");
  revalidatePath("/games");
  revalidatePath("/scores");
  revalidatePath("/scoreboard");
  revalidatePath(`/games/${gameId}`);
  revalidatePath(`/schools/${currentGame.awaySchoolSlug}`);
  revalidatePath(`/schools/${currentGame.homeSchoolSlug}`);
  redirect(`/internal/score-review?exceptional-outcome-recorded=${encodeURIComponent(gameId)}`);
}
