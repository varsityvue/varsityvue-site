import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import ExtendedGameStatsPanel from "@/components/ExtendedGameStatsPanel";
import { extendedGameStats } from "@/data/extended-game-stats";
import { displayStatLabel, presentPlayerValues, presentExtendedNotes, presentTeamMetric } from "@/lib/extended-stat-presentation";

test("De Leon source values split without calculations or replacing missing values", () => {
  const stats = extendedGameStats.find((s) => s.gameId === "hico-at-de-leon-2026-week-8")!;
  const metric = presentTeamMetric(stats.teamMetrics[0], "home");
  assert.deepEqual(metric.fields.map((f) => f.value), ["15", "21", "226", ".714", "15.1", "2", "1", "—", "118.4", "—"]);
  assert.equal(metric.fields[4].label, "Average (source)");
  assert.ok(presentTeamMetric(stats.teamMetrics[0], "away").fields.every((f) => f.value === "—"));
  assert.equal(displayStatLabel("Y/Att"), "Yards / attempt");
});

test("only exact validated composite schemas decode; unusual input remains verbatim", () => {
  for (const value of ["1/2", "1/2/NaN", "1e3/2/3", "1,000/2/3", "1/2/3/4"]) {
    const result = presentTeamMetric({label: "Pass C/A/YDS", away: value, home: "—"}, "away");
    assert.equal(result.fallback, true);
    assert.equal(result.fields[0].value, value);
  }
  assert.deepEqual(presentTeamMetric({label:"Rush CAR/YDS/AVG", away:"0/-11/-.5", home:"—"}, "away").fields.map((f)=>f.value), ["0", "-11", "-.5"]);
  assert.equal(presentTeamMetric({label:"Pass C/Mystery", away:"1/2", home:"—"}, "away").fallback, true);
});

test("all current composites decode and all source datasets remain unchanged by presentation", () => {
  const before = JSON.stringify(extendedGameStats);
  for (const stats of extendedGameStats) for (const metric of stats.teamMetrics) {
    for (const side of ["away", "home"] as const) {
      const display = presentTeamMetric(metric, side);
      if (/^(Pass(?:ing)?|Rush(?:ing)?|Rec(?:eiving)?) /.test(metric.label)) assert.equal(display.fallback, false, metric.label);
    }
  }
  assert.equal(JSON.stringify(extendedGameStats), before);
});

test("technical disclosures are not performances and material discrepancies remain public", () => {
  const stats = extendedGameStats.find((s)=>s.gameId==="hico-at-de-leon-2026-week-8")!;
  const notes = presentExtendedNotes(stats.gameId, stats.notes);
  assert.equal(notes.highlights.length, 0);
  assert.match(notes.source.join(" "), /15 completions and 16 receptions/);
  assert.match(notes.technical.join(" "), /Owner directed/);
  assert.deepEqual(presentExtendedNotes("new-game", ["An unknown source note"]).source, ["An unknown source note"]);
  const historical = extendedGameStats[0];
  assert.equal(presentExtendedNotes(historical.gameId, historical.notes).highlights.length, 4);
});

for (const gameId of ["hico-at-de-leon-2026-week-8", "goldthwaite-at-albany-2026-week-8", "junction-at-goldthwaite-2026-week-1", "miles-at-stamford-2026-week-5"]) {
  test(`${gameId}: semantic labels, intact source values and source provenance`, () => {
    const html = renderToStaticMarkup(<ExtendedGameStatsPanel gameId={gameId} awayTeamName="A very long away school name" homeTeamName="A very long home school name" />);
    assert.match(html, /<dl/);
    assert.match(html, /Sources &amp; completeness/);
    assert.match(html, /unreported, not zero/);
    assert.ok(!html.includes("15/21/226/.714/15.1/2/1/—/118.4"));
    const stats=extendedGameStats.find((s)=>s.gameId===gameId)!;
    for (const table of stats.tables) for (const row of table.rows) {
      assert.ok(html.includes(row.player.replaceAll("'", "&#x27;")), row.player);
      for (const value of row.values) assert.ok(html.includes(`>${value}</dd>`), `${row.player}: ${value}`);
    }
    if (gameId === "hico-at-de-leon-2026-week-8") {
      assert.ok(!html.includes("Standout performances"));
      assert.match(html, /<details[^>]*><summary/);
    }
  });
}

test("truncated structured rows retain missing fields as unknown and extra values have safe labels", () => {
  assert.deepEqual(presentPlayerValues("Rushing detail", ["Player", "Car", "Yds", "TD"], [0, -12]), [
    { label: "Carries", value: 0 }, { label: "Yards", value: -12 }, { label: "Touchdowns", value: "—" },
  ]);
  assert.deepEqual(presentPlayerValues("Unknown", ["Player"], ["1e3"]), [{label:"Stat 1",value:"1e3"}]);
});

test("explicit slash-containing yards-per-attempt header is preserved as a single field", () => {
  const display = presentTeamMetric({label:"Pass C/A/YDS/Y/Att",away:"1/2/10/5.0",home:"—"},"away");
  assert.equal(display.fallback,false);
  assert.deepEqual(display.fields.at(-1),{label:"Yards / attempt",value:"5.0"});
});
