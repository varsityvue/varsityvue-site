import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const { load } = createRequire(import.meta.url)('js-yaml');
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
  // Retain every original sensitive step verbatim apart from the new condition.
  const sensitive = text => (load(text)?.jobs?.verify?.steps ?? []).filter(step => /test-coverage-demand|supabase|psql|coverage_demand_.*\.sh/.test(JSON.stringify(step))).map(step => {const copy={...step}; delete copy.if; return copy;});
  if (JSON.stringify(sensitive(before('.github/workflows/coverage-demand-v1.yml'))) !== JSON.stringify(sensitive(after('.github/workflows/coverage-demand-v1.yml')))) return true;
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
