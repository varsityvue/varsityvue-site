import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import StandingsTable from "@/components/StandingsTable";
import type { Standing } from "./standings";
import { sortStandingsForDisplay } from "./standings-display";

function row(team: string, dw: number, dl: number, ow: number, ol: number): Standing {
  return { team, schoolSlug: `fixture-${team}`, districtWins: dw, districtLosses: dl,
    overallWins: ow, overallLosses: ol, overallRecordKnown: true, pointsFor: 0, pointsAgainst: 0 };
}
const names = (rows: Standing[]) => sortStandingsForDisplay(rows).map((r) => r.team);

test("tied district records use overall performance and retain T-1/T-4 in both layouts", () => {
  const rows = [row("Cisco",1,0,4,2), row("Hawley",0,1,2,4), row("De Leon",1,0,5,1),
    row("Abilene Texas Leadership",0,1,2,4), row("Hico",1,0,6,0), row("Anson",0,1,3,3)];
  const before = structuredClone(rows);
  assert.deepEqual(names(rows), ["Hico","De Leon","Cisco","Anson","Abilene Texas Leadership","Hawley"]);
  const html = renderToStaticMarkup(<StandingsTable standings={rows} theme={{ primary:"#000000", secondary:"#ffffff", accent:"#ffffff" }} />);
  assert.equal((html.match(/>T-1</g) ?? []).length, 6);
  assert.equal((html.match(/>T-4</g) ?? []).length, 6);
  for (const section of [html.split('md:hidden')[1].split('md:block')[0], html.split('<tbody>')[1]]) {
    const offsets = names(rows).map((name) => section.indexOf(`>${name}<`));
    assert.ok(offsets.every((offset,i) => offset >= 0 && (i === 0 || offset > offsets[i-1])));
  }
  assert.match(html, /display order within ties, not official district rank/);
  assert.deepEqual(rows, before, "sorting and rendering must not mutate records");
});

test("overall percentage precedes wins with unequal games played; wins break equal percentages", () => {
  assert.deepEqual(names([row("Six wins",1,0,6,2),row("Unbeaten",1,0,4,0)]),["Unbeaten","Six wins"]);
  assert.deepEqual(names([row("Alpha",1,0,2,2),row("Zulu",1,0,3,3)]),["Zulu","Alpha"]);
});

test("identical overall records fall back to alphabetic team name", () => {
  assert.deepEqual(names([row("Zulu",0,1,2,4),row("Alpha",0,1,2,4)]),["Alpha","Zulu"]);
});

test("district percentage precedes wins; district wins break equal percentages regardless of overall", () => {
  assert.deepEqual(names([row("More wins",3,2,6,0),row("Better percentage",2,0,2,4)]),["Better percentage","More wins"]);
  assert.deepEqual(names([row("Fewer wins",1,1,6,0),row("More wins",2,2,2,4)]),["More wins","Fewer wins"]);
});

test("distinct winless district records remain separate; unknown overall records do not outrank known losses", () => {
  assert.deepEqual(names([row("Two losses",0,2,6,2),row("One loss",0,1,1,5)]),["One loss","Two losses"]);
  const unknown = {...row("Unknown",1,0,0,0),overallRecordKnown:false};
  assert.deepEqual(names([unknown,row("Known",1,0,0,6)]),["Known","Unknown"]);
});
