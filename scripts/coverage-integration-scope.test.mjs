import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {needsIntegration} from './coverage-integration-scope.mjs';
const fixture = path => path === 'scripts/coverage-integration-scope.mjs' ? '' : readFileSync(path,'utf8');
test('presentation scope retains pure checks; contract, selector and unknown dependencies restore integration',()=>{
 assert.equal(needsIntegration(['lib/weekly-refinements.test.ts'],fixture,fixture),false);
 for(const path of ['types/coverage-demand.ts','lib/coverage-demand-summary.ts','components/useCoverageEpisode.ts','supabase/migrations/new.sql','package-lock.json']) assert.equal(needsIntegration([path],fixture,fixture),true,path);
 const changed = path => path === 'lib/unified-games.ts' ? fixture(path).replace('export function selectWeeklyGames(', 'export function changedSelection(') : fixture(path);
 assert.equal(needsIntegration(['lib/unified-games.ts'],fixture,changed),true);
 const hook = path => path === 'components/WeeklyGamesExplorer.tsx' ? fixture(path).replace('params.radius, params.q','params.radius, params.filter') : fixture(path);
 assert.equal(needsIntegration(['components/WeeklyGamesExplorer.tsx'],fixture,hook),true);
 const workflow = path => path === '.github/workflows/coverage-demand-v1.yml' ? fixture(path).replace('node scripts/test-coverage-demand-browser.mjs','echo omitted') : fixture(path);
 assert.equal(needsIntegration(['.github/workflows/coverage-demand-v1.yml'],fixture,workflow),true);
 assert.equal(needsIntegration(['scripts/coverage-integration-scope.mjs'],()=> 'old policy',()=> 'new policy'),true);
});
