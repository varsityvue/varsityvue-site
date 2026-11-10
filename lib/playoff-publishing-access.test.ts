import assert from "node:assert/strict";
import test from "node:test";
import { canViewPlayoffPublishing } from "./playoff-publishing-access";

test("only admins can view the publishing dashboard", () => {
  assert.equal(canViewPlayoffPublishing([{ role: "admin" }]), true);
  assert.equal(canViewPlayoffPublishing([{ role: "member" }, { role: "admin" }]), true);
  for (const roles of [[], [{ role: "member" }], [{ role: "moderator" }], [{ role: "scorekeeper" }]]) {
    assert.equal(canViewPlayoffPublishing(roles), false);
  }
});

test("missing roles and role-query failures deny access", () => {
  assert.equal(canViewPlayoffPublishing(null), false);
  assert.equal(canViewPlayoffPublishing(undefined), false);
  assert.equal(canViewPlayoffPublishing([{ role: "admin" }], true), false);
});
