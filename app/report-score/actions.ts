"use server";

import { redirect } from "next/navigation";

import { hasCompleteScoreboardTeamIdentity } from "@/data/scoreboard-team-identities";
import { getGameById } from "@/lib/games";
import { getSchoolBySlug } from "@/lib/schools";
import { createClient } from "@/lib/supabase/server";

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

export async function submitScore(formData: FormData) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    redirect("/login?message=Sign%20in%20to%20submit%20a%20score.");
  }

  const gameId = text(formData, "game_id");
  const game = getGameById(gameId);
  const homeScore = score(formData, "home_score");
  const awayScore = score(formData, "away_score");
  const gameStatus = text(formData, "game_status");
  const period = text(formData, "period") || null;
  const clock = text(formData, "clock") || null;
  const sourceNote = text(formData, "source_note") || null;

  if (!game || game.gameType === "bye" || game.gameType === "scrimmage") {
    redirect("/report-score?message=Choose%20a%20valid%20game.");
  }

  const awayReady = teamHasCompleteIdentity(game.awaySchoolSlug, game.awayTeam);
  const homeReady = teamHasCompleteIdentity(game.homeSchoolSlug, game.homeTeam);
  if (!awayReady || !homeReady) {
    redirect("/report-score?message=This%20game%20is%20not%20available%20for%20reporting%20until%20both%20teams%20have%20complete%20identity%20data.");
  }

  if (homeScore === null || awayScore === null) {
    redirect("/report-score?message=Enter%20valid%20scores%20for%20both%20teams.");
  }

  if (!["live", "final"].includes(gameStatus)) {
    redirect("/report-score?message=Choose%20Live%20or%20Final%20for%20the%20game%20status.");
  }

  const { error } = await supabase.from("score_submissions").insert({
    game_id: gameId,
    submitted_by: userId,
    home_score: homeScore,
    away_score: awayScore,
    game_status: gameStatus,
    period,
    clock,
    source_note: sourceNote,
  });

  if (error) {
    redirect(`/report-score?message=${encodeURIComponent(error.message)}`);
  }

  redirect("/report-score?submitted=1");
}
