# Week 8 coach statistics — October 17, 2026

The owner supplied these coach statistics directly and instructed that reported discrepancies remain unchanged. The source batch is preserved in `data/owner-week8-game-stats.ts`; the shared core catalog updates individual team, player, area and district statistics. Detailed game tables preserve the additional supplied metrics.

| Game | Imported coverage |
| --- | --- |
| China Spring at Stephenville, 21–55 | Both quarter scores; Stephenville offense only |
| Hico at De Leon, 7–49 | Both quarter scores; De Leon offense only |
| Stamford at Cross Plains, 49–13 | Stamford offense only; no quarter splits supplied |
| Cisco at Hawley, 31–35 | Both quarter scores only |
| Goldthwaite at Albany, 56–0 | Both quarter scores only |
| Comanche at Dublin, 40–0 | Comanche offense only; no quarter splits supplied |

## Outstanding reporting

**Still need Week 8 team and individual statistics from Albany, Cisco and Goldthwaite.** These games display pending-stat notes. No offensive data was supplied for China Spring, Hico, Cross Plains, Hawley or Dublin in this batch. No opponent player statistics, scoring-play chronology, photographs or credits were invented.

## Source handling

- Stephenville has 22 passing completions and 21 receptions. De Leon has 15 completions and 16 receptions. Comanche has 82 passing yards and 93 receiving yards. Preserve each coach-supplied category independently; these are partial reports, not corrections to be inferred.
- Blank TD, INT and long-gain cells remain unknown. Stamford supplies QB passing touchdowns only; rushing and receiving touchdown blanks are not zeroes.
- Explicit supplied zeroes remain zeroes. Total offensive yards are derived only as reported passing yards plus reported rushing yards: Stephenville 591, De Leon 457, Stamford 440, Comanche 523.
- Use existing full-name identities where available. Mason Shaver (#9, junior) and Carter VanZandt (#21, junior) were checked against the Stephenville MaxPreps roster: https://www.maxpreps.com/tx/stephenville/stephenville-yellow-jackets-honeybees/football/roster/ . Do not infer grades where absent.
- Existing finals for Stamford–Cross Plains and Comanche–Dublin are retained without fabricated quarter splits.
- Reconciliation also exposed an older Week 6 Cross Plains–Albany completeness claim: receiving TD blanks had been labeled complete. Its passing/receiving metadata is now partial; no older statistic was changed.

Week 8 remains the featured Game of the Week through the weekend. This statistics import does not change the homepage feature or the separately scheduled Monday switch to Stephenville at Jarrell.
