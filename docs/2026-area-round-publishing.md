# 2026 playoff area-round publishing runbook

## Source of truth
- Bracket positions: `data/playoff-bracket-fields.ts` (UIL-linked brackets).
- Published game schedule: `data/games.ts` aggregated by `lib/games.ts`.
- Verified results: `public_score_states` / `public_game_state` loaded by `lib/dynamic-games.ts`.
- Publishing queue: `getAreaRoundReadiness(games)` in `lib/area-round-readiness.ts`. Read-only; never writes games or guesses details.

## Game-night to publication
1. Check the two corresponding bi-district games for a verified final result; handle forfeit via official winner slug and never advance a no-contest automatically.
2. Confirm the resulting area pairing against UIL bracket position and school/UIL announcements. Never substitute a projected winner.
3. Confirm home/away designation, **exact** kickoff (Central time with UTC offset), venue, and reliable source. If any are pending, keep the game out of the published schedule rather than inventing details.
4. Add one unique `Game` record with `season: 2026`, `gameType: "playoff"`, `playoff.round: "Area"`, proper division and region, team names matching the bracket registry, both school slugs when available, `status: "upcoming"`, `districtGame: false`, `sourceStatus`, and `sourceLabel`. Use the existing repository game publishing path; do not insert a new game only into score-state tables.
5. Run prebuild tests, TypeScript, production build and preview. Verify the new matchup appears in Playoff Central's game cards, Game Center, and the correct bracket slot; check mobile horizontal scrolling.
6. Obtain release approval, merge, then confirm production. After the game, only verified final scores may advance the bracket.

## Release gates
- No duplicate area pairing or conflicting game IDs.
- Both participants are verified winners of adjacent first-round slots.
- No fabricated venue, kickoff, source or score.
- Do not use scores from a different season or a regular-season rematch.
- Forfeit and no-contest follow `verifiedWinner` fail-closed rules.
- A newly scheduled game does not imply a verified result.

## Fan-experience roadmap
1. Mobile region/school filters and quick jumps (without changing game truth).
2. A 'Your school's path' view, with confirmed opponents vs TBD clearly differentiated.
3. 'What changed since your last visit' for verified results and newly confirmed games.
4. Shareable school-specific bracket deep links and upcoming game cards.
5. Optional alerts for new confirmed matchups and verified finals, requiring user opt-in.
6. Weekly engagement analytics: repeat visits, bracket interactions, school-follow conversion and Game Center clicks.

Prioritize low-maintenance features over speculative predictions or unverifiable live scores.
