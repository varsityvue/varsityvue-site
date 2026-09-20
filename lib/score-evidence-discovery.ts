import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { EvidenceSourceType } from "@/lib/score-evidence-confidence";

type DiscoveryCandidate = { intelligence_id: string; game_id: string; kickoff: string; away_team: string; home_team: string };
type SearchResult = { title?: string; url?: string; description?: string; extra_snippets?: string[] };
type EvidenceItem = { source_name: string; source_type: EvidenceSourceType; source_url: string; away_score: number; home_score: number; evidence_note: string };

function clean(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

function sourceType(url: string): EvidenceSourceType {
  const hostname = new URL(url).hostname.toLowerCase();
  if (hostname.includes("maxpreps.com") || hostname.includes("scorestream.com")) return "score_service";
  if (hostname.includes("hudl.com")) return "official_team";
  if (hostname.includes("facebook.com") || hostname.includes("x.com") || hostname.includes("twitter.com")) return "social";
  if (hostname.includes("k12.tx.us") || hostname.includes("isd.net") || hostname.includes("isd.org")) return "official_school";
  if (/(koxe|ktab|krbc|ktex|kwtx|bigcountryhomepage)/.test(hostname)) return "broadcaster";
  if (/(newspaper|news|reporter|bulletin|telegram)/.test(hostname)) return "newspaper";
  return "other";
}

function teamPattern(team: string) {
  return team.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((part) => part.length > 2);
}

function mentionsTeam(text: string, team: string) {
  const normalized = text.toLowerCase();
  const tokens = teamPattern(team);
  return tokens.length > 0 && tokens.some((token) => normalized.includes(token));
}

function extractScore(text: string, awayTeam: string, homeTeam: string) {
  if (!mentionsTeam(text, awayTeam) || !mentionsTeam(text, homeTeam)) return null;
  const awayToken = teamPattern(awayTeam).at(-1);
  const homeToken = teamPattern(homeTeam).at(-1);
  if (!awayToken || !homeToken) return null;
  const escapedAway = awayToken.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedHome = homeToken.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`${escapedAway}[^0-9]{0,24}(\\d{1,3})[^a-z0-9]{1,16}${escapedHome}[^0-9]{0,24}(\\d{1,3})`, "i"),
    new RegExp(`${escapedHome}[^0-9]{0,24}(\\d{1,3})[^a-z0-9]{1,16}${escapedAway}[^0-9]{0,24}(\\d{1,3})`, "i"),
  ];
  const direct = text.match(patterns[0]);
  if (direct) return { awayScore: Number(direct[1]), homeScore: Number(direct[2]) };
  const reversed = text.match(patterns[1]);
  if (reversed) return { awayScore: Number(reversed[2]), homeScore: Number(reversed[1]) };
  return null;
}

async function searchCandidate(candidate: DiscoveryCandidate, apiKey: string): Promise<EvidenceItem[]> {
  const date = new Date(candidate.kickoff).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/Chicago" });
  const query = `"${candidate.away_team}" "${candidate.home_team}" football score ${date} Texas`;
  const params = new URLSearchParams({ q: query, country: "us", search_lang: "en", freshness: "pw", count: "10", extra_snippets: "true", safesearch: "moderate" });
  const response = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
    headers: { Accept: "application/json", "X-Subscription-Token": apiKey },
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`Brave Search returned ${response.status}`);
  const payload = await response.json() as { web?: { results?: SearchResult[] } };
  const evidence: EvidenceItem[] = [];
  for (const result of payload.web?.results ?? []) {
    if (!result.url || !/^https?:\/\//.test(result.url)) continue;
    const text = clean([result.title, result.description, ...(result.extra_snippets ?? [])].filter(Boolean).join(" "));
    const score = extractScore(text, candidate.away_team, candidate.home_team);
    if (!score || score.awayScore > 150 || score.homeScore > 150) continue;
    evidence.push({
      source_name: clean(result.title ?? new URL(result.url).hostname).slice(0, 100),
      source_type: sourceType(result.url),
      source_url: result.url.slice(0, 500),
      away_score: score.awayScore,
      home_score: score.homeScore,
      evidence_note: `Search excerpt: ${text}`.slice(0, 1000),
    });
  }
  return evidence;
}

export async function discoverMissingScoreEvidence(client: SupabaseClient, workerSecret: string, candidateGameIds: string[]) {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) return { outcome: "not_configured" as const };
  const { data, error } = await client.rpc("claim_missing_score_discovery", { worker_secret: workerSecret, candidate_game_ids: candidateGameIds });
  if (error) return { outcome: "claim_failed" as const, code: error.code };
  const candidates = (data ?? []) as DiscoveryCandidate[];
  let evidenceFound = 0;
  for (const candidate of candidates) {
    try {
      const evidence = await searchCandidate(candidate, apiKey);
      const { data: inserted, error: recordError } = await client.rpc("record_missing_score_discovery", {
        worker_secret: workerSecret,
        target_intelligence_id: candidate.intelligence_id,
        discovery_status: evidence.length ? "evidence_found" : "no_evidence",
        discovery_detail: evidence.length ? `${evidence.length} candidate source result(s) extracted.` : "No score line was safely extractable from current search results.",
        evidence_items: evidence,
      });
      if (recordError) throw new Error(`Evidence record failed: ${recordError.code}`);
      evidenceFound += Number(inserted ?? 0);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown discovery error";
      await client.rpc("record_missing_score_discovery", {
        worker_secret: workerSecret, target_intelligence_id: candidate.intelligence_id,
        discovery_status: "provider_error", discovery_detail: detail.slice(0, 500), evidence_items: [],
      });
    }
  }
  return { outcome: "searched" as const, gamesSearched: candidates.length, evidenceFound };
}
