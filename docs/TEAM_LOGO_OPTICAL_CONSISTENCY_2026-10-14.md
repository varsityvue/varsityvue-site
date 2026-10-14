# Team logo optical consistency — October 14, 2026

Baseline main/production da857efa5a2e899eb305902f6c31a526cea6c6be (PR #88 merged). Original image bytes, registry paths and aspect ratios unchanged. Controls live in data/school-logos.ts; directory, shared logo/badge and game crest consumers apply them. Pick ’Em uses its already-normalized derivatives and the composed glow filter, including optimized Next image URLs. No general-image scaling applied to Pick ’Em.

Exactly 29 teams adjusted below. Clyde is reviewed and left unchanged as the reference for Crawford. Five other PR #88 glows (Brownwood, Colorado City, Jarrell, Marble Falls, Mason) retain their exact strength. Existing six-team CSS remains as a fallback for legacy consumers; new controls use no additional per-team CSS selectors or solid backgrounds.

## Per-team controls and measured mobile artwork

Scale values are uniform, centered multipliers. Directory overrides are used only when needed to keep large hub marks within safe margins. Wide directory frames are 76px; default frames remain 56px mobile / 64px desktop. Visible bounds below come from PNG alpha bounds combined with actual rendered object-contain geometry, not image-container dimensions.

| Team slug | General scale | Directory scale | Wide frame | Glow | Visible before → after, at 390px |
|---|---:|---:|---|---|---|
| abilene-texas-leadership | 1.00 | 1.00 | 76px | unchanged | 42.0×24.9 → 62.0×36.8px |
| burnet | 1.06 | 1.06 | default | unchanged | 42.0×34.2 → 44.5×36.3px |
| holland | 1.06 | 1.08 | default | unchanged | 42.0×23.2 → 45.4×25.1px |
| meridian | 1.00 | 1.00 | default | subtle | 42.0×29.1 → 42.0×29.1px |
| moody | 1.00 | 1.00 | default | reduced | 42.0×36.2 → 42.0×36.2px |
| roscoe | 1.06 | 1.10 | default | unchanged | 42.0×15.7 → 46.2×17.2px |
| anson | 1.05 | 1.05 | 76px | unchanged | 30.5×26.6 → 47.3×41.2px |
| canyon-west-plains | 1.20 | 1.20 | default | unchanged | 32.9×26.6 → 39.5×31.9px |
| china-spring | 1.52 | 1.52 | default | unchanged | 25.1×26.6 → 38.1×40.4px |
| clifton | 1.00 | 1.00 | default | subtle | 28.8×26.6 → 28.8×26.6px |
| crawford | 1.20 | 1.20 | default | unchanged | 36.6×24.4 → 43.9×29.3px |
| cross-plains | 1.40 | 1.40 | default | subtle | 26.9×26.6 → 37.7×37.2px |
| dublin | 1.14 | 1.14 | default | unchanged | 35.2×26.6 → 40.2×30.3px |
| early | 1.00 | 1.00 | default | subtle | 33.9×26.6 → 33.9×26.6px |
| eastland | 1.22 | 1.22 | default | unchanged | 32.7×26.6 → 39.9×32.5px |
| florence | 1.45 | 1.45 | default | unchanged | 28.0×26.6 → 40.6×38.6px |
| frost | 1.35 | 1.35 | default | unchanged | 29.1×26.6 → 39.2×35.9px |
| hamlin | 1.12 | 1.12 | default | unchanged | 36.6×18.8 → 41.0×21.1px |
| hawley | 1.18 | 1.18 | default | subtle | 34.0×26.6 → 40.1×31.4px |
| hubbard | 1.50 | 1.50 | default | unchanged | 26.2×26.7 → 39.3×40.1px |
| lampasas | 1.00 | 1.00 | default | subtle | 36.6×24.8 → 36.6×24.8px |
| mart | 1.40 | 1.40 | default | unchanged | 28.8×26.6 → 40.3×37.2px |
| merkel | 1.10 | 1.10 | default | unchanged | 36.7×23.2 → 40.3×25.6px |
| miles | 1.10 | 1.10 | default | unchanged | 37.0×22.4 → 40.7×24.6px |
| millsap | 1.28 | 1.28 | default | unchanged | 30.3×26.6 → 38.8×34.0px |
| rio-vista | 1.28 | 1.28 | default | unchanged | 30.5×26.6 → 39.0×34.0px |
| tolar | 1.08 | 1.08 | 76px | subtle | 36.7×15.3 → 58.5×24.3px |
| winters | 1.35 | 1.35 | default | unchanged | 28.0×26.5 → 37.8×35.8px |
| wortham | 1.22 | 1.22 | default | unchanged | 33.7×26.6 → 41.1×32.5px |

## Glow

Subtle alpha-based white silhouette glow: Hawley, Tolar, Clifton, Lampasas, Meridian, Cross Plains, Early. Shadows use 1px/2px blur with white alpha .65/.30. Moody is reduced to 1px/2px blur with alpha .55/.18 (was 2px/4px, .90/.50). No rectangular backgrounds or artwork recoloring. Hawley/Early’s former Pick ’Em brightness/contrast filters are replaced by silhouette glow to preserve official image colors. Existing PR #88 legacy shadows remain unchanged for the five reference marks.

## Verification and release

Before/after directory screenshots captured at 390px and 1280px; all 69 logo assets measured, with artwork safe-margin checks. Brownwood comparison informs Dublin without forcing identical dimensions. Clyde stays fixed; Crawford’s visible filled area is approximately 95% of Clyde’s in the mobile directory. Image files and team records remain unchanged. Compact xs/sm text badges keep their established design.

Full browser results, screenshots, exact package hashes and CI/Preview results are saved outside the repository. The referenced PDF was not accessible in this execution environment; the explicit owner team list and measured production-baseline directory were used. No claim of PDF review. Rollback after separately authorized publication: revert the single optical-consistency commit; no data or migration rollback. Do not merge or deploy without separate approval.
