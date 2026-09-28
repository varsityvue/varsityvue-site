import { getSchoolBySlug } from "@/lib/schools";

export const isTeamFeedEnabled = (slug: string) => getSchoolBySlug(slug)?.status === "pilot";
