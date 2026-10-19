import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import SchoolGameNight from "@/components/SchoolGameNight";
import { getSchoolRecentForm } from "@/lib/team-hub-form";
import { getSchoolBySlug } from "@/lib/schools";
import type { Game } from "@/types/platform";
const school = getSchoolBySlug("de-leon")!;
const final = { id: "hico-at-de-leon-2026-week-8", status: "final", gameType: "regular", homeSchoolSlug: "de-leon", awaySchoolSlug: "hico", homeTeam: "De Leon", awayTeam: "Hico", homeScore: 49, awayScore: 7, kickoff: "2026-10-16T00:00:00Z", publicScoreVerified: true, scoreAttribution: { type: "verified" } } as Game;
function render(game = final, games = [game], slug = "de-leon") { return renderToStaticMarkup(<SchoolGameNight school={getSchoolBySlug(slug)!} focus={{ featured: game, next: undefined }} games={games} />); }
test("Hico away 7 and De Leon home 49 stay paired; final, Game Center and no summary attribution", () => {
 const html = render();
 assert.match(html, /Final score, away team first/);
 assert.match(html, /Away<\/span><span[^>]*>Hico<\/span>/);
 assert.match(html, /Hico: <\/span>7<span/);
 assert.match(html, /Home<\/span><span[^>]*>De Leon<\/span>/);
 assert.match(html, /De Leon: <\/span>49<span/);
 assert.match(html, /FINAL/); assert.match(html, /href="\/games\/hico-at-de-leon-2026-week-8"/);
 assert.doesNotMatch(html, /Verified by VarsityVue/);
 assert.equal((html.match(/>Winner</g) ?? []).length, 1);
});
for (const [name, game, result] of [
 ["home victory", final, "W"],
 ["away victory", { ...final, homeSchoolSlug: "hico", awaySchoolSlug: "de-leon", homeTeam: "Hico", awayTeam: "De Leon", homeScore: 7, awayScore: 49 }, "W"],
 ["loss", { ...final, homeScore: 7, awayScore: 49 }, "L"],
 ["tie", { ...final, homeScore: 7, awayScore: 7, resultType: "tie" }, "T"],
] as const) test(name + " uses De Leon's perspective", () => {
 assert.equal(getSchoolRecentForm([game as Game], "de-leon")[0].result, result);
 const html = render(game as Game);
 assert.match(html, new RegExp(`aria-label="${result === "W" ? "Win" : result === "L" ? "Loss" : "Tie"} against`));
 if (result === "T") assert.doesNotMatch(html, />Winner</);
});
test("latest five use existing chronological ordering, oldest to newest, without mutating source", () => {
 const games = [6, 2, 4, 1, 3, 5].map(n => ({ ...final, id: `game-${n}`, week: n, kickoff: `2026-09-${String(n).padStart(2,"0")}T00:00:00Z`, homeScore: n % 2 ? 7 : 49, awayScore: n % 2 ? 49 : 7 }));
 const before = JSON.stringify(games); const form = getSchoolRecentForm(games,"de-leon");
 assert.deepEqual(form.map(r => r.game.id), ["game-2","game-3","game-4","game-5","game-6"]);
 assert.deepEqual(form.map(r => r.result), ["W","L","W","L","W"]);
 assert.equal(JSON.stringify(games),before);
 assert.match(render(final, games), /Last 5 results, oldest to newest/);
});
test("fewer than five, score-only values, missing, unverified, exceptional and unrelated results", () => {
 const nested = { ...final, id: "nested", homeScore: undefined, awayScore: undefined, score: { home: 49, away: 7 } };
 const invalid = [
 { ...final, homeScore: undefined }, { ...final, awayScore: NaN }, { ...final, status: "upcoming" }, { ...final, status: "live", publicScoreVerified: false },
 { ...final, publicScoreVerified: false }, { ...final, resultType: "forfeit" }, { ...final, resultType: "no_contest" },
 { ...final, gameType: "scrimmage" }, { ...final, gameType: "bye" }, { ...final, homeSchoolSlug: "cisco" },
 ] as Game[];
 assert.deepEqual(getSchoolRecentForm(invalid,"de-leon"),[]);
 assert.equal(getSchoolRecentForm([nested],"de-leon").length,1);
 for (const game of invalid.slice(0,5)) assert.doesNotMatch(render(game), /Final score, away team first/);
 assert.doesNotMatch(render(final,[]), /Last 5/);
});
test("Hico and Cisco retain previous scorecard and do not gain De Leon form", () => {
 for(const slug of ["hico","cisco"]) { const html=render(final,[final],slug);assert.doesNotMatch(html,/Final score, away team first|Last 5 results/);assert.match(html,/Verified by VarsityVue/); }
});
