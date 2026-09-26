# Week 5 product audit operating notes

## School results and directory

The Season Overview uses `orderPlayedFinals` to sort scored, played finals by kickoff, then week and ID. Last 5 reads left to right, oldest to newest. The directory includes the original `pilot` programs as Featured Schools and schools referenced by canonical games as tracked schools. A tracked school's available statistics, roster and editorial coverage may be sparse. Additional teams appearing in canonical games without a verified school record link to their filtered matchup results, without claiming a School Hub or inventing metadata.

## Score operations

The `score_submissions` pending queue is available at `/internal/score-review`. An admin or moderator sees its count on the global Account control and the Account tools link. The count reflects pending rows only; trusted moderator/admin reports are automatically approved by the existing `submit_score_submission` RPC and therefore do not linger as review alerts. The Scores Explorer shows the latest final date's full slate with search and classification groups. Followed matchups appear first and are excluded from their later classification group to avoid duplicate cards. It uses the existing `school_follows` table.

Live period and clock are stored in `game_state` and propagated through both dynamic game and scoreboard models. `liveGameContext` formats only values on file. The public report form offers 1st–4th, OT and several numbered OT options. Server validation accepts arbitrary numbered OT periods for future overtime depth.

## Pick ’Em

Per-game locks remain at canonical kickoff. A weekly submission boundary is `pickem_weeks.closes_at`, set to 7 PM America/Chicago on Friday by the slate setup action. The public CLOSED label is computed at request time, even while the database enum still says `open`; a forward migration also enforces that boundary on writes and in `pickem_game_cards`. Grading is a separate lifecycle and can continue after closure.

Week 5 has no tiebreaker prediction. From Week 6, a designated Game of the Week must be among selected games before opening the slate; its `pickem_games.id` is saved on the week. Entrants predict one combined total per week, editable until close. Weekly standings rank correct picks first, then absolute distance from the verified played/tie GOTW total. If the featured game is void, postponed, cancelled, a scoreless forfeit or lacks a verified final, the distance is inactive. Equal remaining results share rank; user ID provides stable presentation order. Keep the designation and kickoff verified before opening the Week 6 slate.

## Identity inventory

Prominent identity: `SchoolBadge` md/lg, Game Center crests, Schools directory and featured school cards use a normalized logo when registered; the Featured Schools and desktop School Hero matchup now opt in for compact logo use. Compact badges in score lists, standings, game strips and dense matchup cards retain initials for legibility. Text-only team names are appropriate when a compact badge would repeat nearby information. `SchoolBadge` and Game Center keep initials fallback when no registered logo exists. The broader header/card redesign remains outside this audit.

## Data safeguard

The Holliday at Whitesboro matchup is deliberately missing a final. No score import or cleanup for that game belongs to this audit. The existing Score Scout missing-score queue should be tested separately without publishing a result.
