import assert from "node:assert/strict";
import test from "node:test";
import {renderToStaticMarkup} from "react-dom/server";
import ConnectedPlayoffBracket from "../components/ConnectedPlayoffBracket";
test("unknown participants never receive a winner check",()=>{
 const html=renderToStaticMarkup(<ConnectedPlayoffBracket games={[]} selectedSchool="De Leon"/>);
 assert.equal((html.match(/<article /g)??[]).length,15);
 assert.doesNotMatch(html,/✓/);
 assert.match(html,/W5/);assert.match(html,/R5/);
 assert.match(html,/Fit Entire Bracket/);
});

test("Houston Austin renders its own F10 seed instead of El Paso Austin's F1",()=>{
 const html=renderToStaticMarkup(<ConnectedPlayoffBracket games={[]} selectedSchool="4A-D1|2|Austin"/>);
 assert.match(html,/href="\/schools\/houston-austin"/);
 assert.match(html,/>F10<\/span>/);
 assert.doesNotMatch(html,/href="\/schools\/el-paso-austin"/);
});
