"use client";
import type { CoverageChoice } from "@/types/coverage-demand";
export default function CoverageMeasurementChoice({choice, choose}: {choice: CoverageChoice; choose: (choice: "enabled" | "disabled") => void}) {
  return <div className="weekly-notice">
    <p id="coverage-disclosure">Optional approximate regional usage helps VarsityVue decide where to expand coverage. Precise location is not saved. Games Near Me works without sharing.</p>
    <div aria-describedby="coverage-disclosure" className="weekly-location-buttons">
      <button type="button" className="weekly-control" aria-pressed={choice === "enabled"} onClick={() => choose("enabled")}>Allow regional measurement</button>
      <button type="button" className="weekly-control" aria-pressed={choice === "disabled"} onClick={() => choose("disabled")}>Don’t share regional usage</button>
    </div>
    {choice && <p role="status">Regional measurement {choice === "enabled" ? "allowed" : "off"}.</p>}
  </div>;
}
