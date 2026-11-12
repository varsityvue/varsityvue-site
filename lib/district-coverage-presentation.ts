import type { District } from "../types/platform";

/** Planned districts contain reviewed playoff schools, not a complete season. */
export function getDistrictCoveragePresentation(status: District["status"], districtPlayStarted: boolean) {
  if (status === "planned") return {
    teamLabel: "Catalog Schools",
    gamesLabel: "Listed District Games",
    finalsLabel: "Verified District Finals",
    statusLabel: "Result Coverage",
    statusValue: districtPlayStarted ? "Partial Results" : "Results Pending",
    notice: "This hub currently lists playoff schools added to VarsityVue. District membership and 2026 results may be incomplete.",
  };
  return {
    teamLabel: "Teams",
    gamesLabel: "District Games",
    finalsLabel: "District Finals",
    statusLabel: "District Play",
    statusValue: districtPlayStarted ? "Underway" : "Not Started",
    notice: null,
  };
}
