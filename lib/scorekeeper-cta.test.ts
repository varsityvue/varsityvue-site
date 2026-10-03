import assert from "node:assert/strict";
import test from "node:test";
import { resolveScorekeeperCta, scorekeeperCtaPresentation, type ScorekeeperContext } from "./scorekeeper-cta";
import { contributorIntent, contributorLoginHref, applicationSchools } from "./contributor-intent";
import { safeNextPath } from "./safe-next-path";
const active: ScorekeeperContext = { signedIn: true, accountStatus: "active" };
const assignment = { school_slug: "de-leon", assignment_role: "scorekeeper", active: true };
const application = (status: string, school_slug = "de-leon") => ({ school_slug, requested_role: "scorekeeper", status });
const cases: [string, ScorekeeperContext, string][] = [
  ["signed out", { signedIn: false }, "apply"],
  ["active member", active, "apply"],
  ...["pending", "deferred"].map(status => [status, { ...active, applications: [application(status)] }, "application_pending"] as [string, ScorekeeperContext, string]),
  ...["declined", "withdrawn"].map(status => [status, { ...active, applications: [application(status)] }, "apply"] as [string, ScorekeeperContext, string]),
  ["historical approval", { ...active, applications: [application("approved")] }, "access_review"],
  ["current keeper", { ...active, roles: ["scorekeeper"], assignments: [assignment] }, "report_score"],
  ["coach only", { ...active, roles: ["scorekeeper"], assignments: [{ ...assignment, assignment_role: "coach" }] }, "access_review"],
  ["revoked assignment", { ...active, roles: ["scorekeeper"], assignments: [{ ...assignment, active: false }] }, "access_review"],
  ["removed role", { ...active, assignments: [assignment], applications: [application("approved")] }, "access_review"],
  ["suspended", { ...active, accountStatus: "suspended", roles: ["scorekeeper"], assignments: [assignment] }, "unavailable"],
  ["account unavailable", { ...active, accountStatus: "unavailable" }, "unavailable"],
  ["read failure", { ...active, lookupFailed: true }, "unavailable"],
  ["different school pending", { ...active, schoolSlug: "cisco", applications: [application("pending")] }, "apply"],
  ["different school assigned", { ...active, schoolSlug: "cisco", roles: ["scorekeeper"], assignments: [assignment] }, "access_review"],
  ["current access over history", { ...active, roles: ["scorekeeper"], assignments: [assignment], applications: [application("pending")] }, "report_score"],
];
for (const [name, context, expected] of cases) test(name, () => assert.equal(resolveScorekeeperCta(context), expected));
test("presentation uses existing routes without private identifiers", () => {
  assert.equal(scorekeeperCtaPresentation.apply.href, "/contributors");
  assert.equal(scorekeeperCtaPresentation.application_pending.href, "/contributors#your-applications");
  assert.equal(scorekeeperCtaPresentation.report_score.href, "/report-score");
  for (const p of Object.values(scorekeeperCtaPresentation)) assert.doesNotMatch(JSON.stringify(p), /user_id|applicant_id|actor_id/);
});
test("school and role are validated against actual application programs", () => {
  assert.equal(contributorIntent("de-leon", "scorekeeper").schoolSlug, "de-leon");
  assert.equal(contributorIntent("not-a-school", "admin").returnTo, "/contributors");
  assert.equal(contributorIntent("de-leon", "admin").requestedRole, "scorekeeper");
  assert.equal(contributorIntent("de-leon", "coach").requestedRole, "coach");
  const excluded = ["../../admin", "https://evil.invalid", "//evil.invalid"];
  for (const school of excluded) assert.equal(contributorIntent(school).schoolSlug, undefined);
  assert.ok(applicationSchools().every(s => s.status !== "archived" && s.districtId !== "opponent"));
});
test("login and signup preserve validated context and safe return path", () => {
  const intent = contributorIntent("de-leon", "scorekeeper");
  for (const signup of [false, true]) {
    const href = new URL(contributorLoginHref(intent.returnTo, signup), "https://varsityvue.invalid");
    assert.equal(href.searchParams.get("next"), intent.returnTo);
    assert.equal(href.searchParams.get("mode"), signup ? "signup" : null);
    assert.equal(safeNextPath(href.searchParams.get("next")), intent.returnTo);
  }
  for (const unsafe of ["//evil.invalid", "https://evil.invalid", "/\\evil", "/\nadmin"]) assert.equal(safeNextPath(unsafe, "/contributors"), "/contributors");
});
