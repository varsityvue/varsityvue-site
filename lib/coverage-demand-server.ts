import { MAX_SUMMARY_BYTES, validSummary } from "./coverage-demand-summary";
import type { GamesNearMeSearchSummary } from "@/types/coverage-demand";

// A process-local global budget, never indexed by an IP or browser identifier.
// Distributed protection remains a deployment requirement, not a uniqueness claim.
export function coverageBudget(limit = 120, clock: () => number = Date.now) {
  let minute = -1, count = 0;
  return () => { const next = Math.floor(clock() / 60000); if (next !== minute) { minute = next; count = 0; } return ++count <= limit; };
}
export async function readCoverageBody(request: Request): Promise<unknown> {
  const declared = request.headers.get("content-length");
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > MAX_SUMMARY_BYTES)) throw new Error("Invalid coverage body");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Invalid coverage body");
  const chunks: Uint8Array[] = []; let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_SUMMARY_BYTES) { await reader.cancel(); throw new Error("Invalid coverage body"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const body = new Uint8Array(bytes); let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body));
}
export async function ingestCoverage(request: Request, record: (summary: GamesNearMeSearchSummary) => Promise<void>,
  options: { enabled: boolean; budget: () => boolean; approved: (summary: GamesNearMeSearchSummary) => boolean }): Promise<Response> {
  const respond = (status: number) => new Response(null, { status, headers: { "Cache-Control": "no-store" } });
  if (!options.enabled) return respond(503);
  // Exact same origin; no CORS allowance. Does not inspect IP, UA, cookies or identity.
  const url = new URL(request.url);
  // Next can use its listener hostname in request.url; Host preserves the actual
  // first-party browser destination. Browser JavaScript cannot override Host.
  const origin = `${url.protocol}//${request.headers.get("host") ?? url.host}`;
  if (request.headers.get("origin") !== origin
    || request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return respond(400);
  if (!options.budget()) return respond(429);
  let summary: unknown;
  try { summary = await readCoverageBody(request); } catch { return respond(400); }
  if (!validSummary(summary) || !options.approved(summary)) return respond(400);
  try { await record(summary); return respond(204); } catch { return respond(503); }
}
