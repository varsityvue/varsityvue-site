import type { School } from "@/types/platform";
import { getSchoolBySlug } from "@/lib/schools";

export type AccountFollow = {
  school: School;
  followedAt: string;
};

type AccountFollowRow = {
  school_slug: string;
  created_at: string;
};

export function resolveAccountFollows(rows: AccountFollowRow[]) {
  const follows: AccountFollow[] = [];
  let staleFollowCount = 0;

  for (const row of rows) {
    const school = getSchoolBySlug(row.school_slug);
    if (!school) {
      staleFollowCount += 1;
      continue;
    }
    follows.push({ school, followedAt: row.created_at });
  }

  return { follows, staleFollowCount };
}
