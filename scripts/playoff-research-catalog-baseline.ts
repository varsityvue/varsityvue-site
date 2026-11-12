import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { School, District, Game } from "../types/platform";

// Research proposals are measured against the released 70-school/11-district
// baseline, not a later runtime catalog that may already include these proposals.
// Resolve from this script so adversarial fixture working directories cannot
// silently substitute another catalog. No runtime module imports this loader.
const baseline = JSON.parse(fs.readFileSync(path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../docs/playoffs/research-20261110/catalog-baseline-20261111.json",
), "utf8")) as { sourceMainHead: string; schools: School[]; districts: District[] };
if (baseline.sourceMainHead !== "ea1b4a57da0dc07e1b5418772ca2f3a2842ebe0f" || baseline.schools.length !== 70 || baseline.districts.length !== 11) {
  throw new Error("unexpected research catalog baseline");
}
export const getResearchBaselineSchools = () => baseline.schools;
export const researchBaselineDistricts = baseline.districts;

// Freeze the original seven schedule identities for historical research reproduction.
const baselinePlayoffs = JSON.parse(fs.readFileSync(path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../docs/playoffs/completion-20261111/released-inventory.json",
), "utf8")) as { games: Game[] };
export const getResearchBaselinePlayoffGames = () => baselinePlayoffs.games;
