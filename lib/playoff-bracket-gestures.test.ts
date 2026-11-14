import test from 'node:test';import assert from 'node:assert/strict';
import {zoomBracketAt,pinchBracket} from './playoff-bracket-gestures';
test('zoom preserves the bracket point under the pointer and respects limits',()=>{
 const v={scale:.5,x:10,y:20},a={x:150,y:100};const n=zoomBracketAt(v,2,a);
 assert.equal((a.x-n.x)/n.scale,(a.x-v.x)/v.scale);assert.equal((a.y-n.y)/n.scale,(a.y-v.y)/v.scale);
 assert.equal(zoomBracketAt(v,100,a).scale,2.5);assert.equal(zoomBracketAt(v,.001,a).scale,.025);
});
test('two-finger pinch handles zoom and midpoint translation together',()=>{
 const v={scale:1,x:0,y:0};
 assert.deepEqual(pinchBracket(v,{x:0,y:0},{x:100,y:0},{x:0,y:0},{x:200,y:0}),{scale:2,x:0,y:0});
 assert.deepEqual(pinchBracket(v,{x:0,y:0},{x:100,y:0},{x:20,y:30},{x:120,y:30}),{scale:1,x:20,y:30});
 assert.deepEqual(pinchBracket(v,{x:0,y:0},{x:0,y:0},{x:0,y:0},{x:100,y:0}),v);
});
