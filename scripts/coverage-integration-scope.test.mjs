import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {needsIntegration, safeChecksAreUnconditional} from './coverage-integration-scope.mjs';
const {load, dump} = createRequire(import.meta.url)('js-yaml');
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

const coverageWorkflow = '.github/workflows/coverage-demand-v1.yml';
const unifiedWorkflow = '.github/workflows/games-page-organization-v1.yml';
const current = path => readFileSync(path, 'utf8');
const changedWorkflow = (path, transform) => file => file === path ? transform(current(file)) : current(file);

test('sensitive step condition changes restore integration', () => {
  for (const condition of ['false', "github.head_ref != 'hidden-branch'", 'always()']) {
    const changed = changedWorkflow(coverageWorkflow, text => text.replaceAll(
      "if: steps.scope.outputs.integration == 'true'", `if: ${condition}`,
    ));
    assert.equal(needsIntegration([coverageWorkflow], current, changed), true, condition);
  }
  const removed = changedWorkflow(coverageWorkflow, text => text.replaceAll(
    "        if: steps.scope.outputs.integration == 'true'\n", '',
  ));
  assert.equal(needsIntegration([coverageWorkflow], current, removed), true);
});

test('job-level exclusions in either workflow restore integration', () => {
  for (const path of [coverageWorkflow, unifiedWorkflow]) {
    const changed = changedWorkflow(path, text => text.replace('  verify:\n', '  verify:\n    if: false\n'));
    assert.equal(needsIntegration([path], current, changed), true, path);
  }
});

const editedYaml = (path, edit) => changedWorkflow(path, text => {
  const workflow = load(text);
  edit(workflow.jobs.verify);
  return dump(workflow);
});

test('each of the eleven sensitive conditions is compared, not discarded', () => {
  const steps = load(current(coverageWorkflow)).jobs.verify.steps;
  const indices = steps.flatMap((step, index) => step.if === "steps.scope.outputs.integration == 'true'" ? [index] : []);
  assert.equal(indices.length, 11);
  for (const index of indices) {
    const changed = editedYaml(coverageWorkflow, job => { job.steps[index].if = false; });
    assert.equal(needsIntegration([coverageWorkflow], current, changed), true, steps[index].name ?? steps[index].run ?? steps[index].uses);
  }
});

test('both workflows retain unconditional safe checks and reject conditional or ignored failures', () => {
  for (const path of [coverageWorkflow, unifiedWorkflow]) {
    assert.equal(safeChecksAreUnconditional(current(path)), true, path);
    const steps = load(current(path)).jobs.verify.steps;
    for (const [index, step] of steps.entries()) {
      if (Object.hasOwn(step, 'if')) continue; // Sensitive checks and artifact uploads.
      for (const field of ['if', 'continue-on-error']) {
        const changed = editedYaml(path, job => { job.steps[index][field] = field === 'if' ? false : true; });
        assert.equal(safeChecksAreUnconditional(changed(path)), false, `${path}: ${field}: ${step.name ?? step.run ?? step.uses}`);
        assert.equal(needsIntegration([path], current, changed), true);
      }
    }
    const ignoredJob = editedYaml(path, job => { job['continue-on-error'] = true; });
    assert.equal(safeChecksAreUnconditional(ignoredJob(path)), false);
    assert.equal(needsIntegration([path], current, ignoredJob), true);
    for (const command of ['node --import tsx --test ', 'npx tsc --noEmit', 'npm run lint', 'npx eslint ', 'npm run build', 'node scripts/test-unified-games-browser.mjs']) {
      if (!steps.some(step => step.run?.startsWith(command))) continue;
      const missing = editedYaml(path, job => { job.steps = job.steps.filter(step => !step.run?.startsWith(command)); });
      assert.equal(safeChecksAreUnconditional(missing(path)), false, `${path}: missing ${command}`);
      assert.equal(needsIntegration([path], current, missing), true);
    }
  }
});

test('only the exact initial reviewed integration condition may be added', () => {
  const before = path => {
    if (path === 'scripts/coverage-integration-scope.mjs') return '';
    if (path !== coverageWorkflow) return current(path);
    const workflow = load(current(path));
    for (const step of workflow.jobs.verify.steps) if (step.if === "steps.scope.outputs.integration == 'true'") delete step.if;
    return dump(workflow);
  };
  assert.equal(needsIntegration([coverageWorkflow, 'scripts/coverage-integration-scope.mjs'], before, current), false);
  const invalid = changedWorkflow(coverageWorkflow, text => text.replaceAll("if: steps.scope.outputs.integration == 'true'", 'if: false'));
  assert.equal(needsIntegration([coverageWorkflow], before, invalid), true);
  assert.equal(needsIntegration(['scripts/coverage-integration-scope.mjs'], current, path => path === 'scripts/coverage-integration-scope.mjs' ? current(path) + '\n// policy edit' : current(path)), true);
});

test('malformed or missing workflows fail closed', () => {
  for (const path of [coverageWorkflow, unifiedWorkflow]) for (const text of ['', 'jobs: [', 'jobs: {}']) {
    assert.equal(safeChecksAreUnconditional(text), false);
    assert.equal(needsIntegration([path], current, file => file === path ? text : current(file)), true);
  }
});
