/** Editorial placement is independent of related schools and canonical games. */
export function parseFeedVisibility(value: string): boolean | null {
  if (value === "primary") return false;
  if (value === "both") return true;
  return null;
}

/** Apply before ordering/limiting so mixed-visibility pages have correct cursors. */
export function teamFeedSchoolFilter(schoolId: string): string {
  // Canonical school IDs are lowercase slugs. Never interpolate filter syntax.
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(schoolId)) throw new Error("Invalid school ID");
  return `primary_school_id.eq.${schoolId},and(secondary_school_id.eq.${schoolId},show_on_secondary_school.eq.true)`;
}
