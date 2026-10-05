"use client";
import { useRef } from "react";
import type { CoverageChoice } from "@/types/coverage-demand";
export default function CoverageMeasurementChoice({choice, choose}: {choice: CoverageChoice; choose: (choice: "enabled" | "disabled") => void}) {
  const options = useRef<HTMLDetailsElement>(null);
  const available = process.env.NEXT_PUBLIC_COVERAGE_DEMAND_ENABLED === "true";
  return <section className="weekly-measurement" aria-label="Regional measurement">
    <p role="status">{available ? "Collection requires your permission." : "Collection is currently off."} {choice === "enabled" ? "Preference: allow regional sharing." : choice === "disabled" ? "Preference: don’t share." : "No preference active on this page."}</p>
    <div className="weekly-measurement-actions">
      <a href="/privacy#regional-measurement" className="underline">Privacy</a>
      {choice === "enabled" && <button type="button" className="weekly-control weekly-withdraw" aria-pressed={false} onClick={() => { choose("disabled"); options.current?.querySelector("summary")?.focus(); }}>Don’t share regional usage</button>}
      <details ref={options}>
        <summary>Sharing options</summary>
        <p id="coverage-disclosure">Optional regional summaries help plan coverage. Precise coordinates stay in page memory. Discovery and location permission do not require sharing. Allowing records a preference for future operation while collection is off; your browser normally remembers it.</p>
        <p><a href="/privacy#regional-measurement" className="underline">Privacy, retention and withdrawal details</a></p>
        <div aria-describedby="coverage-disclosure" className="weekly-location-buttons weekly-consent-buttons">
          <button type="button" className="weekly-control" aria-pressed={choice === "enabled"} onClick={() => choose("enabled")}>Allow regional measurement</button>
          {choice !== "enabled" && <button type="button" className="weekly-control" aria-pressed={choice === "disabled"} onClick={() => choose("disabled")}>Don’t share regional usage</button>}
        </div>
        <noscript><p>JavaScript is needed to read or change a saved preference. All Games discovery stays available.</p></noscript>
      </details>
    </div>
  </section>;
}
