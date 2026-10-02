import {
  reportingPrizeLabel,
  retentionRateLabel,
  type PickemConversionReport as Report,
} from "../../lib/pickem-conversion-report";

function Metric({ label, value }: { label: string; value: number | string }) {
  return <div className="rounded-xl border border-white/10 bg-black/20 p-4"><dt className="text-[10px] font-bold uppercase tracking-wide text-white/45">{label}</dt><dd className="mt-2 text-2xl font-black">{value}</dd></div>;
}

export default function PickemConversionReport({ report }: { report: Report | null }) {
  return (
    <section aria-labelledby="pickem-report-heading" className="mt-10 border-t border-white/15 pt-8">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--vv-accent)]">Pick ’Em Conversion + Retention</p>
      <h2 id="pickem-report-heading" className="mt-2 text-2xl font-black sm:text-3xl">Cash-contest accepted-entry reporting</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-white/55">Valid accepted receipts are the participation metric. Saved selections, draft saves, follows, and analytics events do not establish an accepted entry. Weeks 6–11 only; Week 5 is historical pre-cash activity.</p>
      {!report ? <p role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-500/10 p-5 text-sm text-red-50">Pick ’Em reporting is temporarily unavailable. Member conversion reporting is independent.</p> : (
        <>
          <p className="mt-4 text-xs leading-5 text-white/40">{report.season} campaign · All weeks, independent of the member reporting period · Snapshot {new Date(report.generated_at).toLocaleString("en-US", { timeZone: "America/Chicago", timeZoneName: "short" })}</p>
          <dl className="mt-5 grid gap-3 sm:grid-cols-3">
            <Metric label="Unique Cash-Contest Participants" value={report.summary.unique_valid_participants} />
            <Metric label="Total Valid Accepted Entries" value={report.summary.total_valid_entries} />
            <Metric label="Average Entries per Participant" value={report.summary.average_entries_per_participant?.toFixed(2) ?? "Not applicable"} />
          </dl>

          <h3 className="mt-8 text-xl font-black">Weekly participation and stored selections</h3>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {report.weeks.map((week) => (
              <article key={week.week} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="text-lg font-black">Week {week.week}</h4><span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">{week.status.replaceAll("_", " ")}</span></div>
                {(!week.configured || week.status === "draft") && <p className="mt-2 text-xs text-white/45">Not open — participation has not begun.</p>}
                <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 text-sm">
                  {[
                    ["Valid Accepted Entries", week.valid_accepted_entries],
                    ["Disqualified Entries", week.disqualified_entries],
                    ["Outstanding Drafts", week.outstanding_draft_users],
                    ["Any Stored Selections", week.any_selection_users],
                    ["Complete Stored Selections", week.complete_selection_users],
                    ["Complete Without Valid Entry", week.complete_without_valid_entry],
                  ].map(([label, value]) => <div key={label}><dt className="text-xs leading-5 text-white/45">{label}</dt><dd className="mt-1 text-xl font-black">{value}</dd></div>)}
                </dl>
                <p className="mt-4 border-t border-white/10 pt-3 text-sm font-bold">Prize: {reportingPrizeLabel(week)}</p>
                {week.finalized_at && <p className="mt-1 text-xs text-white/40">Finalized {new Date(week.finalized_at).toLocaleString("en-US", { timeZone: "America/Chicago", timeZoneName: "short" })}; subject to authorized correction.</p>}
                <p className="mt-2 text-xs text-white/35">{week.required_game_count} required non-VOID matchups · {week.game_count} configured</p>
              </article>
            ))}
          </div>
          <p className="mt-3 text-xs leading-5 text-white/40">Counts are distinct members within each week. Outstanding drafts include prediction-only saves and exclude accounts with any accepted receipt. Stored-selection counts combine public picks and private drafts, deduplicate matchups, and exclude VOID games. Complete selections without a valid entry may include disqualified receipts; completeness does not establish eligibility. Successful acceptance deletes drafts, so these are current gaps, not historical draft abandonment.</p>

          <h3 className="mt-8 text-xl font-black">Repeat accepted-entry retention</h3>
          <div className="mt-4 space-y-3">
            {report.retention.map((pair) => <article key={pair.previous_week} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.035] p-4">
              <div><h4 className="font-black">Week {pair.previous_week} → Week {pair.current_week}</h4><p className="mt-1 text-xs leading-5 text-white/45">Previous valid cohort: {pair.previous_valid_cohort} · Repeat Accepted Entries: {pair.repeat_valid_entries}</p></div>
              <div className="text-right"><p className="text-lg font-black">{retentionRateLabel(pair)}</p>{pair.measurable && <p className="mt-1 text-xs text-white/40">{pair.finalized ? "Finalized cohorts" : "Provisional cohorts"}</p>}</div>
            </article>)}
          </div>
          <p className="mt-3 text-xs leading-5 text-white/40">Repeat valid entrants ÷ previous-week valid entrants. The later week must have opened and received a valid entry, and the previous cohort must be nonzero. This measures repeat accepted participation, not page returns. Cohorts reflect current receipt validity and can change through disqualification, deletion, or correction.</p>

          <h3 className="mt-8 text-xl font-black">Current follow adoption among accepted participants</h3>
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <Metric label="Currently Follow ≥1 School" value={report.summary.currently_following} />
            <Metric label="No Current School Follows" value={report.summary.no_current_follows} />
            <Metric label="Current Follow Adoption" value={report.summary.follow_adoption_pct === null ? "Not applicable" : `${report.summary.follow_adoption_pct.toFixed(1)}%`} />
          </dl>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <Metric label="Surviving Follow Before/at First Accepted Entry" value={report.summary.surviving_follow_before_or_at_first_entry} />
            <Metric label="Earliest Surviving Follow After First Accepted Entry" value={report.summary.earliest_surviving_follow_after_first_entry} />
          </dl>
          <p className="mt-3 text-xs leading-5 text-white/40">Each participant is counted once across the campaign. Timing compares the earliest surviving follow with the first currently valid accepted entry. Unfollowed relationships are absent; refollows may have newer timestamps. This is surviving-follow evidence, not proof that Pick ’Em caused a follow.</p>
          <p className="mt-5 rounded-xl border border-white/10 p-4 text-xs leading-5 text-white/45">Admin-only aggregates can support a later sponsor summary. Deleted accounts can remove historical records; suspended accounts remain in receipt totals unless disqualified. No page-return tracking or Facebook-to-entry conversion rate is included.</p>
        </>
      )}
    </section>
  );
}
