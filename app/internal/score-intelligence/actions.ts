"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getGameById } from "@/lib/games";
import { scoutReviewArguments, scoutReviewError } from "@/lib/score-scout-review";
import { requireActiveMember } from "@/lib/member-access";
import { evidenceSourceTypes, type EvidenceSourceType } from "@/lib/score-evidence-confidence";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function requireModerator() {
  const { supabase, userId } = await requireActiveMember();
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (!roles?.some((row) => row.role === "moderator" || row.role === "admin")) redirect("/account");
  return { supabase, userId };
}

export async function addScoreEvidence(formData: FormData) {
  const intelligenceId = value(formData, "intelligence_id");
  const sourceName = value(formData, "source_name").slice(0, 100);
  const sourceType = value(formData, "source_type") as EvidenceSourceType;
  const rawSourceUrl = value(formData, "source_url").slice(0, 500);
  let sourceUrl: string | null = null;
  if (rawSourceUrl) {
    try {
      const parsed = new URL(rawSourceUrl);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("Unsupported source URL");
      sourceUrl = parsed.toString();
    } catch {
      redirect("/internal/score-intelligence?message=Source%20URL%20must%20be%20a%20valid%20web%20address.");
    }
  }
  const evidenceNote = value(formData, "evidence_note").slice(0, 1000) || null;
  const awayInput = value(formData, "away_score");
  const homeInput = value(formData, "home_score");
  const awayScore = awayInput === "" ? null : Number(awayInput);
  const homeScore = homeInput === "" ? null : Number(homeInput);
  const { supabase, userId } = await requireModerator();

  const scoresValid = (awayScore === null && homeScore === null) || (
    Number.isInteger(awayScore) && Number.isInteger(homeScore) && awayScore! >= 0 && awayScore! <= 150 && homeScore! >= 0 && homeScore! <= 150
  );
  if (!intelligenceId || !sourceName || !evidenceSourceTypes.includes(sourceType) || !scoresValid) redirect("/internal/score-intelligence?message=Check%20the%20evidence%20details.");

  const { error } = await supabase.from("missing_score_evidence").insert({
    intelligence_id: intelligenceId,
    source_name: sourceName,
    source_type: sourceType,
    ingestion_method: "moderator",
    source_url: sourceUrl,
    away_score: awayScore,
    home_score: homeScore,
    evidence_note: evidenceNote,
    captured_by: userId,
  });
  if (error) redirect(`/internal/score-intelligence?message=${encodeURIComponent(error.message)}`);
  revalidatePath("/internal/score-intelligence");
  redirect("/internal/score-intelligence?updated=evidence-added");
}

export async function updateIntelligenceStatus(formData: FormData) {
  const intelligenceId = value(formData, "intelligence_id");
  const status = value(formData, "status");
  const note = value(formData, "moderator_note").slice(0, 1000) || null;
  const { supabase, userId } = await requireModerator();
  if (!intelligenceId || !["open", "dismissed"].includes(status)) redirect("/internal/score-intelligence?message=Invalid%20queue%20update.");

  const { error } = await supabase.from("missing_score_intelligence").update({
    status,
    moderator_note: note,
    reviewed_by: userId,
    resolved_at: status === "dismissed" ? new Date().toISOString() : null,
    resolution: status === "dismissed" ? "dismissed_by_moderator" : null,
  }).eq("id", intelligenceId);
  if (error) redirect(`/internal/score-intelligence?message=${encodeURIComponent(error.message)}`);
  revalidatePath("/internal/score-intelligence");
  redirect(`/internal/score-intelligence?updated=${encodeURIComponent(status)}`);
}

export async function reviewScoreEvidence(formData: FormData) {
  const { supabase } = await requireModerator();
  let args: ReturnType<typeof scoutReviewArguments>;
  try { args = scoutReviewArguments(formData); }
  catch (error) { redirect(`/internal/score-intelligence?message=${encodeURIComponent(scoutReviewError({ message: error instanceof Error ? error.message : undefined }))}`); }
  const game = getGameById(args.p_expected_game_id);
  if (!game || game.gameType === "bye" || game.gameType === "scrimmage" ||
    game.awaySchoolSlug !== args.p_evidence_snapshot.away_school_slug ||
    game.homeSchoolSlug !== args.p_evidence_snapshot.home_school_slug) {
    redirect("/internal/score-intelligence?message=Game%20mapping%20changed%20%E2%80%94%20review%20the%20evidence%20again.");
  }
  const { error } = await supabase.rpc("review_missing_score_evidence", args);
  if (error) redirect(`/internal/score-intelligence?message=${encodeURIComponent(scoutReviewError(error))}`);
  for (const path of ["/internal/score-intelligence", "/internal/score-review", "/internal/scoring", "/scoreboard", "/games", "/", "/pickem", `/games/${game.id}`, `/schools/${game.awaySchoolSlug}`, `/schools/${game.homeSchoolSlug}`]) revalidatePath(path);
  redirect(`/internal/score-intelligence?updated=${encodeURIComponent(`evidence-${args.decision}d`)}`);
}
