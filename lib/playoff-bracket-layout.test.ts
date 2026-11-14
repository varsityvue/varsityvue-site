import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildBracketLayout,fitBracket,schoolRoute} from './playoff-bracket-layout';
import {statewideDivisions} from '../data/statewide-playoff-brackets';
for(const division of statewideDivisions) test(`${division.id}: complete connected tournament`,()=>{
 const {nodes}=buildBracketLayout(division.id,[]);
 assert.equal(nodes.length,63);
 assert.equal(nodes.filter(n=>n.round===0).length,32);
 for(const node of nodes) for(const source of node.sources) assert.ok(nodes.find(n=>n.id===source && n.round===node.round-1));
 assert.equal(schoolRoute(nodes,division.regions[0][0][0]).size,6);
 assert.ok(nodes.filter(n=>n.round>0).every(n=>n.teams.every(t=>t===null)));
});
test('fit contains all bounds on mobile and desktop',()=>{
 for(const viewport of [{width:350,height:550},{width:1300,height:700}]) {
 const b={x:300,y:1800,width:1500,height:3200}; const t=fitBracket(b,viewport);
 assert.ok(b.x*t.scale+t.x>=0);assert.ok(b.y*t.scale+t.y>=0);
 assert.ok((b.x+b.width)*t.scale+t.x<=viewport.width);
 assert.ok((b.y+b.height)*t.scale+t.y<=viewport.height);
 }
});
