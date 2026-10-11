// Aggregate inputs only. No user IDs, request bodies, tokens or diagnostics.
export type HealthWindow = {
  observations: number;
  failedVantages: number;
  availabilityFailedWindows: number;
  dataApiRequests: number;
  dataApiFailures: number;
  poolTimeouts: number;
  postgresRepeatedErrors: number;
  connectionUsedPercent?: number;
  connectionPressureMinutes?: number;
  submissionAttempts: number;
  submissionFailures: number;
  accountChecks: number;
  accountFailures: number;
  overdueJobs: number;
  pageP95Ms?: number;
};
export function evaluateHealth(w: HealthWindow) {
  const alerts: string[] = [];
  if (w.failedVantages >= 2 && w.availabilityFailedWindows >= 2) alerts.push("public_availability");
  if (w.poolTimeouts >= 1) alerts.push("pool_timeout_investigate");
  if (w.dataApiRequests >= 20 && w.dataApiFailures >= 5 && w.dataApiFailures / w.dataApiRequests >= .1) alerts.push("data_api_errors");
  if (w.postgresRepeatedErrors >= 20) alerts.push("postgres_repeat_storm");
  if ((w.connectionUsedPercent ?? 0) >= 70 && (w.connectionPressureMinutes ?? 0) >= 5) alerts.push("connection_pressure");
  if (w.submissionAttempts >= 5 && w.submissionFailures >= 3 && w.submissionFailures / w.submissionAttempts >= .2) alerts.push("submission_failures");
  if (w.accountChecks >= 5 && w.accountFailures >= 3) alerts.push("account_status_failures");
  if (w.overdueJobs > 0) alerts.push("scheduled_job_overdue");
  if ((w.pageP95Ms ?? 0) > 3000 && w.observations >= 20) alerts.push("page_latency");
  return alerts;
}

// A collector must explicitly supply each metric. Missing/stale data is never green.
export function evaluateMonitoring(input: Partial<HealthWindow>, collectedAt: number, now = Date.now()) {
  const groups: Record<string, (keyof HealthWindow)[]> = {
    availability: ["failedVantages", "availabilityFailedWindows"],
    dataApi: ["dataApiRequests", "dataApiFailures", "poolTimeouts"],
    postgres: ["postgresRepeatedErrors"],
    connections: ["connectionUsedPercent", "connectionPressureMinutes"],
    submissions: ["submissionAttempts", "submissionFailures"],
    accounts: ["accountChecks", "accountFailures"],
    jobs: ["overdueJobs"],
    latency: ["observations", "pageP95Ms"],
  };
  const stale = !Number.isFinite(collectedAt) || now - collectedAt > 120000 || collectedAt > now;
  const unknown = Object.entries(groups).filter(([, keys]) => stale || keys.some(key =>
    typeof input[key] !== "number" || !Number.isFinite(input[key]) || input[key]! < 0)).map(([name]) => name);
  const valid = Object.fromEntries(Object.entries(input).filter(([,value]) => typeof value === "number" && Number.isFinite(value) && value >= 0));
  const alerts = stale ? [] : evaluateHealth(valid as HealthWindow);
  return { status: alerts.length ? "alert" : unknown.length ? "unknown" : "healthy", alerts, unknown, stale };
}
