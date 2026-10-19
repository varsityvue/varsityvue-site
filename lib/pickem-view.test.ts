import assert from 'node:assert/strict';
import test from 'node:test';
import { pickemViewForHash } from './pickem-view';
test('legacy and new Pick Em links open their matching view', () => {
  for (const hash of ['#my-picks','#results']) assert.equal(pickemViewForHash(hash,'picks'),'results');
  for (const hash of ['#weekly-standings','#season-leaderboard','#standings']) assert.equal(pickemViewForHash(hash,'picks'),'standings');
  assert.equal(pickemViewForHash('#picks','standings'),'picks');
});
test('unknown anchors preserve the open or closed contest default', () => {
  assert.equal(pickemViewForHash('','picks'),'picks');
  assert.equal(pickemViewForHash('#unknown','standings'),'standings');
});
