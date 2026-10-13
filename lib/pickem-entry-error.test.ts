import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pickemEntryErrorMessage } from "./pickem-entry-error";

const sql = readFileSync(new URL("../supabase/migrations/20260926051734_pickem_week6_cash_entry.sql", import.meta.url), "utf8");
function rejection(phrase: string) {
  const message = [...sql.matchAll(/raise exception '([^']+)'/g)].find(match => match[1].includes(phrase))?.[1];
  assert.ok(message, `Database rejection missing: ${phrase}`);
  return message;
}

test("database account-number conflict directs the entrant to support", () => {
  assert.equal(pickemEntryErrorMessage(rejection("different contest number")), "This account is already linked to a different contest number. Contact VarsityVue support for help.");
});

test("database invalid-number and duplicate-entrant rejections stay distinct", () => {
  assert.equal(pickemEntryErrorMessage(rejection("valid U.S. mobile")), "Enter a valid U.S. mobile number.");
  assert.equal(pickemEntryErrorMessage(rejection("already used for another entrant")), "This number is already used for another entrant.");
});

test("unrecognized errors keep generic wording without exposing private details", () => {
  assert.equal(pickemEntryErrorMessage("Unexpected database detail: private data"), "Your entry could not be saved. Refresh and review the slate.");
});
