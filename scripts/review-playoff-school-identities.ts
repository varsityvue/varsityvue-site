import fs from "node:fs";
import { getBiDistrictReadiness } from "../lib/bidistrict-readiness";
import { getSchools } from "../lib/schools";

type AlignmentSchool = { officialName: string; district: number; region: number };
type AlignmentSource = { division: string; sourceUrl: string; schools: AlignmentSchool[] };
type NameExpansion = { division: string; region: string; bracketName: string; officialName: string; sourceUrl: string };
const root = "docs/playoffs/research-20261110/";
const sources: AlignmentSource[] = JSON.parse(fs.readFileSync(root + "uil-alignment-schools.json", "utf8")).sources;
const expansions: NameExpansion[] = JSON.parse(fs.readFileSync(root + "school-identity-name-expansions.json", "utf8")).nameExpansions;
const schools = getSchools();
const expansionKeys = expansions.map((item) => `${item.division}|${item.region}|${item.bracketName}`);
if (new Set(expansionKeys).size !== expansionKeys.length) throw new Error("duplicate qualified name expansion");
if (new Set(sources.map((item) => item.division)).size !== sources.length) throw new Error("duplicate alignment division");

// Offline staging only. These are identity review proposals, never School records.
// No slugs, colors, mascots, seeds, home/away order or publication approval are invented.
const games = getBiDistrictReadiness([]).map((game) => {
  const source = sources.find((item) => item.division === game.division);
  const region = ["Region I", "Region II", "Region III", "Region IV"].indexOf(game.region) + 1;
  if (!source || !region) throw new Error("missing qualified alignment source");
  const identities = game.teams.map((bracketName) => {
    const expansion = expansions.find((item) => item.division === game.division && item.region === game.region && item.bracketName === bracketName);
    if (expansion && expansion.sourceUrl !== source.sourceUrl) throw new Error("name expansion source mismatch");
    const officialName = expansion?.officialName ?? bracketName;
    const matches = source.schools.filter((item) => item.officialName === officialName && item.region === region);
    if (matches.length !== 1) throw new Error(`ambiguous or absent alignment identity: ${game.division}|${game.region}|${bracketName}`);
    const match = matches[0];
    if (match.region !== Math.ceil(match.district / 4)) throw new Error("alignment district/region mismatch");
    const catalogMatches = schools.filter((school) => [bracketName, officialName].includes(school.name) &&
      school.classification.conference === game.division.split(" ")[0] &&
      school.classification.division === (game.division.endsWith(" II") ? "D2" : "D1"));
    const catalog = catalogMatches.length === 1 ? catalogMatches[0] : null;
    const expectedDistrictId = `${game.division.split(" ")[0].toLowerCase()}-${game.division.endsWith(" II") ? "d2" : "d1"}-district-${match.district}`;
    const catalogConflict = catalogMatches.length > 1 || Boolean(catalog &&
      (catalog.uilRegion !== region || (catalog.districtId !== "opponent" && catalog.districtId !== expectedDistrictId)));
    return {
      bracketName, officialName, division: game.division, region: game.region,
      district: match.district, alignmentRegion: match.region,
      sourceUrl: source.sourceUrl,
      nameMatch: expansion ? "explicit-reviewed-expansion" : "exact-official-name",
      catalogAction: catalogConflict ? "hold-catalog-conflict" : catalog ?
        (catalog.name === bracketName ? "reuse-existing-record" : "review-existing-name-alias") : "new-catalog-record-required",
      existingCatalog: catalog ? { name: catalog.name, slug: catalog.slug, districtId: catalog.districtId, uilRegion: catalog.uilRegion } : null,
      proposedSlug: null,
      requiredNextWork: catalogConflict ? ["reconcile existing catalog district/region or duplicate identity"] : catalog ?
        ["review exact mapping before integration"] : ["review canonical ID and slug", "verify mascot and full display name", "verify abbreviation and school colors", "review district registry integration", "choose coverage status"],
      readyForCatalogIntegration: false,
      readyForPublication: false,
    };
  });
  // UIL bi-district opponents come from paired districts: 1/2, 3/4, etc.
  if (Math.ceil(identities[0].district / 2) !== Math.ceil(identities[1].district / 2)) throw new Error("opponents belong to different district pairs");
  return { bracket: { division: game.division, region: game.region, slot: game.slot, teams: game.teams }, identities };
});
const identities = games.flatMap((game) => game.identities);
const qualified = new Set(identities.map((item) => `${item.division}|${item.region}|${item.officialName}`));
if (qualified.size !== identities.length) throw new Error("duplicate official school in bracket field");
console.log(JSON.stringify({
  reviewedDate: "2026-11-10", mode: "offline-research-only", productionWrites: false,
  runtimeCatalogChanges: false, readyForPublication: 0,
  summary: {
    games: games.length, teamReferences: identities.length, distinctOfficialIdentities: qualified.size,
    exactAlignmentNames: identities.filter((item) => item.nameMatch === "exact-official-name").length,
    reviewedNameExpansions: identities.filter((item) => item.nameMatch === "explicit-reviewed-expansion").length,
    existingCatalogReferences: identities.filter((item) => item.existingCatalog !== null).length,
    existingNameAliasesForReview: identities.filter((item) => item.catalogAction === "review-existing-name-alias").length,
    newCatalogRecordsRequired: identities.filter((item) => item.catalogAction === "new-catalog-record-required").length,
    catalogConflicts: identities.filter((item) => item.catalogAction === "hold-catalog-conflict").length,
  }, games,
}, null, 2));
