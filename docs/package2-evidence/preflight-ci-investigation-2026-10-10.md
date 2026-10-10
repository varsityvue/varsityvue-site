# Package 2 CI preflight correction

Production remains Package 1. No merge, deployment, database write or monitoring activation is authorized by this correction.

## Compared revisions

- Production/main baseline: `ae2860b13f27108c38e169a26e035d1bd10b23bb`.
- Previously reviewed candidate: `7f22dfcb447c0b71fd41a78eaa052d6fc064db46`, tree `501348a561595da7bca772daa6691b2e228b7aa2`.
- PR: https://github.com/varsityvue/varsityvue-site/pull/76.

## Findings

Unified Games CI run 38094724651 failed twice at the unchanged season Back assertion (jobs 114338173649 and 114340355570). Fresh isolated synthetic browsers used separately installed main and candidate dependencies. Main passed 20 history transitions. Candidate reproduced a persistent URL/control mismatch: pushState season2026, popstate season2025, then delayed Next replaceState season2026, while the control stayed2025. Waiting five seconds did not repair it. Next16.4's supported native history wrapper queues router restoration in a transition; a stale router commit can overwrite the traversed entry.

The correction captures the exact URL on popstate and passes it through public replaceState before local state restoration. It creates no history entry, no popstate recursion, no server navigation or extra database request, and preserves the query and hash. An isolated 30-transition experiment passed without an immediate mismatch. A flushSync experiment failed and was discarded.

The original full browser suite passed the Games and Scoreboard season-history, following-failure, and ordered-refresh checks with the correction experiment. It subsequently failed the Near Me empty-state assertion at line296 (0 vs1); full-suite success is NOT claimed. Updated repository CI must verify the revised test and investigate any further failure.

Coverage demand CI run38094724629 has exactly the same three failures reproduced on unchanged main and candidate: invalid range validation (true vsfalse), stage presentation (status_filter_excluded vsquery_filter_excluded), and held-row presentation (true vsfalse). The relevant implementation and test files are unchanged from main. Required CI remains failed; baseline equivalence does not make a failed check pass. No tests or required-check settings were weakened.

## Correction verification

- Focused unit tests:40/40 passed.
- TypeScript:passed.
- Lint:0errors,13existing warnings.
- Production build:passed;64prebuild tests and80generated pages.
- Syntax and whitespace checks:passed.
- Independent review:no material implementation, privacy, authorization or request-behavior findings. Requested delayed assertion was added to guard late router commits.
- Updated browser regression:five Back/Forward cycles on both Games and Scoreboard, retained classification/result/week, URL/control agreement, plus a one-second delayed final assertion. Updated CI pending at preparation.

## Isolation and remaining gate

The temporary sandbox used only synthetic data, no production credentials and no exposed ports. Network access was denied after dependency bootstrap; sandbox stopped after testing. Upload of revised local source to this sandbox was rejected by automatic approval review because the destination was not explicitly authorized; no retry or bypass was attempted. The revised candidate uses the repository's existing GitHub CI instead.

No production load testing occurred. Existing native-platform RLS/scoring evidence remains attached to the original Package2 tree; the correction changes only browser history restoration and its test, with no database/auth/publication changes.

Fresh exact-head authorization and passing required checks (or an explicitly approved baseline-remediation decision) are required before any release. Monitoring remains disabled.
