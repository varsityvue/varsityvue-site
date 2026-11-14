import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildBracketLayout,fitBracket,schoolRoute,potentialParticipants} from './playoff-bracket-layout';
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

test('future opponent candidates respect the source subtree',()=>{
 const {nodes}=buildBracketLayout('2A-D1',[]);
 assert.deepEqual(potentialParticipants(nodes,'1-0-6'),['Axtell','Bangs']);
 assert.equal(potentialParticipants(nodes,'final').length,64);
});
test('verified results reach state across normalized division labels',()=>{
 const games: import('../types/platform').Game[]=[];
 const rounds=['Bi-District','Area','Regional Semifinal','Regional Final','State Semifinal','State Championship'] as const;
 for(let round=0;round<6;round++) {
  const {nodes}=buildBracketLayout('2A-D1',games);
  for(const node of nodes.filter(n=>n.round===round)) {
   assert.ok(node.teams.every(Boolean));
   games.push({id:node.id,season:2026,gameType:'playoff',districtGame:false,status:'final',publicScoreVerified:true,homeTeam:node.teams[0]!,awayTeam:node.teams[1]!,homeScore:21,awayScore:7,playoff:{round:rounds[round],division:'2A Division I',...(node.region>=0?{region:['I','II','III','IV'][node.region]}:{})}});
  }
 }
 const final=buildBracketLayout('2A-D1',games).nodes.find(n=>n.id==='final')!;
 assert.ok(final.game);assert.equal(final.teams[0],'Panhandle');assert.equal(final.teams[1],'Cooper');
 const semifinal=games.find(g=>g.id==='semi-0')!;semifinal.publicScoreVerified=false;
 const blocked=buildBracketLayout('2A-D1',games).nodes.find(n=>n.id==='final')!;
 assert.equal(blocked.teams[0],null);assert.equal(blocked.game,undefined);
});
