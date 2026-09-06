import { getStandingForSchool } from "@/lib/standings";

export function getSchoolRecord(slug: string) {
  const standing = getStandingForSchool(slug);
  const wins = standing?.overallWins ?? 0;
  const losses = standing?.overallLosses ?? 0;

  return {
    wins,
    losses,
    record: `${wins}-${losses}`,
  };
}
