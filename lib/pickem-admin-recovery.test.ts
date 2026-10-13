import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runAdminWrite, selectAdminWeek } from './pickem-admin-recovery';
test('explicit week never falls back to another contest', () => {
 const weeks = [{id:'11'}, {id:'7'}];
 assert.equal(selectAdminWeek(weeks,'7')?.id,'7');
 assert.equal(selectAdminWeek(weeks,'missing'),null);
 assert.equal(selectAdminWeek(weeks,''),null);
 assert.equal(selectAdminWeek(weeks)?.id,'11');
});
test('successful write acknowledgement is independent of subsequent refresh', async () => {
 let writes=0; const result=await runAdminWrite(async()=>{writes++;return {error:null}});
 assert.equal(result.status,'recorded');
 try { throw new Error('refresh failed'); } catch { assert.equal(result.status,'recorded'); }
 assert.equal(writes,1);
});
test('SQL rejection returns actionable prerequisite message', async () => {
 const result=await runAdminWrite(async()=>({error:{code:'P0001',message:'Record notification before deciding this claim'}}));
 assert.equal(result.status,'rejected'); assert.match(result.message,/Record notification/);
});
test('lost response never claims that database write failed, and never retries', async () => {
 let writes=0; const result=await runAdminWrite(async()=>{writes++;throw new Error('network')});
 assert.equal(result.status,'unknown'); assert.equal(writes,1);
 assert.equal((await runAdminWrite(async()=>({error:{message:'Failed to fetch'}}))).status,'unknown');
});
