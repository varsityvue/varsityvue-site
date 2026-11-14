import assert from "node:assert/strict";
import test from "node:test";
import {renderToStaticMarkup} from "react-dom/server";
import ConnectedPlayoffBracket from "../components/ConnectedPlayoffBracket";
test("unknown participants never receive a winner check",()=>{
 const html=renderToStaticMarkup(<ConnectedPlayoffBracket games={[]} selectedSchool="De Leon"/>);
 assert.equal((html.match(/<article /g)??[]).length,63);
 assert.doesNotMatch(html,/✓/);
 assert.match(html,/W5/);assert.match(html,/R5/);
 assert.match(html,/Fit Entire Bracket/);
});
