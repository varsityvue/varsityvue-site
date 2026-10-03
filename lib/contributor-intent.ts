import { getSchools } from "./schools";
import { safeNextPath } from "./safe-next-path";

export function applicationSchools() {
  return getSchools().filter(s => s.status !== "archived" && s.districtId !== "opponent").sort((a, b) => a.name.localeCompare(b.name));
}
export function contributorIntent(school?: string, role?: string) {
  const schoolSlug = applicationSchools().some(s => s.slug === school) ? school : undefined;
  const requestedRole = role === "coach" || role === "scorekeeper" ? role : "scorekeeper";
  const params = new URLSearchParams();
  if (schoolSlug) params.set("school", schoolSlug);
  if (role === "coach" || role === "scorekeeper") params.set("role", requestedRole);
  const returnTo = safeNextPath(`/contributors${params.size ? `?${params.toString()}` : ""}`);
  return { schoolSlug, requestedRole, returnTo };
}
export function contributorLoginHref(returnTo: string, signup = false) {
  const params = new URLSearchParams({ next: safeNextPath(returnTo, "/contributors") });
  if (signup) params.set("mode", "signup");
  return `/login?${params.toString()}`;
}
