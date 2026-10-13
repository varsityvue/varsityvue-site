"use server";

import { createClient } from "@/lib/supabase/server";
import { memberAccountStatus } from "@/lib/member-access";
import { createPickemReadScope, loadPickemCore, isContestWeek, type PickemWeek } from "@/lib/pickem-page-loader";
import { savedIntentMatches, type PickemWriteIntent } from "@/lib/pickem-write-recovery";

// An explicit read action. It cannot submit, save, invalidate, sign out, or replay.
export async function reconcilePickemWrite(intent: PickemWriteIntent): Promise<"matched" | "unresolved"> {
  try {
    if (!intent || !["entry", "draft"].includes(intent.kind) || !intent.weekId ||
      Object.keys(intent.selections ?? {}).length > 100) return "unresolved";
    const client = await createClient(true);
    const { data, error } = await client.auth.getClaims();
    const userId = data?.claims?.sub;
    if (error || !userId || await memberAccountStatus(client, userId) !== "active") return "unresolved";
    const scope = createPickemReadScope(client);
    const week = await scope.read(client.from("pickem_weeks")
      .select("id,season,week,title,status,closes_at,tiebreaker_game_id,entry_deadline_at,presenting_sponsor_name")
      .eq("id", intent.weekId).maybeSingle()) as PickemWeek | null;
    if (!week) return "unresolved";
    const core = await loadPickemCore(scope, week, userId);
    const rows = intent.kind === "draft" ? core.draftPicks : core.memberPickRows;
    return savedIntentMatches(intent, {
      selections: Object.fromEntries(rows.map(pick => [pick.pickem_game_id, pick.picked_school_slug])),
      prediction: intent.kind === "draft" ? core.draftPrediction : core.memberPrediction?.predicted_total ?? null,
      entryExists: Boolean(core.memberEntry), contest: isContestWeek(week),
    }) ? "matched" : "unresolved";
  } catch { return "unresolved"; }
}
