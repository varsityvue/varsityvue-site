import test from "node:test";
import assert from "node:assert/strict";
import { parseScoreInput } from "./score-input";
test("missing and malformed scores never become a published zero", () => {
  for (const input of [null, "", " ", "-1", "1.5", "1e2", "0x10", "151", "Infinity", new File(["0"], "score")]) {
    assert.equal(parseScoreInput(input), null, String(input));
  }
  for (const input of ["0", " 42 ", "150"]) assert.equal(parseScoreInput(input), Number(input));
});
