import {test} from 'node:test';import assert from 'node:assert/strict';
import {validateTemplate,transitionQualifier,projectDistrictQualifiers} from './playoff-qualification';
import {template2AD12026} from '../data/playoff-template-2ad1-2026';
test('reviewed template covers every seed exactly once',()=>assert.deepEqual(validateTemplate(template2AD12026),[]));
test('projected cannot skip confirmation or unresolved ties',()=>{
 const q={slotId:template2AD12026.slots[0].id,schoolSlug:'test',state:'projected' as const,tiebreaker:'resolved' as const,history:[]};const evidence=template2AD12026.evidence!;
 assert.throws(()=>transitionQualifier(q,'published',evidence,template2AD12026));
 const confirmed=transitionQualifier(q,'confirmed',evidence,template2AD12026);assert.equal(confirmed.state,'confirmed');assert.equal(q.state,'projected');
 assert.equal(transitionQualifier(confirmed,'published',evidence,template2AD12026).history.length,2);
 assert.throws(()=>transitionQualifier({...q,tiebreaker:'review-required'},'confirmed',evidence,template2AD12026));
});
test('missing games never produce ranked qualifiers',()=>{const result=projectDistrictQualifiers(2027,['a','b'],[]);assert.equal(result.ready,false);assert.ok(result.rows.every(r=>r.projectedFinish===null));});
