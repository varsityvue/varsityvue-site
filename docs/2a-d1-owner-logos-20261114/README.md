# Owner-supplied 2A Division I logos — November 14, 2026

Source: VarsityVue_2A_D1_logos(3).zip, 48 PNGs. Beckville is absent.

All 48 are new registry entries on production main e69226b6014f9b86a78060db6b8567263b21c804. No existing artwork is replaced. PR #149's Division II branch has no school-logo registry diff; this branch does not include that work.

`inventory.json` records every filename, exact catalog ID/slug, source SHA256, alpha crop bounds, transparent padding, output dimensions and asset SHA256. This is provenance documentation, not a runtime registry. The sole runtime registry remains data/school-logos.ts.

## Qualified identity matching

| Bracket shorthand | Owner filename prefix / canonical catalog ID and slug |
| --- | --- |
| Carlisle | Price-Carlisle / price-carlisle |
| Leon | Jewett-Leon / jewett-leon |
| Pewitt | Omaha-Pewitt / omaha-pewitt |
| Union Grove | Gladewater-Union-Grove / gladewater-union-grove |
| Highland Park | Amarillo-Highland-Park / amarillo-highland-park |
| Johnson City | Johnson-City-LBJ / johnson-city-lbj |

These qualified identifiers already exist; no alternate registry entries or school catalog changes are introduced.

## Asset processing

All source PNGs decode as RGBA. Main assets are cropped to the nonzero-alpha bounds, then given 4% transparent padding. Every retained RGBA pixel is preserved exactly, with no resizing, recoloring, redrawing or background removal. Original aspect ratios and internal transparency are unchanged. Leon, Farwell, Spearman, Waskom, Flatonia and Ganado use the existing subtle alpha-only glow on dark shared-component surfaces; the source pixels and school colors are unchanged. Smaller 300×200 sources remain at their native resolution; do not upscale them for large print use.

The established scripts/normalize-pickem-logos.ts generates 192×192 transparent Pick 'Em derivatives for the 48 exact slugs only. Existing general and Pick 'Em files remain byte-identical; existing-asset-hashes.json records all 148 original asset file hashes.

## Verification

lib/school-owner-logos.test.tsx checks exact identities, asset hashes, decoding, alpha, shared component rendering, preserved artwork and Beckville fallback. The existing interactive bracket workflow now triggers for logo assets and the shared registry, and includes this test. Its browser script also checks all 48 school hubs, 48 text-only schedules, all 32 DI first-round and 16 Area Game Centers, and four DI regions on desktop/iPhone/Android, plus a 26/64px light/dark contrast sheet. Existing score fallback and advancement regressions remain intact.

School schedules have no logo image slot in their existing design; this change preserves that design. Shared logo consumers cover Playoff Central cards, connected statewide/regional Road to State, Game Centers and school hubs.

## Beckville continuation

When the owner supplies verified Beckville artwork, add public/logos/schools/beckville.png, add a single `beckville` entry to schoolLogoBySlug, and run `node --import tsx scripts/normalize-pickem-logos.ts beckville`. Update the explicit missing-logo regression in lib/school-owner-logos.test.tsx and rerun verification. Do not invent artwork.

No game catalogs, scores, schedules, bracket participants, advancement logic, database/schema, permissions or production settings are changed. No merge or production deployment is authorized.
