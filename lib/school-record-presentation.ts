import type { Standing } from "@/lib/standings";

type RecordState = Pick<Standing, "overallRecordKnown" | "districtWins" | "districtLosses">;

export function hasKnownStandingRecord(standing: RecordState) {
  return standing.overallRecordKnown || standing.districtWins > 0 || standing.districtLosses > 0;
}

export function formatOverallRecord(standing: Pick<Standing, "overallRecordKnown" | "overallWins" | "overallLosses"> | undefined) {
  return standing?.overallRecordKnown ? `${standing.overallWins}-${standing.overallLosses}` : "—";
}

export function formatDistrictRecord(standing: RecordState | undefined) {
  return standing && hasKnownStandingRecord(standing) ? `${standing.districtWins}-${standing.districtLosses}` : "—";
}
