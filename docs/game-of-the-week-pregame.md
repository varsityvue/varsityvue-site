# Game of the Week: Monday pregame content

For each week's designated Game of the Week, publish a short, matchup-specific Game Center summary **no later than Monday** of game week. Add the summary when setting the Game of the Week flag whenever possible.

1. Confirm the canonical game ID and designation in `lib/games.ts` (`GAME_OF_THE_WEEK_IDS`).
2. Add a matching entry in `data/game-previews.ts`. Write the `eyebrow`, `title`, and a concise `excerpt` using verified information available at that time: records, verified rankings, recent results, district stakes, or other established context. Leave `paragraphs` empty for Game of the Week. Do not fill gaps with assumed stats or claims. Cite the sources in the editorial work record before publishing; update the summary as verified facts arrive.
3. Run `npm run test:games`. The production `prebuild` gate also checks that every designated Game of the Week has a written 60–350 character summary and no duplicate article paragraphs. A new designation cannot deploy with the generic matchup placeholder.
4. When a full preview article is ready, add it to `data/articles.ts` with `type: "preview"`, `humanReviewed: true`, and the same canonical `gameId`. `getGamePreview` automatically adds **Read Game Preview →** using the article slug. The Game Center excerpt remains the separately written text in `data/game-previews.ts`; editing the article does not rewrite that summary.
5. Check the Game Center on a phone and desktop, and follow its CTA to the article. Other games can retain the generic pregame fallback unless they receive their own matchup-specific preview entry.

For Week 6, complete steps 1–3 by Monday, September 28, 2026, whether or not a full article is planned.
