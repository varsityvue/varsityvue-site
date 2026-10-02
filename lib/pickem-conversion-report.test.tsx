import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import PickemConversionReport from "../components/internal/PickemConversionReport";
import { reportingPrizeLabel, retentionRateLabel, type PickemConversionReport as Report } from "./pickem-conversion-report";

const report: Report = {
  generated_at: "2026-10-01T20:03:02Z", season: 2026,
  summary: { unique_valid_participants: 31, total_valid_entries: 31, average_entries_per_participant: 1,
    currently_following: 17, no_current_follows: 14, follow_adoption_pct: 54.8,
    surviving_follow_before_or_at_first_entry: 14, earliest_surviving_follow_after_first_entry: 3 },
  weeks: Array.from({ length: 6 }, (_, index) => ({
    week: index + 6, configured: true, status: index === 0 ? "open" : "draft", game_count: index === 0 ? 6 : 10,
    required_game_count: index === 0 ? 6 : 10, valid_accepted_entries: index === 0 ? 31 : 0,
    disqualified_entries: 0, prize_dollars: index === 0 ? 31 : null,
    prize_state: index === 0 ? "provisional" : "not_applicable", finalized_at: null,
    outstanding_draft_users: index === 0 ? 1 : 0, any_selection_users: index === 0 ? 32 : 0,
    complete_selection_users: index === 0 ? 31 : 0, complete_without_valid_entry: 0,
  })),
  retention: Array.from({ length: 5 }, (_, index) => ({ previous_week: index + 6, current_week: index + 7,
    previous_valid_cohort: index === 0 ? 31 : 0, repeat_valid_entries: 0, measurable: false,
    finalized: false, repeat_rate_pct: null })),
};

test("unopened reporting displays cohort and not-yet-measurable retention without a zero rate", () => {
  const html = renderToStaticMarkup(<PickemConversionReport report={report} />);
  assert.match(html, /Previous valid cohort: 31/);
  assert.equal((html.match(/Not yet measurable/g) ?? []).length, 5);
  assert.doesNotMatch(html, /0\.0%/);
  assert.match(html, /Not open — participation has not begun/);
  assert.match(html, /Prize: \$31 · Provisional/);
  assert.match(html, /Prize: Not applicable/);
  assert.match(html, /54\.8%/);
  assert.match(html, /current gaps, not historical draft abandonment/);
  assert.match(html, /surviving-follow evidence, not proof/);
});

test("measurable zero-repeat and nonzero-repeat rates render honestly", () => {
  const pair = { ...report.retention[0], measurable: true, repeat_rate_pct: 0 };
  assert.equal(retentionRateLabel(pair), "0.0%");
  assert.equal(retentionRateLabel({ ...pair, repeat_valid_entries: 15, repeat_rate_pct: 48.4 }), "48.4%");
  assert.equal(retentionRateLabel({ ...pair, measurable: false }), "Not yet measurable");
  const html = renderToStaticMarkup(<PickemConversionReport report={{ ...report, retention: [pair] }} />);
  assert.match(html, /Provisional cohorts/);
  assert.match(html, /0\.0%/);
});

test("unavailable report does not fabricate zero counts or a prize", () => {
  const html = renderToStaticMarkup(<PickemConversionReport report={null} />);
  assert.match(html, /role="alert"/);
  assert.match(html, /temporarily unavailable/);
  assert.doesNotMatch(html, /\$0|Not yet measurable|Total Valid Accepted Entries/);
});

test("finalization and correction-review prize states remain distinct", () => {
  const week = report.weeks[0];
  assert.equal(reportingPrizeLabel({ ...week, prize_state: "finalized" }), "$31 · Finalized");
  assert.equal(reportingPrizeLabel({ ...week, prize_state: "under_review" }), "$31 · Under review");
  assert.equal(reportingPrizeLabel({ ...week, prize_dollars: null }), "Not applicable");
});

test("only explicit aggregate fields are rendered, even if unexpected identity data arrives", () => {
  const payload = { ...report, user_id: "00000000-private-id", email: "private@example.invalid",
    phone: "+12545550123", username: "private-username", members: ["private-member"] };
  const html = renderToStaticMarkup(<PickemConversionReport report={payload} />);
  assert.doesNotMatch(html, /private-id|private@example|12545550123|private-username|private-member/);
  assert.match(html, /Unique Cash-Contest Participants/);
});

test("dashboard preserves existing member RPC, active-member guard, and separate reporting failure", () => {
  const page = readFileSync("app/internal/conversions/page.tsx", "utf8");
  assert.match(page, /await requireActiveMember\(\)/);
  assert.match(page, /row\.role === "admin"/);
  assert.match(page, /rpc\("admin_conversion_dashboard", \{ range_days: days \}\)/);
  assert.match(page, /rpc\("admin_pickem_conversion_report", \{ p_season: 2026 \}\)/);
  assert.match(page, /pickemError \? null : pickemData/);
  assert.match(page, /Member Conversion/);
  assert.match(page, /do not establish Facebook-to-accepted-entry conversion/);
  assert.doesNotMatch(page, /\.insert\(|\.update\(|\.delete\(|\.upsert\(/);
});
