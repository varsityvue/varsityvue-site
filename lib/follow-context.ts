export type FollowSourceSurface = "school_hub" | "game_center" | "article";

export type FollowContext =
  | { sourceSurface: "school_hub" }
  | { sourceSurface: "game_center"; sourceId: string }
  | { sourceSurface: "article"; sourceId: string };

const SOURCE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function createFollowContext(
  sourceSurface: FollowSourceSurface,
  sourceId?: string,
): FollowContext | null {
  if (sourceSurface === "school_hub") return { sourceSurface };
  if (sourceSurface !== "game_center" && sourceSurface !== "article") return null;
  const normalizedId = sourceId?.trim();
  if (!normalizedId || !SOURCE_ID_PATTERN.test(normalizedId)) return null;
  return { sourceSurface, sourceId: normalizedId };
}

export function followReturnPath(context: FollowContext, schoolSlug: string) {
  if (context.sourceSurface === "game_center") {
    return `/games/${context.sourceId}`;
  }
  if (context.sourceSurface === "article") {
    return `/coverage/${context.sourceId}`;
  }
  return `/schools/${schoolSlug}`;
}

export function sameFollowContext(left: FollowContext, right: FollowContext) {
  return (
    left.sourceSurface === right.sourceSurface &&
    (left.sourceSurface === "school_hub" ||
      (right.sourceSurface !== "school_hub" && left.sourceId === right.sourceId))
  );
}
