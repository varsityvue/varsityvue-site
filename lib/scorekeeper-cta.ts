export type ScorekeeperCtaState = "apply" | "application_pending" | "report_score" | "access_review" | "unavailable";
export type ContributorApplication = { school_slug: string; requested_role: string; status: string };
export type ContributorAssignment = { school_slug: string; assignment_role: string; active: boolean };
export type ScorekeeperContext = {
  signedIn: boolean;
  accountStatus?: string;
  lookupFailed?: boolean;
  roles?: string[];
  assignments?: ContributorAssignment[];
  applications?: ContributorApplication[];
  schoolSlug?: string;
};

// Presentation only. Current database authority still controls every score write.
export function resolveScorekeeperCta(context: ScorekeeperContext): ScorekeeperCtaState {
  if (context.lookupFailed) return "unavailable";
  if (!context.signedIn) return "apply";
  if (context.accountStatus !== "active") return "unavailable";
  const matches = (school: string) => !context.schoolSlug || school === context.schoolSlug;
  const roles = context.roles ?? [];
  if (roles.includes("admin") || roles.includes("moderator")) return "report_score";
  if (roles.includes("scorekeeper") && context.assignments?.some(a => a.active && a.assignment_role === "scorekeeper" && matches(a.school_slug))) return "report_score";
  const applications = context.applications?.filter(a => matches(a.school_slug)) ?? [];
  if (applications.some(a => a.status === "pending" || a.status === "deferred")) return "application_pending";
  if (applications.some(a => a.status === "approved" && a.requested_role === "scorekeeper") || roles.includes("scorekeeper")) return "access_review";
  return "apply";
}

export const scorekeeperCtaPresentation = {
  apply: { label: "Become a Scorekeeper", href: "/contributors", note: "Approval and a school assignment are required." },
  application_pending: { label: "View application status", href: "/contributors#your-applications", note: "Your application is awaiting review. You can apply separately for another program." },
  report_score: { label: "Report a Score", href: "/report-score", note: "LIVE publishing requires an eligible verified game and current scoring access." },
  access_review: { label: "View contributor access", href: "/contributors", note: "Current access needs review. Previous approval does not restore a role or assignment." },
  unavailable: { label: "View contributor information", href: "/contributors", note: "Active account and access verification are required before scoring." },
} satisfies Record<ScorekeeperCtaState, { label: string; href: string; note: string }>;
