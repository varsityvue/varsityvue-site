import assert from "node:assert/strict";
import test from "node:test";
import { playoffRoundLabels, regionalPlayoffRoundLabels } from "./playoff-round-labels";

test("UIL display labels preserve six distinct rounds and four regional rounds", () => {
  assert.deepEqual([...playoffRoundLabels], ["Bi-District", "Area", "Regionals", "Quarterfinals", "Semifinals", "State Championship"]);
  assert.deepEqual(regionalPlayoffRoundLabels, playoffRoundLabels.slice(0, 4));
});
