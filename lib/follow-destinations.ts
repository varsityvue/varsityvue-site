import "server-only";

import type { FollowContext } from "@/lib/follow-context";
import { followReturnPath } from "@/lib/follow-context";
import { getArticleBySlug } from "@/lib/articles";
import { getDynamicGameById } from "@/lib/dynamic-games";
import { getSchoolBySlug } from "@/lib/schools";

export async function resolveFollowDestination(
  schoolSlug: string,
  context: FollowContext,
) {
  const school = getSchoolBySlug(schoolSlug);
  if (!school) return null;

  if (context.sourceSurface === "game_center") {
    const game = await getDynamicGameById(context.sourceId);
    if (
      !game ||
      (game.homeSchoolSlug !== school.slug && game.awaySchoolSlug !== school.slug)
    ) {
      return null;
    }
  }

  if (context.sourceSurface === "article") {
    const article = getArticleBySlug(context.sourceId);
    if (!article?.schoolIds?.includes(school.slug)) return null;
  }

  return followReturnPath(context, school.slug);
}
