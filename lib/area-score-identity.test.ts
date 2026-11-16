import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { getGameById } from "./games";
const sql = readFileSync(new URL("../docs/release-sql/2026-la-villa-chilton-score-identity.sql", import.meta.url), "utf8");
test("approval-gated identity SQL matches the canonical game, is idempotent, and aborts conflicts", async () => {
  const db = new PGlite();
  try {
    await db.exec("create schema private; create table private.canonical_game_identity(game_id text primary key, away_school_slug text not null, home_school_slug text not null);");
    await db.exec(sql);
    await db.exec(sql);
    const game = getGameById("2026-area-2a-d2-iv-4")!;
    assert.deepEqual((await db.query("select * from private.canonical_game_identity")).rows, [{game_id:game.id,away_school_slug:game.awaySchoolSlug,home_school_slug:game.homeSchoolSlug}]);
    await db.exec("update private.canonical_game_identity set home_school_slug='conflicting-school'");
    await assert.rejects(db.exec(sql), /conflicts/);
    await db.exec("rollback");
    assert.equal((await db.query<{home_school_slug:string}>("select home_school_slug from private.canonical_game_identity")).rows[0].home_school_slug,"conflicting-school");
  } finally { await db.close(); }
});
