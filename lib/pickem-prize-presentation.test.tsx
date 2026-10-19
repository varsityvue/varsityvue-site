import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import Prize from '../components/PickemPrizeCounter';

for (const state of ['open', 'closed', 'graded', 'finalized']) {
  for (const prize of [{ valid_entries: 0, prize_dollars: 0 }, { valid_entries: 80, prize_dollars: 80 }, { valid_entries: 143, prize_dollars: 100 }]) {
    test(`${state} prize preserves authoritative ${prize.valid_entries} entries / $${prize.prize_dollars}`, () => {
      const html = renderToStaticMarkup(<Prize weekId="fixture" initialPrize={prize} />);
      assert.match(html, /Valid entries/);
      assert.match(html, /Calculated prize/);
      assert.match(html, new RegExp(`>${prize.valid_entries}</dd>`));
      assert.match(html, new RegExp(`>\\$${prize.prize_dollars}</dd>`));
      assert.doesNotMatch(html, /Final prize|Final entries|claimed|paid/i);
    });
  }
}
test('missing authoritative count does not fabricate zero', () => {
  const html = renderToStaticMarkup(<Prize weekId="fixture" initialPrize={null} />);
  assert.match(html, /temporarily unavailable/);
  assert.doesNotMatch(html, /\$0/);
});
test('single prize summary precedes the form outside collapsed rules; existing query is reused', () => {
  const page = readFileSync('app/pickem/page.tsx', 'utf8');
  assert.equal(page.match(/<PickemPrize scope=/g)?.length, 1);
  assert.ok(page.indexOf('<PickemPrize scope=') < page.indexOf('<PickemSlateForm key='));
  const disclosure = page.slice(page.indexOf('{contestWeek ? <details'), page.indexOf('</details>'));
  assert.doesNotMatch(disclosure, /<PickemPrize|<details[^>]*\bopen\b/);
  for (const term of ['Official Rules', 'Privacy Notice', '$1 per valid accepted entry', 'New-entry deadline:', 'eligibility attestation']) assert.ok(disclosure.includes(term));
  assert.ok(disclosure.includes("Graded results alone do not finalize the prize"));
});
