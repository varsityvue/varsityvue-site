# Game of the Week: Monday pregame content

Status: CURRENT EDITORIAL GUIDANCE, with historical Week 6 deadline superseded by [Season Operations](2026-season-operations-plan.md). Editorial feature / Game of the Week and Pick ’Em tiebreaker are independent concepts. A district-preview feature need not designate a matchup. These instructions apply only to an explicitly chosen editorial matchup; they do not configure a contest.

For each week's designated Game of the Week, publish a short, matchup-specific Game Center summary **no later than Monday** of game week. Add the summary when setting the Game of the Week flag whenever possible.

1. Confirm the canonical game ID and designation in `lib/games.ts` (`GAME_OF_THE_WEEK_IDS`).
2. Add a matching entry in `data/game-previews.ts`. Write the `eyebrow`, `title`, and a concise `excerpt` using verified information available at that time: records, verified rankings, recent results, district stakes, or other established context. Leave `paragraphs` empty for Game of the Week. Do not fill gaps with assumed stats or claims. Cite the sources in the editorial work record before publishing; update the summary as verified facts arrive.
3. Run `npm run test:games`. The production `prebuild` gate also checks that every designated Game of the Week has a written 60–350 character summary and no duplicate article paragraphs. A new designation cannot deploy with the generic matchup placeholder.
4. When a full preview article is ready, add it to `data/articles.ts` with `type: "preview"`, `humanReviewed: true`, and the same canonical `gameId`. `getGamePreview` automatically adds **Read Game Preview →** using the article slug. The Game Center excerpt remains the separately written text in `data/game-previews.ts`; editing the article does not rewrite that summary.
5. Check the Game Center on a phone and desktop, and follow its CTA to the article. Other games can retain the generic pregame fallback unless they receive their own matchup-specific preview entry.

Historical September 28 Week 6 deadline is no longer an active task. The current Week 6 homepage district preview and Goldthwaite–Miles Pick ’Em tiebreaker are recorded separately in Season Operations.
