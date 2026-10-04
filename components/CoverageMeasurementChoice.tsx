"use client";
import type { CoverageChoice } from "@/types/coverage-demand";
export default function CoverageMeasurementChoice({choice, choose}: {choice: CoverageChoice; choose: (choice: "enabled" | "disabled") => void}) {
  return <div className="weekly-notice">
    <p id="coverage-disclosure">Optional approximate regional usage helps VarsityVue decide where to expand coverage. Precise coordinates stay in page memory; optional summaries use broad geography and aggregate counts. Games Near Me and location permission work independently of sharing.</p>
    <p><a href="/privacy#regional-measurement" className="underline">Read privacy, retention and withdrawal details</a></p>
    <p>Collection is {process.env.NEXT_PUBLIC_COVERAGE_DEMAND_ENABLED === "true" ? "available only with your permission" : "currently off; allowing saves your preference for future operation"}.</p>
    <div aria-describedby="coverage-disclosure" className="weekly-location-buttons">
      <button type="button" className="weekly-control" aria-pressed={choice === "enabled"} onClick={() => choose("enabled")}>Allow regional measurement</button>
      <button type="button" className="weekly-control" aria-pressed={choice === "disabled"} onClick={() => choose("disabled")}>Don’t share regional usage</button>
    </div>
    {choice && <p role="status">Regional measurement {choice === "enabled" ? "allowed" : "off"}.</p>}
  </div>;
}
