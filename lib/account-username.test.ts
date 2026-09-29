import assert from "node:assert/strict";
import test from "node:test";

import { validateUsername } from "./account-username";

test("username input retains only supported ASCII and canonicalizes case and whitespace", () => {
  assert.deepEqual(validateUsername("  Friday_Night9  ", null), { canonical: "friday_night9" });
  assert.deepEqual(validateUsername("abc", null), { canonical: "abc" });
  assert.deepEqual(validateUsername("a".repeat(30), null), { canonical: "a".repeat(30) });
  for (const input of ["ab", "a".repeat(31), "éabc", "Kabc", "foo-bar", "foo bar", "＠abc"])
    assert.equal(validateUsername(input, null).error, "invalid", input);
});

test("reserved exact names and case-only changes are rejected", () => {
  for (const input of ["ADMIN", "varsityvue", "administrator", "moderator", "support", "official"])
    assert.equal(validateUsername(input, null).error, "reserved", input);
  assert.equal(validateUsername("  Foo_Bar ", "foo_bar").error, "no-op");
  assert.deepEqual(validateUsername("my_admin_fan", null), { canonical: "my_admin_fan" });
});
