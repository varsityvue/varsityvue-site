import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
const { load } = createRequire(import.meta.url)('js-yaml');
const integrationCondition = "steps.scope.outputs.integration == 'true'";
const workflows = [
  '.github/workflows/coverage-demand-v1.yml',
  '.github/workflows/games-page-organization-v1.yml',
];
const sensitiveStep = step => step.uses?.startsWith('supabase/') || /(?:^|\n)\s*(?:supabase\s|PGPASSWORD=.*\bpsql\b|bash\s+supabase\/tests\/coverage_demand_|node\s+(?:--import\s+tsx\s+)?scripts\/test-coverage-demand)/.test(step.run ?? '');
export function safeChecksAreUnconditional(text) {
  try {
    const job = load(text)?.jobs?.verify;
    if (!job || Object.hasOwn(job, 'if') || (Object.hasOwn(job, 'continue-on-error') && job['continue-on-error'] !== false) || !Array.isArray(job.steps)) return false;
    const safe = job.steps.filter(step => !sensitiveStep(step) && !step.uses?.startsWith('actions/upload-artifact@'));
    if (safe.some(step => Object.hasOwn(step, 'if') || (Object.hasOwn(step, 'continue-on-error') && step['continue-on-error'] !== false))) return false;
    const commands = safe.map(step => step.run ?? '');
    return [
      command => /^node --import tsx --test /.test(command) && command.includes('scripts/coverage-integration-scope.test.mjs'),
      command => command === 'npx tsc --noEmit',
      command => command === 'npm run lint' || /^npx eslint /.test(command),
      command => command === 'npm run build',
      command => command === 'node scripts/test-unified-games-browser.mjs',
    ].every(required => commands.some(required));
  } catch {
    return false;
  }
}
function workflowNeedsIntegration(beforeText, afterText, initialPolicyAddition) {
  try {
    const beforeJob = load(beforeText)?.jobs?.verify;
    const afterJob = load(afterText)?.jobs?.verify;
    if (!beforeJob || !Array.isArray(beforeJob.steps) || !safeChecksAreUnconditional(afterText)) return true;
    // Job eligibility and error handling must never disappear from comparison.
    if (!isDeepStrictEqual(beforeJob.if, afterJob.if) || !isDeepStrictEqual(beforeJob['continue-on-error'], afterJob['continue-on-error'])) return true;
    const beforeSteps = beforeJob.steps.filter(sensitiveStep).map(step => {
      // Only the initial policy addition may add the exact reviewed condition
      // to an originally unconditional sensitive step. Later edits compare if.
      return initialPolicyAddition && !Object.hasOwn(step, 'if')
        ? { ...step, if: integrationCondition }
        : step;
    });
    return !isDeepStrictEqual(beforeSteps, afterJob.steps.filter(sensitiveStep));
  } catch {
    return true;
  }
}
// Only presentation/refinement changes qualify. Every unknown dependency fails
// closed to the original consent/HTTP/database suite, independent of branch name.
const presentation = new Set([
  'components/WeeklyGamesExplorer.tsx', 'lib/unified-games.ts',
  'lib/weekly-refinements.test.ts', 'scripts/test-unified-games-browser.mjs',
  '.github/workflows/games-page-organization-v1.yml',
  '.github/workflows/coverage-demand-v1.yml',
  'scripts/coverage-integration-scope.mjs', 'scripts/coverage-integration-scope.test.mjs',
]);
export function needsIntegration(paths, before, after) {
  if (paths.some(path => !presentation.has(path))) return true;
  // Shared selectors feed dormant summaries. Changes to their implementations
  // require integration coverage, even on a presentation branch.
  for (const name of ['selectWeeklyGames', 'parseWeeklyParams', 'applyWeeklyStatus']) {
    const part = text => text.match(new RegExp(`export function ${name}\\([\\s\\S]*?(?=\\nexport (?:function|type|const)|$)`))?.[0].replace(/\/\/.*$/gm, '').trim();
    if (part(before('lib/unified-games.ts')) !== part(after('lib/unified-games.ts'))) return true;
  }
  const measurement = text => text.split('\n').filter(line => /useCoverageEpisode|coverageSnapshot|buildWeeklySearchSummary|params\.radius, params\.q/.test(line)).join('\n');
  if (measurement(before('components/WeeklyGamesExplorer.tsx')) !== measurement(after('components/WeeklyGamesExplorer.tsx'))) return true;
  // A future edit to this policy restores integration. The initial addition is
  // reviewed as part of this PR; subsequent changes cannot silently reuse it.
  if (before('scripts/coverage-integration-scope.mjs') && before('scripts/coverage-integration-scope.mjs') !== after('scripts/coverage-integration-scope.mjs')) return true;
  const initialPolicyAddition = !before('scripts/coverage-integration-scope.mjs') && Boolean(after('scripts/coverage-integration-scope.mjs'));
  for (const path of workflows) {
    if (workflowNeedsIntegration(before(path), after(path), initialPolicyAddition)) return true;
  }
  return false;
}
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const base = process.argv[2];
  if (!/^[a-f0-9]{40}$/.test(base ?? '') || /^0+$/.test(base)) {
    console.log('integration=true');
  } else {
    const git = args => execFileSync('git', args, {encoding:'utf8',stdio:['ignore','pipe','pipe']});
    const paths = git(['diff','--name-only',base,'HEAD']).trim().split('\n').filter(Boolean);
    const before = path => {try {return git(['show',`${base}:${path}`]);} catch {return '';}};
    const after = path => {try {return readFileSync(path,'utf8');} catch {return '';}};
    console.error('Integration dependency selection:', JSON.stringify(paths));
    console.log(`integration=${needsIntegration(paths,before,after)}`);
  }
}
