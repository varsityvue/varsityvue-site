import assert from "node:assert/strict";
import test from "node:test";
import { brackets, regionTwoD1, regionTwoD2, regionThree4AD1 } from "./playoff-bracket-fields";

// Frozen 2026 UIL/MaxPreps first-round bracket order, G9–G16 (2A) and G17–G24 (4A).
const expected = [
  [["Cisco","Nocona"],["Bosqueville","Johnson City"],["Muenster","Hawley"],["San Saba","Valley Mills"],["Mason","Itasca"],["Tioga","Anson"],["Axtell","Bangs"],["De Leon","Alvord"]],
  [["Wellington","Munday"],["Crawford","Albany"],["Windthorst","Quanah"],["Stamford","Mart"],["Goldthwaite","Hubbard"],["Haskell","Clarendon"],["Santo","Miles"],["Wheeler","Seymour"]],
  [["Little Cypress-Mauriceville","Austin"],["Jarrell","El Campo"],["Stafford","Bridge City"],["Sealy","China Spring"],["Bay City","Lampasas"],["Fort Bend Willowridge","Hargrave"],["Stephenville","Navasota"],["Vidor","Sterling"]],
];

test("all 24 official first-round pairings remain in correct advancement order", () => {
  assert.deepEqual([regionTwoD1,regionTwoD2,regionThree4AD1], expected);
  assert.equal(brackets.length, 3);
  for (const bracket of brackets) {
    assert.equal(bracket.teams.length, 8);
    assert.equal(new Set(bracket.teams.flat()).size, 16);
  }
});

test("featured VarsityVue schools are represented in their correct region", () => {
  const expectedFeatured = [
    ["Cisco","Hawley","Anson","De Leon"],
    ["Goldthwaite","Santo","Albany"],
    ["Stephenville"],
  ];
  brackets.forEach((bracket, index) => {
    const names = new Set(bracket.teams.flat());
    for (const school of expectedFeatured[index]) assert.ok(names.has(school), `${school} absent from ${bracket.title}`);
  });
});
