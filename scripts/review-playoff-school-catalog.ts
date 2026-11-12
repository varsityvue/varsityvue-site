import fs from "node:fs";
import type { School, District } from "../types/platform";
import { getResearchBaselineSchools as getSchools } from "./playoff-research-catalog-baseline";
import { researchBaselineDistricts as districts } from "./playoff-research-catalog-baseline";

type Identity = { officialName: string; division: string; region: string; district: number; catalogAction: string; sourceUrl: string };
type Link = { officialName: string; division: string; region: string; district: number; schoolId: string; seed: string; teamUrl: string; bracketSourceUrl: string };
type PublisherSchool = { schoolId: string; name: string; city: string; state: string; mascot: string | null; nameAcronym: string | null; color1: string | null; color2: string | null; color3: string | null; canonicalUrl: string; isHistoricalOnly: boolean };
type Metadata = { officialName: string; division: string; region: string; district: number; expectedSchoolId: string; sourceSchoolUrl: string; retrievalStatus: string; publisherSchool?: PublisherSchool; htmlSha256?: string };
const root = "docs/playoffs/research-20261110/";
const identities: Identity[] = JSON.parse(fs.readFileSync(root + "school-identity-review.json", "utf8")).games.flatMap((game: { identities: Identity[] }) => game.identities);
const links: Link[] = JSON.parse(fs.readFileSync(root + "bracket-school-profile-links.json", "utf8")).rows;
const metadata: Metadata[] = JSON.parse(fs.readFileSync(root + "publisher-school-metadata.json", "utf8")).rows;
const key = (item: { officialName: string; division: string; region: string }) => `${item.division}|${item.region}|${item.officialName}`;
for (const [label, rows] of [["identity", identities], ["profile link", links], ["metadata", metadata]] as const) {
  if (new Set(rows.map(key)).size !== rows.length) throw new Error(`duplicate qualified ${label}`);
}
if (identities.length !== 384 || links.length !== 384) throw new Error("incomplete identity or bracket-link inventory");
if (new Set(links.map((item) => item.schoolId)).size !== 384) throw new Error("duplicate linked school ID");
const missing = identities.filter((item) => item.catalogAction === "new-catalog-record-required");
if (metadata.length !== missing.length || metadata.some((item) => !missing.some((identity) => key(identity) === key(item)))) throw new Error("metadata must cover exactly the missing catalog identities");
const primaryChecks: { officialName: string; sourceUrl: string; scope: string; reviewIssues: string[] }[] = JSON.parse(fs.readFileSync(root + "primary-branding-checks.json", "utf8")).rows;
const catalog = getSchools();
const reserved = new Set(catalog.flatMap((school) => [school.id, school.slug, ...(school.aliases ?? [])]));
const proposedIds = new Set<string>();
const slugify = (name: string) => name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const color = (value: string | null | undefined) => /^[a-f\d]{6}$/i.test(value?.trim() ?? "") ? `#${value!.trim().toUpperCase()}` : null;
const schoolProposals = missing.map((identity) => {
  const link = links.find((item) => key(item) === key(identity));
  const report = metadata.find((item) => key(item) === key(identity));
  if (!link || !report || link.district !== identity.district || report.district !== identity.district || !/^[WRTF]\d+$/.test(link.seed) || Number(link.seed.slice(1)) !== identity.district) throw new Error("profile link does not match qualified UIL district identity");
  if (report.expectedSchoolId !== link.schoolId) throw new Error("metadata school ID does not match bracket link");
  const url = new URL(report.sourceSchoolUrl);
  if (url.protocol !== "https:" || url.hostname !== "www.maxpreps.com") throw new Error("unreviewed metadata publisher URL");
  const school = report.publisherSchool;
  if (school && (school.schoolId !== link.schoolId || school.state !== "TX")) throw new Error("wrong school profile or state");
  // Expand UIL location abbreviations for proposed display labels and URLs.
  const displayName = identity.officialName.replace(/^H /, "Houston ").replace(/^Ft Worth /, "Fort Worth ").replace(/^CC /, "Corpus Christi ").replace(/^Tex\. /, "Texarkana ");
  const id = slugify(displayName);
  if (!id || reserved.has(id) || proposedIds.has(id)) throw new Error(`proposed ID/slug collision: ${id}`);
  proposedIds.add(id);
  const conference = identity.division.split(" ")[0] as School["classification"]["conference"];
  const division = identity.division.endsWith(" II") ? "D2" : "D1";
  const region = (["Region I", "Region II", "Region III", "Region IV"].indexOf(identity.region) + 1) as School["uilRegion"];
  if (!region || !Number.isInteger(identity.district) || identity.district < 1 || identity.district > 16 || region !== Math.ceil(identity.district / 4)) throw new Error("school district/region mismatch");
  const districtId = `${conference.toLowerCase()}-${division.toLowerCase()}-district-${identity.district}`;
  const primary = color(school?.color1), secondary = color(school?.color2), third = color(school?.color3);
  const issues: string[] = [];
  if (report.retrievalStatus !== "publisher-profile-retrieved") issues.push("publisher profile retrieval failed");
  if (!school?.mascot?.trim()) issues.push("mascot missing");
  if (!school?.nameAcronym?.trim()) issues.push("abbreviation missing");
  if (!primary || !secondary) issues.push("valid primary and secondary color values required");
  if (school?.isHistoricalOnly) issues.push("historical-only school profile requires review");
  const proposedFields = { id, slug: id, name: displayName,
    fullName: school?.mascot?.trim() ? `${displayName} ${school.mascot.trim()}` : null,
    mascot: school?.mascot?.trim() || null, abbreviation: school?.nameAcronym?.trim() || null,
    classification: { conference, division }, districtId, uilRegion: region,
    colors: primary && secondary ? { primary, secondary, accent: third ?? secondary } : null,
    sports: ["football"], status: "planned" };
  const proposedRecord: School | null = issues.length ? null : {
    ...proposedFields, fullName: proposedFields.fullName!, mascot: proposedFields.mascot!, abbreviation: proposedFields.abbreviation!,
    classification: { conference, division }, colors: proposedFields.colors!, sports: ["football"], status: "planned",
  };
  return { identity, proposedFields, proposedRecord, structurallyComplete: proposedRecord !== null,
    metadataIssues: issues, sourceSchoolId: link.schoolId,
    primaryBrandingCheck: primaryChecks.find((item) => item.officialName === identity.officialName) ?? null,
    provenance: { alignment: identity.sourceUrl, bracket: link.bracketSourceUrl, schoolProfile: report.sourceSchoolUrl, htmlSha256: report.htmlSha256 ?? null,
      displayMetadata: "publisher-reported; not confirmed as official school branding", idAndSlug: "generated from qualified UIL name with documented location abbreviations expanded; proposed engineering identifiers", fullName: "generated display label from expanded UIL name plus reported mascot", accent: third ? "publisher third color" : "secondary color reused as presentation fallback", coverageStatus: "planned is a proposed internal coverage setting" },
    integrationIssues: ["review canonical ID/slug and display label", "review publisher branding and any primary-source discrepancies", "review district registry additions", "review planned coverage status", ...(primaryChecks.find((item) => item.officialName === identity.officialName)?.reviewIssues ?? [])],
    readyForCatalogIntegration: false, readyForPublication: false };
});
const districtProposals: { sourceUrl: string; proposedRecord: District; readyForCatalogIntegration: false }[] = [];
const seenDistricts = new Set<string>();
for (const item of schoolProposals) {
  const record = item.proposedFields;
  if (districts.some((district) => district.id === record.districtId) || seenDistricts.has(record.districtId)) continue;
  seenDistricts.add(record.districtId);
  districtProposals.push({ sourceUrl: item.identity.sourceUrl, proposedRecord: {
    id: record.districtId, slug: record.districtId, name: `${item.identity.division} District ${item.identity.district}`,
    classification: { conference: record.classification.conference, division: record.classification.division as "D1" | "D2" },
    uilRegion: record.uilRegion, status: "planned",
  }, readyForCatalogIntegration: false });
}
console.log(JSON.stringify({ reviewedDate: "2026-11-10", mode: "offline-proposals-only", productionWrites: false,
  runtimeCatalogChanges: false, readyForCatalogIntegration: 0, readyForPublication: 0,
  summary: { schoolProposals: schoolProposals.length, structurallyCompleteSchoolRecords: schoolProposals.filter((item) => item.structurallyComplete).length,
    incompleteSchoolRecords: schoolProposals.filter((item) => !item.structurallyComplete).length, newDistrictRecordsRequired: districtProposals.length },
  schoolProposals, districtProposals,
}, null, 2));
