import assert from 'node:assert/strict';
import test from 'node:test';
import { pickemEntrySummary, pickemRecoveryCopy } from './pickem-entry-presentation';
const base = { entered:false,entryClosed:false,allLocked:false,uncertain:false,reconciled:false,selected:10,total:10,needsPrediction:false,hasPhone:true,attested:true };
test('complete selections never imply acceptance',()=>{
 assert.equal(pickemEntrySummary(base).title,'Your entry isn’t submitted yet.');
 assert.match(pickemEntrySummary(base).detail,/Submit your entry/);
});
test('remaining requirements explain disabled entry without changing eligibility',()=>{
 const result=pickemEntrySummary({...base,selected:8,needsPrediction:true,hasPhone:false,attested:false});
 assert.match(result.detail,/2 more winners/);
 assert.doesNotMatch(result.detail,/mobile number|eligibility/);
 assert.match(pickemEntrySummary({...base,needsPrediction:true}).detail,/combined points/);
 assert.match(pickemEntrySummary({...base,hasPhone:false}).detail,/mobile number/);
 assert.match(pickemEntrySummary({...base,attested:false}).detail,/eligibility/);
 assert.match(pickemEntrySummary({...base,selected:0,needsPrediction:true}).detail,/Pick all 10 winners/);
});
test('only valid receipt gets accepted wording; closed valid entrants retain it',()=>{
 assert.equal(pickemEntrySummary({...base,entered:true,status:'valid',entryClosed:true,allLocked:true}).title,'Entry accepted.');
 for(const status of ['disqualified','pending',undefined])assert.match(pickemEntrySummary({...base,entered:true,status}).title,/ineligible or under review/);
});
test('closed drafts never get entry instructions',()=>{
 for(const input of [{entryClosed:true},{allLocked:true}])assert.equal(pickemEntrySummary({...base,...input}).title,'Entry closed — not entered');
});
test('uncertain write overrides valid receipt and matching state still requires review',()=>{
 assert.equal(pickemEntrySummary({...base,entered:true,status:'valid',uncertain:true}).title,'Save outcome uncertain');
 assert.match(pickemEntrySummary({...base,uncertain:true,reconciled:true}).detail,/before another save/);
});
test('recovery accurately distinguishes entry availability and never promises acceptance',()=>{
 for(const section of ['history','standings'] as const){
 assert.match(pickemRecoveryCopy(section,false),/New entries are closed/);
 assert.doesNotMatch(pickemRecoveryCopy(section,false),/entry form above/);
 assert.match(pickemRecoveryCopy(section,true),/confirmed valid receipt/);
 }
});
